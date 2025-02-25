const { Token } = require('./db');
const config = require('../config');

/**
 * Get all tokens
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
  return await Token.findByPk(address.toLowerCase());
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
  initializeDefaultTokens
};
