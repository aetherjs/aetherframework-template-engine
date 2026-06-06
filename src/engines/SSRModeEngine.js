
/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/engines/SSrModeEngine
 */

import AetherEngine from './AetherEngine.js'; // Adjust this path if AetherEngine is in a different folder

/**
 * SSR Mode Engine - Server-Side Rendering engine for Aether templates
 * Converts Aether templates to full HTML documents with SSR optimizations
 */
class SSRModeEngine extends AetherEngine {
  constructor(options = {}) {
    super(options);
    this.name = 'ssr-mode';
    this.version = '1.0.0';
    
    // SSR-specific options
    this.ssrOptions = {
      hydrate: options.hydrate !== false,
      stream: options.stream || false,
      ...options
    };
  }
  
  /**
   * Render template with SSR optimizations
   * @param {string} templateName - Template name or content
   * @param {Object} data - Template data
   * @param {Object} options - Render options
   * @returns {Promise<string>} Rendered HTML with SSR enhancements
   */
  async render(templateName, data = {}, options = {}) {
    // First, render the inner content using the parent Aether engine
    const content = await super.render(templateName, data, options);
    
    // Wrap and enhance for SSR
    return this.enhanceForSSR(content, data, options);
  }
  
  /**
   * Enhance rendered content for SSR by wrapping it in a full HTML document
   * @param {string} content - Rendered HTML content
   * @param {Object} data - Template data
   * @param {Object} options - SSR options
   * @returns {string} Enhanced HTML
   * @private
   */
  enhanceForSSR(content, data, options) {
    // Extract meta information from data with safe fallbacks
    const title = data.title || 'Aether Framework';
    const description = data.description || 'Next-generation lightweight full-stack solution';
    const keywords = data.keywords || 'Aether,Framework,Web';
    
    // Safely serialize data for hydration (prevent XSS in script tags)
    const safeDataJson = JSON.stringify(data).replace(/</g, '\\u003c');
    
    // Build full HTML document with SSR optimizations
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <meta name="description" content="${this.escapeHtml(description)}">
    <meta name="keywords" content="${this.escapeHtml(keywords)}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    
    ${data.head || ''}
    
    <!-- SSR Hydration Data -->
    <script type="application/json" id="ssr-data">
      ${safeDataJson}
    </script>
    
    <!-- SSR Styles -->
    <style>
      body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .ssr-hydrated { opacity: 1; transition: opacity 0.3s ease; }
    </style>
</head>
<body class="antialiased bg-[#020617] text-white">
    <div id="app" class="ssr-hydrated">
        ${content}
    </div>
    
    ${data.scripts || ''}
    
    <!-- SSR Hydration Script -->
    <script>
      (function() {
        // Hydrate SSR data
        const ssrData = document.getElementById('ssr-data');
        if (ssrData) {
          try {
            window.__SSR_DATA__ = JSON.parse(ssrData.textContent);
          } catch (e) {
            console.error('Failed to parse SSR data', e);
          }
        }
        
        // Mark as hydrated
        document.addEventListener('DOMContentLoaded', function() {
          const app = document.getElementById('app');
          if (app) {
            app.classList.add('ssr-hydrated');
          }
        });
      })();
    </script>
</body>
</html>`;
  }

  /**
   * Get engine metadata
   * @returns {Object} Engine information
   */
  getMetadata() {
    const baseMetadata = super.getMetadata();
    return {
      ...baseMetadata,
      mode: 'ssr',
      hydrate: this.ssrOptions.hydrate,
      stream: this.ssrOptions.stream
    };
  }
}

// Use 'export default' to match the import in your index.js
export default SSRModeEngine;
