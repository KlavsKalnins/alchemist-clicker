/**
 * GameManager – Central state controller for Alchemist Clicker.
 *
 * Responsibilities:
 *  - Track and persist player state (level, resources, crushes, XP)
 *  - Handle crush mechanics including timing windows and combo multipliers
 *  - Manage level progression across 50 levels with scaling difficulty
 *  - Apply passive buffs from crafted Relics
 *  - Emit events for achievements and UI updates
 */

import { getElementsForLevel } from './data/elements.js';

// ── Constants ────────────────────────────────────────────────────────────────

/** Base XP required to reach the next level; scales exponentially. */
const BASE_XP_PER_LEVEL = 100;

/** XP scaling exponent per level (difficulty ramp). */
const XP_SCALE_FACTOR = 1.35;

/** Default perfect-timing window in milliseconds. */
const DEFAULT_TIMING_WINDOW_MS = 400;

/** How long the timing indicator cycles (ms) – scales down with level. */
const BASE_INDICATOR_CYCLE_MS = 2000;

/** Minimum indicator cycle time (ms) – hard cap at level 50. */
const MIN_INDICATOR_CYCLE_MS = 600;

/** Combo resets after this many milliseconds without a crush. */
const COMBO_RESET_DELAY_MS = 3000;

// ── Class ────────────────────────────────────────────────────────────────────

export class GameManager {
  /**
   * @param {Object} [initialState] - Optional saved state to restore from.
   */
  constructor(initialState = null) {
    /** @type {Function[]} Event listeners keyed by event name */
    this._listeners = {};

    this._initState(initialState);
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  /**
   * Initialises game state from scratch or from a saved snapshot.
   * @param {Object|null} savedState
   */
  _initState(savedState) {
    if (savedState) {
      Object.assign(this, savedState);
      // Re-hydrate computed state that isn't serialisable.
      this._comboTimer = null;
      return;
    }

    /** Current level (1 – 50). */
    this.level = 1;

    /** Accumulated XP towards the next level. */
    this.xp = 0;

    /** Total crushes performed across all time. */
    this.totalCrushes = 0;

    /** Perfect crushes performed across all time. */
    this.perfectCrushes = 0;

    /** Current combo multiplier (resets after COMBO_RESET_DELAY_MS). */
    this.combo = 1;

    /** Highest combo ever reached. */
    this.maxCombo = 1;

    /**
     * Resource inventory: { elementId: count }
     */
    this.resources = {};

    /**
     * Crafted relics inventory: { relicId: count }
     * Values can exceed 1 (player can craft duplicates).
     */
    this.relics = {};

    /** Number of unique relic types ever crafted. */
    this.uniqueRelicsCrafted = 0;

    /** Number of Tier-3 relics ever crafted. */
    this.tier3RelicsCrafted = 0;

    /**
     * Passive buffs accumulated from relics.
     * { yield_multiplier, auto_crush_rate, timing_window, level_xp_bonus, combo_multiplier }
     */
    this.buffs = {
      yield_multiplier: 1,
      auto_crush_rate: 0,
      timing_window: 0,
      level_xp_bonus: 0,
      combo_multiplier: 1,
    };

    /** Internal combo-reset timer id (from setTimeout / clearTimeout). */
    this._comboTimer = null;
  }

  // ── Event System ───────────────────────────────────────────────────────────

  /**
   * Registers an event listener.
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  /**
   * Removes an event listener.
   * @param {string} event - Event name
   * @param {Function} callback - Handler function to remove
   */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
  }

