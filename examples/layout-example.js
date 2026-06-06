/**
 * Layout Example - Demonstrates template inheritance using @extends and @section
 * This example shows how to use template layouts and inheritance with Aether template engine
 * Uses the same factory pattern as ssr-example.js and basic-usage.js for consistency
 */

import { createEngine } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to get current directory in ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function to run layout example
 * Demonstrates template inheritance using @extends and @section directives
 * @returns {Promise<void>}
 */
async function runLayoutExample() {
  console.log('🚀 Starting Layout Example...\n');

  try {
    // 1️⃣ Initialize Engine using Factory Pattern
    console.log('1️⃣ Initializing Engine with Factory Pattern...');
    
    // Create engine factory with template mode configuration
    const factory = await createEngine({
      mode: 'template',           // Use template mode for layout rendering
      cacheEnabled: true,         // Enable caching for better performance
      debug: true,                // Enable debug logging to see compilation details
      templateDir: path.join(__dirname, './dist/templates') // Set template directory
    });
    
    console.log('✅ Engine factory initialized successfully\n');

    // 2️⃣ Create Renderer from Factory
    console.log('2️⃣ Creating Template Renderer...');
    
    // Create a renderer instance using the factory
    // The 'aether' engine name refers to the default Aether template engine
    const renderer = factory.createRenderer('aether');
    console.log('✅ Template renderer created successfully\n');

    // 3️⃣ Setup Template Directory Structure
    console.log('3️⃣ Setting up template directories...');
    
    // Create necessary directories for templates
    const layoutsDir = path.join(__dirname, './dist/templates/layouts');
    const pagesDir = path.join(__dirname, './dist/templates/pages');
    const distDir = path.join(__dirname, './dist');
    
    // Create directories if they don't exist
    await fs.mkdir(layoutsDir, { recursive: true });
    await fs.mkdir(pagesDir, { recursive: true });
    await fs.mkdir(distDir, { recursive: true });
    
    console.log('📁 Directory structure created');
    console.log(`   - Layouts: ${layoutsDir}`);
    console.log(`   - Pages: ${pagesDir}`);
    console.log(`   - Output: ${distDir}\n`);

    // 4️⃣ Create Main Layout Template
    console.log('4️⃣ Creating Main Layout Template...');
    
    // Define the main layout template with @yield directives
    // @yield directives define sections that child templates can fill
    const layoutContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Aether Framework')</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    @yield('head')
</head>
<body class="bg-gray-900 text-white">
    <!-- Header Section -->
    <header class="bg-gray-800 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <span class="text-xl font-bold text-indigo-400">Aether<span class="text-white">Framework</span></span>
                </div>
                <nav class="flex items-center space-x-4">
                    <a href="/" class="text-gray-300 hover:text-white transition-colors duration-200">Home</a>
                    <a href="/about" class="text-gray-300 hover:text-white transition-colors duration-200">About</a>
                    <a href="/docs" class="text-gray-300 hover:text-white transition-colors duration-200">Documentation</a>
                </nav>
            </div>
        </div>
    </header>
    
    <!-- Main Content Section -->
    <main class="py-8">
        @yield('content')
    </main>
    
    <!-- Footer Section -->
    <footer class="bg-gray-800 border-t border-gray-700 mt-12">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center">
                <p class="text-sm text-gray-400">
                    &copy; {{ currentYear }} Aether Template Engine. All rights reserved.
                </p>
                <div class="flex space-x-4">
                    <a href="#" class="text-gray-400 hover:text-white">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white">
                        <i class="fab fa-discord"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>
    
    <!-- Scripts Section -->
    @yield('scripts')
</body>
</html>`;

    // Save layout template to file
    const layoutPath = path.join(layoutsDir, 'main.aether');
    await fs.writeFile(layoutPath, layoutContent, 'utf-8');
    console.log(`✅ Layout template saved to: ${layoutPath}\n`);

    // 5️⃣ Create Child Template with @extends and @section
    console.log('5️⃣ Creating Child Template with Layout Inheritance...');
    
    // Define child template that extends the main layout
    // IMPORTANT: Use Aether/Blade syntax (@foreach), NOT Handlebars syntax ({{#each}})
    const childTemplate = `@extends('layouts/main')

@section('title', 'Home Page - Aether Framework')

@section('head')
<style>
    body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
    }
    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }
    .feature-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.75rem;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    .feature-card:hover {
        transform: translateY(-5px);
        border-color: #4f46e5;
        box-shadow: 0 10px 25px rgba(79, 70, 229, 0.2);
    }
    .feature-icon {
        font-size: 2rem;
        color: #4f46e5;
        margin-bottom: 1rem;
    }
