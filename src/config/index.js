require('dotenv').config();
const path = require('path');

module.exports = {
  // Blockchain Configuration
  blockchain: {
    rpcUrl: process.env.TURA_RPC_URL || 'https://rpc-beta1.turablockchain.com',
    chainId: parseInt(process.env.TURA_CHAIN_ID || '1337', 10),
    factoryAddress: process.env.FACTORY_ADDRESS || '0xdf5F4d3239391716A4F5928d57E2AaDd3f644C70',
    privateKey: process.env.PRIVATE_KEYS || 'ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474'
  },
  
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  },
  
  // Database Configuration
  database: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../database/uniswap-simple.sqlite')
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // Default Tokens
  defaultTokens: [
    {
      address: '0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be',
      name: 'Wrapped Tura',
      symbol: 'WTURA',
      decimals: 18,
      chainId: 1337
    },
    {
      address: '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9',
      name: 'Test Token 1',
      symbol: 'TT1',
      decimals: 18,
      chainId: 1337
    },
    {
      address: '0xC8F7D7989A409472945b00177396f4E9b8601df3',
      name: 'Test Token 2',
      symbol: 'TT2',
      decimals: 18,
      chainId: 1337
    }
  ]
};
