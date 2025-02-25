# Token and Pool List Management System

## Overview

This document outlines the design and implementation of the token and pool list management system for the Uniswap V3 implementation. The system is responsible for maintaining an up-to-date list of tokens and pools, providing this information to the frontend, and enabling real-time updates.

## System Architecture

The system consists of the following components:

1. **Backend Service**: A Node.js server that maintains a database of tokens and pools, listens for blockchain events, and provides API endpoints for the frontend.
2. **Database**: A SQLite database that stores token and pool information.
3. **Blockchain Event Listeners**: Services that monitor the blockchain for events related to pool creation and updates.
4. **WebSocket Service**: A service that provides real-time updates to the frontend.
5. **Frontend Integration**: Components and hooks that consume the backend API and WebSocket service.

### Backend Service

The backend service is built using Express.js and provides the following functionality:

- RESTful API endpoints for token and pool data
- WebSocket server for real-time updates
- Blockchain event monitoring
- Scheduled data updates

#### API Endpoints

- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:address` - Get token by address
- `POST /api/tokens` - Create or update token
- `GET /api/pools` - Get all pools
- `GET /api/pools/:address` - Get pool by address
- `GET /api/pools/token/:address` - Get pools by token address
- `POST /api/pools` - Create or update pool
- `PUT /api/pools/:address/data` - Update pool price and liquidity data
- `PUT /api/pools/:address/volume` - Update pool volume data

#### WebSocket Events

- `pool:updated` - Pool data updated
- `pool:created` - New pool created
- `cache:pools` - Pools cache updated

### Database Schema

The database schema consists of two main tables:

#### Tokens Table

| Column   | Type    | Description                    |
|----------|---------|--------------------------------|
| address  | STRING  | Token address (primary key)    |
| name     | STRING  | Token name                     |
| symbol   | STRING  | Token symbol                   |
| decimals | INTEGER | Token decimals                 |
| chainId  | INTEGER | Chain ID                       |
| logoURI  | STRING  | Token logo URI (optional)      |

#### Pools Table

| Column        | Type    | Description                       |
|---------------|---------|-----------------------------------|
| address       | STRING  | Pool address (primary key)        |
| token0Address | STRING  | Token0 address                    |
| token1Address | STRING  | Token1 address                    |
| token0Symbol  | STRING  | Token0 symbol                     |
| token1Symbol  | STRING  | Token1 symbol                     |
| fee           | INTEGER | Fee tier                          |
| tickSpacing   | INTEGER | Tick spacing                      |
| sqrtPriceX96  | STRING  | Square root price X96 (optional)  |
| liquidity     | STRING  | Liquidity (optional)              |
| tick          | INTEGER | Current tick (optional)           |
| volume24h     | STRING  | 24-hour volume (optional)         |
| volumeWeek    | STRING  | Weekly volume (optional)          |
| volumeMonth   | STRING  | Monthly volume (optional)         |
| tvl           | STRING  | Total value locked (optional)     |
| initialized   | BOOLEAN | Whether the pool is initialized   |

### Blockchain Event Listeners

The system listens for the following blockchain events:

- `PoolCreated` - Emitted when a new pool is created
- `Mint` - Emitted when liquidity is added to a pool
- `Burn` - Emitted when liquidity is removed from a pool
- `Swap` - Emitted when a swap occurs in a pool

### Scheduled Tasks

The system runs the following scheduled tasks:

- Pool data updates (every 5 minutes)
- Token list updates (every hour)

## Frontend Integration

The frontend integrates with the backend service using the following components:

### WebSocket Hook

```typescript
// useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';

