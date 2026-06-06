/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/utils/ConfigLoader
 */

/**
 * Configuration Loader - Loads and manages configuration from environment variables and configuration files
 * Supports loading from .env files, environment variables, and setting defaults
 */
import fs from 'fs-extra';
import path from 'path';

class ConfigLoader {
  /**
   * Constructor for ConfigLoader
   * @param {Object} options - Configuration options
   * @param {string} options.configFile - Configuration file name (default: '.env')
   * @param {string} options.configDir - Configuration directory path (default: current working directory)
   */
  constructor(options = {}) {
    // Initialize configuration options with defaults
    this.options = {
      configFile: options.configFile || '.env',
      configDir: options.configDir || process.cwd(),
      ...options
    };
    
    // Configuration storage object
    this.config = {};
    
    // Flag to track if configuration has been loaded
    this.loaded = false;
  }
  
  /**
   * Load configuration from environment variables and configuration files
   * @returns {Promise<Object>} Configuration object containing all loaded settings
   */
  async load() {
    // Return cached configuration if already loaded
    if (this.loaded) {
      return this.config;
    }
    
    // Step 1: Load configuration from environment variables
    this.loadFromEnv();
    
    // Step 2: Load configuration from configuration file
    await this.loadFromFile();
    
    // Step 3: Set default values for any missing configuration options
    this.setDefaults();
    
    // Mark configuration as loaded
    this.loaded = true;
    
    return this.config;
  }
  
  /**
   * Load configuration from environment variables
   * Environment variables take precedence over file configuration
   * @private
   */
  loadFromEnv() {
    // Template Engine Configuration
    this.config.mode = process.env.TEMPLATE_ENGINE_MODE || 'template';
    this.config.defaultEngine = process.env.TEMPLATE_ENGINE || 'aether';
    this.config.templateDir = process.env.TEMPLATE_DIR || './templates';
    
    // Cache Configuration
    this.config.cacheEnabled = process.env.CACHE_ENABLED !== 'false';
    this.config.cacheTTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes default
    this.config.cacheMaxSize = parseInt(process.env.CACHE_MAX_SIZE) || 1000;
    
    // Debug Configuration
    this.config.debug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    
    // Server-Side Rendering (SSR) Configuration
    this.config.ssrHydrate = process.env.SSR_HYDRATE !== 'false';
    this.config.ssrStream = process.env.SSR_STREAM === 'true';
    
    // Template Configuration
    this.config.layoutSupport = process.env.LAYOUT_SUPPORT !== 'false';
    this.config.includeSupport = process.env.INCLUDE_SUPPORT !== 'false';
    this.config.cacheTemplates = process.env.CACHE_TEMPLATES !== 'false';
  }
  
  /**
   * Load configuration from configuration file
   * File configuration is used as fallback when environment variables are not set
   * @private
   */
  async loadFromFile() {
    // Construct full path to configuration file
    const configPath = path.join(this.options.configDir, this.options.configFile);
    
    try {
      // Check if configuration file exists
      if (await fs.pathExists(configPath)) {
        // Read configuration file content
        const content = await fs.readFile(configPath, 'utf-8');
        const lines = content.split('\n');
        
        // Parse each line in the configuration file
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Skip comments (lines starting with #) and empty lines
          if (!trimmed || trimmed.startsWith('#')) {
            continue;
          }
          
          // Parse key=value pairs
          const equalsIndex = trimmed.indexOf('=');
          if (equalsIndex > 0) {
            const key = trimmed.substring(0, equalsIndex).trim();
            const value = trimmed.substring(equalsIndex + 1).trim();
            
            // Remove surrounding quotes if present
            const cleanValue = value.replace(/['"]|['"]$/g, '');
            
            // Only set configuration from file if environment variable is not already set
            if (process.env[key] === undefined) {
              this.config[key] = this.parseValue(cleanValue);
            }
          }
        }
        
        console.log(`📁 Configuration loaded from: ${configPath}`);
      }
    } catch (error) {
      // Log warning but don't fail if configuration file cannot be loaded
      console.warn(`⚠️ Could not load config file: ${error.message}`);
    }
  }
  
  /**
   * Parse configuration value from string to appropriate type
   * @param {string} value - Raw string value from configuration
   * @returns {any} Parsed value (boolean, number, or string)
   * @private
   */
  parseValue(value) {
    // Parse boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Parse numeric values
    if (!isNaN(value) && value.trim() !== '') {
      const num = Number(value);
      if (!isNaN(num)) return num;
    }
    
    // Return as string if not boolean or number
    return value;
  }
  
  /**
   * Set default configuration values for any missing options
   * This ensures all required configuration options have values
   * @private
   */
  setDefaults() {
    // Default configuration values
    const defaults = {
      mode: 'template',
      defaultEngine: 'aether',
      templateDir: './templates',
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes in milliseconds
      cacheMaxSize: 1000,
      debug: false,
      ssrHydrate: true,
      ssrStream: false,
      layoutSupport: true,
      includeSupport: true,
      cacheTemplates: true
    };
    
    // Apply defaults only for configuration options that are not already set
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (this.config[key] === undefined) {
        this.config[key] = defaultValue;
      }
    }
  }
  
  /**
   * Get a specific configuration value
   * @param {string} key - Configuration key to retrieve
   * @param {any} defaultValue - Default value to return if key is not found
   * @returns {any} Configuration value or default value
   */
  get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }
  
  /**
   * Set a configuration value
   * @param {string} key - Configuration key to set
   * @param {any} value - Value to set for the configuration key
   * @returns {ConfigLoader} This instance for method chaining
   */
  set(key, value) {
    this.config[key] = value;
    return this;
  }
  
  /**
   * Get all configuration as an object
   * @returns {Object} Complete configuration object
   */
  getAll() {
    // Return a copy to prevent external modification
    return { ...this.config };
  }
  
  /**
   * Reload configuration from sources
   * Useful when configuration files have been updated
   * @returns {Promise<Object>} Updated configuration object
   */
  async reload() {
    // Reset loaded flag and clear existing configuration
    this.loaded = false;
    this.config = {};
    
    // Load configuration again
    return this.load();
  }
  
  /**
   * Validate the current configuration
   * Checks for required settings and valid values
   * @returns {Object} Validation result with errors and warnings
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Validate rendering mode
    if (!['ssr', 'template', 'disabled'].includes(this.config.mode)) {
      errors.push(`Invalid mode: ${this.config.mode}. Must be 'ssr', 'template', or 'disabled'`);
    }
    
    // Validate template directory configuration
    if (!this.config.templateDir) {
      errors.push('Template directory not specified');
    }
    
    // Validate cache TTL (must be positive)
    if (this.config.cacheTTL < 0) {
      errors.push(`Invalid cache TTL: ${this.config.cacheTTL}. Must be positive number`);
    }
    
    // Validate cache maximum size (must be at least 1)
    if (this.config.cacheMaxSize < 1) {
      errors.push(`Invalid cache max size: ${this.config.cacheMaxSize}. Must be at least 1`);
    }
    
    // Check if template directory exists (warning only, not an error)
    if (this.config.templateDir && !fs.existsSync(this.config.templateDir)) {
      warnings.push(`Template directory does not exist: ${this.config.templateDir}`);
    }
    
    // Return validation results
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: this.config
    };
  }
}

export default ConfigLoader;
