/**
 * UIScene – Persistent HUD overlay drawn on top of GameScene.
 *
 * Displays:
 *  - Level indicator and XP progress bar (top centre)
 *  - Relic count (top right)
 *  - Auto-crush rate indicator (top right under relics)
 *  - Achievements button (top left)
 *  - Achievement counter badge
 */

import Phaser from 'phaser';

const COLORS = {
  accent: 0x44ffaa,
  panel: 0x0f0f2a,
  xpBar: 0x44ffaa,
  xpBg: 0x1a2a1a,
  levelText: 0xffffff,
  relic: 0xffcc00,
};

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this._gm = this.registry.get('gm');
    this._achievementService = this.registry.get('achievementService');

    const { width } = this.scale;

    // ── XP Progress Bar ──────────────────────────────────────────
    const barW = 260;
    const barH = 14;
    const barX = (width - barW) / 2;
    const barY = 10;

    this._xpBarBg = this.add.graphics();
    this._xpBarBg.fillStyle(COLORS.xpBg, 0.8);
    this._xpBarBg.fillRoundedRect(barX, barY, barW, barH, 4);

    this._xpBarFill = this.add.graphics();
    this._xpBarRect = { x: barX, y: barY, w: barW, h: barH };

    // Level text
    this._levelText = this.add
      .text(width / 2, barY + barH + 4, '', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#44ffaa',
      })
      .setOrigin(0.5, 0);

    // ── Relic count ──────────────────────────────────────────────
    this._relicText = this.add.text(width - 10, 10, '', {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: '#ffcc00',
    }).setOrigin(1, 0);

    // ── Auto-crush rate ──────────────────────────────────────────
    this._autoText = this.add.text(width - 10, 30, '', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: '#aaaacc',
    }).setOrigin(1, 0);

    // ── Feats button ─────────────────────────────────────────────
    this.add
      .text(10, 10, '🏆 Feats', {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#44ffaa',
        backgroundColor: '#0f0f2a',
        padding: { x: 6, y: 3 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.launch('FeatsScene'))
      .on('pointerover', function () { this.setStyle({ color: '#ffffff' }); })
      .on('pointerout', function () { this.setStyle({ color: '#44ffaa' }); });

    // ── Achievement count badge ───────────────────────────────────
    this._featBadge = this.add.text(10, 32, '', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: '#888888',
    });
  }

  update() {
    const gm = this._gm;
    const xpReq = gm.getXpForNextLevel();
    const xpFrac = gm.level >= 50 ? 1 : Math.min(1, gm.xp / xpReq);

    // Update XP bar
    const { x, y, w, h } = this._xpBarRect;
    this._xpBarFill.clear();
    this._xpBarFill.fillStyle(COLORS.xpBar, 0.9);
    this._xpBarFill.fillRoundedRect(x, y, Math.max(4, w * xpFrac), h, 4);

    // Level label
    const xpLabel = gm.level >= 50
      ? `Level ${gm.level} – MAX`
      : `Level ${gm.level}  ${gm.xp}/${xpReq} XP`;
    this._levelText.setText(xpLabel);

    // Relic count
    const relicCount = Object.keys(gm.relics).length;
    this._relicText.setText(`⚗ Relics: ${relicCount}/8`);

    // Auto-crush rate
    if (gm.buffs.auto_crush_rate > 0) {
      this._autoText.setText(`⚙ Auto: ${gm.buffs.auto_crush_rate.toFixed(1)}/s`);
    } else {
      this._autoText.setText('');
    }

    // Achievement badge
    const unlocked = this._achievementService.getUnlockedIds().length;
    const total = this._achievementService.getAllAchievements().length;
    this._featBadge.setText(`${unlocked}/${total} unlocked`);
  }
}

export default UIScene;