export function useWebSocket<T>(
  url: string,
  onMessage?: (data: T) => void,
  autoReconnect = true
) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        
        if (autoReconnect) {
          setTimeout(() => {
            connect();
          }, 3000);
        }
      };
      
      setSocket(ws);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsConnected(false);
    }
  }, [url, onMessage, autoReconnect]);
  
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);
  
  const send = useCallback((data: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  }, [socket, isConnected]);
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return { isConnected, error, send };
}
```

### Pool List WebSocket Hook

```typescript
// usePoolListWebSocket.ts
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { Pool } from '../types/pool';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export function usePoolListWebSocket() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'cache' && data.resource === 'pools') {
      setPools(data.data);
      setLoading(false);
    } else if (data.type === 'update' && data.channel === 'pool:updated') {
      setPools(prevPools => {
        const updatedPools = [...prevPools];
        const index = updatedPools.findIndex(p => p.address === data.data.address);
        
        if (index !== -1) {
          updatedPools[index] = { ...updatedPools[index], ...data.data };
        }
        
        return updatedPools;
      });
    } else if (data.type === 'update' && data.channel === 'pool:created') {
      setPools(prevPools => [...prevPools, data.data]);
    } else if (data.type === 'update' && data.channel === 'cache:pools') {
      setPools(data.data);
    }
  }, []);
  
  const { isConnected, error: wsError, send } = useWebSocket<any>(
    `${WS_URL}`,
    handleMessage
  );
  
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);
  
  useEffect(() => {
    if (isConnected) {
      // Subscribe to pool updates
      send({
        type: 'subscribe',
        channel: 'pool:updated'
      });
      
      // Subscribe to new pool notifications
      send({
        type: 'subscribe',
        channel: 'pool:created'
      });
      
      // Subscribe to pool cache updates
      send({
        type: 'subscribe',
        channel: 'cache:pools'
      });
      
      // Request initial pool data
      send({
        type: 'request',
        resource: 'pools'
      });
    }
  }, [isConnected, send]);
  
  return { pools, loading, error, isConnected };
}
```

### Pool List Component

```typescript
// PoolList/index.tsx
import { usePoolListWebSocket } from '../../hooks/usePoolListWebSocket';
import { formatAddress } from '../../utils';
import { Link } from 'react-router-dom';

export function PoolList() {
  const { pools, loading, error, isConnected } = usePoolListWebSocket();
  
  if (loading) {
    return <div>Loading pools...</div>;
  }
  
  if (error) {
    return <div>Error loading pools: {error.message}</div>;
  }
  
  return (
    <div>
      <div className="connection-status">
        {isConnected ? 'Connected to WebSocket' : 'Disconnected from WebSocket'}
      </div>
      
      <h2>Pools ({pools.length})</h2>
      
      <table>
        <thead>
          <tr>
            <th>Pool</th>
            <th>Fee</th>
            <th>Price</th>
            <th>TVL</th>
            <th>Volume (24h)</th>
          </tr>
        </thead>
        <tbody>
          {pools.map(pool => (
            <tr key={pool.address}>
              <td>
                <Link to={`/pool/${pool.address}`}>
                  {pool.token0Symbol}/{pool.token1Symbol}
                </Link>
              </td>
              <td>{pool.fee / 10000}%</td>
              <td>{pool.sqrtPriceX96 ? formatPrice(pool.sqrtPriceX96) : 'N/A'}</td>
              <td>{pool.tvl ? formatLiquidity(pool.tvl) : 'N/A'}</td>
              <td>{pool.volume24h ? formatVolume(pool.volume24h) : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Implementation Plan

### Phase 1: Backend Setup (Completed)

- [x] Set up Node.js backend with Express.js
- [x] Configure SQLite database with Sequelize ORM
- [x] Create models for tokens and pools
- [x] Implement API endpoints for token and pool data
- [x] Set up WebSocket server for real-time updates

### Phase 2: Blockchain Integration (Completed)

- [x] Implement blockchain event listeners
- [x] Create services for token and pool data fetching
- [x] Set up scheduled tasks for data updates

### Phase 3: Frontend Integration (In Progress)

- [x] Create WebSocket hook for real-time updates
- [x] Implement pool list component with WebSocket integration
- [ ] Update pool detail page to use backend data
- [ ] Implement token list component

### Phase 4: Testing and Deployment (Pending)

- [ ] Write unit tests for backend services
- [ ] Write integration tests for API endpoints
- [ ] Deploy backend service
- [ ] Configure frontend to use deployed backend

## Conclusion

The token and pool list management system provides a robust solution for maintaining and displaying token and pool data in the Uniswap V3 implementation. The system leverages a combination of blockchain event monitoring, scheduled data updates, and real-time WebSocket communication to ensure that users always have access to the most up-to-date information.
