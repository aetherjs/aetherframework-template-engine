/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/engines/TemplateModeEngine
 */
/**
 * Template Mode Engine - Template rendering engine for Aether templates
 * Extends AetherEngine with template-specific functionality
 */
import AetherEngine from './AetherEngine.js';

class TemplateModeEngine extends AetherEngine {
 constructor(options = {}) {
    super(options);
    this.name = 'template-mode';
    this.version = '1.0.0';
    
    // Template mode specific options
    this.templateOptions = {
      layoutSupport: options.layoutSupport !== false,
      includeSupport: options.includeSupport !== false,
      cacheTemplates: options.cacheTemplates !== false,
      // Template mode compression options
      compressTemplates: options.compressTemplates !== false,
      minifyTemplates: options.minifyTemplates !== false,
      ...options
    };
    
    // Merge compression options
    this.options = { 
      ...this.options, 
      ...this.templateOptions 
    };
    
    // Initialize template directories
    this.ensureTemplateDir();
  }
  
  /**
   * Initialize the template engine
   * @returns {Promise<TemplateModeEngine>} Initialized engine instance
   */
  async initialize() {
    if (this.initialized) return this;
    
    await super.initialize();
    
    // Load default layout if exists
    await this.loadDefaultLayout();
    
    console.log(`✅ Template Mode Engine initialized (v${this.version})`);
    this.initialized = true;
    return this;
  }
  
