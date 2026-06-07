Aether Framework Template Engine

A modern, lightweight template engine for Node.js with Blade-like syntax, supporting SSR (Server-Side Rendering) and template modes. Features include template inheritance, includes, conditionals, loops, filters, and custom functions.

Features

- Blade-like Syntax: Familiar syntax similar to Laravel Blade
- Template Inheritance: Support for `@extends`, `@section`, `@yield`, `@include`
- Conditionals & Loops: `@if`, `@else`, `@endif`, `@foreach`, `@endforeach`
- Custom Functions: `{{ route('home') }}`, `{{ asset('images/logo.png') }}`
- Chained Properties: `{{ auth().user.name }}`
- Filters: `{{ variable|upper }}`, `{{ variable|date:'YYYY-MM-DD' }}`
- SSR Support: Server-side rendering mode
- Caching: Built-in template compilation caching
- ES Module: Native ES Module support

Installation

```bash
npm install @aetherframework/template-engine
```

Quick Start

Basic Usage

```javascript
import AetherEngine from '@aetherframework/template-engine';

// Initialize the engine
const engine = new AetherEngine({
  templateDir: './templates',  // Template directory
  cacheEnabled: true,           // Enable caching
  debug: true                   // Debug mode
});

await engine.initialize();

// Define your template
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
                        <a class="nav-link dropdown-toggle" href="" role="button">
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

// Prepare data
const data = {
  auth: () => ({
    check: () => true,
    user: { name: 'John Doe' }
  }),
  route: (name) => {
    const routes = {
      'home': '/',
      'about': '/about',
      'login': '/login',
      'register': '/register',
      'profile': '/profile',
      'logout': '/logout'
    };
    return routes[name] || '';
  },
  asset: (path) => `/assets/${path}`
};

// Render the template
const html = await engine.render(template, data);
console.log(html);
```

Using Factory Pattern

```javascript
import { createEngine } from '@aetherframework/template-engine';

// Create engine factory
const factory = await createEngine({
  mode: 'template',     // 'template' or 'ssr'
  templateDir: './views',
  cacheEnabled: true,
  debug: process.env.NODE_ENV === 'development'
});

// Create renderer
const renderer = factory.createRenderer('aether');

// Render template
const html = await renderer.render(template, data);
```

Template Syntax

Variables

```html
<!-- Simple variable -->
<p>Hello, {{ name }}!</p>

<!-- Object property -->
<p>Email: {{ user.email }}</p>

<!-- Array access -->
<p>First item: {{ items[0] }}</p>
```

Functions

```html
<!-- Function call -->
<a href="{{ route('home') }}">Home</a>
<img src="{{ asset('images/logo.png') }}">

<!-- Chained method calls -->
@if(auth().check())
  <p>Welcome, {{ auth().user.name }}!</p>
@endif
```

Conditionals

```html
@if(user.isAdmin)
  <p>Administrator Access</p>
@elseif(user.isModerator)
  <p>Moderator Access</p>
@else
  <p>User Access</p>
@endif
```

Loops

```html
<ul>
@foreach(users as user)
  <li>{{ user.name }} - {{ user.email }}</li>
@endforeach
</ul>

<!-- Alternative syntax -->
@foreach(items as item)
  <div>{{ item.name }}</div>
@endforeach
```

Filters

```html
<!-- Single filter -->
<p>{{ content|upper }}</p>

<!-- Multiple filters -->
<p>{{ content|escape|lower }}</p>

<!-- Filter with arguments -->
<p>{{ date|date:'YYYY-MM-DD' }}</p>
<p>{{ price|formatCurrency:'USD' }}</p>
```

Layouts and Inheritance

layouts/base.aether:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Default Title')</title>
    @yield('head')
</head>
<body>
    @include('partials/header')
    
    <main>
        @yield('content')
    </main>
    
    @include('partials/footer')
    
    @yield('scripts')
</body>
</html>
```

pages/home.aether:
```html
@extends('layouts/base')

@section('title', 'Home Page')

@section('head')
    <link rel="stylesheet" href="/css/home.css">
@endsection

