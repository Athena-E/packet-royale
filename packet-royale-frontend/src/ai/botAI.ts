/**
 * Bot AI for enemy player
 * Makes strategic decisions to capture nodes and expand territory
 */

import type { NetworkGameState } from '../types/graphTypes';
import { getCapturableConnections, initiateCaptureViaEdge, canAttackEnemyBase, launchAttack } from '../utils/graphData';

export interface BotConfig {
  thinkDelay: number; // Time between decisions in ms (default: 2000)
  aggressiveness: number; // 0-1, how likely to attack vs defend
}

export class BotAI {
  private playerId: number;
  private config: BotConfig;
  private lastThinkTime: number = 0;

  constructor(playerId: number, config: Partial<BotConfig> = {}) {
    this.playerId = playerId;
    this.config = {
      thinkDelay: config.thinkDelay ?? 2000,
      aggressiveness: config.aggressiveness ?? 0.6,
    };
  }

  /**
   * Main decision-making method called every game tick
   */
  public think(gameState: NetworkGameState, currentTime: number): void {
    // Check if enough time has passed since last decision
    if (currentTime - this.lastThinkTime < this.config.thinkDelay) {
      return;
    }

    this.lastThinkTime = currentTime;

    // Make a decision
    this.makeDecision(gameState);
  }

  /**
   * Core decision-making logic
   */
  private makeDecision(gameState: NetworkGameState): void {
    // Priority 1: Check if bot can launch final attack on enemy base
    if (canAttackEnemyBase(gameState, this.playerId)) {
      console.log(`[Bot ${this.playerId}] 🎯 All adjacent nodes to enemy base secured! Launching final attack...`);
      const success = launchAttack(gameState, this.playerId);
      if (success) {
        console.log(`[Bot ${this.playerId}] 💥 Final attack launched successfully!`);
      }
      return; // Exit decision-making after launching final attack
    }

    // Priority 2: Get all capturable connections for this bot
    const capturableConnections = getCapturableConnections(gameState, this.playerId);

    if (capturableConnections.length === 0) {
      console.log(`[Bot ${this.playerId}] No capturable connections available`);
      return;
    }

    // Evaluate each potential capture and choose the best one
    const scoredConnections = capturableConnections.map(conn => ({
      connection: conn,
      score: this.evaluateConnection(gameState, conn),
    }));

    // Sort by score (highest first)
    scoredConnections.sort((a, b) => b.score - a.score);

    // Attempt captures starting from highest priority
    // Try multiple captures if bandwidth thresholds aren't met
    const attemptCount = Math.min(3, scoredConnections.length);

    for (let i = 0; i < attemptCount; i++) {
      const { connection } = scoredConnections[i];
      const targetNode = gameState.nodes.get(connection.targetNodeId);

      if (!targetNode) continue;

      // Check if this target already has sufficient bandwidth
      if (targetNode.state === 'CAPTURING' &&
          targetNode.currentLoad >= targetNode.bandwidthThreshold) {
        // Skip - already being captured with sufficient bandwidth
        continue;
      }

      // Attempt the capture
      const success = initiateCaptureViaEdge(
        gameState,
        connection.sourceNodeId,
        connection.targetNodeId,
        this.playerId
      );

      if (success) {
        const sourceNode = gameState.nodes.get(connection.sourceNodeId);
        console.log(
          `[Bot ${this.playerId}] 🤖 Initiated capture: ${sourceNode?.id} → ${targetNode.id} ` +
          `(Threshold: ${targetNode.bandwidthThreshold.toFixed(1)} Gbps, Current: ${targetNode.currentLoad.toFixed(1)} Gbps)`
        );

        // Check if we need more streams for this target
        if (targetNode.state === 'CAPTURING' &&
            targetNode.currentLoad < targetNode.bandwidthThreshold) {
          console.log(
            `[Bot ${this.playerId}] ⚠️ Need more streams for ${targetNode.id} ` +
            `(${targetNode.currentLoad.toFixed(1)}/${targetNode.bandwidthThreshold.toFixed(1)} Gbps)`
          );
          // Continue to next iteration to possibly add another stream
        } else {
          // One successful capture is enough for this think cycle
          break;
        }
      }
    }
  }

  /**
   * Evaluate the strategic value of capturing a connection
   * Returns a score (higher = better)
   */
  private evaluateConnection(
    gameState: NetworkGameState,
    connection: { sourceNodeId: string; targetNodeId: string }
  ): number {
    const targetNode = gameState.nodes.get(connection.targetNodeId);
    if (!targetNode) return 0;

    let score = 0;

    // Factor 1: Prefer nodes with lower bandwidth thresholds (easier to capture)
    const thresholdScore = (10 - targetNode.bandwidthThreshold) * 10; // 0-80 points
    score += thresholdScore;

    // Factor 2: Prefer nodes that are already being captured (finish what we started)
    if (targetNode.state === 'CAPTURING' && targetNode.ownerId !== this.playerId) {
      score += 50; // High priority to complete captures
    }

    // Factor 3: Prefer nodes that expand territory (more connections)
    const expansionScore = targetNode.connections.length * 5; // More connections = better position
    score += expansionScore;

    // Factor 4: Prefer enemy-owned nodes over neutral (aggressiveness factor)
    if (targetNode.ownerId !== null && targetNode.ownerId !== this.playerId) {
      score += this.config.aggressiveness * 40; // 0-40 points based on aggressiveness
    }

    // Factor 5: Prefer nodes closer to enemy base
    const enemyPlayer = gameState.players.find(p => p.id !== this.playerId);
    if (enemyPlayer) {
      const enemyBase = gameState.nodes.get(enemyPlayer.baseNodeId);
      if (enemyBase) {
        const distance = Math.sqrt(
          Math.pow(targetNode.position.x - enemyBase.position.x, 2) +
          Math.pow(targetNode.position.y - enemyBase.position.y, 2)
        );
        // Closer nodes get higher score (normalize to 0-30 points)
        const proximityScore = Math.max(0, 30 - (distance / 100));
        score += proximityScore;
      }
    }

    // Factor 6: If target is already being captured but needs more bandwidth
    if (targetNode.state === 'CAPTURING' &&
        targetNode.currentLoad < targetNode.bandwidthThreshold &&
        targetNode.currentLoad > 0) {
      // High priority to add supporting streams
      score += 70;
    }

    // Factor 7: Avoid nodes that are too hard to capture alone
    const existingEdges = Array.from(gameState.edges.values()).filter(
      e => e.targetNodeId === targetNode.id && e.ownerId === this.playerId
    );
    const currentBotLoad = existingEdges.reduce((sum, e) => sum + e.bandwidth, 0);

    // If we're already attacking and still insufficient, deprioritize unless we're close
    if (currentBotLoad > 0 && currentBotLoad < targetNode.bandwidthThreshold * 0.5) {
      // More than 50% short - reduce priority slightly
      score -= 20;
    }

    return score;
  }

  /**
   * Reset the bot's internal state
   */
  public reset(): void {
    this.lastThinkTime = 0;
  }

  /**
   * Update bot configuration
   */
  public setConfig(config: Partial<BotConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
