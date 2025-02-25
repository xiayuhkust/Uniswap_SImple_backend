const { Token } = require('../models/db');
const { ethers } = require('ethers');
const { getProvider } = require('./blockchain');
const config = require('../config');

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)'
];

/**
 * Get all tokens from database
 * @returns {Promise<Array>} Array of tokens
 */
async function getAllTokens() {
  return await Token.findAll();
}

/**
 * Get token by address
 * @param {string} address Token address
 * @returns {Promise<Object>} Token object
 */
async function getTokenByAddress(address) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  return await Token.findByPk(normalizedAddress);
}

/**
 * Create or update token
 * @param {Object} tokenData Token data
 * @returns {Promise<Object>} Created or updated token
 */
async function createOrUpdateToken(tokenData) {
  const { address, ...data } = tokenData;
  
  if (!address) {
    throw new Error('Token address is required');
  }
  
  const normalizedAddress = address.toLowerCase();
  
  const [token, created] = await Token.findOrCreate({
    where: { address: normalizedAddress },
    defaults: { 
      ...data, 
      address: normalizedAddress 
    }
  });
  
  if (!created) {
    await token.update(data);
  }
  
  return token;
}

/**
 * Fetch token data from blockchain
 * @param {string} address Token address
 * @returns {Promise<Object>} Token data
 */
async function fetchTokenDataFromChain(address) {
  try {
    const provider = getProvider();
    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
    
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);
    
    return {
      address,
      name,
      symbol,
      decimals: Number(decimals),
      chainId: config.blockchain.chainId
    };
  } catch (error) {
    console.error(`Error fetching token data for ${address}:`, error);
    throw new Error(`Failed to fetch token data: ${error.message}`);
  }
}

/**
 * Get or create token by address
 * @param {string} address Token address
 * @returns {Promise<Object>} Token object
 */
async function getOrCreateToken(address) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  let token = await getTokenByAddress(normalizedAddress);
  
  if (!token) {
    try {
      const tokenData = await fetchTokenDataFromChain(normalizedAddress);
      token = await createOrUpdateToken(tokenData);
    } catch (error) {
      console.error(`Failed to create token ${normalizedAddress}:`, error);
      throw error;
    }
  }
  
  return token;
}

/**
 * Initialize default tokens
 * @returns {Promise<Array>} Array of created tokens
 */
async function initializeDefaultTokens() {
  const tokens = [];
  
  for (const tokenData of config.defaultTokens) {
    const token = await createOrUpdateToken(tokenData);
    tokens.push(token);
  }
  
  return tokens;
}

module.exports = {
  getAllTokens,
  getTokenByAddress,
  createOrUpdateToken,
  fetchTokenDataFromChain,
  getOrCreateToken,
  initializeDefaultTokens
};
