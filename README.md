Aether Framework Template Engine

A modern, lightweight template engine for Node.js with Blade-like syntax, supporting SSR (Server-Side Rendering) and template modes. Features include template inheritance, includes, conditionals, loops, filters, and custom functions.

Features

- Blade-like Syntax: Familiar syntax similar to Laravel Blade
- Template Inheritance: Support for `@extends`, `@section`, `@yield`
- Conditionals & Loops: `@if`, `@else`, `@endif`, `@foreach`, `@endforeach`
- Custom Functions: `{{ route('home') }}`, `{{ asset('images/logo.png') }}`
- Chained Properties: `{{ auth().user.name }}`
- Filters: `{{ variable|upper }}`, `{{ variable|date:'YYYY-MM-DD' }}`
- SSR Support: Server-side rendering mode
- Caching: Built-in template compilation caching
- ES Module: Native ES Module support

Installation

```bash
npm install aether-template-engine
```

Quick Start

Basic Usage

```javascript
import AetherEngine from 'aether-template-engine';

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
import { createEngine } from 'aether-template-engine';

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
import { createEngine } from 'aether-template-engine';

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
import { createEngine } from 'aether-template-engine';

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
import { createEngine } from 'aether-template-engine';

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

For issues and feature requests, please visit the [GitHub repository](https://github.com/yourusername/aether-template-engine).

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