/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/core/CacheManager
 */
/**
 * Cache Manager - Manages template and compilation cache
 */
class CacheManager {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      ttl: options.ttl || 300000, // 5 minutes default
      maxSize: options.maxSize || 1000,
      ...options
    };
    
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} ttl - Time to live in milliseconds
   * @returns {CacheManager} This instance for chaining
   */
  set(key, value, ttl = this.options.ttl) {
    if (!this.options.enabled) return this;
    
    // Check cache size limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }
    
    const entry = {
      value,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
    
    return this;
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    if (!this.options.enabled) return undefined;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return undefined;
    }
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Check if cache has key
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    if (!this.options.enabled) return false;
    
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if entry was deleted
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   * @returns {CacheManager} This instance for chaining
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.deletes++;
    return this;
  }

  /**
   * Get cache size
   * @returns {number} Number of cache entries
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.options.enabled,
      ttl: this.options.ttl,
      maxSize: this.options.maxSize,
      currentSize: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Evict oldest cache entries
   * @private
   */
  evictOldest() {
    if (this.cache.size === 0) return;
    
    // Find oldest entry
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Clean expired cache entries
   * @returns {number} Number of entries cleaned
   */
  cleanExpired() {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    return cleaned;
  }

  /**
   * Enable cache
   * @returns {CacheManager} This instance for chaining
   */
  enable() {
    this.options.enabled = true;
    return this;
  }

  /**
   * Disable cache
   * @returns {CacheManager} This instance for chaining
   */
  disable() {
    this.options.enabled = false;
    this.clear();
    return this;
  }

  /**
   * Set cache TTL
   * @param {number} ttl - Time to live in milliseconds
   * @returns {CacheManager} This instance for chaining
   */
  setTTL(ttl) {
    this.options.ttl = ttl;
    return this;
  }

  /**
   * Set cache max size
   * @param {number} maxSize - Maximum cache size
   * @returns {CacheManager} This instance for chaining
   */
  setMaxSize(maxSize) {
    this.options.maxSize = maxSize;
    
    // Evict entries if current size exceeds new max
    while (this.cache.size > maxSize) {
      this.evictOldest();
    }
    
    return this;
  }
}

export default CacheManager;
