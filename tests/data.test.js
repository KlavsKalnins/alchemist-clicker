/**
 * Tests for data definitions – elements, recipes, and achievements.
 */

import { getAllElements, getElementById, getElementsForLevel } from '../src/data/elements.js';
import { getAllRecipes, getRecipeById, getRecipesByTier } from '../src/data/recipes.js';
import { getAllAchievements, getAchievementById } from '../src/data/achievements.js';

// ── Elements ──────────────────────────────────────────────────────────────

describe('elements.js', () => {
  test('getAllElements returns at least 2 elements', () => {
    const els = getAllElements();
    expect(els.length).toBeGreaterThanOrEqual(2);
  });

  test('getElementById returns the correct element', () => {
    const el = getElementById('fire_ore');
    expect(el).toBeDefined();
    expect(el.name).toBe('Fire Ore');
  });

  test('getElementById returns undefined for unknown id', () => {
    expect(getElementById('not_an_element')).toBeUndefined();
  });

  test('getElementsForLevel(1) returns only early elements', () => {
    const els = getElementsForLevel(1);
    expect(els.length).toBeLessThan(getAllElements().length);
  });

  test('getElementsForLevel(50) returns all elements', () => {
    const all = getAllElements();
    const atMax = getElementsForLevel(50);
    expect(atMax.length).toBe(all.length);
  });

  test('getElementsForLevel returns more elements as level increases', () => {
    const el1 = getElementsForLevel(1).length;
    const el20 = getElementsForLevel(20).length;
    const el50 = getElementsForLevel(50).length;
    expect(el20).toBeGreaterThanOrEqual(el1);
    expect(el50).toBeGreaterThanOrEqual(el20);
  });

  test('each element has required fields', () => {
    getAllElements().forEach((el) => {
      expect(el).toHaveProperty('id');
      expect(el).toHaveProperty('name');
      expect(el).toHaveProperty('color');
      expect(el).toHaveProperty('baseYield');
      expect(el).toHaveProperty('rarity');
    });
  });
});

// ── Recipes ───────────────────────────────────────────────────────────────

describe('recipes.js', () => {
  test('getAllRecipes returns at least 3 recipes', () => {
    expect(getAllRecipes().length).toBeGreaterThanOrEqual(3);
  });

  test('getRecipeById returns the correct recipe', () => {
    const r = getRecipeById('ember_stone');
    expect(r).toBeDefined();
    expect(r.name).toBe('Ember Stone');
  });

  test('getRecipeById returns undefined for unknown id', () => {
    expect(getRecipeById('unknown')).toBeUndefined();
  });

  test('getRecipesByTier returns only matching tier', () => {
    const tier1 = getRecipesByTier(1);
    tier1.forEach((r) => expect(r.tier).toBe(1));
    expect(tier1.length).toBeGreaterThan(0);
  });

  test('each recipe has required fields', () => {
    getAllRecipes().forEach((r) => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('ingredients');
      expect(r).toHaveProperty('buff');
      expect(r).toHaveProperty('tier');
      expect(r.buff).toHaveProperty('type');
      expect(r.buff).toHaveProperty('value');
    });
  });

  test('recipe ingredients are non-empty objects', () => {
    getAllRecipes().forEach((r) => {
      expect(Object.keys(r.ingredients).length).toBeGreaterThan(0);
    });
  });
});

// ── Achievements ──────────────────────────────────────────────────────────

describe('achievements.js', () => {
  test('getAllAchievements returns at least 10 achievements', () => {
    expect(getAllAchievements().length).toBeGreaterThanOrEqual(10);
  });

  test('getAchievementById returns the correct achievement', () => {
    const a = getAchievementById('first_crush');
    expect(a).toBeDefined();
    expect(a.name).toBe('First Contact');
  });

  test('getAchievementById returns undefined for unknown id', () => {
    expect(getAchievementById('fake_id')).toBeUndefined();
  });

  test('each achievement has required fields', () => {
    getAllAchievements().forEach((a) => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('name');
      expect(a).toHaveProperty('description');
      expect(a).toHaveProperty('icon');
      expect(a).toHaveProperty('condition');
      expect(a.condition).toHaveProperty('type');
      expect(a.condition).toHaveProperty('value');
    });
  });

  test('all achievement ids are unique', () => {
    const ids = getAllAchievements().map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
