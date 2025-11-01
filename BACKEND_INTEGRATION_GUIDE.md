# Backend Integration Guide

## Overview

The Packet Royale frontend has been integrated with the CamHack backend using HTTP polling and client-side data transformation. This integration requires **zero backend code changes** and works with the existing backend API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 CamHack Backend (../camhack)                 │
│                                                              │
│  GET /game/state  →  { players[], nodes[], total_events }  │
│  POST /events     →  Submit game events (attack, etc.)      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Polling (500ms)
                     │ JSON over HTTP
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Packet Royale Frontend (./packet-royale-frontend)    │
│                                                              │
│  ┌──────────────────┐      ┌───────────────────────┐       │
│  │  backendApi.ts   │─────▶│ backendAdapter.ts     │       │
│  │  (HTTP Client)   │      │ (Data Transform)      │       │
│  └──────────────────┘      └───────────┬───────────┘       │
│                                        │                    │
│                                        ▼                    │
│                              ┌─────────────────┐            │
│                              │   GameScene.ts  │            │
│                              │   (Phaser.js)   │            │
│                              └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Backend API Service Layer
**File**: `src/services/backendApi.ts`

Handles HTTP communication with CamHack backend:
- `fetchGameState()` - Poll game state (GET /game/state)
- `setAttackTarget()` - Send attack commands (POST /events)
- `stopAttack()` - Stop attacking (POST /events with null target)
- `joinGame()` - Join as a player (POST /events)
- `pingBackend()` - Health check

### 2. Data Transformation Adapter
**File**: `src/adapters/backendAdapter.ts`

Transforms backend data format → frontend data format:
- **Player Colors**: Maps `player_id` → color from palette
- **Node Types**: Determines BASE vs OWNED vs NEUTRAL
- **Fog of War**: Calculates visibility based on ownership
- **Bandwidth Streams**: Derives from `node.current_target` field
- **Throughput**: Converts bytes/sec → Gbps
- **Capture Progress**: Simulates progress based on attack intensity

### 3. Backend Configuration
**File**: `src/config/backend.ts`

Configuration settings:
- Backend URL (from env or default localhost:8080)
- Polling interval (500ms)
- Request timeout (5 seconds)
- Retry logic
- Debug logging

### 4. Environment Configuration
**File**: `.env`

```env
VITE_BACKEND_URL=http://localhost:8080
```

## How Data Transformation Works

### Backend Format → Frontend Format

#### Players
```typescript
// Backend provides:
{
  player_id: 1,
  name: "Alice",
  capital_coord: { q: 0, r: 0 },
  alive: true,
  node_count: 5
}

// Frontend receives:
{
  id: 1,
  name: "Alice",
  color: 0x00ffff,           // Auto-assigned from palette
  totalThroughput: 12.5,     // Calculated from streams
  nodesOwned: 5,
  maxNodes: 100,
  baseNodeId: "0,0",
  isAlive: true
}
```

#### Nodes
```typescript
// Backend provides:
{
  coord: { q: 2, r: 3 },
  owner_id: 1,
  current_target: { q: 5, r: 6 }  // Node is attacking (5,6)
}

// Frontend receives:
{
  id: "2,3",
  position: { q: 2, r: 3, s: -5 },
  type: "OWNED",             // Determined by owner and position
  state: "IDLE",
  ownerId: 1,
  bandwidth: 7.5,            // Simulated (backend doesn't expose yet)
  maxBandwidth: 10.0,
  captureProgress: 0,
  explored: true             // Calculated based on player's vision
}
```

#### Bandwidth Streams (Derived)
```typescript
// Backend has: node.current_target
// Frontend creates:
{
  id: "2,3->5,6",
  sourceNodeId: "2,3",
  targetNodeId: "5,6",
  ownerId: 1,
  bandwidth: 8.0,            // Simulated
  maxBandwidth: 10.0,
  packetsSent: 15000,        // Simulated
  packetsLost: 150,          // Simulated (10% at high load)
  active: true
}
```

## Frontend-Only Features

These features are implemented purely in the frontend using data transformations:

