/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/engines/BaseEngine
 */

/**
 * Base Engine - Abstract base class for all template engines
 * Provides common interface and default implementations
 */
class BaseEngine {
  constructor(options = {}) {
    this.name = 'base';
    this.version = '1.0.0';
    this.initialized = false;
    this.options = {
      cacheEnabled: options.cacheEnabled !== false,
      debug: options.debug || false,
      ...options
    };
  }

  /**
   * Initialize the engine
   * @abstract
   */
  async initialize() {
    this.initialized = true;
    return this;
  }

  /**
   * Render template with data
   * @param {string} template - Template content
   * @param {Object} data - Template data
   * @param {Object} options - Render options
   * @returns {Promise<string>} Rendered HTML
   * @abstract
   */
  async render(template, data = {}, options = {}) {
    throw new Error('render() method must be implemented by subclass');
  }

  /**
   * Compile template for reuse
   * @param {string} template - Template content
   * @param {Object} options - Compile options
   * @returns {Function} Compiled function
   * @abstract
   */
  compile(template, options = {}) {
    throw new Error('compile() method must be implemented by subclass');
  }

  /**
   * Clear engine cache
   */
  clearCache() {
    // Default implementation does nothing
  }

  /**
   * Get engine metadata
   * @returns {Object} Engine information
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      options: this.options
    };
  }

  /**
   * Validate template syntax
   * @param {string} template - Template content
   * @returns {boolean} True if valid
   */
  validate(template) {
    return typeof template === 'string' && template.length > 0;
  }

  /**
   * Escape HTML special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default BaseEngine;
