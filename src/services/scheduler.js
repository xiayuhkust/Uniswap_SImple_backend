const cron = require('node-cron');
const poolService = require('./pool');
const tokenService = require('./token');
const blockchainService = require('./blockchain');
const websocketService = require('./websocket');

// Store scheduled tasks
const scheduledTasks = {};

/**
 * Initialize scheduler
 */
function initScheduler() {
  console.log('Initializing scheduler...');
  
  // Schedule tasks
  schedulePoolDataUpdates();
  scheduleTokenListUpdates();
  
  console.log('Scheduler initialized');
}

/**
 * Schedule pool data updates
 * @param {string} cronExpression Cron expression (default: every 5 minutes)
 */
function schedulePoolDataUpdates(cronExpression = '*/5 * * * *') {
  if (scheduledTasks.poolDataUpdates) {
    scheduledTasks.poolDataUpdates.stop();
  }
  
  scheduledTasks.poolDataUpdates = cron.schedule(cronExpression, async () => {
    console.log('Running scheduled pool data updates...');
    
    try {
      const pools = await poolService.getAllPools();
      
      for (const pool of pools) {
        try {
          const poolData = await poolService.fetchPoolDataFromChain(pool.address);
          await poolService.updatePoolData(pool.address, poolData);
          
          // Notify clients about the update
          websocketService.notifyPoolUpdate(pool.address, poolData);
          
          console.log(`Updated pool data for ${pool.address}`);
        } catch (error) {
          console.error(`Error updating pool data for ${pool.address}:`, error);
        }
      }
      
      console.log('Scheduled pool data updates completed');
    } catch (error) {
      console.error('Error in scheduled pool data updates:', error);
    }
  });
  
  console.log(`Pool data updates scheduled with cron: ${cronExpression}`);
}

/**
 * Schedule token list updates
 * @param {string} cronExpression Cron expression (default: every hour)
 */
function scheduleTokenListUpdates(cronExpression = '0 * * * *') {
  if (scheduledTasks.tokenListUpdates) {
    scheduledTasks.tokenListUpdates.stop();
  }
  
  scheduledTasks.tokenListUpdates = cron.schedule(cronExpression, async () => {
    console.log('Running scheduled token list updates...');
    
    try {
      // Ensure default tokens are in the database
      await tokenService.initializeDefaultTokens();
      
      // Update token data for all tokens in the database
      const tokens = await tokenService.getAllTokens();
      
      for (const token of tokens) {
        try {
          const tokenData = await tokenService.fetchTokenDataFromChain(token.address);
          await tokenService.createOrUpdateToken(tokenData);
          
          console.log(`Updated token data for ${token.address}`);
        } catch (error) {
          console.error(`Error updating token data for ${token.address}:`, error);
        }
      }
      
      console.log('Scheduled token list updates completed');
    } catch (error) {
      console.error('Error in scheduled token list updates:', error);
    }
  });
  
  console.log(`Token list updates scheduled with cron: ${cronExpression}`);
}

/**
 * Stop all scheduled tasks
 */
function stopAllTasks() {
  Object.values(scheduledTasks).forEach(task => {
    if (task && typeof task.stop === 'function') {
      task.stop();
    }
  });
  
  console.log('All scheduled tasks stopped');
}

module.exports = {
  initScheduler,
  schedulePoolDataUpdates,
  scheduleTokenListUpdates,
  stopAllTasks
};
