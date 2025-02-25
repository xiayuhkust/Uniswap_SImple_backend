const express = require('express');
const cors = require('cors');
const http = require('http');
const { sequelize, Token, Pool } = require('./models/db');
const tokenRoutes = require('./routes/token');
const poolRoutes = require('./routes/pool');
const blockchainService = require('./services/blockchain');
const websocketService = require('./services/websocket');
const schedulerService = require('./services/scheduler');
const tokenService = require('./services/token');
const config = require('./config');

// Initialize Express app
const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tokens', tokenRoutes);
app.use('/api/pools', poolRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
websocketService.initWebSocketServer(server);

// Initialize database and start server
async function initializeAndStart() {
  try {
    // Initialize blockchain provider
    blockchainService.initProvider();
    
    // Sync database models
    await sequelize.sync();
    console.log('Database synchronized');
    
    // Initialize default tokens
    await tokenService.initializeDefaultTokens();
    console.log('Default tokens initialized');
    
    // Initialize scheduler
    schedulerService.initScheduler();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Stop scheduler
  schedulerService.stopAllTasks();
  
  // Close WebSocket server
  websocketService.closeWebSocketServer();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    }).catch((error) => {
      console.error('Error closing database connection:', error);
      process.exit(1);
    });
  });
});

// Start the server
initializeAndStart();

module.exports = { app, server };
