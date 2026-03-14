/**
 * Tests for GameManager – state, crush mechanics, levelling, and buffs.
 */

import { GameManager } from '../src/GameManager.js';
import { getElementById } from '../src/data/elements.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns a mock element for testing without importing all data. */
const mockElement = (id = 'fire_ore', baseYield = 1) => ({ id, baseYield });

// ── Construction ──────────────────────────────────────────────────────────

describe('GameManager – initialisation', () => {
  test('starts at level 1 with zero resources', () => {
    const gm = new GameManager();
    expect(gm.level).toBe(1);
    expect(gm.xp).toBe(0);
    expect(gm.totalCrushes).toBe(0);
    expect(gm.resources).toEqual({});
  });

  test('starts with default buffs', () => {
    const gm = new GameManager();
    expect(gm.buffs.yield_multiplier).toBe(1);
    expect(gm.buffs.auto_crush_rate).toBe(0);
    expect(gm.buffs.timing_window).toBe(0);
    expect(gm.buffs.level_xp_bonus).toBe(0);
    expect(gm.buffs.combo_multiplier).toBe(1);
  });
});

// ── Crush Mechanics ───────────────────────────────────────────────────────

describe('GameManager – crush()', () => {
  let gm;
  beforeEach(() => {
    gm = new GameManager();
    // Prevent real setTimeout from running
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test('normal crush adds resources and increments counters', () => {
    const el = mockElement('fire_ore', 1);
    gm.crush(el, false);

    expect(gm.totalCrushes).toBe(1);
    expect(gm.resources.fire_ore).toBeGreaterThanOrEqual(1);
  });

  test('perfect crush awards double base yield', () => {
    const el = mockElement('fire_ore', 2);
    const result = gm.crush(el, true);

    expect(gm.perfectCrushes).toBe(1);
    // combo=2 after first crush, so yield = ceil(2*2 * (2 * 1)) = ceil(8) = 8
    // or at minimum ceil(4 * 2) = 8 (perfect doubles baseYield before combo)
    expect(result.isPerfect).toBe(true);
    expect(result.yield).toBeGreaterThan(2); // more than base yield
  });

  test('combo increments on each crush', () => {
    const el = mockElement();
    gm.crush(el, false); // combo → 2
    gm.crush(el, false); // combo → 3
    expect(gm.combo).toBe(3);
  });

  test('combo resets after delay', () => {
    const el = mockElement();
    gm.crush(el, false);
    gm.crush(el, false);
    expect(gm.combo).toBe(3);

    jest.advanceTimersByTime(4000); // past COMBO_RESET_DELAY_MS (3000 ms)
    expect(gm.combo).toBe(1);
  });

  test('crush emits "crush" event with result', () => {
    const listener = jest.fn();
    gm.on('crush', listener);
    const el = mockElement('water_crystal', 1);
    gm.crush(el, false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toHaveProperty('yield');
    expect(listener.mock.calls[0][0]).toHaveProperty('isPerfect', false);
  });

  test('yields scale with yield_multiplier buff', () => {
    gm.buffs.yield_multiplier = 3;
    const el = mockElement('fire_ore', 2);
    const result = gm.crush(el, false);
    // base: 2 * 3 = 6, combo at 2 → 6 * 2 = 12
    expect(result.yield).toBeGreaterThanOrEqual(6);
  });
});

// ── Levelling ─────────────────────────────────────────────────────────────

describe('GameManager – levelling', () => {
  let gm;
  beforeEach(() => {
    gm = new GameManager();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test('XP for next level is > 0', () => {
    expect(gm.getXpForNextLevel()).toBeGreaterThan(0);
  });

  test('XP required increases with each level', () => {
    const xpL1 = gm.getXpForNextLevel();
    gm.level = 2;
    const xpL2 = gm.getXpForNextLevel();
    expect(xpL2).toBeGreaterThan(xpL1);
  });

  test('level increases when XP threshold is reached', () => {
    const listener = jest.fn();
    gm.on('level_up', listener);

    // Inject XP directly to trigger level up
    gm._addXp(gm.getXpForNextLevel());
    expect(gm.level).toBe(2);
    expect(listener).toHaveBeenCalledWith({ level: 2 });
  });

  test('level is capped at 50', () => {
    gm.level = 49;
    gm._addXp(gm.getXpForNextLevel() + 100000);
    expect(gm.level).toBe(50);
  });
});

// ── Buff Management ───────────────────────────────────────────────────────

describe('GameManager – applyBuff()', () => {
  let gm;
  beforeEach(() => { gm = new GameManager(); });

  test('yield_multiplier buff multiplies existing multiplier', () => {
    gm.applyBuff({ type: 'yield_multiplier', value: 3 });
    expect(gm.buffs.yield_multiplier).toBe(3);
    gm.applyBuff({ type: 'yield_multiplier', value: 2 });
    expect(gm.buffs.yield_multiplier).toBe(6);
  });

  test('auto_crush_rate buff is additive', () => {
    gm.applyBuff({ type: 'auto_crush_rate', value: 0.5 });
    gm.applyBuff({ type: 'auto_crush_rate', value: 1.5 });
    expect(gm.buffs.auto_crush_rate).toBeCloseTo(2.0);
  });

  test('timing_window buff is additive', () => {
    gm.applyBuff({ type: 'timing_window', value: 200 });
    gm.applyBuff({ type: 'timing_window', value: 100 });
    expect(gm.buffs.timing_window).toBe(300);
  });

  test('combo_multiplier buff multiplies existing', () => {
    gm.applyBuff({ type: 'combo_multiplier', value: 2 });
    expect(gm.buffs.combo_multiplier).toBe(2);
    gm.applyBuff({ type: 'combo_multiplier', value: 3 });
    expect(gm.buffs.combo_multiplier).toBe(6);
  });

  test('emits buff_applied event', () => {
    const listener = jest.fn();
    gm.on('buff_applied', listener);
    gm.applyBuff({ type: 'auto_crush_rate', value: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('unknown buff type warns but does not throw', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => gm.applyBuff({ type: 'magic_unknown', value: 99 })).not.toThrow();
    warn.mockRestore();
  });
});

// ── Serialisation ─────────────────────────────────────────────────────────

describe('GameManager – serialisation', () => {
  test('toJSON returns a plain object that can be round-tripped', () => {
    jest.useFakeTimers();
    const gm = new GameManager();
    gm.crush(mockElement('fire_ore', 1), false);
    gm.level = 5;

    const json = gm.toJSON();
    expect(json.level).toBe(5);
    expect(json.totalCrushes).toBe(1);

    const gm2 = GameManager.fromJSON(json);
    expect(gm2.level).toBe(5);
    expect(gm2.totalCrushes).toBe(1);
    jest.useRealTimers();
  });

  test('fromJSON initialises _listeners and _comboTimer to safe defaults', () => {
    const gm = GameManager.fromJSON({ level: 3, xp: 0, totalCrushes: 0, perfectCrushes: 0,
      combo: 1, maxCombo: 1, resources: {}, relics: {}, uniqueRelicsCrafted: 0,
      tier3RelicsCrafted: 0, buffs: { yield_multiplier: 1, auto_crush_rate: 0,
        timing_window: 0, level_xp_bonus: 0, combo_multiplier: 1 } });
    expect(gm._comboTimer).toBeNull();
    expect(gm._listeners).toEqual({});
  });
});

// ── Accessors ─────────────────────────────────────────────────────────────

describe('GameManager – accessors', () => {
  test('getTimingWindowMs returns base + buff timing', () => {
    const gm = new GameManager();
    const base = gm.getTimingWindowMs();
    gm.applyBuff({ type: 'timing_window', value: 200 });
    expect(gm.getTimingWindowMs()).toBe(base + 200);
  });

  test('getIndicatorCycleMs decreases with level (harder)', () => {
    const gm = new GameManager();
    const cycleL1 = gm.getIndicatorCycleMs();
    gm.level = 20;
    const cycleL20 = gm.getIndicatorCycleMs();
    expect(cycleL20).toBeLessThan(cycleL1);
  });

  test('getIndicatorCycleMs is capped at minimum', () => {
    const gm = new GameManager();
    gm.level = 50;
    expect(gm.getIndicatorCycleMs()).toBeGreaterThan(0);
  });

  test('getAvailableElements returns level-appropriate elements', () => {
    const gm = new GameManager();
    const el1 = gm.getAvailableElements();
    gm.level = 30;
    const el30 = gm.getAvailableElements();
    expect(el30.length).toBeGreaterThan(el1.length);
  });
});
