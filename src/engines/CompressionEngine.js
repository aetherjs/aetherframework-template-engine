/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/engines/CompressionEngine
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
/**
 * Compression Engine - Handles HTML, CSS, and JavaScript minification and obfuscation
 * Supports caching of compressed results for performance optimization
 */
class CompressionEngine {
  constructor(options = {}) {
    this.options = {
      minifyHTML: options.minifyHTML !== false,
      minifyCSS: options.minifyCSS !== false,
      minifyJS: options.minifyJS !== false,
      mangleJS: options.mangleJS || false,
      removeComments: options.removeComments || false,
      collapseWhitespace: options.collapseWhitespace || true,
      removeAttributeQuotes: options.removeAttributeQuotes || false,
      removeEmptyAttributes: options.removeEmptyAttributes || false,
      cacheCompressed: options.cacheCompressed !== false,
      ...options
    };
    
    // Cache for compressed results
    this.compressionCache = new Map();
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    this.cacheTimestamps = new Map();
  }

  /**
   * Generate cache key for compressed content
   * @param {string} content - Original content
   * @param {Object} options - Compression options
   * @returns {string} Cache key
   */
  generateCacheKey(content, options = {}) {
    const configString = JSON.stringify({
      ...this.options,
      ...options
    });
    return crypto.createHash('md5')
      .update(content + configString)
      .digest('hex');
  }

  /**
   * Check if cached compressed content is still valid
   * @param {string} cacheKey - Cache key
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(cacheKey) {
    if (!this.options.cacheCompressed) return false;
    
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.cacheTTL;
  }

  /**
   * Get cached compressed content
   * @param {string} cacheKey - Cache key
   * @returns {string|null} Cached content or null
   */
  getCached(cacheKey) {
    if (this.options.cacheCompressed && 
        this.compressionCache.has(cacheKey) && 
        this.isCacheValid(cacheKey)) {
      return this.compressionCache.get(cacheKey);
    }
    return null;
  }

  /**
   * Set cached compressed content
   * @param {string} cacheKey - Cache key
   * @param {string} content - Compressed content
   */
  setCached(cacheKey, content) {
    if (this.options.cacheCompressed) {
      this.compressionCache.set(cacheKey, content);
      this.cacheTimestamps.set(cacheKey, Date.now());
    }
  }

  /**
   * Clear compression cache
   */
  clearCompressionCache() {
    this.compressionCache.clear();
    this.cacheTimestamps.clear();
  }

