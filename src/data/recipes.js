/**
 * Crafting recipes for combining elements into Relics.
 * Each relic provides a passive buff to gameplay.
 *
 * Buff types:
 *   - yield_multiplier: Multiplies resource yield from crushes
 *   - auto_crush_rate:  Adds automatic crushes per second
 *   - timing_window:    Expands the perfect-timing window (ms)
 *   - level_xp_bonus:  Adds bonus XP per crush
 *   - combo_multiplier: Multiplies combo bonus
 */
const RECIPES = [
  // === Tier 1 Relics (Common elements only) ===
  {
    id: 'ember_stone',
    name: 'Ember Stone',
    description: 'Born from fire and water – doubles crush yield.',
    ingredients: { fire_ore: 5, water_crystal: 5 },
    buff: { type: 'yield_multiplier', value: 2 },
    color: 0xff8844,
    tier: 1,
  },
  {
    id: 'living_rock',
    name: 'Living Rock',
    description: 'Earth shaped by water – generates 0.5 auto-crushes/sec.',
    ingredients: { water_crystal: 5, earth_stone: 5 },
    buff: { type: 'auto_crush_rate', value: 0.5 },
    color: 0x44aacc,
    tier: 1,
  },
  {
    id: 'flame_earth',
    name: 'Flame Earth',
    description: 'Fire meets earth – expands perfect timing window by 200ms.',
    ingredients: { fire_ore: 8, earth_stone: 4 },
    buff: { type: 'timing_window', value: 200 },
    color: 0xcc6622,
    tier: 1,
  },

  // === Tier 2 Relics (Require uncommon elements) ===
  {
    id: 'storm_heart',
    name: 'Storm Heart',
    description: 'Tempest trapped in stone – triples crush yield.',
    ingredients: { wind_shard: 3, earth_stone: 5, fire_ore: 5 },
    buff: { type: 'yield_multiplier', value: 3 },
    color: 0xaaffaa,
    tier: 2,
  },
  {
    id: 'void_lens',
    name: 'Void Lens',
    description: 'Shadow dust compressed – adds 1.5 auto-crushes/sec.',
    ingredients: { shadow_dust: 4, water_crystal: 6 },
    buff: { type: 'auto_crush_rate', value: 1.5 },
    color: 0xcc44ff,
    tier: 2,
  },
  {
    id: 'tempest_ring',
    name: 'Tempest Ring',
    description: 'Forged in the eye of a storm – 50% XP bonus per crush.',
    ingredients: { wind_shard: 5, shadow_dust: 3, fire_ore: 4 },
    buff: { type: 'level_xp_bonus', value: 0.5 },
    color: 0x88ffcc,
    tier: 2,
  },

  // === Tier 3 Relics (Require rare elements) ===
  {
    id: 'aether_crown',
    name: 'Aether Crown',
    description: 'The pinnacle relic – 5× crush yield, 2 auto-crushes/sec.',
    ingredients: { aether_gem: 3, wind_shard: 5, shadow_dust: 5, fire_ore: 10 },
    buff: { type: 'yield_multiplier', value: 5 },
    color: 0xffdd44,
    tier: 3,
  },
  {
    id: 'infinity_prism',
    name: 'Infinity Prism',
    description: 'Refracts reality – doubles all combo bonuses.',
    ingredients: { aether_gem: 5, water_crystal: 10, earth_stone: 10 },
    buff: { type: 'combo_multiplier', value: 2 },
    color: 0xffffff,
    tier: 3,
  },
];

/**
 * Returns all crafting recipes.
 * @returns {Array} Array of recipe objects
 */
export function getAllRecipes() {
  return RECIPES;
}

/**
 * Returns recipe by id.
 * @param {string} id - Recipe id
 * @returns {Object|undefined} Recipe object or undefined
 */
export function getRecipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

/**
 * Returns recipes available at a given tier (1-3).
 * @param {number} tier - Tier number
 * @returns {Array} Array of recipe objects matching the tier
 */
export function getRecipesByTier(tier) {
  return RECIPES.filter((r) => r.tier === tier);
}
