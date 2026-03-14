/**
 * AchievementService – Tracks and unlocks player Feats.
 *
 * Responsibilities:
 *  - Listen to GameManager events (crushes, level_up, relic_crafted, combo)
 *  - Compare player stats against achievement conditions
 *  - Emit 'achievement_unlocked' events for UI display
 *  - Maintain a set of already-unlocked achievement ids to prevent duplicates
 */

import { getAllAchievements } from './data/achievements.js';

export class AchievementService {
  /**
   * @param {import('./GameManager.js').GameManager} gameManager
   * @param {string[]} [unlockedIds] - Previously unlocked achievement ids (for restore)
   */
  constructor(gameManager, unlockedIds = []) {
    this._gm = gameManager;

    /** @type {Set<string>} Ids of already-unlocked achievements */
    this._unlocked = new Set(unlockedIds);

    /** @type {Object[]} Full achievement definitions */
    this._achievements = getAllAchievements();

    /** @type {Function[]} Listeners for 'achievement_unlocked' events */
    this._listeners = [];

    this._bindEvents();
  }

  // ── Event binding ─────────────────────────────────────────────────────────

  /**
   * Subscribes to GameManager events that can trigger achievements.
   */
  _bindEvents() {
    this._gm.on('crush', () => this._checkCrushAchievements());
    this._gm.on('level_up', () => this._checkLevelAchievements());
    this._gm.on('relic_crafted', () => this._checkCraftAchievements());
    this._gm.on('combo_reset', () => {}); // placeholder for future use
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Registers a listener for achievement unlock events.
   * @param {Function} callback - Receives the achievement object on unlock
   */
  onUnlock(callback) {
    this._listeners.push(callback);
  }

  /**
   * Returns all unlocked achievement ids.
   * @returns {string[]}
   */
  getUnlockedIds() {
    return Array.from(this._unlocked);
  }

  /**
   * Returns achievement definitions for all unlocked achievements.
   * @returns {Object[]}
   */
  getUnlockedAchievements() {
    return this._achievements.filter((a) => this._unlocked.has(a.id));
  }

  /**
   * Returns all achievement definitions (for a trophy screen).
   * @returns {Object[]}
   */
  getAllAchievements() {
    return this._achievements;
  }

  /**
   * Checks a specific achievement condition manually (e.g. on load).
   * Useful for re-evaluating after restoring saved state.
   */
  checkAll() {
    this._checkCrushAchievements();
    this._checkLevelAchievements();
    this._checkCraftAchievements();
    this._checkComboAchievements();
    this._checkResourceAchievements();
  }

  // ── Internal checks ───────────────────────────────────────────────────────

  /**
   * Checks achievements based on total/perfect crush counts.
   */
  _checkCrushAchievements() {
    this._achievements
      .filter((a) => a.condition.type === 'crushes')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.totalCrushes >= a.condition.value) {
          this._unlock(a);
        }
      });

    this._achievements
      .filter((a) => a.condition.type === 'perfect_crushes')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.perfectCrushes >= a.condition.value) {
          this._unlock(a);
        }
      });

    // Check combo achievements after every crush too
    this._checkComboAchievements();
    // Check resource achievements
    this._checkResourceAchievements();
  }

  /**
   * Checks level-based achievements.
   */
  _checkLevelAchievements() {
    this._achievements
      .filter((a) => a.condition.type === 'level')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.level >= a.condition.value) {
          this._unlock(a);
        }
      });
  }

  /**
   * Checks crafting-based achievements.
   */
  _checkCraftAchievements() {
    this._achievements
      .filter((a) => a.condition.type === 'relics')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.uniqueRelicsCrafted >= a.condition.value) {
          this._unlock(a);
        }
      });

    this._achievements
      .filter((a) => a.condition.type === 'tier3_craft')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.tier3RelicsCrafted >= a.condition.value) {
          this._unlock(a);
        }
      });
  }

  /**
   * Checks combo-based achievements using the player's max combo.
   */
  _checkComboAchievements() {
    this._achievements
      .filter((a) => a.condition.type === 'combo')
      .forEach((a) => {
        if (!this._unlocked.has(a.id) && this._gm.maxCombo >= a.condition.value) {
          this._unlock(a);
        }
      });
  }

  /**
   * Checks resource-based achievements.
   */
  _checkResourceAchievements() {
    this._achievements
      .filter((a) => a.condition.type === 'resource' && a.condition.target)
      .forEach((a) => {
        const have = this._gm.resources[a.condition.target] || 0;
        if (!this._unlocked.has(a.id) && have >= a.condition.value) {
          this._unlock(a);
        }
      });
  }

  /**
   * Marks an achievement as unlocked and notifies listeners.
   * @param {Object} achievement - Achievement definition
   */
  _unlock(achievement) {
    this._unlocked.add(achievement.id);
    this._listeners.forEach((cb) => cb(achievement));
    this._gm.emit('achievement_unlocked', achievement);
  }
}

export default AchievementService;
