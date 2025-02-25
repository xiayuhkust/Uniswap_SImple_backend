const { Pool } = require('./db');
const { ethers } = require('ethers');
const config = require('../config');

/**
 * Get all pools
 * @returns {Promise<Array>} Array of pools
 */
async function getAllPools() {
  return await Pool.findAll({
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Get pool by address
 * @param {string} address Pool address
 * @returns {Promise<Object>} Pool object
 */
async function getPoolByAddress(address) {
  return await Pool.findByPk(address.toLowerCase());
}

/**
 * Get pools by token address
 * @param {string} tokenAddress Token address
 * @returns {Promise<Array>} Array of pools
 */
async function getPoolsByToken(tokenAddress) {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  return await Pool.findAll({
    where: {
      [Op.or]: [
        { token0Address: normalizedAddress },
        { token1Address: normalizedAddress }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Create or update pool
 * @param {Object} poolData Pool data
 * @returns {Promise<Object>} Created or updated pool
 */
async function createOrUpdatePool(poolData) {
  const { address, ...data } = poolData;
  
  if (!address) {
    throw new Error('Pool address is required');
  }
  
  const normalizedAddress = address.toLowerCase();
  const normalizedToken0 = data.token0Address ? data.token0Address.toLowerCase() : undefined;
  const normalizedToken1 = data.token1Address ? data.token1Address.toLowerCase() : undefined;
  
  const [pool, created] = await Pool.findOrCreate({
    where: { address: normalizedAddress },
    defaults: { 
      ...data, 
      address: normalizedAddress,
      token0Address: normalizedToken0,
      token1Address: normalizedToken1
    }
  });
  
  if (!created) {
    await pool.update({
      ...data,
      token0Address: normalizedToken0,
      token1Address: normalizedToken1
    });
  }
  
  return pool;
}

/**
 * Update pool price and liquidity data
 * @param {string} address Pool address
 * @param {Object} data Pool data to update
 * @returns {Promise<Object>} Updated pool
 */
async function updatePoolData(address, data) {
  const pool = await getPoolByAddress(address);
  
  if (!pool) {
    throw new Error(`Pool not found: ${address}`);
  }
  
  await pool.update(data);
  return pool;
}

/**
 * Update pool volume data
 * @param {string} address Pool address
 * @param {string} volume24h 24-hour volume
 * @param {string} volumeWeek Weekly volume
 * @param {string} volumeMonth Monthly volume
 * @returns {Promise<Object>} Updated pool
 */
async function updatePoolVolume(address, volume24h, volumeWeek, volumeMonth) {
  const pool = await getPoolByAddress(address);
  
  if (!pool) {
    throw new Error(`Pool not found: ${address}`);
  }
  
  await pool.update({
    volume24h: volume24h || pool.volume24h,
    volumeWeek: volumeWeek || pool.volumeWeek,
    volumeMonth: volumeMonth || pool.volumeMonth
  });
  
  return pool;
}

module.exports = {
  getAllPools,
  getPoolByAddress,
  getPoolsByToken,
  createOrUpdatePool,
  updatePoolData,
  updatePoolVolume
};
