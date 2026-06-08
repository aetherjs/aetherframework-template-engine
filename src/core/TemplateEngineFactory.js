/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/core/TemplateEngineFactory
 */

/**
 * Template Engine Factory - Core factory class for creating and managing template engines
 * Supports factory pattern with multiple rendering modes (SSR/Template)
 */
import EngineRegistry from './EngineRegistry.js';
import ModeManager from './ModeManager.js';
import CacheManager from './CacheManager.js';
import ConfigLoader from '../utils/ConfigLoader.js';
import ErrorHandler from '../utils/ErrorHandler.js';

class TemplateEngineFactory {
  constructor(options = {}) {
    // Load configuration from environment variables
    this.config = {
      // Mode selection: 'ssr' or 'template'
      mode: process.env.TEMPLATE_ENGINE_MODE || options.mode || 'template',
      
      // Default engine to use
      defaultEngine: process.env.TEMPLATE_ENGINE || options.defaultEngine || 'aether',
      
      // Cache configuration
      cacheEnabled: process.env.CACHE_ENABLED !== 'false' && (options.cacheEnabled !== false),
      cacheTTL: parseInt(process.env.CACHE_TTL) || options.cacheTTL || 300000, // 5 minutes
      
      // Template directory
      templateDir: process.env.TEMPLATE_DIR || options.templateDir || './templates',
      
      // Debug mode
      debug: process.env.NODE_ENV === 'development' || options.debug || false,
      
      // Merge with user options
      ...options
    };
    
    // Initialize core components
    this.registry = new EngineRegistry();
    this.modeManager = new ModeManager(this.config);
    this.cacheManager = new CacheManager(this.config);
    
    // Track initialization state
    this.initialized = false;
    
    console.log(`🚀 Template Engine Factory created in ${this.config.mode} mode`);
  }
  
