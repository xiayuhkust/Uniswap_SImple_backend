const { Pool, Token, sequelize } = require('../models/db');
const { Op } = require('sequelize');
const { ethers } = require('ethers');
const tokenService = require('./token');
const { getProvider } = require('./blockchain');
const config = require('../config');

// Pool ABI for blockchain interactions
const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function tickSpacing() external view returns (int24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

/**
 * Get all pools from database
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
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  return await Pool.findByPk(normalizedAddress);
}

/**
 * Get pools by token address
 * @param {string} tokenAddress Token address
 * @returns {Promise<Array>} Array of pools
 */
async function getPoolsByToken(tokenAddress) {
  if (!tokenAddress) return [];
  
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

/**
 * Fetch pool data from blockchain
 * @param {string} address Pool address
 * @returns {Promise<Object>} Pool data
 */
async function fetchPoolDataFromChain(address) {
  try {
    const provider = getProvider();
    const poolContract = new ethers.Contract(address, POOL_ABI, provider);
    
    const [token0Address, token1Address, fee, tickSpacing, liquidity, slot0] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0()
    ]);
    
    // Get token symbols
    const token0 = await tokenService.getOrCreateToken(token0Address);
    const token1 = await tokenService.getOrCreateToken(token1Address);
    
    return {
      address,
      token0Address: token0Address.toLowerCase(),
      token1Address: token1Address.toLowerCase(),
      token0Symbol: token0.symbol,
      token1Symbol: token1.symbol,
      fee: Number(fee),
      tickSpacing: Number(tickSpacing),
      sqrtPriceX96: slot0.sqrtPriceX96.toString(),
      tick: Number(slot0.tick),
      liquidity: liquidity.toString(),
      initialized: true
    };
  } catch (error) {
    console.error(`Error fetching pool data for ${address}:`, error);
    throw new Error(`Failed to fetch pool data: ${error.message}`);
  }
}

/**
 * Get or create pool by address
 * @param {string} address Pool address
 * @returns {Promise<Object>} Pool object
 */
async function getOrCreatePool(address) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  let pool = await getPoolByAddress(normalizedAddress);
  
  if (!pool) {
    try {
      const poolData = await fetchPoolDataFromChain(normalizedAddress);
      pool = await createOrUpdatePool(poolData);
    } catch (error) {
      console.error(`Failed to create pool ${normalizedAddress}:`, error);
      throw error;
    }
  }
  
  return pool;
}

module.exports = {
  getAllPools,
  getPoolByAddress,
  getPoolsByToken,
  createOrUpdatePool,
  updatePoolData,
  updatePoolVolume,
  fetchPoolDataFromChain,
  getOrCreatePool
};
