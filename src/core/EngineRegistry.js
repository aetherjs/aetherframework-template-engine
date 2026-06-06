/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/core/EngineRegistry
 */

/**
 * Engine Registry - Manages template engine registration and retrieval
 */
class EngineRegistry {
  constructor() {
    this.engines = new Map();
    this.defaultEngine = null;
  }

  /**
   * Register a template engine
   * @param {string} name - Engine name
   * @param {BaseEngine} engine - Engine instance
   * @param {boolean} isDefault - Whether to set as default engine
   */
  register(name, engine, isDefault = false) {
    if (this.engines.has(name)) {
      console.warn(`⚠️ Engine "${name}" already registered, overwriting...`);
    }
    
    this.engines.set(name, engine);
    
    if (isDefault || this.engines.size === 1) {
      this.defaultEngine = name;
    }
    
    return this;
  }

  /**
   * Get engine by name
   * @param {string} name - Engine name
   * @returns {BaseEngine} Engine instance
   */
  get(name) {
    if (!this.engines.has(name)) {
      throw new Error(`Engine "${name}" not found. Available engines: ${Array.from(this.engines.keys()).join(', ')}`);
    }
    return this.engines.get(name);
  }

  /**
   * Check if engine exists
   * @param {string} name - Engine name
   * @returns {boolean} True if engine exists
   */
  has(name) {
    return this.engines.has(name);
  }

  /**
   * Remove engine by name
   * @param {string} name - Engine name
   * @returns {boolean} True if engine was removed
   */
  unregister(name) {
    const removed = this.engines.delete(name);
    
    if (removed && this.defaultEngine === name) {
      this.defaultEngine = this.engines.keys().next().value || null;
    }
    
    return removed;
  }

  /**
   * Get default engine
   * @returns {BaseEngine} Default engine instance
   */
  getDefault() {
    if (!this.defaultEngine) {
      throw new Error('No default engine set');
    }
    return this.get(this.defaultEngine);
  }

  /**
   * Set default engine
   * @param {string} name - Engine name
   */
  setDefault(name) {
    if (!this.engines.has(name)) {
      throw new Error(`Cannot set default: Engine "${name}" not found`);
    }
    this.defaultEngine = name;
    return this;
  }

  /**
   * List all registered engines
   * @returns {Array} List of engine names
   */
  listEngines() {
    return Array.from(this.engines.keys());
  }

  /**
   * Get engine metadata
   * @param {string} name - Engine name
   * @returns {Object} Engine metadata
   */
  getEngineInfo(name) {
    const engine = this.get(name);
    return engine ? engine.getMetadata() : null;
  }

  /**
   * Clear all engine caches
   */
  clearCaches() {
    for (const [name, engine] of this.engines) {
      if (typeof engine.clearCache === 'function') {
        engine.clearCache();
      }
    }
  }

  /**
   * Get engine statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      totalEngines: this.engines.size,
      defaultEngine: this.defaultEngine,
      engines: []
    };

    for (const [name, engine] of this.engines) {
      stats.engines.push({
        name,
        initialized: engine.initialized || false,
        metadata: engine.getMetadata ? engine.getMetadata() : {}
      });
    }

    return stats;
  }
}

export default EngineRegistry;
