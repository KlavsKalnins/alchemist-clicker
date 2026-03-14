/**
 * FeatsScene – Overlay showing all achievement (Feat) definitions.
 * Launched on top of GameScene/UIScene as an overlay.
 */

import Phaser from 'phaser';

export class FeatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FeatsScene' });
  }

  create() {
    const { width, height } = this.scale;
    this._achievementService = this.registry.get('achievementService');

    // Overlay
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setInteractive();

    // Panel
    const pw = Math.min(440, width - 40);
    const ph = Math.min(580, height - 60);
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;

    const g = this.add.graphics();
    g.fillStyle(0x0f0f2a, 0.97);
    g.fillRoundedRect(px, py, pw, ph, 10);
    g.lineStyle(2, 0x44ffaa, 0.9);
    g.strokeRoundedRect(px, py, pw, ph, 10);

    // Title
    this.add
      .text(width / 2, py + 16, '🏆 FEATS', {
        fontFamily: 'Courier New',
        fontSize: '20px',
        color: '#44ffaa',
      })
      .setOrigin(0.5, 0);

    // Close
    this.add
      .text(px + pw - 14, py + 14, '✕', {
        fontFamily: 'Courier New',
        fontSize: '18px',
        color: '#ff4444',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop());

    // Achievement list
    const all = this._achievementService.getAllAchievements();
    const unlocked = new Set(this._achievementService.getUnlockedIds());
    const itemH = 46;
    const startY = py + 52;

    all.forEach((a, i) => {
      const iy = startY + i * itemH;
      if (iy + itemH > py + ph - 8) return;

      const isUnlocked = unlocked.has(a.id);
      const iconColor = isUnlocked
        ? `#${a.icon.toString(16).padStart(6, '0')}`
        : '#333355';

      // Row background
      const rowGfx = this.add.graphics();
      rowGfx.fillStyle(isUnlocked ? 0x111130 : 0x0a0a1e, 0.7);
      rowGfx.fillRoundedRect(px + 8, iy, pw - 16, itemH - 4, 5);

      // Icon circle
      rowGfx.fillStyle(isUnlocked ? a.icon : 0x222244, 1);
      rowGfx.fillCircle(px + 24, iy + (itemH - 4) / 2, 10);

      // Name
      this.add.text(px + 42, iy + 6, a.name, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: isUnlocked ? iconColor : '#444466',
      });

      // Description
      this.add.text(px + 42, iy + 22, a.description, {
        fontFamily: 'Courier New',
        fontSize: '10px',
        color: isUnlocked ? '#aaaacc' : '#333355',
        wordWrap: { width: pw - 60 },
      });

      // Unlocked checkmark
      if (isUnlocked) {
        this.add.text(px + pw - 24, iy + (itemH - 4) / 2, '✓', {
          fontFamily: 'Courier New',
          fontSize: '16px',
          color: '#44ffaa',
        }).setOrigin(0.5);
      }
    });
  }
}

export default FeatsScene;
