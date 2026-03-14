/**
 * CraftingScene – Overlay scene for the crafting (Relic) menu.
 * Launched on top of GameScene; does not pause it.
 */

import Phaser from 'phaser';

const COLORS = {
  bg: 0x08081a,
  panel: 0x0f0f2a,
  accent: 0x44ffaa,
  accentDim: 0x226644,
  locked: 0x444466,
  tier1: 0x44aaff,
  tier2: 0xaa66ff,
  tier3: 0xffcc00,
};

export class CraftingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CraftingScene' });
  }

  create() {
    this._gm = this.registry.get('gm');
    this._cm = this.registry.get('craftingManager');

    const { width, height } = this.scale;

    // ── Semi-transparent overlay ──────────────────────────────────
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0)
      .setInteractive(); // Capture clicks so they don't fall through

    // ── Panel ─────────────────────────────────────────────────────
    const pw = Math.min(480, width - 40);
    const ph = Math.min(600, height - 60);
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(COLORS.panel, 0.97);
    panelGfx.fillRoundedRect(px, py, pw, ph, 10);
    panelGfx.lineStyle(2, COLORS.accent, 0.9);
    panelGfx.strokeRoundedRect(px, py, pw, ph, 10);

    // ── Title ─────────────────────────────────────────────────────
    this.add
      .text(width / 2, py + 20, '⚗ CRAFTING', {
        fontFamily: 'Courier New',
        fontSize: '22px',
        color: '#44ffaa',
      })
      .setOrigin(0.5, 0);

    // ── Close button ──────────────────────────────────────────────
    this.add
      .text(px + pw - 16, py + 16, '✕', {
        fontFamily: 'Courier New',
        fontSize: '18px',
        color: '#ff4444',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop());

    // ── Recipe list ───────────────────────────────────────────────
    const recipes = this._cm.getAllRecipes();
    const listY = py + 60;
    const itemH = 90;
    const colW = pw - 20;

    recipes.forEach((recipe, i) => {
      const iy = listY + i * itemH;
      // Stop rendering if out of panel bounds
      if (iy + itemH > py + ph - 10) return;

      this._drawRecipeItem(recipe, px + 10, iy, colW, itemH - 4);
    });
  }

  /**
   * Draws a single recipe card inside the crafting panel.
   */
  _drawRecipeItem(recipe, x, y, w, h) {
    const resources = this._gm.resources;
    const craftable = this._cm.canCraft(recipe, resources);
    const alreadyCrafted = !!this._gm.relics[recipe.id];

    // Background card
    const cardGfx = this.add.graphics();
    const tierColors = [0, COLORS.tier1, COLORS.tier2, COLORS.tier3];
    const cardBorderColor = craftable ? tierColors[recipe.tier] : COLORS.locked;
    cardGfx.fillStyle(craftable ? 0x111130 : 0x0d0d20, 0.9);
    cardGfx.fillRoundedRect(x, y, w, h, 6);
    cardGfx.lineStyle(1.5, cardBorderColor, craftable ? 0.9 : 0.4);
    cardGfx.strokeRoundedRect(x, y, w, h, 6);

    // Relic name + tier badge
    const tierLabel = ['', 'T1', 'T2', 'T3'][recipe.tier];
    this.add.text(x + 10, y + 8, `[${tierLabel}] ${recipe.name}`, {
      fontFamily: 'Courier New',
      fontSize: '13px',
      color: craftable ? `#${tierColors[recipe.tier].toString(16).padStart(6, '0')}` : '#666688',
    });

    // Description
    this.add.text(x + 10, y + 26, recipe.description, {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: craftable ? '#aaaacc' : '#555566',
      wordWrap: { width: w - 20 },
    });

    // Ingredient list
    const status = this._cm.getIngredientStatus(recipe, resources);
    const ingredientStr = status
      .map((s) => `${s.elementId.replace('_', ' ')}: ${s.have}/${s.required}`)
      .join('  ');
    this.add.text(x + 10, y + 56, ingredientStr, {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: '#888899',
    });

    // Craft button (right side of card)
    if (craftable) {
      const btnX = x + w - 60;
      const btnY = y + h / 2 - 12;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(COLORS.accent, 0.15);
      btnBg.fillRoundedRect(btnX, btnY, 54, 24, 5);
      btnBg.lineStyle(1.5, COLORS.accent, 0.9);
      btnBg.strokeRoundedRect(btnX, btnY, 54, 24, 5);

      this.add
        .text(btnX + 27, btnY + 12, 'CRAFT', {
          fontFamily: 'Courier New',
          fontSize: '12px',
          color: '#44ffaa',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this._doCraft(recipe.id));
    } else if (alreadyCrafted) {
      this.add.text(x + w - 70, y + h / 2 - 6, `×${this._gm.relics[recipe.id]}`, {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#666688',
      });
    }
  }

  /**
   * Executes a craft and refreshes the scene.
   * @param {string} recipeId
   */
  _doCraft(recipeId) {
    const result = this._cm.craft(recipeId);
    if (result.success) {
      // Briefly flash green, then restart scene to refresh UI
      this.cameras.main.flash(300, 68, 255, 170);
      this.time.delayedCall(350, () => {
        this.scene.restart();
      });
    } else {
      // Show error briefly
      const { width, height } = this.scale;
      const err = this.add
        .text(width / 2, height / 2, result.error, {
          fontFamily: 'Courier New',
          fontSize: '12px',
          color: '#ff4444',
          backgroundColor: '#0f0f2a',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5);

      this.time.delayedCall(1800, () => err.destroy());
    }
  }
}

export default CraftingScene;
