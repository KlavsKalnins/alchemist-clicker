/**
 * Tests for AchievementService – unlock logic and event emission.
 */

import { AchievementService } from '../src/AchievementService.js';
import { GameManager } from '../src/GameManager.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSetup(overrides = {}) {
  const gm = new GameManager();
  Object.assign(gm, overrides);
  // Suppress fake timers for combo resets
  jest.useFakeTimers();
  const svc = new AchievementService(gm);
  return { gm, svc };
}

// ── Construction ──────────────────────────────────────────────────────────

describe('AchievementService – initialisation', () => {
  afterEach(() => jest.useRealTimers());

  test('starts with no unlocked achievements', () => {
    const { svc } = makeSetup();
    expect(svc.getUnlockedIds()).toHaveLength(0);
  });

  test('restores previously unlocked achievements from saved ids', () => {
    const gm = new GameManager();
    const svc = new AchievementService(gm, ['first_crush', 'level_10']);
    expect(svc.getUnlockedIds()).toEqual(expect.arrayContaining(['first_crush', 'level_10']));
  });

  test('getAllAchievements returns all defined achievements', () => {
    const { svc } = makeSetup();
    expect(svc.getAllAchievements().length).toBeGreaterThan(0);
  });
});

// ── Crush Achievements ────────────────────────────────────────────────────

describe('AchievementService – crush achievements', () => {
  afterEach(() => jest.useRealTimers());

  test('unlocks "first_crush" after 1st crush', () => {
    const { gm, svc } = makeSetup();
    const unlockFn = jest.fn();
    svc.onUnlock(unlockFn);

    gm.totalCrushes = 1;
    gm.emit('crush', {});

    expect(svc.getUnlockedIds()).toContain('first_crush');
    expect(unlockFn).toHaveBeenCalledWith(expect.objectContaining({ id: 'first_crush' }));
  });

  test('unlocks "hundred_crushes" after 100 crushes', () => {
    const { gm, svc } = makeSetup();
    gm.totalCrushes = 100;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('hundred_crushes');
  });

  test('does not unlock "hundred_crushes" at 99 crushes', () => {
    const { gm, svc } = makeSetup();
    gm.totalCrushes = 99;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).not.toContain('hundred_crushes');
  });

  test('unlocks "first_perfect" after first perfect crush', () => {
    const { gm, svc } = makeSetup();
    gm.perfectCrushes = 1;
    gm.totalCrushes = 1;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('first_perfect');
  });
});

// ── Combo Achievements ────────────────────────────────────────────────────

describe('AchievementService – combo achievements', () => {
  afterEach(() => jest.useRealTimers());

  test('unlocks "five_combo" when maxCombo reaches 5', () => {
    const { gm, svc } = makeSetup();
    gm.maxCombo = 5;
    gm.totalCrushes = 5;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('five_combo');
  });

  test('does not unlock "twenty_combo" at maxCombo 10', () => {
    const { gm, svc } = makeSetup();
    gm.maxCombo = 10;
    gm.totalCrushes = 10;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).not.toContain('twenty_combo');
  });

  test('unlocks "twenty_combo" at maxCombo 20', () => {
    const { gm, svc } = makeSetup();
    gm.maxCombo = 20;
    gm.totalCrushes = 20;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('twenty_combo');
  });
});

// ── Level Achievements ────────────────────────────────────────────────────

describe('AchievementService – level achievements', () => {
  afterEach(() => jest.useRealTimers());

  test('unlocks "level_10" on level-up to 10', () => {
    const { gm, svc } = makeSetup();
    gm.level = 10;
    gm.emit('level_up', { level: 10 });
    expect(svc.getUnlockedIds()).toContain('level_10');
  });

  test('unlocks "level_25" at level 25', () => {
    const { gm, svc } = makeSetup({ level: 25 });
    gm.emit('level_up', { level: 25 });
    expect(svc.getUnlockedIds()).toContain('level_25');
  });

  test('unlocks "level_50" at max level', () => {
    const { gm, svc } = makeSetup({ level: 50 });
    gm.emit('level_up', { level: 50 });
    expect(svc.getUnlockedIds()).toContain('level_50');
  });
});

// ── Crafting Achievements ─────────────────────────────────────────────────

describe('AchievementService – crafting achievements', () => {
  afterEach(() => jest.useRealTimers());

  test('unlocks "first_craft" after crafting 1 unique relic', () => {
    const { gm, svc } = makeSetup();
    gm.uniqueRelicsCrafted = 1;
    gm.emit('relic_crafted', {});
    expect(svc.getUnlockedIds()).toContain('first_craft');
  });

  test('unlocks "master_crafter" after 3 unique relics', () => {
    const { gm, svc } = makeSetup();
    gm.uniqueRelicsCrafted = 3;
    gm.emit('relic_crafted', {});
    expect(svc.getUnlockedIds()).toContain('three_relics');
  });

  test('unlocks "all_relics" after all 8 unique relics', () => {
    const { gm, svc } = makeSetup();
    gm.uniqueRelicsCrafted = 8;
    gm.emit('relic_crafted', {});
    expect(svc.getUnlockedIds()).toContain('all_relics');
  });

  test('unlocks "tier3_relic" after crafting a tier-3 relic', () => {
    const { gm, svc } = makeSetup();
    gm.tier3RelicsCrafted = 1;
    gm.emit('relic_crafted', {});
    expect(svc.getUnlockedIds()).toContain('tier3_relic');
  });
});

// ── Resource Achievements ─────────────────────────────────────────────────

describe('AchievementService – resource achievements', () => {
  afterEach(() => jest.useRealTimers());

  test('unlocks "collect_100_fire" at 100 fire_ore', () => {
    const { gm, svc } = makeSetup();
    gm.resources.fire_ore = 100;
    gm.totalCrushes = 1;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('collect_100_fire');
  });

  test('does not unlock "collect_100_fire" at 99 fire_ore', () => {
    const { gm, svc } = makeSetup();
    gm.resources.fire_ore = 99;
    gm.totalCrushes = 1;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).not.toContain('collect_100_fire');
  });

  test('unlocks "collect_aether" at 1 aether_gem', () => {
    const { gm, svc } = makeSetup();
    gm.resources.aether_gem = 1;
    gm.totalCrushes = 1;
    gm.emit('crush', {});
    expect(svc.getUnlockedIds()).toContain('collect_aether');
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────

describe('AchievementService – no duplicate unlocks', () => {
  afterEach(() => jest.useRealTimers());

  test('does not fire callback twice for same achievement', () => {
    const { gm, svc } = makeSetup();
    const fn = jest.fn();
    svc.onUnlock(fn);

    gm.totalCrushes = 1;
    gm.emit('crush', {});
    gm.emit('crush', {});

    const firstCrushCalls = fn.mock.calls.filter(
      (call) => call[0].id === 'first_crush'
    );
    expect(firstCrushCalls).toHaveLength(1);
  });
});

// ── checkAll ──────────────────────────────────────────────────────────────

describe('AchievementService – checkAll()', () => {
  afterEach(() => jest.useRealTimers());

  test('re-evaluates all conditions on demand', () => {
    const gm = new GameManager();
    gm.totalCrushes = 1000;
    gm.level = 10;
    gm.uniqueRelicsCrafted = 1;

    const svc = new AchievementService(gm);
    svc.checkAll();

    const ids = svc.getUnlockedIds();
    expect(ids).toContain('first_crush');
    expect(ids).toContain('hundred_crushes');
    expect(ids).toContain('thousand_crushes');
    expect(ids).toContain('level_10');
    expect(ids).toContain('first_craft');
  });
});
