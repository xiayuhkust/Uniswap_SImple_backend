const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Define Token model
const Token = sequelize.define('Token', {
  address: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      isEthereumAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Address must be a valid Ethereum address');
        }
      }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  decimals: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 18
  },
  chainId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  logoURI: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['address', 'chainId']
    }
  ]
});

// Define Pool model
const Pool = sequelize.define('Pool', {
  address: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      isEthereumAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Address must be a valid Ethereum address');
        }
      }
    }
  },
  token0Address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Address must be a valid Ethereum address');
        }
      }
    }
  },
  token1Address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(value) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Address must be a valid Ethereum address');
        }
      }
    }
  },
  token0Symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token1Symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tickSpacing: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sqrtPriceX96: {
    type: DataTypes.STRING,
    allowNull: true
  },
  liquidity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tick: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  volume24h: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '0'
  },
  volumeWeek: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '0'
  },
  volumeMonth: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '0'
  },
  tvl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '0'
  },
  initialized: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['token0Address']
    },
    {
      fields: ['token1Address']
    }
  ]
});

// Define relationships
Token.hasMany(Pool, { 
  as: 'token0Pools',
  foreignKey: 'token0Address',
  sourceKey: 'address',
  constraints: false
});

Token.hasMany(Pool, { 
  as: 'token1Pools',
  foreignKey: 'token1Address',
  sourceKey: 'address',
  constraints: false
});

Pool.belongsTo(Token, { 
  as: 'token0',
  foreignKey: 'token0Address',
  targetKey: 'address',
  constraints: false
});

Pool.belongsTo(Token, { 
  as: 'token1',
  foreignKey: 'token1Address',
  targetKey: 'address',
  constraints: false
});

module.exports = {
  sequelize,
  Token,
  Pool
};
