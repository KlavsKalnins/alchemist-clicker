/**
 * BootScene – First scene; initialises managers and transitions to GameScene.
 * Also handles loading any assets (none needed for this code-only build).
 */

import Phaser from 'phaser';
import GameManager from '../GameManager.js';
import CraftingManager from '../CraftingManager.js';
import AchievementService from '../AchievementService.js';

const SAVE_KEY = 'alchemist_clicker_save';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // ── Restore or create game state ──────────────────────────────
    let gm;
    let unlockedIds = [];

    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        gm = GameManager.fromJSON(data.gameManager);
        unlockedIds = data.unlockedIds || [];
      }
    } catch (e) {
      console.warn('[BootScene] Failed to restore save, starting fresh.', e);
    }

    if (!gm) gm = new GameManager();

    const craftingManager = new CraftingManager(gm);
    const achievementService = new AchievementService(gm, unlockedIds);

    // Re-evaluate achievements against restored state
    achievementService.checkAll();

    // Expose managers on the Phaser registry for other scenes
    this.registry.set('gm', gm);
    this.registry.set('craftingManager', craftingManager);
    this.registry.set('achievementService', achievementService);

    // ── Auto-save every 10 seconds ────────────────────────────────
    this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => this._save(gm, achievementService),
      callbackScope: this,
    });

    // ── Brief boot splash then go to game ─────────────────────────
    const { width, height } = this.scale;
    const title = this.add
      .text(width / 2, height / 2 - 20, '⚗ ALCHEMIST CLICKER ⚗', {
        fontFamily: 'Courier New',
        fontSize: '28px',
        color: '#44ffaa',
      })
      .setOrigin(0.5);

    const sub = this.add
      .text(width / 2, height / 2 + 20, 'Loading…', {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Animate and transition
    this.tweens.add({
      targets: [title, sub],
      alpha: { from: 0, to: 1 },
      duration: 800,
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.scene.start('GameScene');
          this.scene.launch('UIScene');
        });
      },
    });
  }

  /**
   * Saves current state to localStorage.
   * @param {GameManager} gm
   * @param {AchievementService} achievementService
   */
  _save(gm, achievementService) {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          gameManager: gm.toJSON(),
          unlockedIds: achievementService.getUnlockedIds(),
        })
      );
    } catch (e) {
      console.warn('[BootScene] Failed to save.', e);
    }
  }
}

export default BootScene;
