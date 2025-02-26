const { ethers } = require('ethers');
const config = require('../config');

// Factory ABI for blockchain interactions
const FACTORY_ABI = [
  'event PoolCreated(address token0, address token1, uint24 fee, int24 tickSpacing, address pool)',
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

// Provider instance
let provider = null;

/**
 * Initialize the blockchain provider
 * @returns {ethers.Provider} Ethers provider instance
 */
function initProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    console.log(`Provider initialized for RPC URL: ${config.blockchain.rpcUrl}`);
  }
  return provider;
}

/**
 * Get the blockchain provider
 * @returns {ethers.Provider} Ethers provider instance
 */
function getProvider() {
  if (!provider) {
    return initProvider();
  }
  return provider;
}

/**
 * Get a wallet instance
 * @param {string} privateKey Private key (optional, uses config if not provided)
 * @returns {ethers.Wallet} Ethers wallet instance
 */
function getWallet(privateKey = null) {
  const provider = getProvider();
  const key = privateKey || config.blockchain.privateKey;
  return new ethers.Wallet(key, provider);
}

/**
 * Get a contract instance
 * @param {string} address Contract address
 * @param {Array|string} abi Contract ABI
 * @param {ethers.Signer} signer Signer (optional)
 * @returns {ethers.Contract} Ethers contract instance
 */
function getContract(address, abi, signer = null) {
  const provider = getProvider();
  return new ethers.Contract(
    address,
    abi,
    signer || provider
  );
}

/**
 * Get the factory contract instance
 * @param {ethers.Signer} signer Signer (optional)
 * @returns {ethers.Contract} Factory contract instance
 */
function getFactoryContract(signer = null) {
  return getContract(config.blockchain.factoryAddress, FACTORY_ABI, signer);
}

/**
 * Listen for events on a contract
 * @param {ethers.Contract} contract Contract instance
 * @param {string} eventName Event name
 * @param {Function} callback Callback function
 * @returns {Function} Unsubscribe function
 */
function listenForEvents(contract, eventName, callback) {
  contract.on(eventName, (...args) => {
    callback(...args);
  });
  
  return () => {
    contract.removeAllListeners(eventName);
  };
}

/**
 * Get past events from a contract
 * @param {ethers.Contract} contract Contract instance
 * @param {string} eventName Event name
 * @param {Object} filter Filter options
 * @param {number} fromBlock From block (optional)
 * @param {number} toBlock To block (optional)
 * @returns {Promise<Array>} Array of events
 */
async function getPastEvents(contract, eventName, filter = {}, fromBlock = 0, toBlock = 'latest') {
  const events = await contract.queryFilter(
    contract.filters[eventName](...Object.values(filter)),
    fromBlock,
    toBlock
  );
  
  return events;
}

/**
 * Get the current block number
 * @returns {Promise<number>} Current block number
 */
async function getCurrentBlockNumber() {
  const provider = getProvider();
  return await provider.getBlockNumber();
}

/**
 * Get transaction receipt
 * @param {string} txHash Transaction hash
 * @returns {Promise<Object>} Transaction receipt
 */
async function getTransactionReceipt(txHash) {
  const provider = getProvider();
  return await provider.getTransactionReceipt(txHash);
}

/**
 * Initialize pool creation event listener
 * @param {Function} callback Callback function to handle pool creation events
 * @returns {Function} Unsubscribe function
 */
function initPoolCreationEventListener(callback) {
  console.log('Initializing pool creation event listener...');
  const factoryContract = getFactoryContract();
  
  // Add debug log to track when the listener is set up
  console.log(`Listening for PoolCreated events from factory contract: ${config.blockchain.factoryAddress}`);
  
  // Listen for PoolCreated events
  return listenForEvents(factoryContract, 'PoolCreated', (token0, token1, fee, tickSpacing, pool, event) => {
    // Add debug log to track when events are received
    console.log('Received PoolCreated event:', {
      token0,
      token1,
      fee: fee.toString(),
      tickSpacing: tickSpacing.toString(),
      pool,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    });
    
    // Call the callback with the event data
    callback(token0, token1, fee, tickSpacing, pool, event);
  });
}

module.exports = {
  initProvider,
  getProvider,
  getWallet,
  getContract,
  getFactoryContract,
  listenForEvents,
  getPastEvents,
  getCurrentBlockNumber,
  getTransactionReceipt,
  initPoolCreationEventListener,
  FACTORY_ABI
};
