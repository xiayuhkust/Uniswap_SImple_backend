const { ethers } = require('ethers');

/**
 * Format address to checksum format
 * @param {string} address Ethereum address
 * @returns {string} Checksum address
 */
function formatAddress(address) {
  if (!address) return '';
  
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error('Invalid address format:', error);
    return address;
  }
}

/**
 * Validate Ethereum address
 * @param {string} address Ethereum address
 * @returns {boolean} Is valid address
 */
function isValidAddress(address) {
  if (!address) return false;
  
  try {
    ethers.getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format price from sqrtPriceX96
 * @param {string} sqrtPriceX96 Square root price in X96 format
 * @param {number} token0Decimals Token0 decimals
 * @param {number} token1Decimals Token1 decimals
 * @returns {string} Formatted price
 */
function formatSqrtPriceX96(sqrtPriceX96, token0Decimals = 18, token1Decimals = 18) {
  if (!sqrtPriceX96) return '0';
  
  try {
    // Convert sqrtPriceX96 to price
    const Q96 = ethers.BigInt(2) ** ethers.BigInt(96);
    const sqrtPriceBigInt = ethers.BigInt(sqrtPriceX96);
    
    // price = (sqrtPriceX96 / 2^96) ^ 2
    const price = (sqrtPriceBigInt * sqrtPriceBigInt * ethers.BigInt(10) ** ethers.BigInt(token0Decimals)) / 
                  (Q96 * Q96 * ethers.BigInt(10) ** ethers.BigInt(token1Decimals));
    
    return price.toString();
  } catch (error) {
    console.error('Error formatting sqrtPriceX96:', error);
    return '0';
  }
}

/**
 * Format price for display
 * @param {string} price Price as string
 * @param {number} decimals Number of decimals to display
 * @returns {string} Formatted price for display
 */
function formatPriceForDisplay(price, decimals = 6) {
  if (!price) return '0';
  
  try {
    const priceBigInt = ethers.BigInt(price);
    const priceNumber = Number(priceBigInt) / 10 ** decimals;
    
    if (priceNumber < 0.000001) {
      return priceNumber.toExponential(4);
    }
    
    return priceNumber.toFixed(Math.min(decimals, 6));
  } catch (error) {
    console.error('Error formatting price for display:', error);
    return '0';
  }
}

/**
 * Format liquidity for display
 * @param {string} liquidity Liquidity as string
 * @param {number} decimals Number of decimals to display
 * @returns {string} Formatted liquidity for display
 */
function formatLiquidityForDisplay(liquidity, decimals = 2) {
  if (!liquidity) return '0';
  
  try {
    const liquidityBigInt = ethers.BigInt(liquidity);
    const liquidityNumber = Number(liquidityBigInt) / 10 ** 18;
    
    if (liquidityNumber >= 1_000_000) {
      return `${(liquidityNumber / 1_000_000).toFixed(decimals)}M`;
    } else if (liquidityNumber >= 1_000) {
      return `${(liquidityNumber / 1_000).toFixed(decimals)}K`;
    }
    
    return liquidityNumber.toFixed(decimals);
  } catch (error) {
    console.error('Error formatting liquidity for display:', error);
    return '0';
  }
}

/**
 * Format volume for display
 * @param {string} volume Volume as string
 * @param {number} decimals Number of decimals to display
 * @returns {string} Formatted volume for display
 */
function formatVolumeForDisplay(volume, decimals = 2) {
  return formatLiquidityForDisplay(volume, decimals);
}

/**
 * Calculate price from tick
 * @param {number} tick Tick
 * @returns {string} Price
 */
function tickToPrice(tick) {
  if (tick === undefined || tick === null) return '0';
  
  try {
    const price = 1.0001 ** tick;
    return price.toString();
  } catch (error) {
    console.error('Error calculating price from tick:', error);
    return '0';
  }
}

/**
 * Calculate tick from price
 * @param {number|string} price Price
 * @returns {number} Tick
 */
function priceToTick(price) {
  if (!price) return 0;
  
  try {
    const priceNumber = typeof price === 'string' ? parseFloat(price) : price;
    return Math.floor(Math.log(priceNumber) / Math.log(1.0001));
  } catch (error) {
    console.error('Error calculating tick from price:', error);
    return 0;
  }
}

module.exports = {
  formatAddress,
  isValidAddress,
  formatSqrtPriceX96,
  formatPriceForDisplay,
  formatLiquidityForDisplay,
  formatVolumeForDisplay,
  tickToPrice,
  priceToTick
};
