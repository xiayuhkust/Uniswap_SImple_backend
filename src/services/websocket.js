const socketIO = require('socket.io');
const http = require('http');
const poolService = require('./pool');
const tokenService = require('./token');

// Socket.IO server instance
let io = null;
let server = null;

/**
 * Initialize WebSocket server
 * @param {http.Server} httpServer HTTP server instance
 * @returns {socketIO.Server} Socket.IO server instance
 */
function initWebSocketServer(httpServer) {
  if (io) {
    console.log('WebSocket server already initialized');
    return io;
  }
  
  server = httpServer;
  // Use the most basic configuration possible
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      credentials: false
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 25000,
    connectTimeout: 30000,
    allowEIO3: true
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket');
    
    // Send initial data
    sendPoolsToClient(socket);
    
    // Add a simple ping-pong test
    socket.on('ping', () => {
      console.log('Received ping from client');
      socket.emit('pong', { message: 'Server pong response', timestamp: new Date().toISOString() });
    });
    
    // Handle subscription requests
    socket.on('subscribe:pool', (poolAddress) => {
      console.log(`Client subscribed to pool: ${poolAddress}`);
      socket.join(`pool:${poolAddress}`);
    });
    
    socket.on('unsubscribe:pool', (poolAddress) => {
      console.log(`Client unsubscribed from pool: ${poolAddress}`);
      socket.leave(`pool:${poolAddress}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected from WebSocket: ${reason}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  });
  
  console.log('WebSocket server initialized');
  return io;
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
