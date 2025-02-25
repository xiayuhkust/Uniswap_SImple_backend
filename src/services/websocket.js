const WebSocket = require('ws');
const http = require('http');
const poolService = require('./pool');
const tokenService = require('./token');

// WebSocket server instance
let wss = null;
let server = null;

/**
 * Initialize WebSocket server
 * @param {http.Server} httpServer HTTP server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
function initWebSocketServer(httpServer) {
  if (wss) {
    console.log('WebSocket server already initialized');
    return wss;
  }
  
  server = httpServer;
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial data
    sendPoolsToClient(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          handleSubscription(ws, data);
        } else if (data.type === 'request') {
          handleRequest(ws, data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        sendError(ws, 'Invalid message format');
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Send a ping every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
  
  console.log('WebSocket server initialized');
  return wss;
}

/**
 * Handle subscription requests
 * @param {WebSocket} ws WebSocket connection
 * @param {Object} data Subscription data
 */
function handleSubscription(ws, data) {
  const { channel } = data;
  
  if (!channel) {
    return sendError(ws, 'Channel is required for subscription');
  }
  
  // Store subscription info on the connection
  ws.subscriptions = ws.subscriptions || [];
  
  if (!ws.subscriptions.includes(channel)) {
    ws.subscriptions.push(channel);
    console.log(`Client subscribed to channel: ${channel}`);
  }
  
  // Send confirmation
  sendToClient(ws, {
    type: 'subscription',
    status: 'success',
    channel
  });
}

/**
 * Handle data requests
 * @param {WebSocket} ws WebSocket connection
 * @param {Object} data Request data
 */
async function handleRequest(ws, data) {
  const { resource, id } = data;
  
  if (!resource) {
    return sendError(ws, 'Resource is required for request');
  }
  
  try {
    let responseData;
    
    if (resource === 'pools') {
      responseData = await poolService.getAllPools();
    } else if (resource === 'pool' && id) {
      responseData = await poolService.getPoolByAddress(id);
    } else if (resource === 'tokens') {
      responseData = await tokenService.getAllTokens();
    } else if (resource === 'token' && id) {
      responseData = await tokenService.getTokenByAddress(id);
    } else {
      return sendError(ws, 'Invalid resource or missing id');
    }
    
    sendToClient(ws, {
      type: 'response',
      resource,
      id,
      data: responseData
    });
  } catch (error) {
    console.error(`Error handling request for ${resource}:`, error);
    sendError(ws, `Failed to fetch ${resource}: ${error.message}`);
  }
}

/**
 * Send error message to client
 * @param {WebSocket} ws WebSocket connection
 * @param {string} message Error message
 */
function sendError(ws, message) {
  sendToClient(ws, {
    type: 'error',
    message
  });
}

/**
 * Send data to client
 * @param {WebSocket} ws WebSocket connection
 * @param {Object} data Data to send
 */
function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Send data to all connected clients
 * @param {Object} data Data to send
 */
function broadcastToAll(data) {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * Send data to clients subscribed to a specific channel
 * @param {string} channel Channel name
 * @param {Object} data Data to send
 */
function broadcastToChannel(channel, data) {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && 
        client.subscriptions && 
        client.subscriptions.includes(channel)) {
      client.send(JSON.stringify({
        type: 'update',
        channel,
        data
      }));
    }
  });
}

/**
 * Send pools data to client
 * @param {WebSocket} ws WebSocket connection
 */
async function sendPoolsToClient(ws) {
  try {
    const pools = await poolService.getAllPools();
    
    sendToClient(ws, {
      type: 'cache',
      resource: 'pools',
      data: pools
    });
  } catch (error) {
    console.error('Error sending pools to client:', error);
  }
}

/**
 * Notify clients about pool updates
 * @param {string} poolAddress Pool address
 * @param {Object} poolData Updated pool data
 */
function notifyPoolUpdate(poolAddress, poolData) {
  broadcastToChannel('pool:updated', {
    address: poolAddress,
    ...poolData
  });
}

/**
 * Notify clients about new pools
 * @param {Object} poolData New pool data
 */
function notifyPoolCreated(poolData) {
  broadcastToChannel('pool:created', poolData);
  
  // Also update the pools cache for all clients
  updatePoolsCache();
}

/**
 * Update pools cache for all clients
 */
async function updatePoolsCache() {
  try {
    const pools = await poolService.getAllPools();
    
    broadcastToChannel('cache:pools', pools);
  } catch (error) {
    console.error('Error updating pools cache:', error);
  }
}

/**
 * Close WebSocket server
 */
function closeWebSocketServer() {
  if (wss) {
    wss.close(() => {
      console.log('WebSocket server closed');
    });
    wss = null;
  }
}

module.exports = {
  initWebSocketServer,
  broadcastToAll,
  broadcastToChannel,
  notifyPoolUpdate,
  notifyPoolCreated,
  updatePoolsCache,
  closeWebSocketServer
};
