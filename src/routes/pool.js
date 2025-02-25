const express = require('express');
const router = express.Router();
const poolService = require('../services/pool');

/**
 * @route GET /api/pools
 * @desc Get all pools
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const pools = await poolService.getAllPools();
    res.json(pools);
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
});

/**
 * @route GET /api/pools/:address
 * @desc Get pool by address
 * @access Public
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid pool address' });
    }
    
    const pool = await poolService.getPoolByAddress(address);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    res.json(pool);
  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({ error: 'Failed to fetch pool' });
  }
});

/**
 * @route GET /api/pools/token/:address
 * @desc Get pools by token address
 * @access Public
 */
router.get('/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    const pools = await poolService.getPoolsByToken(address);
    res.json(pools);
  } catch (error) {
    console.error('Error fetching pools by token:', error);
    res.status(500).json({ error: 'Failed to fetch pools by token' });
  }
});

/**
 * @route POST /api/pools
 * @desc Create or update pool
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const { 
      address, 
      token0Address, 
      token1Address, 
      token0Symbol,
      token1Symbol,
      fee, 
      tickSpacing, 
      sqrtPriceX96, 
      liquidity, 
      tick 
    } = req.body;
    
    if (!address || !token0Address || !token1Address || !fee || !tickSpacing) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address) || 
        !/^0x[a-fA-F0-9]{40}$/.test(token0Address) || 
        !/^0x[a-fA-F0-9]{40}$/.test(token1Address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const pool = await poolService.createOrUpdatePool({
      address,
      token0Address,
      token1Address,
      token0Symbol,
      token1Symbol,
      fee,
      tickSpacing,
      sqrtPriceX96,
      liquidity,
      tick,
      initialized: !!sqrtPriceX96
    });
    
    res.status(201).json(pool);
  } catch (error) {
    console.error('Error creating/updating pool:', error);
    res.status(500).json({ error: 'Failed to create/update pool' });
  }
});

/**
 * @route PUT /api/pools/:address/data
 * @desc Update pool price and liquidity data
 * @access Public
 */
router.put('/:address/data', async (req, res) => {
  try {
    const { address } = req.params;
    const { sqrtPriceX96, liquidity, tick } = req.body;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid pool address' });
    }
    
    const pool = await poolService.updatePoolData(address, {
      sqrtPriceX96,
      liquidity,
      tick,
      initialized: true
    });
    
    res.json(pool);
  } catch (error) {
    console.error('Error updating pool data:', error);
    res.status(500).json({ error: 'Failed to update pool data' });
  }
});

/**
 * @route PUT /api/pools/:address/volume
 * @desc Update pool volume data
 * @access Public
 */
router.put('/:address/volume', async (req, res) => {
  try {
    const { address } = req.params;
    const { volume24h, volumeWeek, volumeMonth } = req.body;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid pool address' });
    }
    
    const pool = await poolService.updatePoolVolume(address, volume24h, volumeWeek, volumeMonth);
    res.json(pool);
  } catch (error) {
    console.error('Error updating pool volume:', error);
    res.status(500).json({ error: 'Failed to update pool volume' });
  }
});

module.exports = router;