</style>
@endsection

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Hero Section -->
    <div class="text-center py-12">
        <h1 class="text-4xl font-bold text-white mb-4">
            Welcome to Aether Framework
        </h1>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            A modern template engine with layout inheritance, SSR support, and enhanced syntax.
            This content is injected into the main layout using @section directives.
        </p>
    </div>

    <!-- Features Grid -->
    <div class="feature-grid">
        @foreach(features as feature)
        <div class="feature-card">
            <div class="feature-icon">
                <i class="{{ feature.icon }}"></i>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">
                {{ feature.name }}
            </h3>
            <p class="text-gray-300">
                {{ feature.description }}
            </p>
            <div class="mt-4">
                <span class="inline-block bg-indigo-900 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full">
                    {{ feature.tag }}
                </span>
            </div>
        </div>
        @endforeach
    </div>

    <!-- Additional Content -->
    <div class="mt-12 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl p-8 border border-indigo-800/30">
        <h2 class="text-2xl font-bold text-white mb-4">
            Why Choose Aether?
        </h2>
        <ul class="space-y-3 text-gray-300">
            <li class="flex items-center">
                <i class="fas fa-check text-green-400 mr-3"></i>
                <span>Blade-style syntax with @extends, @section, and @yield directives</span>
            </li>
            <li class="flex items-center">
                <i class="fas fa-check text-green-400 mr-3"></i>
                <span>Server-side rendering (SSR) support with hydration</span>
            </li>
            <li class="flex items-center">
                <i class="fas fa-check text-green-400 mr-3"></i>
                <span>Template inheritance and component reuse</span>
            </li>
            <li class="flex items-center">
                <i class="fas fa-check text-green-400 mr-3"></i>
                <span>Built-in caching for optimal performance</span>
            </li>
        </ul>
    </div>
</div>
@endsection

@section('scripts')
<script>
    console.log('Home page loaded successfully');
    
    // Add interactive features
    document.addEventListener('DOMContentLoaded', function() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('ring-2');
                this.classList.toggle('ring-indigo-500');
            });
        });
        
        console.log('Interactive features initialized');
    });
