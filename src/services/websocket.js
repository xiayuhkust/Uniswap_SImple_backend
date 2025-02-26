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
 * Send error message to client
 * @param {socketIO.Socket} socket Socket.IO connection
 * @param {string} message Error message
 */
function sendError(socket, message) {
  socket.emit('error', { message });
}

/**
 * Send data to all connected clients
 * @param {string} event Event name
 * @param {Object} data Data to send
 */
function broadcastToAll(event, data) {
  if (!io) return;
  
  io.emit(event, data);
}

/**
 * Send data to clients in a specific room
 * @param {string} room Room name
 * @param {string} event Event name
 * @param {Object} data Data to send
 */
function broadcastToRoom(room, event, data) {
  if (!io) return;
  
  io.to(room).emit(event, data);
}

/**
 * Send pools data to client
 * @param {socketIO.Socket} socket Socket.IO connection
 */
async function sendPoolsToClient(socket) {
  try {
    const pools = await poolService.getAllPools();
    socket.emit('cache:pools', pools);
  } catch (error) {
    console.error('Error sending pools to client:', error);
    sendError(socket, 'Failed to fetch pools');
  }
}

/**
 * Notify clients about pool updates
 * @param {string} poolAddress Pool address
 * @param {Object} poolData Updated pool data
 */
function notifyPoolUpdate(poolAddress, poolData) {
  broadcastToAll('pool:updated', {
    address: poolAddress,
    ...poolData
  });
  
  // Also notify clients subscribed to this specific pool
  broadcastToRoom(`pool:${poolAddress}`, 'pool:detail:updated', {
    address: poolAddress,
    ...poolData
  });
}

/**
 * Notify clients about new pools
 * @param {Object} poolData New pool data
 */
function notifyPoolCreated(poolData) {
  broadcastToAll('pool:created', poolData);
  
  // Also update the pools cache for all clients
  updatePoolsCache();
}

/**
 * Update pools cache for all clients
 */
async function updatePoolsCache() {
  try {
    const pools = await poolService.getAllPools();
    broadcastToAll('cache:pools', pools);
  } catch (error) {
    console.error('Error updating pools cache:', error);
  }
}

/**
 * Close WebSocket server
 */
function closeWebSocketServer() {
  if (io) {
    io.close(() => {
      console.log('WebSocket server closed');
    });
    io = null;
  }
}

module.exports = {
  initWebSocketServer,
  broadcastToAll,
  broadcastToRoom,
  notifyPoolUpdate,
  notifyPoolCreated,
  updatePoolsCache,
  closeWebSocketServer
};
