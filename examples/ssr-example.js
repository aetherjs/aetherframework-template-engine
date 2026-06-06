/**
 * SSR Mode Example
 * Demonstrates Server-Side Rendering capabilities with hydration data
 * This example shows how to use the TemplateEngineFactory to create SSR-enabled renderers
 */

import { createEngine } from '../index.js';

/**
 * Main function to run SSR example
 * @returns {Promise<void>}
 */
async function runSSRExample() {
  console.log('🚀 Starting SSR Mode Example...\n');

  try {
    // 1. Initialize Engine in SSR Mode
    console.log('1️⃣ Initializing Engine in SSR Mode...');
    
    // Create engine factory with SSR mode enabled
    const factory = await createEngine({
      mode: 'ssr', // Set to SSR mode for server-side rendering
      debug: true, // Enable debug logging
      ssrHydrate: true, // Enable hydration data injection
      cacheEnabled: true, // Enable caching for better performance
      templateDir: './dist' // Optional: specify template directory
    });
    
    console.log('✅ Engine factory initialized in SSR mode\n');

    // 2. Create SSR Renderer using factory
    console.log('2️⃣ Creating SSR Renderer...');
    
    // Create renderer with SSR mode engine
    const renderer = factory.createRenderer('ssr-mode');
    console.log('✅ SSR Renderer created\n');

    // 3. Define Template with Aether syntax (not Handlebars)
    // Note: Aether uses Blade-style syntax, not Handlebars
    const template = `
<div class="app-container">
    <h1 class="title">{{title}}</h1>
    <p class="description">{{description}}</p>
    
    <div class="user-list">
        @foreach(users as user)
        <div class="user-card" id="user-{{user.id}}">
            <img src="{{user.avatar}}" alt="{{user.name}}" />
            <h3>{{user.name}}</h3>
            <p>{{user.role}}</p>
        </div>
        @endforeach
    </div>
    
    <button id="load-more" onclick="loadMore()">Load More</button>
</div>`;

    // 4. Define Data for template rendering
    const data = {
      title: 'User Dashboard',
      description: 'Manage your team members efficiently',
      users: [
        { 
          id: 1, 
          name: 'Alice Johnson', 
          role: 'Admin', 
          avatar: 'https://picsum.photos/50/50?random=1' 
        },
        { 
          id: 2, 
          name: 'Bob Smith', 
          role: 'Developer', 
          avatar: 'https://picsum.photos/50/50?random=2' 
        },
        { 
          id: 3, 
          name: 'Charlie Brown', 
          role: 'Designer', 
          avatar: 'https://picsum.photos/50/50?random=3' 
        }
      ],
      // Additional metadata for SSR enhancement
      keywords: 'Aether,Framework,Web,SSR',
      head: '<link rel="stylesheet" href="/custom-styles.css">',
      scripts: '<script src="/custom-script.js"></script>'
    };

    // 5. Render template with SSR enhancements
    console.log('3️⃣ Rendering with SSR Enhancements...');
    
    // Use the renderer to process template with data
    const result = await renderer.render(template, data);
    console.log('✅ SSR Rendering completed\n');

    // 6. Output the rendered result
    console.log('--- SSR Rendered Output (First 1000 chars) ---');
    console.log(result.substring(0, 1000) + (result.length > 1000 ? '...' : ''));
    console.log('----------------------------------------------\n');

    // 7. Verify SSR features are working
    console.log('🔍 Verifying SSR Features:');
    
    // Check for hydration data injection
    if (result.includes('ssr-data')) {
      console.log('✅ Hydration data injected successfully');
    } else {
      console.log('⚠️ Hydration data missing');
    }
    
    // Check for full HTML document structure
    if (result.includes('<!DOCTYPE html>')) {
      console.log('✅ Full HTML document generated');
    } else {
      console.log('⚠️ Not a complete HTML document');
    }
    
    // Check for Tailwind CSS inclusion
    if (result.includes('tailwindcss.com')) {
      console.log('✅ Tailwind CSS included');
    } else {
      console.log('⚠️ Tailwind CSS not found');
    }
    
    // Check for Font Awesome icons
    if (result.includes('font-awesome')) {
      console.log('✅ Font Awesome included');
    } else {
      console.log('⚠️ Font Awesome not found');
    }

    // 8. Save rendered output to dist folder for inspection
    console.log('\n💾 Saving output to dist folder...');
    
    // Import file system module for saving output
    import('fs').then(fs => {
      // Create dist directory if it doesn't exist
      const distDir = './dist';
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        console.log(`📁 Created directory: ${distDir}`);
      }
      
      // Save to dist folder
      const outputPath = './dist/ssr-output.html';
      fs.writeFileSync(outputPath, result, 'utf-8');
      console.log(`✅ Output saved to: ${outputPath}`);
    }).catch(err => {
      console.log('⚠️ Could not save to file:', err.message);
    });

    // 9. Display engine statistics
    console.log('\n📊 Engine Statistics:');
    const stats = factory.getStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Additional debug information
    console.log('\n🔧 Debug Information:');
    console.log(`- Mode: ${stats.mode}`);
    console.log(`- Available Engines: ${stats.engines.join(', ')}`);
    console.log(`- Cache Enabled: ${stats.cacheEnabled}`);
    console.log(`- Cache Size: ${stats.cacheSize}`);
    console.log(`- Template Directory: ${stats.templateDir}`);

  } catch (error) {
    // Enhanced error handling with detailed information
    console.error('❌ Error occurred during SSR example execution:');
    console.error(`Message: ${error.message}`);
    console.error(`Stack Trace: ${error.stack}`);
    
    // Provide troubleshooting suggestions
    console.error('\n🔧 Troubleshooting Suggestions:');
    console.error('1. Check that SSRModeEngine is properly registered in the factory');
    console.error('2. Verify template syntax uses Aether/Blade style (@foreach not {{#each}})');
    console.error('3. Ensure factory is initialized with mode: "ssr"');
    console.error('4. Check that all required engines are imported and registered');
  }
}

// Execute the SSR example
runSSRExample();
