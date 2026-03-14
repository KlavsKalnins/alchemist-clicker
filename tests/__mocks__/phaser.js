/**
 * Phaser mock for Jest tests.
 * Only stubs the minimal surface area used by game logic modules.
 */

const Phaser = {
  Math: {
    DegToRad: (deg) => (deg * Math.PI) / 180,
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  },
  AUTO: 'AUTO',
  Scale: {
    FIT: 'FIT',
    CENTER_BOTH: 'CENTER_BOTH',
  },
  Game: jest.fn(),
  Scene: class {
    constructor(config) {
      this.key = config && config.key;
    }
  },
};

module.exports = Phaser;
