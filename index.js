/**
 * Aether Template Engine - Main Entry Point
 * Provides a unified interface to access the Template Engine Factory
 */

import TemplateEngineFactory from './src/core/TemplateEngineFactory.js';
import ConfigLoader from './src/utils/ConfigLoader.js';

// Export main factory class
export { TemplateEngineFactory };

// Export utility classes
export { ConfigLoader };

// Export engine classes
export { default as AetherEngine } from './src/engines/AetherEngine.js';
export { default as SSRModeEngine } from './src/engines/SSRModeEngine.js';
export { default as TemplateModeEngine } from './src/engines/TemplateModeEngine.js';
export { default as BaseEngine } from './src/engines/BaseEngine.js';

// Export core components
export { default as EngineRegistry } from './src/core/EngineRegistry.js';
export { default as ModeManager } from './src/core/ModeManager.js';
export { default as CacheManager } from './src/core/CacheManager.js';

// Export compression utilities
export { default as CompressionEngine } from './src/engines/CompressionEngine.js';

/**
 * Create a template engine factory with default configuration
 * @param {Object} options - Configuration options
 * @returns {Promise<TemplateEngineFactory>} Template engine factory instance
 */
export async function createEngine(options = {}) {
  // Create factory instance
  const factory = new TemplateEngineFactory(options);
  
  // Initialize the factory (this will register engines)
  await factory.initialize();
  
  return factory;
}

/**
 * Create a template engine factory from environment configuration
 * @returns {Promise<TemplateEngineFactory>} Template engine factory instance
 */
export async function createEngineFromEnv() {
  const configLoader = new ConfigLoader();
  const config = await configLoader.load();
  
  // Validate configuration
  const validation = configLoader.validate();
  if (!validation.valid) {
    console.warn('⚠️ Configuration validation warnings:', validation.warnings);
    if (validation.errors.length > 0) {
      throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
    }
  }
  
  const factory = new TemplateEngineFactory(config);
  await factory.initialize();
  
  return factory;
}

/**
 * Quick start function for common use cases
 * @param {Object} options - Quick start options
 * @returns {Promise<Object>} Engine instance and utilities
 */
export async function quickStart(options = {}) {
  const defaultOptions = {
    mode: 'template',
    templateDir: './templates',
    cacheEnabled: true,
    debug: process.env.NODE_ENV === 'development',
    // Add compression options
    compressionEnabled: process.env.NODE_ENV === 'production',
    minifyHTML: process.env.NODE_ENV === 'production',
    minifyCSS: process.env.NODE_ENV === 'production',
    minifyJS: process.env.NODE_ENV === 'production',
    mangleJS: process.env.NODE_ENV === 'production',
    removeComments: process.env.NODE_ENV === 'production',
    collapseWhitespace: true,
    cacheCompressed: true
  };
  
  const config = { ...defaultOptions, ...options };
  const factory = new TemplateEngineFactory(config);
  await factory.initialize();
  
  // Create default directory structure
  const fs = await import('fs-extra');
  const dirs = [
    config.templateDir,
    `${config.templateDir}/layouts`,
    `${config.templateDir}/pages`,
    `${config.templateDir}/components`,
    `${config.templateDir}/partials`
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
  
  // Create default layout
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
  
  const layoutPath = `${config.templateDir}/layouts/default.aether`;
  await fs.writeFile(layoutPath, defaultLayout, 'utf-8');
  
  // Create example page
  const examplePage = `@extends('layouts/default')

@section('title', 'Welcome to Aether Framework')

@section('description', 'A modern template engine for Node.js applications')

@section('keywords', 'template, engine, nodejs, javascript')

@section('content')
<div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-4xl font-bold mb-6">Welcome to Aether Framework</h1>
        <p class="text-xl text-gray-300 mb-8">Your template engine is ready to use!</p>
        
        <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 class="text-2xl font-semibold mb-4">Quick Start</h2>
            <p class="mb-4">This is an example page created with Aether Template Engine.</p>
            
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span>Mode:</span>
                    <code class="bg-gray-900 px-2 py-1 rounded">{{mode}}</code>
                </div>
                <div class="flex items-center justify-between">
                    <span>Cache:</span>
                    <span class="{{cacheEnabled ? 'text-green-500' : 'text-red-500'}}">{{cacheEnabled ? 'Enabled' : 'Disabled'}}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span>Template Dir:</span>
                    <code class="bg-gray-900 px-2 py-1 rounded">{{templateDir}}</code>
                </div>
                <div class="flex items-center justify-between">
                    <span>Compression:</span>
                    <span class="{{compressionEnabled ? 'text-green-500' : 'text-red-500'}}">{{compressionEnabled ? 'Enabled' : 'Disabled'}}</span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    console.log('Aether Template Engine loaded successfully!');
</script>
@endsection`;
  
  const pagePath = `${config.templateDir}/pages/welcome.aether`;
  await fs.writeFile(pagePath, examplePage, 'utf-8');
  
  // Create renderer
  const renderer = factory.createRenderer('aether');
  
  return {
    factory,
    renderer,
    config
  };
}

export default {
  createEngine,
  createEngineFromEnv,
  quickStart,
  TemplateEngineFactory
};
