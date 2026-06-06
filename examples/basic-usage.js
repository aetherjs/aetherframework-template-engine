/**
 * Basic Usage Example - Demonstrates template rendering with enhanced syntax support
 * This example shows how to use the TemplateEngineFactory to create and use renderers
 */

// Import the factory function from the main index file
import { createEngine } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to get current directory in ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function to run the basic usage example
 * Demonstrates template rendering with Aether template engine using factory pattern
 */
async function run() {
  console.log('🚀 Starting Basic Usage Example with Enhanced Syntax...\n');

  try {
    // 1️⃣ Initialize Engine using Factory Pattern
    console.log('1️⃣ Initializing Engine with Factory Pattern...');
    
    // Create engine factory with template mode configuration
    const factory = await createEngine({
      mode: 'template',           // Set rendering mode: 'template' or 'ssr'
      cacheEnabled: true,         // Enable template compilation caching for better performance
      debug: true,                // Enable debug mode to see compilation details
      templateDir: path.join(__dirname, '../dist') // Optional: specify default template directory
    });
    
    console.log('✅ Engine factory initialized successfully\n');

    // 2️⃣ Create Renderer from Factory
    console.log('2️⃣ Creating Template Renderer...');
    
    // Create a renderer instance using the factory
    // The 'aether' engine name refers to the default Aether template engine
    const renderer = factory.createRenderer('aether');
    console.log('✅ Template renderer created successfully\n');

    // 3️⃣ Define Template String with Aether Syntax
    // Aether template engine uses Blade-like syntax with {{ }} for variables and @ directives for control structures
    const template = `
<header class="header">
    <nav class="navbar">
        <div class="container">
            <a class="navbar-brand" href="{{ route('home') }}">
                <img src="{{ asset('images/logo.png') }}" alt="Logo" height="40">
            </a>
            
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="{{ route('home') }}">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="{{ route('about') }}">About</a>
                </li>
                
                @if(auth().check())
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button">
                            {{ auth().user.name }}
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="{{ route('profile') }}">Profile</a>
                            <a class="dropdown-item" href="{{ route('logout') }}">Logout</a>
                        </div>
                    </li>
                @else
                    <li class="nav-item">
                        <a class="nav-link" href="{{ route('login') }}">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="{{ route('register') }}">Register</a>
                    </li>
                @endif
            </ul>
        </div>
    </nav>
</header>`;

    // 4️⃣ Define Template Data and Helper Functions
    // These functions will be available in the template context during rendering
    const data = {
      // Mock authentication function - simulates user authentication state
      auth: () => ({
        check: () => true, // Change to false to test the @else block
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'admin'
        }
      }),
      
      // Mock route function - generates URLs for named routes
      route: (name) => {
        const routes = {
          'home': '/',
          'about': '/about',
          'login': '/login',
          'register': '/register',
          'profile': '/profile',
          'logout': '/logout'
        };
        return routes[name] || '#';
      },
      
      // Mock asset function - generates URLs for static assets
      asset: (filePath) => `/assets/${filePath}`,
      
      // Additional template data can be added here
      siteName: 'Aether Template Demo',
      currentYear: new Date().getFullYear()
    };

    // 5️⃣ Render Template with Provided Data
    console.log('3️⃣ Rendering Template with Enhanced Syntax...');
    try {
      // Use the renderer to process template with data
      // The render method compiles the template and executes it with the provided context
      const result = await renderer.render(template, data);
      
      console.log('\n--- Rendered Output ---');
      console.log(result);
      console.log('-----------------------\n');

      // 6️⃣ Save Rendered Output to File
      console.log('4️⃣ Saving rendered output to file...');
      const outputDir = path.join(__dirname, 'dist');
      
      // Create output directory if it doesn't exist
      try {
        await fs.access(outputDir);
        console.log('📁 Output directory already exists');
      } catch {
        await fs.mkdir(outputDir, { recursive: true });
        console.log('📁 Created output directory');
      }
      
      // Define output file path and write the rendered HTML
      const outputPath = path.join(outputDir, 'basic-usage-result.html');
      await fs.writeFile(outputPath, result, 'utf-8');
      
      console.log(`💾 HTML file saved to: ${outputPath}`);
      console.log(`📄 File size: ${result.length} characters`);

    } catch (error) {
      // Enhanced error handling with detailed information
      console.error('❌ Error during template rendering:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      // Provide helpful debugging information
      console.error('\n🔧 Debugging Tips:');
      console.error('   1. Check template syntax for errors');
      console.error('   2. Verify all template functions are defined in data');
      console.error('   3. Ensure template uses correct Aether syntax');
    }

    // 7️⃣ Display Engine Statistics and Configuration
    console.log('\n📊 Engine Factory Statistics:');
    const stats = factory.getStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Additional debug information
    console.log('\n🔧 Configuration Details:');
    console.log(`   - Mode: ${stats.mode}`);
    console.log(`   - Cache Enabled: ${stats.cacheEnabled}`);
    console.log(`   - Cache Size: ${stats.cacheSize}`);
    console.log(`   - Available Engines: ${stats.engines.join(', ')}`);
    console.log(`   - Template Directory: ${stats.templateDir || 'Not specified'}`);

    // 8️⃣ Demonstrate Additional Factory Features
    console.log('\n🎯 Additional Factory Features:');
    
    // List all available engines
    const availableEngines = factory.listEngines();
    console.log(`   Available engines: ${availableEngines.join(', ')}`);
    
    // Show cache information if enabled
    if (stats.cacheEnabled) {
      console.log(`   Cache TTL: ${stats.cacheTTL}ms`);
    }
    
    // Demonstrate engine switching capability
    console.log('\n🔄 Engine Switching Demo:');
    console.log('   The factory pattern allows easy switching between different engines:');
    console.log('   - Use createRenderer(\'aether\') for standard template rendering');
    console.log('   - Use createRenderer(\'ssr-mode\') for server-side rendering');
    console.log('   - Use createRenderer(\'template-mode\') for basic template mode');

  } catch (error) {
    // Handle initialization errors
    console.error('❌ Error during engine initialization:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check that all required modules are installed');
    console.error('   2. Verify the index.js file exports createEngine correctly');
    console.error('   3. Ensure the engine modules are in the correct location');
  }
}

// Execute the main function with error handling
run().catch(error => {
  console.error('💥 Unhandled error in main execution:');
  console.error(error);
  process.exit(1);
});

// Export the run function for potential module usage
export { run };