  /**
   * Load default layout from file
   * @private
   */
  async loadDefaultLayout() {
    try {
      const defaultLayoutPath = `${this.options.templateDir}/layouts/default.aether`;
      const fs = await import('fs-extra');
      
      if (await fs.pathExists(defaultLayoutPath)) {
        const layoutContent = await fs.readFile(defaultLayoutPath, 'utf-8');
        this.registerLayout('default', layoutContent);
        console.log('📄 Default layout loaded from file');
      } else {
        // Create default layout based on user's template
        const defaultLayout = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Aether Framework')</title>
    <meta name="description" content="@yield('description', '下一代轻量级全栈解决方案')">
    <meta name="keywords" content="@yield('keywords', 'Aether,Framework,Web')">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    @yield('head')
</head>
<body class="antialiased bg-[#020617] text-white">
    @yield('content')
    @yield('scripts')
</body>
</html>`;
        
        this.registerLayout('default', defaultLayout);
        
        // Save to file for future use
        await fs.ensureDir(`${this.options.templateDir}/layouts`);
        await fs.writeFile(defaultLayoutPath, defaultLayout, 'utf-8');
        console.log('📄 Default layout created and saved');
      }
    } catch (error) {
      console.warn('⚠️ Could not load default layout:', error.message);
    }
  }
  
  /**
   * Render template with template mode enhancements and compression
   * @param {string} templateName - Template name or content
   * @param {Object} data - Template data
   * @param {Object} options - Render options
   * @returns {Promise<string>} Rendered HTML
   */
  async render(templateName, data = {}, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Add template mode specific data
    const enhancedData = {
      ...data,
      _mode: 'template',
      _timestamp: new Date().toISOString(),
      _engine: this.name
    };
    
    // Render using parent Aether engine
    const content = await super.render(templateName, enhancedData, options);
    
    // Add template mode specific enhancements
    const enhancedContent = this.enhanceForTemplateMode(content, enhancedData, options);
    
    // Apply template-specific compression if enabled
    const shouldCompress = this.options.compressionEnabled && 
                         (this.templateOptions.compressTemplates || 
                          (process.env.NODE_ENV === 'production' && this.templateOptions.minifyTemplates));
    
    if (shouldCompress) {
      return this.processWithCompression(enhancedContent, {
        ...options.compression,
        minifyHTML: this.options.minifyHTML,
        minifyCSS: this.options.minifyCSS,
        minifyJS: this.options.minifyJS,
        mangleJS: this.options.mangleJS
      });
    }
    
    return enhancedContent;
  }
  
  /**
   * Enhance rendered content for template mode
   * @param {string} content - Rendered HTML content
   * @param {Object} data - Template data
   * @param {Object} options - Template options
   * @returns {string} Enhanced HTML
   * @private
   */
  enhanceForTemplateMode(content, data, options) {
    // Add template mode specific meta tags
    const metaTags = `
    <!-- Template Mode: ${this.name} -->
    <!-- Rendered at: ${new Date().toISOString()} -->
    <!-- Cache: ${this.options.cacheEnabled ? 'Enabled' : 'Disabled'} -->`;
    
    // Insert meta tags before closing head tag
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${metaTags}\n</head>`);
    } else {
      // If no head tag, add at the beginning
      content = `${metaTags}\n${content}`;
    }
    
    // Add debug information if enabled
    if (this.options.debug) {
      const debugInfo = `
<!-- DEBUG INFO -->
<!-- Template: ${data._template || 'unknown'} -->
<!-- Data Keys: ${Object.keys(data).join(', ')} -->
<!-- Render Time: ${Date.now() - (data._startTime || Date.now())}ms -->`;
      
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${debugInfo}\n</body>`);
      } else {
        content = `${content}\n${debugInfo}`;
      }
    }
    
    return content;
  }
  
  /**
   * Compile template for template mode
   * @param {string} template - Template content
   * @param {Object} options - Compile options
   * @returns {Function} Compiled function
   */
  compile(template, options = {}) {
    return super.compile(template, options);
  }
  
  /**
   * Create a template file
   * @param {string} name - Template name
   * @param {string} type - Template type ('page', 'component', 'partial', 'layout')
   * @param {string} content - Template content
   * @returns {Promise<string>} File path
   */
  async createTemplate(name, type = 'page', content = null) {
    const fs = await import('fs-extra');
    const path = await import('path');
    
    const typeDirs = {
      page: 'pages',
      component: 'components',
      partial: 'partials',
      layout: 'layouts'
    };
    
    const dir = typeDirs[type] || 'pages';
    const fileName = `${name}.aether`;
    const filePath = path.join(this.options.templateDir, dir, fileName);
    
    // Default content if not provided
    if (!content) {
      switch (type) {
        case 'page':
          content = `@extends('layouts.default')

@section('title', '${name.charAt(0).toUpperCase() + name.slice(1)} Page')

@section('description', 'This is a ${name} page')

@section('keywords', '${name}, page, example')

@section('content')
<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Welcome to ${name} Page</h1>
    <p class="text-gray-300 mb-4">This is an example page created with Aether Template Engine.</p>
    
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Example Data</h2>
        <ul class="space-y-2">
            {{#each items as item}}
            <li class="flex items-center space-x-2">
                <i class="fas fa-check text-green-500"></i>
                <span>{{item}}</span>
            </li>
            {{/each}}
        </ul>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-blue-900/30 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-3">Template Features</h3>
            <ul class="space-y-2">
                <li>Layout inheritance with @extends</li>
                <li>Section management with @section/@yield</li>
                <li>Conditional rendering with @if/@else</li>
                <li>Loop rendering with @foreach</li>
                <li>Variable output with {{variable}}</li>
            </ul>
        </div>
        
        <div class="bg-purple-900/30 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-3">Current Data</h3>
            <pre class="bg-black/50 p-4 rounded text-sm overflow-x-auto">
{{json data}}
            </pre>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    console.log('${name} page loaded');
    // Add your JavaScript here
</script>
@endsection`;
          break;
          
        case 'component':
          content = `<div class="{{class}}">
    <h3 class="text-lg font-semibold mb-2">{{title}}</h3>
    <p class="text-gray-300">{{content}}</p>
    {{#if buttonText}}
    <button class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
        {{buttonText}}
    </button>
    {{/if}}
</div>`;
          break;
          
        case 'partial':
          content = `<div class="bg-gray-800 rounded-lg p-4 mb-4">
    <h4 class="font-semibold mb-2">{{title}}</h4>
    <p>{{content}}</p>
</div>`;
          break;
          
        case 'layout':
          content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Aether Framework')</title>
    <meta name="description" content="@yield('description', '下一代轻量级全栈解决方案')">
    <meta name="keywords" content="@yield('keywords', 'Aether,Framework,Web')">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    @yield('head')
</head>
<body class="antialiased bg-[#020617] text-white">
    @yield('content')
    @yield('scripts')
</body>
</html>`;
          break;
      }
    }
    
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Cache the template if caching is enabled
    if (this.options.cacheEnabled) {
      this.options.templateCache.set(name, content);
    }
    
    return filePath;
  }
  
  /**
   * Get engine metadata
   * @returns {Object} Engine information
   */
  getMetadata() {
    const baseMetadata = super.getMetadata();
    return {
      ...baseMetadata,
      mode: 'template',
      layoutSupport: this.templateOptions.layoutSupport,
      includeSupport: this.templateOptions.includeSupport,
      cacheTemplates: this.templateOptions.cacheTemplates
    };
  }
}

export default TemplateModeEngine;
