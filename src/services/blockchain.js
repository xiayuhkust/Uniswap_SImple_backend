const { ethers } = require('ethers');
const config = require('../config');

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
 * @param {string} abi Factory ABI
 * @param {ethers.Signer} signer Signer (optional)
 * @returns {ethers.Contract} Factory contract instance
 */
function getFactoryContract(abi, signer = null) {
  return getContract(config.blockchain.factoryAddress, abi, signer);
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

module.exports = {
  initProvider,
  getProvider,
  getWallet,
  getContract,
  getFactoryContract,
  listenForEvents,
  getPastEvents,
  getCurrentBlockNumber,
  getTransactionReceipt
};
