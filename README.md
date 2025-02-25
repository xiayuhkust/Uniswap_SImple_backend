# Uniswap Simple Backend

Backend service for the Uniswap Simple DEX, providing token and pool list management, real-time updates, and blockchain event monitoring.

## Features

- Token and pool list management
- Real-time updates via WebSocket
- Blockchain event monitoring
- RESTful API for token and pool data
- Scheduled data updates

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- SQLite

## Installation

1. Clone the repository:
```bash
git clone https://github.com/xiayuhkust/Uniswap_SImple_backend.git
cd Uniswap_SImple_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
# Blockchain Configuration
TURA_RPC_URL=https://rpc-beta1.turablockchain.com
TURA_CHAIN_ID=1337
FACTORY_ADDRESS=0xdf5F4d3239391716A4F5928d57E2AaDd3f644C70

# Server Configuration
PORT=3000

# Database Configuration
DB_STORAGE=database/uniswap-simple.sqlite

# Logging Configuration
LOG_LEVEL=info
```

4. Create the database directory:
```bash
mkdir -p database
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## API Endpoints

### Tokens

- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:address` - Get token by address
- `POST /api/tokens` - Create or update token

### Pools

- `GET /api/pools` - Get all pools
- `GET /api/pools/:address` - Get pool by address
- `GET /api/pools/token/:address` - Get pools by token address
- `POST /api/pools` - Create or update pool
- `PUT /api/pools/:address/data` - Update pool price and liquidity data
- `PUT /api/pools/:address/volume` - Update pool volume data

## WebSocket API

The WebSocket server is available at the same port as the HTTP server. You can connect to it using:

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### WebSocket Events

- `pool:updated` - Pool data updated
- `pool:created` - New pool created
- `cache:pools` - Pools cache updated

### WebSocket Messages

#### Subscribe to a channel

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'pool:updated'
}));
```

#### Request data

```javascript
ws.send(JSON.stringify({
  type: 'request',
  resource: 'pools'
}));
```

## License

MIT