@section('content')
    <h1>Welcome to {{ site.name }}</h1>
    <p>{{ welcomeMessage }}</p>
    
    @foreach(features as feature)
        <div class="feature">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
        </div>
    @endforeach
@endsection

@section('scripts')
    <script src="/js/home.js"></script>
@endsection
```

API Reference

AetherEngine Class

Constructor

```javascript
const engine = new AetherEngine(options);
```

Options:
- `templateDir` (string): Template directory path (default: './templates')
- `cacheEnabled` (boolean): Enable template caching (default: true)
- `cacheTTL` (number): Cache time-to-live in seconds (default: 3600)
- `debug` (boolean): Enable debug mode (default: false)

Methods

initialize()
Initialize the engine (called automatically on first render).

```javascript
await engine.initialize();
```

render(template, data, options)
Render a template with data.

```javascript
const html = await engine.render(templateString, data);
// or
const html = await engine.render('template-file.aether', data);
```

Parameters:
- `template` (string): Template content or file path
- `data` (object): Template data
- `options` (object): Render options

filter(name, handler)
Register a custom filter.

```javascript
engine.filter('uppercase', (value) => value.toUpperCase());
engine.filter('truncate', (value, length = 100) => {
  return value.length > length ? value.substring(0, length) + '...' : value;
});

// Usage in template: {{ content|uppercase|truncate:50 }}
```

function(name, handler)
Register a custom function.

```javascript
engine.function('config', (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
});

engine.function('csrf_token', () => {
  return generateCSRFToken();
});

// Usage in template: {{ config('APP_NAME') }}, {{ csrf_token() }}
```

registerLayout(name, content)
Register a layout template.

```javascript
engine.registerLayout('default', `
<!DOCTYPE html>
<html>
<head>
    <title>@yield('title')</title>
</head>
<body>
    @yield('content')
</body>
</html>
`);
```

clearCache()
Clear the template cache.

```javascript
engine.clearCache();
```

getMetadata()
Get engine metadata.

```javascript
const metadata = engine.getMetadata();
// Returns: { name, version, initialized, filters, functions, layouts, cacheEnabled, templateDir }
```

Factory Functions

createEngine(options)
Create a template engine factory.

```javascript
import { createEngine } from '@aetherframework/template-engine';

const factory = await createEngine({
  mode: 'template',  // 'template' or 'ssr'
  templateDir: './views',
  cacheEnabled: true
});
```

createEngineFromEnv()
Create engine from environment configuration.

```javascript
const factory = await createEngineFromEnv();
// Reads from .env file or environment variables
```

quickStart(options)
Quick start with default configuration.

```javascript
const { factory, renderer, config } = await quickStart({
  templateDir: './templates',
  debug: true
});
```

Configuration

Environment Variables

```env
TEMPLATE_ENGINE_MODE=template          'template' or 'ssr'
TEMPLATE_ENGINE=aether                Default engine
TEMPLATE_DIR=./templates              Template directory
CACHE_ENABLED=true                    Enable caching
CACHE_TTL=300000                      Cache TTL in milliseconds (5 minutes)
DEBUG=true                            Debug mode
```

Configuration File (.env)

Create a `.env` file in your project root:

```env
Template Engine Configuration
TEMPLATE_ENGINE_MODE=template
TEMPLATE_DIR=./resources/views
CACHE_ENABLED=true
CACHE_TTL=300000
DEBUG=false

Custom Functions Configuration
ASSET_URL=/assets
BASE_URL=http://localhost:3000
```

Integration Examples

Express.js Integration

```javascript
import express from 'express';
import { createEngine } from '@aetherframework/template-engine';

const app = express();

// Initialize template engine
const factory = await createEngine({
  templateDir: './views',
  cacheEnabled: process.env.NODE_ENV === 'production'
});

const renderer = factory.createRenderer('aether');

