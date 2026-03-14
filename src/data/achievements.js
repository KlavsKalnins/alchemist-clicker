/**
 * Achievement (Feats) definitions for the Alchemist Clicker game.
 *
 * Each achievement has:
 *   - id:          Unique identifier
 *   - name:        Display name ("Feat" title)
 *   - description: Flavor text shown on unlock
 *   - icon:        Neon color for the achievement badge
 *   - condition:   Object describing what triggers the achievement
 *     - type:      'crushes' | 'level' | 'craft' | 'combo' | 'resource' | 'relics'
 *     - value:     Threshold value
 *     - target:    (optional) specific element or relic id
 */
const ACHIEVEMENTS = [
  // ── Crushing Feats ──────────────────────────────────────────────
  {
    id: 'first_crush',
    name: 'First Contact',
    description: 'Performed your very first crush.',
    icon: 0x44ffaa,
    condition: { type: 'crushes', value: 1 },
  },
  {
    id: 'hundred_crushes',
    name: 'First 100 Crushes',
    description: 'Crushed 100 raw elements. The work is just beginning.',
    icon: 0x44ffaa,
    condition: { type: 'crushes', value: 100 },
  },
  {
    id: 'thousand_crushes',
    name: 'Unstoppable Force',
    description: 'Reached 1,000 total crushes. Nothing can stop you.',
    icon: 0x22ddff,
    condition: { type: 'crushes', value: 1000 },
  },
  {
    id: 'ten_thousand_crushes',
    name: 'Crusher Supreme',
    description: '10,000 crushes. The elements bow to your will.',
    icon: 0xffaa00,
    condition: { type: 'crushes', value: 10000 },
  },

  // ── Timing Feats ────────────────────────────────────────────────
  {
    id: 'first_perfect',
    name: 'Perfect Timing',
    description: 'Achieved your first Perfect crush. Precision matters.',
    icon: 0xffff00,
    condition: { type: 'perfect_crushes', value: 1 },
  },
  {
    id: 'fifty_perfects',
    name: 'Precision Alchemist',
    description: '50 Perfect crushes. Your hands are those of a master.',
    icon: 0xffff00,
    condition: { type: 'perfect_crushes', value: 50 },
  },
  {
    id: 'five_combo',
    name: 'Combo Initiate',
    description: 'Reached a 5× combo. Keep the momentum!',
    icon: 0xff88ff,
    condition: { type: 'combo', value: 5 },
  },
  {
    id: 'twenty_combo',
    name: 'Combo Master',
    description: 'Reached a 20× combo. You are unstoppable.',
    icon: 0xff44ff,
    condition: { type: 'combo', value: 20 },
  },

  // ── Crafting Feats ───────────────────────────────────────────────
  {
    id: 'first_craft',
    name: 'Apprentice Crafter',
    description: 'Crafted your first Relic. The journey to mastery begins.',
    icon: 0xaa88ff,
    condition: { type: 'relics', value: 1 },
  },
  {
    id: 'three_relics',
    name: 'Master Crafter',
    description: 'Crafted 3 different Relics. A true alchemical artisan.',
    icon: 0xcc66ff,
    condition: { type: 'relics', value: 3 },
  },
  {
    id: 'all_relics',
    name: 'Grand Artificer',
    description: 'Crafted all 8 Relics. Your collection is legendary.',
    icon: 0xffcc00,
    condition: { type: 'relics', value: 8 },
  },
  {
    id: 'tier3_relic',
    name: 'Transcendent',
    description: 'Crafted a Tier 3 Relic. You touch the fabric of reality.',
    icon: 0xffffff,
    condition: { type: 'tier3_craft', value: 1 },
  },

  // ── Level Feats ──────────────────────────────────────────────────
  {
    id: 'level_10',
    name: 'Novice Alchemist',
    description: 'Reached Level 10. The basics are behind you.',
    icon: 0x44ffaa,
    condition: { type: 'level', value: 10 },
  },
  {
    id: 'level_25',
    name: 'Journeyman',
    description: 'Reached Level 25. Halfway to mastery.',
    icon: 0x22ddff,
    condition: { type: 'level', value: 25 },
  },
  {
    id: 'level_50',
    name: 'Grand Alchemist',
    description: 'Reached Level 50. You have mastered the alchemical arts!',
    icon: 0xffcc00,
    condition: { type: 'level', value: 50 },
  },

  // ── Resource Feats ───────────────────────────────────────────────
  {
    id: 'collect_100_fire',
    name: 'Fire Collector',
    description: 'Collected 100 Fire Ore. Your furnace burns bright.',
    icon: 0xff4422,
    condition: { type: 'resource', value: 100, target: 'fire_ore' },
  },
  {
    id: 'collect_aether',
    name: 'Aether Hunter',
    description: 'Collected your first Aether Gem. Rare and precious.',
    icon: 0xffcc00,
    condition: { type: 'resource', value: 1, target: 'aether_gem' },
  },
];

/**
 * Returns all achievement definitions.
 * @returns {Array} Array of achievement objects
 */
export function getAllAchievements() {
  return ACHIEVEMENTS;
}

/**
 * Returns achievement by id.
 * @param {string} id - Achievement id
 * @returns {Object|undefined} Achievement object or undefined
 */
export function getAchievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