  /**
   * Emits an event to all registered listeners.
   * @param {string} event - Event name
   * @param {*} data - Payload passed to listeners
   */
  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach((cb) => cb(data));
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  /**
   * Returns XP required to advance from the current level to the next.
   * @returns {number}
   */
  getXpForNextLevel() {
    return Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALE_FACTOR, this.level - 1));
  }

  /**
   * Returns the effective timing window (ms) including relic bonuses.
   * @returns {number}
   */
  getTimingWindowMs() {
    return DEFAULT_TIMING_WINDOW_MS + this.buffs.timing_window;
  }

  /**
   * Returns the indicator cycle time (ms) for the current level.
   * Decreases with each level (harder game).
   * @returns {number}
   */
  getIndicatorCycleMs() {
    const reduction = (this.level - 1) * 30;
    return Math.max(MIN_INDICATOR_CYCLE_MS, BASE_INDICATOR_CYCLE_MS - reduction);
  }

  /**
   * Returns the total yield multiplier from all buffs.
   * @returns {number}
   */
  getYieldMultiplier() {
    return this.buffs.yield_multiplier;
  }

  /**
   * Returns the effective combo multiplier including relic bonuses.
   * @returns {number}
   */
  getComboMultiplier() {
    return this.combo * this.buffs.combo_multiplier;
  }

  /**
   * Returns elements available for crushing at the current level.
   * @returns {Array}
   */
  getAvailableElements() {
    return getElementsForLevel(this.level);
  }

  // ── Crush Mechanic ────────────────────────────────────────────────────────

  /**
   * Performs a crush of the given element.
   *
   * @param {Object} element     - Element definition from elements.js
   * @param {boolean} isPerfect  - Whether the player hit the perfect window
   * @returns {{ yield: number, isPerfect: boolean, combo: number, xpGained: number }}
   */
  crush(element, isPerfect) {
    // ── Calculate base yield ──────────────────────────────────────
    let yieldAmount = element.baseYield * this.buffs.yield_multiplier;
    if (isPerfect) yieldAmount *= 2; // Perfect bonus

    // ── Apply combo multiplier ────────────────────────────────────
    yieldAmount = Math.ceil(yieldAmount * this.getComboMultiplier());

    // ── Update combo ──────────────────────────────────────────────
    this.combo += 1;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // ── Restart combo-reset timer ─────────────────────────────────
    if (this._comboTimer !== null) clearTimeout(this._comboTimer);
    this._comboTimer = setTimeout(() => {
      this.combo = 1;
      this.emit('combo_reset', { combo: 1 });
    }, COMBO_RESET_DELAY_MS);

    // ── Add resources ─────────────────────────────────────────────
    this.resources[element.id] = (this.resources[element.id] || 0) + yieldAmount;

    // ── Increment counters ────────────────────────────────────────
    this.totalCrushes += 1;
    if (isPerfect) this.perfectCrushes += 1;

    // ── Gain XP ───────────────────────────────────────────────────
    const xpGained = Math.ceil(
      yieldAmount * (1 + this.buffs.level_xp_bonus)
    );
    this._addXp(xpGained);

    const result = {
      yield: yieldAmount,
      isPerfect,
      combo: this.combo,
      xpGained,
    };

    this.emit('crush', result);
    return result;
  }

  /**
   * Performs an automatic crush (from auto_crush_rate relic buff).
   * Uses the first available element and is never "perfect".
   * @returns {Object|null} Crush result or null if no elements available
   */
  autoCrush() {
    const elements = this.getAvailableElements();
    if (!elements.length) return null;
    return this.crush(elements[0], false);
  }

  // ── XP & Levelling ────────────────────────────────────────────────────────

  /**
   * Adds XP and triggers level-up if threshold is reached.
   * @param {number} amount - XP to add
   */
  _addXp(amount) {
    this.xp += amount;

    while (this.level < 50 && this.xp >= this.getXpForNextLevel()) {
      this.xp -= this.getXpForNextLevel();
      this.level += 1;
      this.emit('level_up', { level: this.level });
    }

    // Cap XP at max level
    if (this.level === 50) {
      this.xp = 0;
      this.emit('max_level', { level: 50 });
    }

    this.emit('xp_update', { xp: this.xp, xpRequired: this.getXpForNextLevel() });
  }

  // ── Buff Management ───────────────────────────────────────────────────────

  /**
   * Applies a relic buff to the player's passive stats.
   * @param {{ type: string, value: number }} buff - Buff definition
   */
  applyBuff(buff) {
    switch (buff.type) {
      case 'yield_multiplier':
        this.buffs.yield_multiplier *= buff.value;
        break;
      case 'auto_crush_rate':
        this.buffs.auto_crush_rate += buff.value;
        break;
      case 'timing_window':
        this.buffs.timing_window += buff.value;
        break;
      case 'level_xp_bonus':
        this.buffs.level_xp_bonus += buff.value;
        break;
      case 'combo_multiplier':
        this.buffs.combo_multiplier *= buff.value;
        break;
      default:
        console.warn(`[GameManager] Unknown buff type: ${buff.type}`);
    }
    this.emit('buff_applied', { buff });
  }

  /**
   * Records a crafted relic and applies its buff.
   * @param {Object} recipe - Recipe definition from recipes.js
   */
  recordCraft(recipe) {
    const isNew = !this.relics[recipe.id];
    this.relics[recipe.id] = (this.relics[recipe.id] || 0) + 1;
    if (isNew) this.uniqueRelicsCrafted += 1;
    if (recipe.tier === 3) this.tier3RelicsCrafted += 1;

    this.applyBuff(recipe.buff);
    this.emit('relic_crafted', { recipe, isNew });
  }

  // ── Serialisation ─────────────────────────────────────────────────────────

  /**
   * Serialises state to a plain object for localStorage persistence.
   * @returns {Object}
   */
  toJSON() {
    return {
      level: this.level,
      xp: this.xp,
      totalCrushes: this.totalCrushes,
      perfectCrushes: this.perfectCrushes,
      combo: this.combo,
      maxCombo: this.maxCombo,
      resources: { ...this.resources },
      relics: { ...this.relics },
      uniqueRelicsCrafted: this.uniqueRelicsCrafted,
      tier3RelicsCrafted: this.tier3RelicsCrafted,
      buffs: { ...this.buffs },
    };
  }

  /**
   * Restores a GameManager from a JSON snapshot (e.g. from localStorage).
   * @param {Object} json - Plain object from toJSON()
   * @returns {GameManager}
   */
  static fromJSON(json) {
    const gm = new GameManager();
    Object.assign(gm, json);
    gm._comboTimer = null;
    gm._listeners = {};
    return gm;
  }
}

export default GameManager;