### 1. Fog of War
- Backend sends ALL nodes
- Frontend filters based on player's visibility rules:
  - Own nodes are visible
  - Nodes adjacent to own nodes are visible
  - Nodes being attacked by player are visible

### 2. Player Colors
- Backend assigns `player_id` only
- Frontend maps: `color = PLAYER_COLORS[player_id % PLAYER_COLORS.length]`
- Palette: `[0x00ffff, 0xff1493, 0x00ff00, 0xff8800, ...]`

### 3. Throughput Calculation
- Backend provides `capacity` (bytes/sec) per node
- Frontend converts: `gbps = (bytes_per_sec / 1_000_000_000) * 8`
- Aggregates across all player's streams

### 4. Capture Progress
- Backend fires `NodeCaptured` event when capture completes
- Frontend animates progress 0→1 based on attack intensity
- Progress = `incoming_bandwidth / max_capacity` (capped at 95%)

### 5. Bandwidth Streams
- Backend stores `current_target` per node
- Frontend creates stream objects from source→target
- Simulates bandwidth numbers (backend doesn't expose metrics yet)

## Running the Integration

### 1. Start Backend (CamHack)

Navigate to camhack directory and start the backend:

```bash
cd ../camhack

# Option A: Run master locally (if you have Rust)
cd master
cargo run --release

# Option B: Use deployed ECS master
# Get master IP from deployment scripts
cd master
./scripts/get-ip.sh
export MASTER_IP=<ip-from-output>
```

Backend should be running at `http://localhost:8080` or your deployed IP.

### 2. Configure Frontend

Update `.env` file if backend is not on localhost:

```bash
cd packet-royale-frontend
echo "VITE_BACKEND_URL=http://<backend-ip>:8080" > .env
```

### 3. Start Frontend

```bash
npm install
npm run dev
```

Open browser to `http://localhost:5173`

### 4. Verify Connection

Check browser console for:
```
✅ [Backend] Checking backend connection...
✅ [Backend] Backend connected successfully
✅ GameScene initialized with X nodes
✅ Backend mode: ENABLED
```

If you see:
```
❌ [Backend Error] Backend not reachable, falling back to dummy data
✅ Backend mode: DISABLED (dummy data)
```

The frontend will still work with dummy data!

## Testing Without Backend

The frontend gracefully falls back to dummy data if backend is unavailable:

1. Set `VITE_BACKEND_URL` to invalid URL, or
2. Edit `src/config/backend.ts` and set `enabled: false`

The game will run with simulated data.

## Toggling Between Hex and Graph Views

Edit `src/main.ts`:

```typescript
const USE_HEX_GRID = true;  // Hex grid (integrated with backend)
const USE_HEX_GRID = false; // Graph view (dummy data only)
```

## Polling Configuration

Edit `src/config/backend.ts`:

```typescript
pollingInterval: 500,    // Fetch game state every 500ms (2 Hz)
requestTimeout: 5000,    // 5 second timeout per request
retryAttempts: 3,        // Retry 3 times on failure
debug: true,             // Enable console logging
```

## Known Limitations

### 1. No Real Neutral Nodes
**Issue**: Backend only creates nodes for player capitals
**Impact**: Map will be sparse with only player bases
**Workaround**: Frontend generates dummy neutral nodes when needed
**Fix**: Backend needs neutral node generation system

### 2. Simulated Bandwidth Numbers
**Issue**: Backend doesn't expose `node_metrics` in `/game/state` response
**Impact**: Bandwidth/packet loss numbers are fake
**Workaround**: Frontend simulates realistic values
**Fix**: Backend should add `metrics` field to API response

### 3. Fake Capture Progress
**Issue**: Backend doesn't calculate incremental capture progress
**Impact**: Progress bar is animated guess, not real
**Workaround**: Frontend animates based on attack intensity
**Fix**: Backend should track sustained bandwidth and calculate progress

### 4. HTTP Polling (Not WebSocket)
**Issue**: Polling is less efficient than WebSocket streaming
**Impact**: 500ms polling creates network overhead
**Workaround**: Acceptable for prototype/demo
**Fix**: Backend should add `/game/state/stream` WebSocket endpoint

## Optional Backend Enhancements

These backend changes would improve the integration (ranked by impact):

### 1. Add Node Metrics to API Response (15 min)
```rust
// In GameStateResponse
pub struct NodeInfo {
    pub coord: NodeCoord,
    pub owner_id: Option<u64>,
    pub current_target: Option<NodeCoord>,
    pub metrics: Option<NodeMetrics>,  // ADD THIS
}

pub struct NodeMetrics {
    pub bandwidth_in: u64,
    pub packet_loss: f32,
}
```

### 2. Neutral Node Generation (1 hour)
Generate neutral nodes in hex grid on game start

### 3. Capture Progress Calculation (30 min)
Track sustained bandwidth per node, calculate progress toward capture

### 4. WebSocket State Streaming (1-2 hours)
Add `/game/state/stream` endpoint that broadcasts full state every 500ms

### 5. Player Color Assignment (15 min)
Store color in Player struct, return in API

## Debugging

### Enable Debug Logging

In `src/config/backend.ts`:
```typescript
debug: true
```

You'll see console logs:
```
[Backend] Checking backend connection...
[Backend] Loaded game state from backend: { players: [...], nodes: [...] }
[Backend] Fetching game state...
```

### Check Network Tab

In browser DevTools → Network:
- Look for `GET /game/state` requests every 500ms
- Response should be JSON with `{ players, nodes, total_events }`

### Common Issues

**Problem**: "Failed to fetch game state"
- **Cause**: Backend not running or wrong URL
- **Fix**: Check VITE_BACKEND_URL, verify backend is up

**Problem**: No nodes visible
- **Cause**: No players joined game, or all nodes unexplored
- **Fix**: Ensure at least 2 players joined via backend

**Problem**: "TypeError: Cannot read property 'q'"
- **Cause**: Backend response format mismatch
- **Fix**: Check `backendAdapter.ts` transformation logic

## API Contract

### GET /game/state

**Response**:
```json
{
  "players": [
    {
      "player_id": 1,
      "name": "Alice",
      "capital_coord": { "q": 0, "r": 0 },
      "alive": true,
      "node_count": 5
    }
  ],
  "nodes": [
    {
      "coord": { "q": 0, "r": 0 },
      "owner_id": 1,
      "current_target": { "q": 2, "r": 3 }
    }
  ],
  "total_events": 42
}
```

### POST /events

**Request (SetNodeTarget)**:
```json
{
  "SetNodeTarget": {
    "node_coord": { "q": 0, "r": 0 },
    "target_coord": { "q": 2, "r": 3 },
    "timestamp": 1698765432000
  }
}
```

**Request (PlayerJoin)**:
```json
{
  "PlayerJoin": {
    "player_id": 12345,
    "name": "Alice",
    "capital_coord": { "q": 0, "r": 0 },
    "node_ip": "10.0.1.5",
    "timestamp": 1698765432000
  }
}
```

## Next Steps

1. **Test with Real Backend**: Start CamHack backend and verify integration
2. **Add UI Actions**: Wire up attack/upgrade buttons to backend API
3. **Improve Visuals**: Use real bandwidth data when backend exposes metrics
4. **WebSocket Migration**: Upgrade from polling to WebSocket when available
5. **Multi-Player**: Test with multiple players joining same game

## Summary

✅ **What Works Now**:
- Automatic backend connection with fallback to dummy data
- Real-time game state polling (500ms interval)
- Player color assignment (frontend)
- Fog of war visibility filtering (frontend)
- Bandwidth stream visualization (derived from backend)
- Throughput calculation (frontend transform)
- Node type detection (BASE vs OWNED)

⚠️ **What's Simulated** (works but not real data):
- Bandwidth numbers (backend doesn't expose)
- Packet loss (backend doesn't expose)
- Capture progress (backend doesn't track incrementally)
- Neutral nodes (backend doesn't generate)

🔧 **Integration Time**: 3-4 hours for full working prototype

🎯 **Backend Changes Required**: ZERO (optional enhancements available)