// Middleware to add render method
app.use((req, res, next) => {
  res.render = async (template, data = {}) => {
    try {
      const html = await renderer.render(template, {
        ...data,
        req,
        res,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
      res.send(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  next();
});

// Route example
app.get('/', async (req, res) => {
  const data = {
    title: 'Home Page',
    user: req.user || null,
    products: await Product.find(),
    csrfToken: req.csrfToken ? req.csrfToken() : null
  };
  
  await res.render('home', data);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

Koa.js Integration

```javascript
import Koa from 'koa';
import { createEngine } from '@aetherframework/template-engine';

const app = new Koa();

const factory = await createEngine();
const renderer = factory.createRenderer('aether');

// Middleware
app.use(async (ctx, next) => {
  ctx.render = async (template, data = {}) => {
    const html = await renderer.render(template, {
      ...data,
      ctx,
      state: ctx.state
    });
    ctx.type = 'html';
    ctx.body = html;
  };
  await next();
});

// Route
app.use(async (ctx) => {
  if (ctx.path === '/') {
    await ctx.render('home', {
      title: 'Welcome',
      user: ctx.state.user
    });
  }
});

app.listen(3000);
```

Advanced Usage

Custom Filters

```javascript
// Register custom filters
engine.filter('formatDate', (date, format = 'YYYY-MM-DD') => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
});

engine.filter('pluralize', (count, singular, plural) => {
  return count === 1 ? singular : plural;
});

// Usage in template
// {{ created_at|formatDate:'MM/DD/YYYY' }}
// {{ count|pluralize:'item':'items' }}
```

Custom Functions

```javascript
// Register custom functions
engine.function('url', (path) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
});

engine.function('old', (field, defaultValue = '') => {
  // Simulate Laravel's old() function for form data
  return session?.old?.[field] || defaultValue;
});

engine.function('can', (permission) => {
  // Check user permissions
  return currentUser?.permissions?.includes(permission) || false;
});

// Usage in template
// <a href="{{ url('/dashboard') }}">Dashboard</a>
// <input value="{{ old('username') }}">
// @if(can('edit-post')) ... @endif
```

Template Caching

```javascript
// Enable/disable caching
const engine = new AetherEngine({
  cacheEnabled: true,
  cacheTTL: 3600000 // 1 hour
});

// Clear cache manually
engine.clearCache();

// Or clear cache on specific events
app.post('/clear-cache', (req, res) => {
  engine.clearCache();
  res.json({ message: 'Cache cleared' });
});
```

Error Handling

```javascript
try {
  const html = await engine.render(template, data);
  // Success
} catch (error) {
  if (error.message.includes('Template not found')) {
    console.error('Template file not found');
  } else if (error.message.includes('Template compilation failed')) {
    console.error('Template syntax error:', error.message);
  } else if (error.message.includes('Runtime error')) {
    console.error('Template runtime error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
  
  // Fallback to error template
  const errorHtml = await engine.render('errors/500', { error: error.message });
}
```

File Structure

```
project/
├── templates/
│   ├── layouts/
│   │   ├── default.aether
│   │   └── admin.aether
│   ├── pages/
│   │   ├── home.aether
│   │   ├── about.aether
│   │   └── contact.aether
│   ├── components/
│   │   ├── header.aether
│   │   ├── footer.aether
│   │   └── sidebar.aether
│   └── partials/
│       ├── nav.aether
│       └── alerts.aether
├── .env
├── package.json
└── app.js
```


---

Compression Features

The Aether Template Engine includes a powerful built-in compression system that automatically minifies and optimizes your HTML, CSS, and JavaScript output for production environments. This feature helps reduce bandwidth usage, improve page load times, and enhance overall performance.

Basic Compression Configuration

```javascript
import AetherEngine from '@aetherframework/template-engine';

// Initialize the engine with compression enabled
const engine = new AetherEngine({
  templateDir: './templates',
  cacheEnabled: true,
  debug: process.env.NODE_ENV === 'development',
  
  // Compression configuration
  compressionEnabled: true,           // Enable/disable compression globally
  minifyHTML: true,                   // Minify HTML structure (remove whitespace, comments)
  minifyCSS: true,                    // Minify inline CSS styles
  minifyJS: true,                     // Minify inline JavaScript code
  mangleJS: false,                    // Obfuscate JavaScript variable names (production only)
  removeComments: true,               // Remove HTML/CSS/JS comments
  collapseWhitespace: true,           // Collapse multiple whitespace characters
  removeAttributeQuotes: false,       // Remove optional quotes from HTML attributes
  removeEmptyAttributes: false,       // Remove empty HTML attributes
  cacheCompressed: true,              // Cache compressed results for performance
  cacheTTL: 3600000                   // Cache time-to-live in milliseconds (1 hour)
});

await engine.initialize();
```

Environment-Based Configuration

```javascript
// Development environment - disable compression for easier debugging
const devEngine = new AetherEngine({
  compressionEnabled: false,
  minifyHTML: false,
  minifyCSS: false,
  minifyJS: false,
  mangleJS: false,
  removeComments: false,
  collapseWhitespace: false,
  cacheCompressed: false,
  debug: true
});

// Production environment - enable all compression for optimal performance
const prodEngine = new AetherEngine({
  compressionEnabled: true,
  minifyHTML: true,
  minifyCSS: true,
  minifyJS: true,
  mangleJS: true,                    // Obfuscate JS in production for security
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeEmptyAttributes: true,
  cacheCompressed: true,
  cacheTTL: 3600000,                 // 1 hour cache
  debug: false
});
```

Per-Render Compression Options

You can override compression settings for individual template renders:

```javascript
// Render with specific compression options
const html = await engine.render('template.aether', data, {
  compression: {
    minifyHTML: true,
    minifyCSS: true,
    minifyJS: true,
    mangleJS: process.env.NODE_ENV === 'production',
    removeComments: true,
    collapseWhitespace: true
  }
});
```

Compression Examples

Before Compression (Development):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Application</title>
  <style>
    /* Main styles */
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to {{ app.name }}</h1>
    <p>This is a sample page with uncompressed output.</p>
  </div>
  
  <script>
    // JavaScript code
    function greetUser(name) {
      console.log("Hello, " + name + "!");
    }
    
    greetUser("John");
  </script>
</body>
</html>
```

After Compression (Production):
```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Application</title><style>body{margin:0;padding:0;font-family:Arial,sans-serif}.container{width:100%;max-width:1200px;margin:0 auto;padding:20px}</style></head><body><div class="container"><h1>Welcome to MyApp</h1><p>This is a sample page with compressed output.</p></div><script>function a(b){console.log("Hello, "+b+"!")}a("John")</script></body></html>
```

Compression Statistics and Cache Management

```javascript
// Get compression statistics
const stats = engine.getCompressionStats();
console.log(stats);
// Output: { cacheSize: 15, cacheHits: 42, cacheTTL: 3600000, options: {...} }

// Clear compression cache (useful during development)
engine.clearCompressionCache();

// Check if compression is enabled
const isCompressionEnabled = engine.options.compressionEnabled;
```

SSR Mode with Compression

```javascript
import { SSRModeEngine } from '@aetherframework/template-engine';

const ssrEngine = new SSRModeEngine({
  templateDir: './templates',
  hydrate: true,
  stream: false,
  
  // SSR-specific compression options
  compressSSR: true,
  minifySSR: true,
  
  // General compression settings
  compressionEnabled: true,
  minifyHTML: true,
  minifyCSS: true,
  minifyJS: true,
  mangleJS: process.env.NODE_ENV === 'production',
  removeComments: true,
  collapseWhitespace: true,
  cacheCompressed: true
});

// Render with SSR and compression
const html = await ssrEngine.render('app.aether', data);
```

Template Mode with Compression

```javascript
import { TemplateModeEngine } from '@aetherframework/template-engine';

const templateEngine = new TemplateModeEngine({
  templateDir: './templates',
  layoutSupport: true,
  includeSupport: true,
  
  // Template-specific compression
  compressTemplates: true,
  minifyTemplates: true,
  
  // General compression settings
  compressionEnabled: true,
  minifyHTML: true,
  minifyCSS: true,
  minifyJS: true,
  mangleJS: false, // Usually keep JS readable in template mode
  removeComments: true,
  collapseWhitespace: true,
  cacheCompressed: true
});

// Render template with compression
const html = await templateEngine.render('page.aether', data);
```

Environment Configuration

Create a `.env` file with compression settings:

```env
Compression Configuration
COMPRESSION_ENABLED=true
MINIFY_HTML=true
MINIFY_CSS=true
MINIFY_JS=true
MANGLE_JS=true
REMOVE_COMMENTS=true
COLLAPSE_WHITESPACE=true
REMOVE_ATTRIBUTE_QUOTES=true
REMOVE_EMPTY_ATTRIBUTES=true
CACHE_COMPRESSED=true
CACHE_TTL=3600000

Template Engine Configuration
TEMPLATE_ENGINE_MODE=template
TEMPLATE_DIR=./templates
CACHE_ENABLED=true
CACHE_TTL=300000
DEBUG=false
```

Express.js Integration with Compression

```javascript
import express from 'express';
import { createEngine } from '@aetherframework/template-engine';

const app = express();

// Initialize template engine with compression
const factory = await createEngine({
  templateDir: './views',
  cacheEnabled: process.env.NODE_ENV === 'production',
  
  // Compression based on environment
  compressionEnabled: process.env.NODE_ENV === 'production',
  minifyHTML: process.env.NODE_ENV === 'production',
  minifyCSS: process.env.NODE_ENV === 'production',
  minifyJS: process.env.NODE_ENV === 'production',
  mangleJS: process.env.NODE_ENV === 'production',
  removeComments: process.env.NODE_ENV === 'production',
  collapseWhitespace: true,
  cacheCompressed: true
});

const renderer = factory.createRenderer('aether');

// Middleware to add render method with compression
app.use((req, res, next) => {
  res.render = async (template, data = {}, options = {}) => {
    try {
      const html = await renderer.render(template, {
        ...data,
        req,
        res,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      }, {
        // Override compression per route if needed
        compression: {
          minifyHTML: true,
          minifyCSS: true,
          minifyJS: true,
          mangleJS: process.env.NODE_ENV === 'production',
          ...options.compression
        }
      });
      
      // Set compression headers
      res.setHeader('X-Compression-Enabled', 'true');
      res.setHeader('X-Compression-Mode', 'template');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      res.send(html);
    } catch (error) {
      console.error('Render error:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  next();
});

// Route with compressed output
app.get('/', async (req, res) => {
  const data = {
    title: 'Home Page',
    user: req.user || null,
    products: await Product.find(),
    csrfToken: req.csrfToken ? req.csrfToken() : null
  };
  
  await res.render('home', data, {
    // Optional: Custom compression for this route
    compression: {
      minifyHTML: true,
      minifyCSS: true,
      minifyJS: true,
      mangleJS: process.env.NODE_ENV === 'production'
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log(`Compression: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
});
```

Performance Benefits

1. Reduced Bandwidth Usage: Compressed HTML can be 30-70% smaller than uncompressed versions
2. Faster Page Load Times: Smaller file sizes lead to quicker downloads and parsing
3. Improved SEO: Faster loading pages are favored by search engines
4. Better User Experience: Users see content faster, especially on mobile devices
5. Reduced Server Load: Less data transmission means lower server resource usage
6. Enhanced Security: JavaScript obfuscation (`mangleJS`) makes code harder to reverse-engineer

Compression Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `compressionEnabled` | boolean | `false` | Enable/disable compression globally |
| `minifyHTML` | boolean | `true` | Minify HTML structure (remove whitespace, comments) |
| `minifyCSS` | boolean | `true` | Minify inline CSS styles |
| `minifyJS` | boolean | `true` | Minify inline JavaScript code |
| `mangleJS` | boolean | `false` | Obfuscate JavaScript variable names |
| `removeComments` | boolean | `true` | Remove HTML, CSS, and JavaScript comments |
| `collapseWhitespace` | boolean | `true` | Collapse multiple whitespace characters into single spaces |
| `removeAttributeQuotes` | boolean | `false` | Remove optional quotes from HTML attributes |
| `removeEmptyAttributes` | boolean | `false` | Remove empty HTML attributes |
| `cacheCompressed` | boolean | `true` | Cache compressed results to avoid re-compression |
| `cacheTTL` | number | `3600000` | Cache time-to-live in milliseconds (1 hour) |

Troubleshooting Compression

Common Issues:

1. Compression not working: Ensure `compressionEnabled` is set to `true` in your configuration
2. JavaScript errors after compression: Disable `mangleJS` or check for variable name conflicts in your code
3. CSS broken after compression: Verify CSS syntax is valid and doesn't contain edge cases
4. Cache not updating: Clear compression cache with `engine.clearCompressionCache()` during development
5. Performance issues: Adjust `cacheTTL` based on your application's update frequency

Debug Mode for Compression:

```javascript
const engine = new AetherEngine({
  compressionEnabled: true,
  debug: true  // Enable debug logs
});

// Check compression logs in console
// [AetherEngine] Compression applied: 10240 → 5120 bytes (50% reduction)
// [AetherEngine] Cache hit for template: home.aether
// [AetherEngine] Compression statistics: { cacheSize: 5, cacheHits: 23 }
```

Best Practices

1. Development Environment: Disable compression (`compressionEnabled: false`) for easier debugging and readable output
2. Production Environment: Enable all compression options for optimal performance and security
3. Testing: Test with `mangleJS: false` first, then enable for production after verification
4. Monitoring: Use `getCompressionStats()` to monitor cache performance and hit rates
5. Caching Strategy: Always enable `cacheCompressed: true` in production to avoid re-compressing the same content
6. Incremental Deployment: Deploy compression changes gradually and monitor for issues
7. Backup Originals: Keep uncompressed templates in source control for debugging purposes

Advanced Compression Configuration

For fine-grained control over compression behavior:

```javascript
const engine = new AetherEngine({
  compressionEnabled: true,
  
  // HTML-specific options
  minifyHTML: true,
  collapseWhitespace: true,
  conservativeCollapse: false, // Preserve single whitespace
  preserveLineBreaks: false,   // Remove all line breaks
  removeComments: true,
  removeEmptyAttributes: true,
  removeAttributeQuotes: true,
  removeOptionalTags: false,    // Don't remove optional tags like </li>
  
  // CSS-specific options
  minifyCSS: true,
  cssMinifierOptions: {
    level: 2,                  // Optimization level (1-3)
    compatibility: '*',        // Browser compatibility
    format: 'keep-breaks'      // Output formatting
  },
  
  // JavaScript-specific options
  minifyJS: true,
  mangleJS: true,
  mangleOptions: {
    reserved: ['render', 'data', 'helpers'] // Variables to preserve
  },
  jsMinifierOptions: {
    compress: {
      drop_console: true,      // Remove console statements
      drop_debugger: true      // Remove debugger statements
    },
    mangle: {
      properties: false         // Don't mangle property names
    }
  },
  
  // Cache configuration
  cacheCompressed: true,
  cacheTTL: 3600000,
  cacheMaxSize: 100            // Maximum number of cached items
});
```

This compression feature is seamlessly integrated into the Aether Template Engine, providing automatic optimization without requiring changes to your template code. The system intelligently handles different content types and provides configurable options for both development and production environments.

Performance Tips

1. Enable Caching in Production: Always enable caching in production environments
2. Precompile Templates: For frequently used templates, precompile them
3. Use Template Inheritance: Reduces duplication and improves maintainability
4. Minimize Complex Logic in Templates: Move complex logic to controllers or services
5. Use Includes for Reusable Components: Create reusable partials for common UI elements

Troubleshooting

Common Issues

1. Template not found: Ensure template directory is correctly configured
2. Syntax errors: Check for missing `@endif` or `@endforeach`
3. Function not defined: Register custom functions before rendering
4. Cache issues: Clear cache with `engine.clearCache()`

Debug Mode

Enable debug mode for detailed error messages:

```javascript
const engine = new AetherEngine({
  debug: process.env.NODE_ENV === 'development'
});
```

License

MIT License - see LICENSE file for details.

Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/yourusername/@aetherframework/template-engine).

Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request


📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the Aether Team