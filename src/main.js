/**
 * main.js – Alchemist Clicker entry point.
 *
 * Initialises Phaser with the correct scene order and game configuration.
 * All game dimensions are fixed to 480×640 (portrait) for a hyper-casual feel.
 */

import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import CraftingScene from './scenes/CraftingScene.js';
import UIScene from './scenes/UIScene.js';
import FeatsScene from './scenes/FeatsScene.js';

const config = {
  type: Phaser.AUTO,            // WebGL if available, else Canvas
  width: 480,
  height: 640,
  backgroundColor: '#0a0a1a',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,      // Entry; creates managers, transitions to GameScene
    GameScene,      // Main gameplay
    UIScene,        // HUD overlay (level bar, relic count, feats button)
    CraftingScene,  // Crafting menu overlay
    FeatsScene,     // Achievement list overlay
  ],
};

// Expose Phaser game instance on window for debugging
window.game = new Phaser.Game(config);
