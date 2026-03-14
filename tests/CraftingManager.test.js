/**
 * Tests for CraftingManager – canCraft, getIngredientStatus, and craft().
 */

import { CraftingManager } from '../src/CraftingManager.js';
import { GameManager } from '../src/GameManager.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeGM(resources = {}) {
  const gm = new GameManager();
  gm.resources = { ...resources };
  return gm;
}

// ── canCraft ──────────────────────────────────────────────────────────────

describe('CraftingManager – canCraft()', () => {
  const recipe = {
    id: 'ember_stone',
    ingredients: { fire_ore: 5, water_crystal: 5 },
    buff: { type: 'yield_multiplier', value: 2 },
    tier: 1,
  };

  test('returns true when all ingredients are met', () => {
    const gm = makeGM({ fire_ore: 10, water_crystal: 8 });
    const cm = new CraftingManager(gm);
    expect(cm.canCraft(recipe, gm.resources)).toBe(true);
  });

  test('returns true when counts are exactly equal', () => {
    const gm = makeGM({ fire_ore: 5, water_crystal: 5 });
    const cm = new CraftingManager(gm);
    expect(cm.canCraft(recipe, gm.resources)).toBe(true);
  });

  test('returns false when one ingredient is short', () => {
    const gm = makeGM({ fire_ore: 4, water_crystal: 5 });
    const cm = new CraftingManager(gm);
    expect(cm.canCraft(recipe, gm.resources)).toBe(false);
  });

  test('returns false when resource is missing entirely', () => {
    const gm = makeGM({ fire_ore: 10 });
    const cm = new CraftingManager(gm);
    expect(cm.canCraft(recipe, gm.resources)).toBe(false);
  });
});

// ── getIngredientStatus ────────────────────────────────────────────────────

describe('CraftingManager – getIngredientStatus()', () => {
  const recipe = {
    id: 'ember_stone',
    ingredients: { fire_ore: 5, water_crystal: 5 },
    buff: { type: 'yield_multiplier', value: 2 },
    tier: 1,
  };

  test('returns status for each ingredient', () => {
    const gm = makeGM({ fire_ore: 3, water_crystal: 7 });
    const cm = new CraftingManager(gm);
    const status = cm.getIngredientStatus(recipe, gm.resources);

    expect(status).toHaveLength(2);
    const fire = status.find((s) => s.elementId === 'fire_ore');
    const water = status.find((s) => s.elementId === 'water_crystal');

    expect(fire).toMatchObject({ required: 5, have: 3, enough: false });
    expect(water).toMatchObject({ required: 5, have: 7, enough: true });
  });

  test('all statuses are "enough" when fully stocked', () => {
    const gm = makeGM({ fire_ore: 10, water_crystal: 10 });
    const cm = new CraftingManager(gm);
    const status = cm.getIngredientStatus(recipe, gm.resources);
    expect(status.every((s) => s.enough)).toBe(true);
  });
});

// ── craft ─────────────────────────────────────────────────────────────────

describe('CraftingManager – craft()', () => {
  test('successful craft deducts resources and applies buff', () => {
    const gm = makeGM({ fire_ore: 10, water_crystal: 10 });
    const cm = new CraftingManager(gm);

    const result = cm.craft('ember_stone');

    expect(result.success).toBe(true);
    expect(result.recipe.id).toBe('ember_stone');

    // Ingredients deducted
    expect(gm.resources.fire_ore).toBe(5);
    expect(gm.resources.water_crystal).toBe(5);

    // Buff applied (yield_multiplier ×2)
    expect(gm.buffs.yield_multiplier).toBe(2);
  });

  test('craft records relic in GameManager', () => {
    const gm = makeGM({ fire_ore: 10, water_crystal: 10 });
    const cm = new CraftingManager(gm);

    cm.craft('ember_stone');
    expect(gm.relics.ember_stone).toBe(1);
    expect(gm.uniqueRelicsCrafted).toBe(1);
  });

  test('failed craft returns error when resources are insufficient', () => {
    const gm = makeGM({ fire_ore: 1 });
    const cm = new CraftingManager(gm);

    const result = cm.craft('ember_stone');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Insufficient/i);
  });

  test('failed craft does not modify resources', () => {
    const gm = makeGM({ fire_ore: 1, water_crystal: 1 });
    const cm = new CraftingManager(gm);

    cm.craft('ember_stone');
    expect(gm.resources.fire_ore).toBe(1);
    expect(gm.resources.water_crystal).toBe(1);
  });

  test('returns error for unknown recipe id', () => {
    const gm = makeGM({});
    const cm = new CraftingManager(gm);

    const result = cm.craft('nonexistent_relic');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unknown recipe/i);
  });

  test('second craft of same relic increments count', () => {
    const gm = makeGM({ fire_ore: 20, water_crystal: 20 });
    const cm = new CraftingManager(gm);

    cm.craft('ember_stone');
    cm.craft('ember_stone');
    expect(gm.relics.ember_stone).toBe(2);
    // uniqueRelicsCrafted should still be 1 (same recipe)
    expect(gm.uniqueRelicsCrafted).toBe(1);
  });

  test('crafting tier-3 relic increments tier3RelicsCrafted', () => {
    const gm = makeGM({
      aether_gem: 5, water_crystal: 10, earth_stone: 10,
    });
    const cm = new CraftingManager(gm);

    const result = cm.craft('infinity_prism');
    expect(result.success).toBe(true);
    expect(gm.tier3RelicsCrafted).toBe(1);
  });
});

// ── getAllRecipes / getRecipeById ──────────────────────────────────────────

describe('CraftingManager – recipe queries', () => {
  const gm = makeGM({});
  const cm = new CraftingManager(gm);

  test('getAllRecipes returns non-empty array', () => {
    const recipes = cm.getAllRecipes();
    expect(Array.isArray(recipes)).toBe(true);
    expect(recipes.length).toBeGreaterThan(0);
  });

  test('getRecipeById returns correct recipe', () => {
    const r = cm.getRecipeById('ember_stone');
    expect(r).toBeDefined();
    expect(r.id).toBe('ember_stone');
  });

  test('getRecipeById returns undefined for unknown id', () => {
    expect(cm.getRecipeById('not_a_recipe')).toBeUndefined();
  });
});