</script>
@endsection`;

    // Save child template to file
    const childPath = path.join(pagesDir, 'home.aether');
    await fs.writeFile(childPath, childTemplate, 'utf-8');
    console.log(`✅ Child template saved to: ${childPath}\n`);

    // 6️⃣ Define Template Data
    console.log('6️⃣ Defining Template Data...');
    
    // Data to be passed to the template
    const data = {
      // Current year for dynamic copyright notice
      currentYear: new Date().getFullYear(),
      
      // Features array for dynamic rendering - FIXED: Use 'description' not 'desc'
      features: [
        { 
          name: 'Fast Rendering', 
          description: 'High performance template compilation and execution with built-in caching',
          icon: 'fas fa-bolt',
          tag: 'Performance'
        },
        { 
          name: 'Layout Inheritance', 
          description: 'Powerful @extends and @section directives for reusable layouts',
          icon: 'fas fa-layer-group',
          tag: 'Productivity'
        },
        { 
          name: 'SSR Support', 
          description: 'Server-side rendering with hydration for optimal SEO and performance',
          icon: 'fas fa-server',
          tag: 'Modern'
        },
        { 
          name: 'Easy Syntax', 
          description: 'Blade-style syntax that is intuitive and easy to learn',
          icon: 'fas fa-code',
          tag: 'Developer Experience'
        }
      ],
      
      // Helper functions available in template
      formatDate: (date) => {
        return new Date(date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
      
      // Route helper function
      route: (name) => {
        const routes = {
          'home': '/',
          'about': '/about',
          'docs': '/documentation',
          'contact': '/contact'
        };
        return routes[name] || '#';
      }
    };
    
    console.log(`✅ Data defined with ${data.features.length} features\n`);

    // 7️⃣ Render Template with Layout Inheritance
    console.log('7️⃣ Rendering Template with Layout Inheritance...');
    
    try {
      // Render the child template with data
      // The engine will automatically handle @extends and @section directives
      const result = await renderer.render(childTemplate, data);
      
      console.log('✅ Rendering completed successfully\n');

      // 8️⃣ Display Rendered Output
      console.log('--- Rendered Output (First 1500 characters) ---');
      console.log(result.substring(0, 1500) + (result.length > 1500 ? '...' : ''));
      console.log('-----------------------------------------------\n');

      // 9️⃣ Save Rendered Output to dist Folder
      console.log('8️⃣ Saving rendered output to dist folder...');
      
      const outputPath = path.join(distDir, 'layout-example-result.html');
      await fs.writeFile(outputPath, result, 'utf-8');
      
      console.log(`💾 HTML file saved to: ${outputPath}`);
      console.log(`📄 File size: ${result.length} characters\n`);

      // 🔟 Display Engine Statistics
      console.log('📊 Engine Factory Statistics:');
      const stats = factory.getStats();
      console.log(JSON.stringify(stats, null, 2));
      
      // Additional debug information
      console.log('\n🔧 Configuration Details:');
      console.log(`   - Mode: ${stats.mode}`);
      console.log(`   - Cache Enabled: ${stats.cacheEnabled}`);
      console.log(`   - Cache Size: ${stats.cacheSize}`);
      console.log(`   - Available Engines: ${stats.engines.join(', ')}`);
      console.log(`   - Template Directory: ${stats.templateDir || 'Not specified'}`);

      // Layout-specific information
      console.log('\n🎯 Layout Features Demonstrated:');
      console.log('   1. Template inheritance with @extends directive');
      console.log('   2. Section definition with @section directive');
      console.log('   3. Content injection with @yield directive');
      console.log('   4. Default content for @yield sections');
      console.log('   5. Multiple sections (title, head, content, scripts)');
      console.log('   6. Conditional rendering with @if/@else');
      console.log('   7. Looping with @foreach directive');
      console.log('   8. Variable interpolation with {{ }} syntax');

    } catch (error) {
      // Enhanced error handling for rendering errors
      console.error('❌ Error during template rendering:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      // Provide helpful debugging information
      console.error('\n🔧 Debugging Tips:');
      console.error('   1. Check that layout file exists at: ' + layoutPath);
      console.error('   2. Verify @extends path is correct (should match file path)');
      console.error('   3. Ensure all @section directives have matching @endsection');
      console.error('   4. Check for syntax errors in template files');
      console.error('   5. Make sure you are using Aether syntax (@foreach) not Handlebars ({{#each}})');
    }

  } catch (error) {
    // Handle initialization and setup errors
    console.error('❌ Error during engine initialization or setup:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check that all required modules are installed');
    console.error('   2. Verify the index.js file exports createEngine correctly');
    console.error('   3. Ensure file system permissions allow directory creation');
    console.error('   4. Check that template directory structure is correct');
  }
}

// Execute the main function with error handling
runLayoutExample().catch(error => {
  console.error('💥 Unhandled error in main execution:');
  console.error(error);
  process.exit(1);
});

// Export the run function for potential module usage
export { runLayoutExample };
