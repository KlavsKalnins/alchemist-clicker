/**
 * Raw elements that players crush to obtain resources.
 * Each element has a color (neon palette), base yield, and rarity.
 */
const ELEMENTS = [
  {
    id: 'fire_ore',
    name: 'Fire Ore',
    color: 0xff4422,
    glowColor: 0xff6644,
    baseYield: 1,
    rarity: 'common',
    description: 'A smoldering chunk of raw flame.',
  },
  {
    id: 'water_crystal',
    name: 'Water Crystal',
    color: 0x22aaff,
    glowColor: 0x44ccff,
    baseYield: 1,
    rarity: 'common',
    description: 'Crystallized deep-sea essence.',
  },
  {
    id: 'earth_stone',
    name: 'Earth Stone',
    color: 0x44cc44,
    glowColor: 0x66ee66,
    baseYield: 1,
    rarity: 'common',
    description: 'Dense core from the planet\'s heart.',
  },
  {
    id: 'wind_shard',
    name: 'Wind Shard',
    color: 0xccffaa,
    glowColor: 0xeeffcc,
    baseYield: 2,
    rarity: 'uncommon',
    description: 'A fragment of frozen tempest.',
  },
  {
    id: 'shadow_dust',
    name: 'Shadow Dust',
    color: 0x9922ff,
    glowColor: 0xbb44ff,
    baseYield: 2,
    rarity: 'uncommon',
    description: 'Residue from extinguished stars.',
  },
  {
    id: 'aether_gem',
    name: 'Aether Gem',
    color: 0xffcc00,
    glowColor: 0xffee44,
    baseYield: 3,
    rarity: 'rare',
    description: 'Pure condensed aether energy.',
  },
];

/**
 * Returns all element definitions.
 * @returns {Array} Array of element objects
 */
export function getAllElements() {
  return ELEMENTS;
}

/**
 * Returns element by id.
 * @param {string} id - Element id
 * @returns {Object|undefined} Element object or undefined
 */
export function getElementById(id) {
  return ELEMENTS.find((e) => e.id === id);
}

/**
 * Returns elements available at a given game level (1-50).
 * Unlocks new elements every 10 levels.
 * @param {number} level - Current game level
 * @returns {Array} Array of unlocked element objects
 */
export function getElementsForLevel(level) {
  if (level >= 41) return ELEMENTS;            // All 6 elements unlocked
  if (level >= 31) return ELEMENTS.slice(0, 5); // Shadow Dust unlocked
  if (level >= 21) return ELEMENTS.slice(0, 4); // Wind Shard unlocked
  if (level >= 11) return ELEMENTS.slice(0, 3); // Earth Stone unlocked
  return ELEMENTS.slice(0, 2);                  // Fire Ore + Water Crystal
}
