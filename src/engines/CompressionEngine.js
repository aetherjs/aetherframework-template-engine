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

    // [Fix 1]: Protect strings, calc(), and url() from whitespace collapsing
    const protectedBlocks = [];
    result = result.replace(/(["'])(?:(?!\1|\\).|\\.)*\1|url\([^)]*\)|calc\([^)]*\)/gi, (match) => {
      protectedBlocks.push(match);
      return `__CSS_PROTECTED_${protectedBlocks.length - 1}__`;
    });

    // Remove CSS comments (preserve important/license comments)
    if (opts.removeComments) {
      result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
        return (match.includes('!important') || match.includes('@license') || match.includes('@preserve') || match.includes('!')) ? match : '';
      });
    }

    // Minify CSS structure
    result = result
      .replace(/\s+/g, ' ')
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
      .replace(/\b0(?:\.0+)?(?:px|em|rem|pt|pc|in|cm|mm|ex|ch|vh|vw|vmin|vmax)\b/gi, '0')
      .replace(/\b0 0 0 0\b/g, '0')
      .replace(/\b0 0\b/g, '0');

    // [Fix 2]: Restore protected blocks back to the CSS
    result = result.replace(/__CSS_PROTECTED_(\d+)__/g, (match, index) => {
      return protectedBlocks[parseInt(index, 10)];
    });

    // [Fix 3]: Fix template engine escape residue (@@ -> @)
    // This fixes issues where template engines fail to unescape @@import or @@keyframes
    result = result.replace(/@@/g, '@');

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

    // Remove single-line comments (safely ignore URLs like http:// or https://)
    if (opts.removeComments) {
      result = result.replace(/(^|[^:"'])\/\/.*$/gm, '$1');
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

    // Safe JavaScript minification
    result = result
      // 1. Replace multiple whitespace/newlines with a single space
      .replace(/\s+/g, ' ')
      // 2. [Critical Fix]: Remove spaces around safe operators, BUT EXCLUDE < and > to prevent breaking HTML tags if mixed
      .replace(/\s*([=+\-*/%&|^?:;,{}()[\]])\s*/g, '$1')
      // 3. Restore spaces after JS keywords to prevent syntax errors (e.g., 'constapp' -> 'const app')
      .replace(/\b(var|let|const|return|typeof|instanceof|in|new|delete|void|throw|case|break|continue|yield|await|async|function|class|extends|import|export|from|default|if|else|for|while|do|switch|try|catch|finally|with)\b/g, '$1 ')
      // 4. Clean up specific patterns
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/else\s*{/g, 'else{')
      .replace(/}\s*else/g, '}else')
      .replace(/\s*=>\s*/g, '=>');

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
      reserved: options.reserved || ['render', 'data', 'helpers', 'exports', 'module', 'require', 'window', 'document', 'console', 'alert', 'fetch', 'Promise', 'JSON', 'Math', 'Date', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'EvalError', 'InternalError', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'navigator', 'location', 'history', 'getElementById', 'addEventListener', 'clipboard', 'writeText', 'querySelector', 'querySelectorAll', 'innerHTML', 'innerText', 'textContent', 'className', 'classList', 'style', 'setAttribute', 'getAttribute', 'removeAttribute', 'appendChild', 'removeChild', 'createElement', 'preventDefault', 'stopPropagation', 'target', 'currentTarget', 'value', 'checked', 'disabled', 'length', 'push', 'pop', 'shift', 'unshift', 'map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'indexOf', 'join', 'split', 'replace', 'match', 'test', 'trim', 'toLowerCase', 'toUpperCase', 'keys', 'values', 'entries', 'assign', 'parse', 'stringify', 'log', 'warn', 'error', 'info', 'debug'],
      ...options
    };

    let result = js;

    if (opts.mangle) {
      // [Critical Fix 1]: Protect string literals, template literals, regex, and comments
      // This prevents replacing variable names that appear inside strings (e.g., "copy-npm-btn")
      const protectedBlocks = [];
      result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1|\/(?![/*])(?:\\.|[^/\\\n])+\/[gimuy]*|\/\*[\s\S]*?\*\/|\/\/.*/g, (match) => {
        protectedBlocks.push(match);
        return `__PROTECTED_${protectedBlocks.length - 1}__`;
      });

      // [Critical Fix 2]: Extract ALL valid JS identifiers (variables, function names, parameters)
      // Instead of just looking for var/let/const, we find all words that look like variables
      const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      const variables = new Set();
      let match;
      
      while ((match = identifierRegex.exec(result)) !== null) {
        const varName = match[1];
        // Skip reserved words, JS keywords, and very short names (like i, e, x)
        if (!opts.reserved.includes(varName) && varName.length > 2 && !/^(var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|void|throw|try|catch|finally|class|extends|import|export|from|default|async|await|yield|true|false|null|undefined|this|super)$/.test(varName)) {
          variables.add(varName);
        }
      }

      // Generate obfuscated names
      const mapping = new Map();
      let counter = 0;
      variables.forEach(variable => {
        mapping.set(variable, `_${counter.toString(36)}`);
        counter++;
      });

      // [Critical Fix 3]: Use safe global regex replacement
      variables.forEach(variable => {
        const newName = mapping.get(variable);
        // Use word boundaries to ensure we only replace exact variable names
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        result = result.replace(regex, newName);
      });

      // [Critical Fix 4]: Restore protected blocks back to the code
      result = result.replace(/__PROTECTED_(\d+)__/g, (match, index) => {
        return protectedBlocks[parseInt(index, 10)];
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
      const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
      result = result.replace(styleRegex, (match, attrs, styleContent) => {
        const minifiedCSS = this.minifyCSS(styleContent, opts);
        return match.replace(styleContent, minifiedCSS);
      });
    }

    // Process embedded JavaScript
    if (opts.minifyJS || opts.mangleJS) {
      // [Critical Fix]: Use a simpler regex and check for 'src' inside the callback.
      // The previous negative lookahead (?![\s\S]*?\bsrc\s*=) would fail if ANY subsequent script had a src.
      const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
      result = result.replace(scriptRegex, (match, attrs, scriptContent) => {
        // Skip external scripts that have a src attribute
        if (/\bsrc\s*=/i.test(attrs)) {
          return match;
        }
        
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