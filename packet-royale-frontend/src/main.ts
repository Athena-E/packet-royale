/**
 * Packet Royale - Network Warfare Game
 * Main entry point
 */

import Phaser from 'phaser';
import { GraphGameScene } from './scenes/GraphGameScene';
import { UIScene } from './scenes/UIScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a1a',
  parent: 'app',
  scene: [GraphGameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);

console.log('🎮 Packet Royale initialized');
