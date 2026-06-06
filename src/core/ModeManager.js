/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/core/ModeManager
 */
/**
 * Mode Manager - Manages rendering modes (SSR/Template)
 */
class ModeManager {
  constructor(options = {}) {
    this.options = {
      defaultMode: options.defaultMode || 'template',
      supportedModes: ['ssr', 'template', 'disabled'],
      ...options
    };
    
    this.currentMode = this.options.defaultMode;
    this.modes = new Map();
    
    // Initialize modes
    this.initializeModes();
  }

  /**
   * Initialize supported modes
   * @private
   */
  initializeModes() {
    // SSR Mode
    this.modes.set('ssr', {
      name: 'ssr',
      description: 'Server-Side Rendering mode',
      features: ['hydration', 'seo-friendly', 'fast-initial-load'],
      renderer: null // Will be set when SSR engine is loaded
    });
    
    // Template Mode
    this.modes.set('template', {
      name: 'template',
      description: 'Template rendering mode',
      features: ['fast-render', 'caching', 'layout-support'],
      renderer: null // Will be set when Template engine is loaded
    });
    
    // Disabled Mode (fallback)
    this.modes.set('disabled', {
      name: 'disabled',
      description: 'Disabled mode - returns raw template',
      features: ['no-processing', 'fallback'],
      renderer: this.getDisabledRenderer()
    });
  }

  /**
   * Set current rendering mode
   * @param {string} mode - Mode name ('ssr', 'template', or 'disabled')
   * @returns {ModeManager} This instance for chaining
   */
  setMode(mode) {
    if (!this.modes.has(mode)) {
      throw new Error(`Unsupported mode: ${mode}. Supported modes: ${Array.from(this.modes.keys()).join(', ')}`);
    }
    
    this.currentMode = mode;
    console.log(`🔄 Mode changed to: ${mode}`);
    return this;
  }

  /**
   * Get current mode
   * @returns {string} Current mode name
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get available modes
   * @returns {Array} List of available modes
   */
  getAvailableModes() {
    return Array.from(this.modes.keys());
  }

  /**
   * Get mode information
   * @param {string} mode - Mode name
   * @returns {Object} Mode information
   */
  getModeInfo(mode) {
    return this.modes.get(mode) || null;
  }

  /**
   * Get renderer for current mode
   * @returns {Function} Renderer function
   */
  getRenderer() {
    const modeInfo = this.modes.get(this.currentMode);
    if (!modeInfo || !modeInfo.renderer) {
      throw new Error(`No renderer available for mode: ${this.currentMode}`);
    }
    return modeInfo.renderer;
  }

  /**
   * Get SSR renderer
   * @returns {Function} SSR renderer function
   */
  getSSRRenderer() {
    const ssrMode = this.modes.get('ssr');
    if (!ssrMode || !ssrMode.renderer) {
      throw new Error('SSR renderer not available. Make sure SSR engine is registered.');
    }
    return ssrMode.renderer;
  }

  /**
   * Get template renderer
   * @returns {Function} Template renderer function
   */
  getTemplateRenderer() {
    const templateMode = this.modes.get('template');
    if (!templateMode || !templateMode.renderer) {
      throw new Error('Template renderer not available. Make sure Template engine is registered.');
    }
    return templateMode.renderer;
  }

  /**
   * Get disabled mode renderer (fallback)
   * @returns {Function} Disabled mode renderer
   */
  getDisabledRenderer() {
    return (template, data) => {
      // Simple renderer that returns template as-is
      if (typeof template === 'string') {
        return Promise.resolve(template);
      }
      return Promise.resolve(String(template));
    };
  }

  /**
   * Register a renderer for a specific mode
   * @param {string} mode - Mode name
   * @param {Function} renderer - Renderer function
   * @returns {ModeManager} This instance for chaining
   */
  registerRenderer(mode, renderer) {
    if (!this.modes.has(mode)) {
      throw new Error(`Cannot register renderer for unknown mode: ${mode}`);
    }
    
    this.modes.get(mode).renderer = renderer;
    console.log(`✅ Renderer registered for mode: ${mode}`);
    return this;
  }

  /**
   * Register an adapter for mode switching
   * @param {Object} adapter - Mode adapter
   * @returns {ModeManager} This instance for chaining
   */
  registerAdapter(adapter) {
    if (!adapter || typeof adapter !== 'object') {
      throw new Error('Adapter must be an object');
    }
    
    if (!adapter.name) {
      throw new Error('Adapter must have a name property');
    }
    
    if (!adapter.supportedModes || !Array.isArray(adapter.supportedModes)) {
      throw new Error('Adapter must have supportedModes array');
    }
    
    // Register adapter for each supported mode
    adapter.supportedModes.forEach(mode => {
      if (this.modes.has(mode)) {
        const modeInfo = this.modes.get(mode);
        modeInfo.adapter = adapter;
        console.log(`✅ Adapter "${adapter.name}" registered for mode: ${mode}`);
      }
    });
    
    return this;
  }

  /**
   * List registered adapters
   * @returns {Array} List of adapter names
   */
  listAdapters() {
    const adapters = new Set();
    for (const [mode, modeInfo] of this.modes) {
      if (modeInfo.adapter) {
        adapters.add(modeInfo.adapter.name);
      }
    }
    return Array.from(adapters);
  }

  /**
   * Get mode statistics
   * @returns {Object} Mode statistics
   */
  getStats() {
    const stats = {
      currentMode: this.currentMode,
      availableModes: this.getAvailableModes(),
      adapters: this.listAdapters(),
      modes: {}
    };

    for (const [name, modeInfo] of this.modes) {
      stats.modes[name] = {
        name: modeInfo.name,
        description: modeInfo.description,
        hasRenderer: !!modeInfo.renderer,
        hasAdapter: !!modeInfo.adapter,
        features: modeInfo.features || []
      };
    }

    return stats;
  }
}

export default ModeManager;
