# Uniswap Simple Deployment Guide

This guide provides step-by-step instructions for deploying both the backend and frontend components of the Uniswap Simple application.

## Backend Deployment

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

### Step 1: Clone the Repository
```bash
# Clone the backend repository
git clone https://github.com/xiayuhkust/Uniswap_SImple_backend.git
cd Uniswap_SImple_backend
git checkout backend-extraction
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory with the following content:
```
# Blockchain Configuration
TURA_RPC_URL=your_rpc_url_here
TURA_CHAIN_ID=your_chain_id_here
PRIVATE_KEYS=your_private_key_here

# Server Configuration
PORT=your_port_here

# Database Configuration
DB_STORAGE=your_database_path_here

# Factory Contract Address
FACTORY_ADDRESS=your_factory_address_here
```

### Step 3: Install Dependencies and Start the Server
```bash
# Install dependencies
npm install

# Create database directory
mkdir -p database

# Start the server
npm start
```

Note: The server is configured to bind to all network interfaces (0.0.0.0), allowing it to be accessed from any device on the network.

The backend server will start on your configured port (default: 3000).

### Backend API Endpoints

#### Tokens
- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:address` - Get token by address

#### Pools
- `GET /api/pools` - Get all pools
- `GET /api/pools/:address` - Get pool by address

### WebSocket Events
The backend provides real-time updates through WebSocket connections:

- `pool:created` - Emitted when a new pool is created
- `pool:updated` - Emitted when a pool is updated
- `cache:pools` - Emitted when the pool cache is refreshed

## Frontend Deployment

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/xiayuhkust/Uniswap_Simple.git
cd Uniswap_Simple
git checkout feature/pool-list-backend-integration
```

### Step 2: Configure Environment Variables
Create a `.env` file in the frontend directory with the following content:
```
VITE_BACKEND_URL=your_backend_url_here
VITE_TURA_RPC_URL=your_rpc_url_here
VITE_TURA_CHAIN_ID=your_chain_id_here
```

### Step 3: Install Dependencies and Start the Development Server
```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start on your configured port (default: 5173).

## Testing the Integration

1. Start the backend server first
2. Start the frontend development server
3. Open the frontend URL in your browser (default: http://localhost:5173)
4. Navigate to the Pool page
5. You should see the PoolList component with the "Live Updates" badge
6. If there are no pools, you'll see the "No pools found" message
7. Create a new pool to test the real-time updates

## Troubleshooting

### Backend Issues
- **Database errors**: Ensure the database directory exists and is writable
- **Connection errors**: Check that the RPC URL is correct and accessible
- **Contract errors**: Verify that the Factory contract address is correct

### Frontend Issues
- **WebSocket connection errors**: Ensure the backend server is running
- **Compilation errors**: Check for TypeScript errors in the console
- **Rendering issues**: Verify that the Pool type definition matches the data returned by the backend API

## Deployment Records

All contract deployments should be recorded in the `Notes/deployment_records.md` file with the following information:
- Contract name
- Contract address
- Deployment date
- Verification status

## Maintenance

### Backend
- The backend server runs scheduled tasks to update pool and token data
- Pool data is updated every 5 minutes
- Token list is updated every hour

### Frontend
- The frontend uses WebSocket to receive real-time updates
- The connection status is displayed in the UI
- Manual refresh is available if the connection is lost
