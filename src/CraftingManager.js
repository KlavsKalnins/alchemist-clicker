/**
 * CraftingManager – Handles all recipe logic for the Alchemist Clicker game.
 *
 * Responsibilities:
 *  - Check if a player can afford a recipe given their resource inventory
 *  - Deduct ingredients and delegate relic recording to GameManager
 *  - Return crafting results (success / error)
 */

import { getAllRecipes, getRecipeById } from './data/recipes.js';

export class CraftingManager {
  /**
   * @param {import('./GameManager.js').GameManager} gameManager
   */
  constructor(gameManager) {
    this._gm = gameManager;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Returns all recipe definitions.
   * @returns {Array}
   */
  getAllRecipes() {
    return getAllRecipes();
  }

  /**
   * Returns a single recipe by id.
   * @param {string} id
   * @returns {Object|undefined}
   */
  getRecipeById(id) {
    return getRecipeById(id);
  }

  /**
   * Checks whether the player has enough resources to craft a given recipe.
   *
   * @param {Object} recipe - Recipe definition
   * @param {Object} resources - Current resource inventory { elementId: count }
   * @returns {boolean}
   */
  canCraft(recipe, resources) {
    return Object.entries(recipe.ingredients).every(
      ([elementId, required]) => (resources[elementId] || 0) >= required
    );
  }

  /**
   * Returns a human-readable breakdown of ingredient availability for a recipe.
   *
   * @param {Object} recipe - Recipe definition
   * @param {Object} resources - Current resource inventory
   * @returns {Array<{ elementId: string, required: number, have: number, enough: boolean }>}
   */
  getIngredientStatus(recipe, resources) {
    return Object.entries(recipe.ingredients).map(([elementId, required]) => ({
      elementId,
      required,
      have: resources[elementId] || 0,
      enough: (resources[elementId] || 0) >= required,
    }));
  }

  // ── Crafting ──────────────────────────────────────────────────────────────

  /**
   * Attempts to craft the recipe with the given id.
   *
   * Workflow:
   *  1. Validate the recipe exists.
   *  2. Check ingredient availability.
   *  3. Deduct ingredients from resources.
   *  4. Delegate to GameManager.recordCraft() to apply the buff.
   *
   * @param {string} recipeId - Id of the recipe to craft
   * @returns {{ success: boolean, error?: string, recipe?: Object }}
   */
  craft(recipeId) {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return { success: false, error: `Unknown recipe: ${recipeId}` };
    }

    const resources = this._gm.resources;

    if (!this.canCraft(recipe, resources)) {
      const missing = this.getIngredientStatus(recipe, resources)
        .filter((s) => !s.enough)
        .map((s) => `${s.elementId} (need ${s.required}, have ${s.have})`)
        .join(', ');
      return { success: false, error: `Insufficient resources: ${missing}` };
    }

    // Deduct ingredients
    Object.entries(recipe.ingredients).forEach(([elementId, required]) => {
      this._gm.resources[elementId] -= required;
    });

    // Record craft and apply buff via GameManager
    this._gm.recordCraft(recipe);

    return { success: true, recipe };
  }
}

export default CraftingManager;
