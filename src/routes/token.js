const express = require('express');
const router = express.Router();
const tokenService = require('../services/token');

/**
 * @route GET /api/tokens
 * @desc Get all tokens
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const tokens = await tokenService.getAllTokens();
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

/**
 * @route GET /api/tokens/:address
 * @desc Get token by address
 * @access Public
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    const token = await tokenService.getTokenByAddress(address);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

/**
 * @route POST /api/tokens
 * @desc Create or update token
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const { address, name, symbol, decimals, chainId, logoURI } = req.body;
    
    if (!address || !name || !symbol || !decimals || !chainId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    const token = await tokenService.createOrUpdateToken({
      address,
      name,
      symbol,
      decimals,
      chainId,
      logoURI
    });
    
    res.status(201).json(token);
  } catch (error) {
    console.error('Error creating/updating token:', error);
    res.status(500).json({ error: 'Failed to create/update token' });
  }
});

module.exports = router;