   /**
   * Minify HTML content with caching support
   * @param {string} html - HTML content
   * @param {Object} options - Minification options
   * @returns {string} Minified HTML
   */
  minifyHTML(html, options = {}) {
    const cacheKey = this.generateCacheKey(html, { type: 'html', ...options });
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const opts = { ...this.options, ...options };
    let result = html;

    // [Critical Fix 1]: Protect pre, textarea, script, and style tags from whitespace collapsing
    // This preserves line breaks and indentation inside code blocks
    const protectedBlocks = [];
    result = result.replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
      protectedBlocks.push(match);
      return `<!--PROTECTED_BLOCK_${protectedBlocks.length - 1}-->`;
    });

    // Remove HTML comments (preserve conditional comments and protected blocks)
    if (opts.removeComments) {
      // [Critical Fix 2]: Fixed conditional comment regex (changed invalid $if to \[if)
      result = result.replace(/<!--(?!\[if\s|PROTECTED_BLOCK_).*?-->/gs, '');
    }

    // Collapse whitespace (only applies to unprotected HTML structure)
    if (opts.collapseWhitespace) {
      result = result
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\s+>/g, '>')
        .replace(/<\s+/g, '<')
        .replace(/\s+$/gm, '')
        .replace(/^\s+/gm, '');
    }

    // Remove optional quotes from attributes
    if (opts.removeAttributeQuotes) {
      result = result.replace(/(\w+)=["']([^"']*)["']/g, (match, attr, value) => {
        // Only remove quotes if value doesn't contain spaces or special characters
        if (!/[ "'=<>`]/.test(value)) {
          return `${attr}=${value}`;
        }
        return match;
      });
    }

    // Remove empty attributes
    if (opts.removeEmptyAttributes) {
      result = result.replace(/\s+(\w+)=["']\s*["']/g, '');
    }

    // Remove redundant attributes
    result = result
      .replace(/\s+type=["']text\/javascript["']/gi, '')
      .replace(/\s+type=["']text\/css["']/gi, '')
      .replace(/\s+language=["']javascript["']/gi, '');

    // [Critical Fix 3]: Restore protected blocks back to the HTML
    result = result.replace(/<!--PROTECTED_BLOCK_(\d+)-->/g, (match, index) => {
      return protectedBlocks[parseInt(index, 10)];
    });

    const finalResult = result.trim();
    this.setCached(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Minify CSS content with caching support
   * @param {string} css - CSS content
   * @param {Object} options - Minification options
   * @returns {string} Minified CSS
   */
  minifyCSS(css, options = {}) {
    const cacheKey = this.generateCacheKey(css, { type: 'css', ...options });
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const opts = { ...this.options, ...options };
    let result = css;

    // Remove CSS comments (preserve important comments)
    if (opts.removeComments) {
      result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
        // Preserve comments containing !important markers
        return match.includes('!important') ? match : '';
      });
    }

    // Minify CSS
    result = result
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/;\s+/g, ';')
      .replace(/:\s+/g, ':')
      .replace(/,\s+/g, ',')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/;\s*}/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*!\s*important/g, '!important')
      .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3')
      .replace(/\b0(\.\d+)?(?:px|em|rem|%|pt|pc|in|cm|mm|ex|ch|vh|vw|vmin|vmax)\b/g, '0')
      .replace(/\b0 0 0 0\b/g, '0')
      .replace(/\b0 0\b/g, '0');

    const finalResult = result.trim();
    this.setCached(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Minify JavaScript content with caching support
   * @param {string} js - JavaScript code
   * @param {Object} options - Minification options
   * @returns {string} Minified JavaScript
   */
  minifyJS(js, options = {}) {
    const cacheKey = this.generateCacheKey(js, { type: 'js', ...options });
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const opts = { ...this.options, ...options };
    let result = js;

    // Remove single-line comments
    if (opts.removeComments) {
      result = result.replace(/\/\/.*$/gm, '');
    }

    // Remove multi-line comments (preserve license and preserve comments)
    if (opts.removeComments) {
      result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
        if (match.includes('@license') || match.includes('@preserve') || match.includes('!')) {
          return match;
        }
        return '';
      });
    }

    // Basic JavaScript minification
    result = result
      .replace(/\s+/g, ' ')
      .replace(/\s*([=+\-*/%&|^<>?:;,{}()[\]])\s*/g, '$1')
      .replace(/\s*;\s*/g, ';')
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*:\s*/g, ':')
      .replace(/else\s*{/g, 'else{')
      .replace(/}\s*else/g, '}else')
      .replace(/for\s*\(/g, 'for(')
      .replace(/if\s*\(/g, 'if(')
      .replace(/while\s*\(/g, 'while(')
      .replace(/function\s*\(/g, 'function(')
      .replace(/return\s+/g, 'return ');

    const finalResult = result.trim();
    this.setCached(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Obfuscate JavaScript code with caching support
   * @param {string} js - JavaScript code
   * @param {Object} options - Obfuscation options
   * @returns {string} Obfuscated JavaScript
   */
  obfuscateJS(js, options = {}) {
    const cacheKey = this.generateCacheKey(js, { type: 'obfuscate', ...options });
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const opts = {
      mangle: options.mangle !== false,
      mangleProperties: options.mangleProperties || false,
      reserved: options.reserved || ['render', 'data', 'helpers', 'exports', 'module', 'require', 'window', 'document', 'console', 'alert', 'fetch', 'Promise', 'JSON', 'Math', 'Date', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'EvalError', 'InternalError', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'navigator', 'location', 'history'],
      ...options
    };

    let result = js;

    if (opts.mangle) {
      // Simple variable name obfuscation (for demonstration)
      // In production, consider using a library like javascript-obfuscator
      const variables = new Set();
      const variableRegex = /\b(var|let|const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      
      // Collect variable names
      let match;
      const matches = [];
      while ((match = variableRegex.exec(result)) !== null) {
        const varName = match;
        if (!opts.reserved.includes(varName) && varName.length > 2) {
          variables.add(varName);
          matches.push({ name: varName, index: match.index + match.length + 1 });
        }
      }

      // Generate obfuscated names
      const mapping = new Map();
      let counter = 0;
      variables.forEach(variable => {
        mapping.set(variable, `_${counter.toString(36)}`);
        counter++;
      });

      // Apply obfuscation in reverse order to avoid conflicts
      const sortedMatches = matches.sort((a, b) => b.index - a.index);
      sortedMatches.forEach(({ name, index }) => {
        if (mapping.has(name)) {
          const newName = mapping.get(name);
          result = result.slice(0, index) + newName + result.slice(index + name.length);
        }
      });
    }

    const finalResult = result;
    this.setCached(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Process HTML content with embedded CSS and JavaScript
   * @param {string} html - HTML content
   * @param {Object} options - Processing options
   * @returns {string} Processed HTML
   */
  processHTML(html, options = {}) {
    const cacheKey = this.generateCacheKey(html, { type: 'full', ...options });
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const opts = { ...this.options, ...options };
    let result = html;

    // Process embedded CSS
    if (opts.minifyCSS) {
      const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
      result = result.replace(styleRegex, (match, styleContent) => {
        const minifiedCSS = this.minifyCSS(styleContent, opts);
        return match.replace(styleContent, minifiedCSS);
      });
    }

    // Process embedded JavaScript
    if (opts.minifyJS || opts.mangleJS) {
      const scriptRegex = /<script\b(?![\s\S]*?\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
      result = result.replace(scriptRegex, (match, scriptContent) => {
        let processedJS = scriptContent;
        if (opts.minifyJS) {
          processedJS = this.minifyJS(processedJS, opts);
        }
        if (opts.mangleJS) {
          processedJS = this.obfuscateJS(processedJS, opts);
        }
        return match.replace(scriptContent, processedJS);
      });
    }

    // Process inline styles
    if (opts.minifyCSS) {
      const styleAttrRegex = /style=["']([^"']*)["']/gi;
      result = result.replace(styleAttrRegex, (match, styleContent) => {
        const minifiedCSS = this.minifyCSS(styleContent, opts);
        return `style="${minifiedCSS}"`;
      });
    }

    // Process inline event handlers
    if (opts.minifyJS) {
      const eventRegex = /(on\w+)=["']([^"']*)["']/gi;
      result = result.replace(eventRegex, (match, eventName, handler) => {
        const minifiedJS = this.minifyJS(handler, opts);
        return `${eventName}="${minifiedJS}"`;
      });
    }

    // Finally minify the HTML structure
    if (opts.minifyHTML) {
      result = this.minifyHTML(result, opts);
    }

    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Get compression statistics
   * @returns {Object} Compression statistics
   */
  getStats() {
    return {
      cacheSize: this.compressionCache.size,
      cacheHits: 0, // You can implement hit tracking if needed
      cacheTTL: this.cacheTTL,
      options: this.options
    };
  }
}
export default CompressionEngine;