  /**
   * Initialize the factory and register engines
   * This method should be called before using the factory
   * @returns {Promise<TemplateEngineFactory>} This factory instance for chaining
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }
    
    try {
      // Initialize built-in engines
      await this.initializeEngines();
      
      this.initialized = true;
      console.log(`✅ Template Engine Factory initialized in ${this.config.mode} mode`);
      
      return this;
    } catch (error) {
      console.error('❌ Factory initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Initialize built-in engines
   * @private
   */
  async initializeEngines() {
    try {
      // Import and register Aether Engine (your custom syntax)
      const { default: AetherEngine } = await import('./../engines/AetherEngine.js');
      this.registerEngine('aether', new AetherEngine(this.config));
      console.log('✅ Aether engine registered');
      
      // Import and register SSR Mode Engine
      const { default: SSRModeEngine } = await import('./../engines/SSRModeEngine.js');
      this.registerEngine('ssr-mode', new SSRModeEngine(this.config));
      console.log('✅ SSR Mode engine registered');
      
      // Import and register Template Mode Engine
      const { default: TemplateModeEngine } = await import('./../engines/TemplateModeEngine.js');
      this.registerEngine('template-mode', new TemplateModeEngine(this.config));
      console.log('✅ Template Mode engine registered');
      
    } catch (error) {
      console.error('❌ Engine initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Register a template engine
   * @param {string} name - Engine name
   * @param {BaseEngine} engine - Engine instance
   * @returns {TemplateEngineFactory} This factory instance for chaining
   */
  registerEngine(name, engine) {
    this.registry.register(name, engine);
    return this;
  }
  
  /**
   * Get engine by name
   * @param {string} name - Engine name
   * @returns {BaseEngine} Engine instance
   */
  getEngine(name) {
    return this.registry.get(name);
  }
  
/**
 * Create a renderer with specific engine
 * @param {string} engineName - Engine name
 * @param {Object} options - Engine options
 * @returns {Object} Renderer instance
 */
createRenderer(engineName = this.config.defaultEngine, options = {}) {
  if (!this.initialized) {
    throw new Error('Factory must be initialized before creating a renderer. Call factory.initialize() first.');
  }
  
  const engine = this.getEngine(engineName);
  if (!engine) {
    throw new Error(`Engine "${engineName}" not found. Available: ${this.registry.listEngines().join(', ')}`);
  }
  
  // Initialize engine if needed
  if (!engine.initialized) {
    engine.initialize(options);
  }
  
  // Store references to avoid context issues
  const cacheManager = this.cacheManager;
  const modeManager = this.modeManager;
  const config = this.config;
  const factory = this; // Store factory reference
  
  return {
    engine,
    engineName,
    cache: cacheManager,
    options: { ...config, ...options },
    
    /**
     * Render template with data
     * @param {string|Function} template - Template content or name
     * @param {Object} data - Template data
     * @param {Object} renderOptions - Render options
     * @returns {Promise<string>} Rendered HTML
     */
    async render(template, data = {}, renderOptions = {}) {
      const startTime = Date.now();
      const mode = config.mode;
      
      // Generate cache key
      const cacheKey = config.cacheEnabled 
        ? `${mode}:${engineName}:${typeof template === 'string' ? template : 'function'}:${JSON.stringify(data)}`
        : null;
      
      // Check cache
      if (cacheKey && cacheManager.has(cacheKey)) {
        const cached = cacheManager.get(cacheKey);
        if (Date.now() - cached.timestamp < config.cacheTTL) {
          return cached.html;
        }
      }
      
      let html;
      try {
        // Render based on mode
        if (mode === 'ssr') {
          // FIX: Use factory.getEngine instead of this.engine.getEngine
          const ssrEngine = factory.getEngine('ssr-mode'); // Fixed line 179
          if (!ssrEngine) {
            throw new Error('SSR engine not found. Make sure SSRModeEngine is registered.');
          }
          html = await ssrEngine.render(template, data, {
            ...renderOptions,
            engine: engineName
          });
        } else if (mode === 'template') {
          // Use template mode engine
          html = await engine.render(template, data, renderOptions);
        } else {
          throw new Error(`Unsupported mode: ${mode}`);
        }
        
        // Cache result
        if (cacheKey && config.cacheEnabled) {
          cacheManager.set(cacheKey, {
            html,
            timestamp: Date.now(),
            mode,
            engine: engineName,
            renderTime: Date.now() - startTime
          });
        }
        
        return html;
        
      } catch (error) {
        // Enhanced error handling
        const errorContext = {
          template: typeof template === 'string' ? template.substring(0, 100) + '...' : 'Function',
          engine: engineName,
          mode: mode,
          data: Object.keys(data)
        };
        
        const handledError = ErrorHandler.handle(error, errorContext);
        
        // Fallback to default mode if configured
        if (renderOptions.fallbackOnError !== false && mode !== 'template') {
          console.warn(`⚠️ Render failed in ${mode} mode, falling back to template mode`);
          // FIX: Use factory.getEngine instead of this.engine.getEngine
          const fallbackEngine = factory.getEngine('template-mode'); // Fixed line 219
          return fallbackEngine.render(template, data, renderOptions);
        }
        
        throw handledError;
      }
    },
    
    /**
     * Compile template for reuse
     * @param {string} template - Template content
     * @param {Object} compileOptions - Compile options
     * @returns {Function} Compiled function
     */
    compile(template, compileOptions = {}) {
      return engine.compile(template, compileOptions);
    },
    
    /**
     * Clear engine cache
     */
    clearCache() {
      engine.clearCache();
      cacheManager.clear();
    }
  };
}

  /**
   * Set rendering mode
   * @param {string} mode - 'ssr' or 'template'
   * @returns {TemplateEngineFactory} This factory instance for chaining
   */
  setMode(mode) {
    if (!['ssr', 'template'].includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Must be 'ssr' or 'template'`);
    }
    this.config.mode = mode;
    console.log(`🔄 Rendering mode changed to: ${mode}`);
    return this;
  }
  
  /**
   * Get current mode
   * @returns {string} Current mode
   */
  getMode() {
    return this.config.mode;
  }
  
  /**
   * Render with auto-detected engine and mode
   * @param {string} template - Template content or name
   * @param {Object} data - Template data
   * @param {Object} options - Render options
   * @returns {Promise<string>} Rendered HTML
   */
  async renderAuto(template, data = {}, options = {}) {
    const mode = this.getMode();
    const engineName = this.detectEngine(template, options);
    const renderer = this.createRenderer(engineName, options);
    return renderer.render(template, data, options);
  }
  
  /**
   * Auto-detect engine based on template content
   * @param {string} template - Template content or file path
   * @param {Object} options - Detection options
   * @returns {string} Engine name
   */
  detectEngine(template, options = {}) {
    // Check by file extension
    if (template.includes('.')) {
      const ext = template.split('.').pop().toLowerCase();
      const extensionMap = {
        'aether': 'aether',
        'html': 'aether',
        'htm': 'aether'
      };
      
      if (extensionMap[ext] && this.registry.has(extensionMap[ext])) {
        return extensionMap[ext];
      }
    }
    
    // Check by template syntax
    if (typeof template === 'string') {
      // Your custom syntax detection
      if (template.includes('@yield') || template.includes('@section') || template.includes('@extends')) {
        return 'aether';
      } else if (template.includes('{{#') || template.includes('{{/')) {
        return 'aether'; // Fallback to Aether for handlebars-like syntax
      }
    }
    
    return options.engine || this.config.defaultEngine;
  }
  
  /**
   * Get list of available engines
   * @returns {Array} List of engine names
   */
  listEngines() {
    return this.registry.listEngines();
  }
  
  /**
   * Get engine information
   * @param {string} name - Engine name
   * @returns {Object} Engine metadata
   */
  getEngineInfo(name) {
    const engine = this.getEngine(name);
    return engine ? engine.getMetadata() : null;
  }
  
  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.cacheManager.clear();
    this.registry.clearCaches();
    console.log('🗑️ All caches cleared');
  }
  
  /**
   * Get factory statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      mode: this.getMode(),
      engines: this.listEngines(),
      cacheSize: this.cacheManager.size(),
      cacheEnabled: this.config.cacheEnabled,
      cacheTTL: this.config.cacheTTL,
      templateDir: this.config.templateDir,
      debug: this.config.debug
    };
  }
}

export default TemplateEngineFactory;
