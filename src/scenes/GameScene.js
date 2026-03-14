/**
 * GameScene – Main gameplay scene.
 *
 * Renders:
 *  - A pulsing "crush target" orb in the center
 *  - Timing indicator arc that rotates around the orb
 *  - Resource counters on the left side
 *  - Combo/yield feedback text
 *  - "Craft" button to open CraftingScene
 *  - Level progress bar at the top
 *
 * Gameplay loop:
 *  1. A timing indicator sweeps around the target orb.
 *  2. Player taps the orb. Timing relative to the indicator decides if the
 *     crush is "perfect" (indicator inside green arc) or normal.
 *  3. Yield is calculated in GameManager and resources are updated.
 *  4. Auto-crush ticks fire at the rate set by relic buffs.
 */

import Phaser from 'phaser';

// Neon colour palette
const COLORS = {
  bg: 0x0a0a1a,
  panel: 0x0f0f2a,
  accent: 0x44ffaa,
  accentDim: 0x226644,
  perfect: 0xffff00,
  normal: 0x44aaff,
  combo: 0xff88ff,
  danger: 0xff4422,
  white: 0xffffff,
  orbBase: 0x1a1a3a,
  orbGlow: 0x2244aa,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this._gm = this.registry.get('gm');
    this._achievementService = this.registry.get('achievementService');

    const { width, height } = this.scale;
    this._cx = width / 2;
    this._cy = height / 2 + 20;

    // ── Background ────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this._drawBackground();

    // ── Orb + timing ring ────────────────────────────────────────
    this._createOrb();
    this._createTimingRing();

    // ── Resource panel ────────────────────────────────────────────
    this._createResourcePanel();

    // ── Feedback text (yields, combo) ─────────────────────────────
    this._feedbackPool = [];
    this._createFeedbackPool(12);

    // ── Combo display ─────────────────────────────────────────────
    this._comboText = this.add
      .text(this._cx, this._cy + 130, '', {
        fontFamily: 'Courier New',
        fontSize: '22px',
        color: '#ff88ff',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // ── Craft button ──────────────────────────────────────────────
    this._createCraftButton();

    // ── Bind GameManager events ───────────────────────────────────
    this._gm.on('crush', (r) => this._onCrush(r));
    this._gm.on('level_up', (r) => this._onLevelUp(r));
    this._gm.on('combo_reset', () => this._hideCombo());
    this._gm.on('achievement_unlocked', (a) => this._showAchievement(a));

    // ── Auto-crush timer ──────────────────────────────────────────
    this._autoCrushAccum = 0;

    // ── Indicator angle state ─────────────────────────────────────
    this._indicatorAngle = 0;     // current angle in radians
    this._indicatorDirection = 1; // +1 or -1 (bounces)

    // ── Tooltip for element name ──────────────────────────────────
    this._elementLabel = this.add
      .text(this._cx, this._cy + 100, '', {
        fontFamily: 'Courier New',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this._currentElementIndex = 0;
    this._updateElementLabel();
  }

  // ── Background ────────────────────────────────────────────────────────────

  _drawBackground() {
    const { width, height } = this.scale;
    // Subtle grid pattern
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a3a, 0.4);
    const step = 40;
    for (let x = 0; x < width; x += step) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) g.lineBetween(0, y, width, y);
  }

  // ── Orb ───────────────────────────────────────────────────────────────────

  _createOrb() {
    const orbRadius = 80;
    this._orbGfx = this.add.graphics();
    this._orbRadius = orbRadius;
    this._drawOrb(false);

    // Invisible hit area over the orb
    this._orbHit = this.add
      .circle(this._cx, this._cy, orbRadius)
      .setInteractive()
      .on('pointerdown', () => this._handleTap());

    // Pulse tween on the orb graphics
    this.tweens.add({
      targets: this._orbGfx,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      ease: 'Sine.easeInOut',
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  _drawOrb(highlighted) {
    const g = this._orbGfx;
    g.clear();

    // Glow rings
    [120, 105, 95].forEach((r, i) => {
      const alpha = highlighted ? 0.5 - i * 0.12 : 0.25 - i * 0.06;
      g.fillStyle(highlighted ? COLORS.accent : COLORS.orbGlow, alpha);
      g.fillCircle(this._cx, this._cy, r);
    });

    // Core
    g.fillStyle(COLORS.orbBase, 1);
    g.fillCircle(this._cx, this._cy, this._orbRadius);

    // Inner shine
    g.fillStyle(highlighted ? COLORS.accent : 0x2255cc, 0.4);
    g.fillCircle(this._cx - 20, this._cy - 20, 30);
  }

  // ── Timing ring ───────────────────────────────────────────────────────────

  _createTimingRing() {
    this._ringGfx = this.add.graphics();
    this._ringRadius = this._orbRadius + 25;
    this._ringWidth = 8;
    // Perfect window arc spans 60° on each side of the indicator = 120° total.
    this._perfectArcHalfAngle = Phaser.Math.DegToRad(30);
  }

  _drawTimingRing() {
    const g = this._ringGfx;
    g.clear();

    const r = this._ringRadius;
    const cx = this._cx;
    const cy = this._cy;

    // Base ring (dim)
    g.lineStyle(this._ringWidth, COLORS.accentDim, 0.4);
    g.strokeCircle(cx, cy, r);

    // Perfect window arc (green)
    const windowRad = this.getPerfectWindowRad();
    g.lineStyle(this._ringWidth + 2, COLORS.accent, 0.8);
    g.beginPath();
    g.arc(cx, cy, r, -windowRad, windowRad, false);
    g.strokePath();

    // Indicator dot
    const ix = cx + Math.cos(this._indicatorAngle) * r;
    const iy = cy + Math.sin(this._indicatorAngle) * r;
    g.fillStyle(COLORS.perfect, 1);
    g.fillCircle(ix, iy, 8);

    // Outer glow of indicator
    g.fillStyle(COLORS.perfect, 0.25);
    g.fillCircle(ix, iy, 16);
  }

  /**
   * Returns the half-angle of the perfect timing window in radians.
   * Scales with the GameManager's timing window.
   * @returns {number}
   */
  getPerfectWindowRad() {
    const windowMs = this._gm.getTimingWindowMs();
    const cycleMs = this._gm.getIndicatorCycleMs();
    // Map ms → fraction of full rotation
    const fraction = windowMs / cycleMs;
    return fraction * Math.PI; // half of full 2π
  }

  // ── Resource Panel ────────────────────────────────────────────────────────

  _createResourcePanel() {
    const { height } = this.scale;
    const panelX = 10;
    const panelY = 80;
    const panelW = 170;

    // Panel background
    this._panelGfx = this.add.graphics();
    this._panelGfx.fillStyle(COLORS.panel, 0.85);
    this._panelGfx.fillRoundedRect(panelX, panelY, panelW, height - 100, 8);
    this._panelGfx.lineStyle(1, COLORS.accentDim, 0.8);
    this._panelGfx.strokeRoundedRect(panelX, panelY, panelW, height - 100, 8);

    // Header
    this.add.text(panelX + panelW / 2, panelY + 15, 'RESOURCES', {
      fontFamily: 'Courier New',
      fontSize: '11px',
      color: '#44ffaa',
    }).setOrigin(0.5, 0);

    // Resource text labels (will be updated each frame)
    this._resourceTexts = {};
    const elements = this._gm.getAvailableElements();
    elements.forEach((el, i) => {
      const y = panelY + 40 + i * 24;
      this._resourceTexts[el.id] = this.add.text(panelX + 10, y, '', {
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: `#${el.color.toString(16).padStart(6, '0')}`,
      });
    });
  }

  _updateResourcePanel() {
    const elements = this._gm.getAvailableElements();
    elements.forEach((el) => {
      if (this._resourceTexts[el.id]) {
        const count = this._gm.resources[el.id] || 0;
        this._resourceTexts[el.id].setText(`${el.name}: ${count}`);
      }
    });
  }

  // ── Craft Button ─────────────────────────────────────────────────────────

  _createCraftButton() {
    const { width, height } = this.scale;
    const bx = width - 90;
    const by = height - 60;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panel, 0.9);
    bg.fillRoundedRect(bx - 70, by - 18, 140, 36, 8);
    bg.lineStyle(2, COLORS.accent, 0.9);
    bg.strokeRoundedRect(bx - 70, by - 18, 140, 36, 8);

    this.add
      .text(bx, by, '⚗ CRAFT', {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#44ffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.launch('CraftingScene'))
      .on('pointerover', function () { this.setStyle({ color: '#ffffff' }); })
      .on('pointerout', function () { this.setStyle({ color: '#44ffaa' }); });
  }

  // ── Tap Handling ─────────────────────────────────────────────────────────

  _handleTap() {
    const elements = this._gm.getAvailableElements();
    if (!elements.length) return;

    // Cycle through available elements with repeated taps
    const element = elements[this._currentElementIndex % elements.length];
    this._currentElementIndex++;

    // Determine if the tap is "perfect" (indicator angle near top = 0/2π)
    const isPerfect = this._isTapPerfect();
    this._gm.crush(element, isPerfect);

    // Visual feedback on orb
    this._drawOrb(true);
    this.time.delayedCall(120, () => this._drawOrb(false));
  }

  /**
   * A tap is "perfect" if the indicator is within the green arc window
   * (centred at angle 0, i.e., the top of the ring).
   * @returns {boolean}
   */
  _isTapPerfect() {
    const windowRad = this.getPerfectWindowRad();
    // Normalise angle to [-π, π]
    let angle = this._indicatorAngle % (2 * Math.PI);
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle < -Math.PI) angle += 2 * Math.PI;
    return Math.abs(angle) <= windowRad;
  }

  // ── Crush Event ────────────────────────────────────────────────────────────

  _onCrush(result) {
    const { yield: yieldAmt, isPerfect, combo } = result;

    // Floating feedback text
    const label = isPerfect
      ? `✦ PERFECT +${yieldAmt}`
      : `+${yieldAmt}`;
    const color = isPerfect ? '#ffff00' : '#44aaff';
    this._spawnFeedback(this._cx, this._cy - 60, label, color, isPerfect ? 28 : 20);

    // Combo display
    if (combo > 2) {
      this._comboText.setText(`×${combo} COMBO`);
      this._comboText.setAlpha(1);
      this.tweens.killTweensOf(this._comboText);
    }
  }

  _hideCombo() {
    this.tweens.add({
      targets: this._comboText,
      alpha: 0,
      duration: 600,
    });
  }

  // ── Level Up ──────────────────────────────────────────────────────────────

  _onLevelUp({ level }) {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height / 2 - 100, `🎉 LEVEL ${level}!`, {
        fontFamily: 'Courier New',
        fontSize: '32px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: t,
      y: height / 2 - 160,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: () => t.destroy(),
    });

    // Update element label in case new elements were unlocked
    this._rebuildResourcePanel();
    this._updateElementLabel();
  }

  _rebuildResourcePanel() {
    // Refresh resource text entries for newly unlocked elements
    const elements = this._gm.getAvailableElements();
    elements.forEach((el, i) => {
      if (!this._resourceTexts[el.id]) {
        const panelX = 10;
        const panelY = 80;
        const y = panelY + 40 + i * 24;
        this._resourceTexts[el.id] = this.add.text(panelX + 10, y, '', {
          fontFamily: 'Courier New',
          fontSize: '12px',
          color: `#${el.color.toString(16).padStart(6, '0')}`,
        });
      }
    });
  }

  // ── Achievement Toast ─────────────────────────────────────────────────────

  _showAchievement(achievement) {
    const { width } = this.scale;
    const toast = this.add
      .text(width / 2, 20, `🏆 FEAT: ${achievement.name}`, {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: `#${achievement.icon.toString(16).padStart(6, '0')}`,
        backgroundColor: '#0f0f2a',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 30,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({ targets: toast, alpha: 0, duration: 600, onComplete: () => toast.destroy() });
        });
      },
    });
  }

  // ── Feedback Pool ─────────────────────────────────────────────────────────

  _createFeedbackPool(size) {
    for (let i = 0; i < size; i++) {
      const t = this.add
        .text(0, 0, '', {
          fontFamily: 'Courier New',
          fontSize: '20px',
          color: '#ffffff',
        })
        .setAlpha(0)
        .setOrigin(0.5);
      this._feedbackPool.push(t);
    }
  }

  _spawnFeedback(x, y, text, color, fontSize = 20) {
    const t = this._feedbackPool.find((obj) => obj.alpha === 0);
    if (!t) return;

    t.setText(text)
      .setStyle({ color, fontSize: `${fontSize}px` })
      .setPosition(x + Phaser.Math.Between(-30, 30), y)
      .setAlpha(1)
      .setScale(1);

    this.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      ease: 'Power2',
    });
  }

  // ── Element Label ─────────────────────────────────────────────────────────

  _updateElementLabel() {
    const elements = this._gm.getAvailableElements();
    if (!elements.length) return;
    const el = elements[this._currentElementIndex % elements.length];
    this._elementLabel.setText(`[${el.name}]`);
  }

  // ── Update Loop ────────────────────────────────────────────────────────────

  update(time, delta) {
    // ── Advance timing indicator ──────────────────────────────────
    const cycleMs = this._gm.getIndicatorCycleMs();
    const anglePerMs = (2 * Math.PI) / cycleMs;
    this._indicatorAngle += anglePerMs * delta * this._indicatorDirection;

    // Bounce the indicator back and forth
    if (this._indicatorAngle > Math.PI) {
      this._indicatorAngle = Math.PI;
      this._indicatorDirection = -1;
    } else if (this._indicatorAngle < -Math.PI) {
      this._indicatorAngle = -Math.PI;
      this._indicatorDirection = 1;
    }

    this._drawTimingRing();

    // ── Auto-crush ────────────────────────────────────────────────
    const rate = this._gm.buffs.auto_crush_rate;
    if (rate > 0) {
      this._autoCrushAccum += (rate * delta) / 1000;
      while (this._autoCrushAccum >= 1) {
        this._autoCrushAccum -= 1;
        this._gm.autoCrush();
      }
    }

    // ── Resource panel ────────────────────────────────────────────
    this._updateResourcePanel();
  }
}

export default GameScene;
