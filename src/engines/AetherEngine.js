/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/engines/AetherEngine
 */

/**
 * Aether Template Engine - Custom template engine with Blade-like syntax
 * Supports: @yield, @section, @extends, @include, {{variable}}, {!! raw !!}, @if, @foreach, @forelse, 
 * @push/@stack, @csrf, pagination(), route(), auth().user.name
 */
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import CompressionEngine from './CompressionEngine.js';

class AetherEngine {
  constructor(options = {}) {
    this.name = 'aether';
    this.version = '1.3.0';
    this.initialized = false;
    
    this.options = {
      templateDir: options.templateDir || './templates',
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 3600,
      compileCache: new Map(),
      templateCache: new Map(),
      debug: options.debug || false,
      csrfToken: options.csrfToken || '',
      
      // Compression options
      compressionEnabled: options.compressionEnabled !== false,
      minifyHTML: options.minifyHTML !== false,
      minifyCSS: options.minifyCSS !== false,
      minifyJS: options.minifyJS !== false,
      mangleJS: options.mangleJS || false,
      removeComments: options.removeComments || false,
      collapseWhitespace: options.collapseWhitespace || true,
      cacheCompressed: options.cacheCompressed !== false,
      ...options
    };
    
    // Initialize compression engine
    this.compressionEngine = new CompressionEngine(this.options);
    
    this.filters = new Map();
    this.functions = new Map();
    this.layouts = new Map();
    this.routes = {};
    
    this.ensureTemplateDir();
    this.registerDefaultFilters();
    this.registerDefaultFunctions();
  }
  
  initialize() {
    if (this.initialized) return;
    console.log(`Aether Engine initialized (v${this.version})`);
    this.initialized = true;
  }

  /**
   * Process content with compression based on options
   */
  processWithCompression(content, options = {}) {
    if (!this.options.compressionEnabled) return content;
    
    const processOptions = {
      minifyHTML: this.options.minifyHTML,
      minifyCSS: this.options.minifyCSS,
      minifyJS: this.options.minifyJS,
      mangleJS: this.options.mangleJS,
      removeComments: this.options.removeComments,
      collapseWhitespace: this.options.collapseWhitespace,
      cacheCompressed: this.options.cacheCompressed,
      ...options
    };
    
    return this.compressionEngine.processHTML(content, processOptions);
  }

  clearCompressionCache() {
    if (this.compressionEngine) this.compressionEngine.clearCompressionCache();
  }

  getCompressionStats() {
    return this.compressionEngine ? this.compressionEngine.getStats() : null;
  }

  ensureTemplateDir() {
    const dirs = [
      this.options.templateDir,
      path.join(this.options.templateDir, 'layouts'),
      path.join(this.options.templateDir, 'components'),
      path.join(this.options.templateDir, 'pages'),
      path.join(this.options.templateDir, 'partials'),
    ];
    dirs.forEach((dir) => { if (!fs.existsSync(dir)) fs.ensureDirSync(dir); });
  }
  
  registerDefaultFilters() {
    this.filter('upper', (value) => String(value).toUpperCase());
    this.filter('lower', (value) => String(value).toLowerCase());
    this.filter('escape', (value) => this.escapeHtml(value));
    this.filter('json', (value) => JSON.stringify(value));
    this.filter('date', (value) => new Date(value).toISOString().split('T')[0]);
    this.filter('raw', (value) => value); 
  }
  
  registerDefaultFunctions() {
    this.function('route', (name, params = {}) => {
      let url = this.routes[name] || `/${name}`;
      if (params && typeof params === 'object') {
        for (const [key, value] of Object.entries(params)) {
          url = url.replace(new RegExp(`[:{]${key}[}]?`, 'g'), value);
        }
      }
      return url;
    });
    
    this.function('asset', (assetPath) => `${process.env.ASSET_URL || '/assets'}/${assetPath.replace(/^\/+/, '')}`);
    this.function('auth', () => ({ check: () => true, user: { name: 'John Doe', email: 'john@example.com', id: 1 } }));
    this.function('env', (key, defaultValue = '') => process.env[key] || defaultValue);
    this.function('url', (urlPath) => `${process.env.BASE_URL || 'http://localhost:3000'}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`);
    this.function('csrf', () => `<input type="hidden" name="_csrf" value="${this.options.csrfToken}">`);
    
    this.function('old', (field, defaultValue = '') => {
      return `__get('old.${field}') || ${JSON.stringify(defaultValue)}`;
    });

    this.function('class', (classes) => {
      if (Array.isArray(classes)) return classes.filter(c => typeof c === 'string').join(' ');
      return '';
    });

    this.function('pagination', (pager) => {
      if (!pager || !pager.total || pager.total <= 1) return '';
      let html = '<nav class="aether-pagination" aria-label="Pagination">';
      if (pager.current > 1) html += `<a href="${pager.baseUrl}?page=${pager.current - 1}" class="page-link prev">&laquo; Prev</a>`;
      else html += `<span class="page-link disabled">&laquo; Prev</span>`;

      const start = Math.max(1, pager.current - 2);
      const end = Math.min(pager.total, pager.current + 2);
      if (start > 1) html += `<a href="${pager.baseUrl}?page=1" class="page-link">1</a><span class="dots">...</span>`;
      
      for (let i = start; i <= end; i++) {
        if (i === pager.current) html += `<span class="page-link active">${i}</span>`;
        else html += `<a href="${pager.baseUrl}?page=${i}" class="page-link">${i}</a>`;
      }
      
      if (end < pager.total) html += `<span class="dots">...</span><a href="${pager.baseUrl}?page=${pager.total}" class="page-link">${pager.total}</a>`;

      if (pager.current < pager.total) html += `<a href="${pager.baseUrl}?page=${pager.current + 1}" class="page-link next">Next &raquo;</a>`;
      else html += `<span class="page-link disabled">Next &raquo;</span>`;

      html += '</nav>';
      return html;
    });
  }
  
  filter(name, handler) { this.filters.set(name, handler); return this; }
  function(name, handler) { this.functions.set(name, handler); return this; }
  registerLayout(name, content) { this.layouts.set(name, content); return this; }
  setRoutes(routes) { this.routes = { ...this.routes, ...routes }; return this; }
  setCsrfToken(token) { this.options.csrfToken = token; return this; }

  escapeHtml(str) {
    if (str === undefined || str === null) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  
  enhancedConvertToJsCode(template) {
    let jsCode = '';
    let cursor = 0;
    
    const parenRegex = '\\(((?:[^()]+|\\([^()]*\\))*)\\)';
    const tokenRegex = new RegExp(
      `(\\{!!.*?!!\\}|\\{\\{.*?\\}\\}|@if\\s*${parenRegex}|@elseif\\s*${parenRegex}|@else\\b|@endif\\b|@foreach\\s*${parenRegex}|@endforeach\\b|@forelse\\s*${parenRegex}|@empty\\b|@endforelse\\b|@yield\\s*${parenRegex}|@section\\s*${parenRegex}|@endsection\\b|@extends\\s*${parenRegex}|@include\\s*${parenRegex}|@push\\s*${parenRegex}|@endpush\\b|@stack\\s*${parenRegex}|@csrf\\b)`,
      'gs'
    );
    
    let inSectionBlock = false;
    let currentSectionName = '';
    let sectionContent = '';

    let inStackBlock = false;
    let currentStackName = '';
    let stackContent = '';
    
    let match;
    while ((match = tokenRegex.exec(template)) !== null) {
      const text = template.slice(cursor, match.index);
      if (text) {
        if (inSectionBlock) sectionContent += text;
        else if (inStackBlock) stackContent += text;
        else jsCode += `__output.push(${JSON.stringify(text)});\n`;
      }
      
      cursor = match.index + match[0].length; 
      const token = match[0].trim();
      
      if (token.startsWith('{!!') && token.endsWith('!!}')) {
        const expr = token.slice(3, -3).trim();
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `__output.push(${this.parseExpression(expr, true)});\n`; 
      } 
      else if (token.startsWith('{{') && token.endsWith('}}')) {
        const expr = token.slice(2, -2).trim();
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `__output.push(${this.parseExpression(expr, false)});\n`;
      } 
      else if (token.startsWith('@if')) {
        const condMatch = token.match(new RegExp(`@if\\s*${parenRegex}`, 's'));
        if (condMatch) {
          if (inSectionBlock) sectionContent += token;
          else if (inStackBlock) stackContent += token;
          else jsCode += `if (${this.parseCondition(condMatch[1])}) {\n`;
        }
      } 
      else if (token.startsWith('@elseif')) {
        const condMatch = token.match(new RegExp(`@elseif\\s*${parenRegex}`, 's'));
        if (condMatch) {
          if (inSectionBlock) sectionContent += token;
          else if (inStackBlock) stackContent += token;
          else jsCode += `} else if (${this.parseCondition(condMatch[1])}) {\n`;
        }
      } 
      else if (token === '@else') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `} else {\n`;
      } 
      else if (token === '@endif') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `}\n`;
      } 
      else if (token.startsWith('@foreach') || token.startsWith('@forelse')) {
        const isForelse = token.startsWith('@forelse');
        const loopMatch = token.match(new RegExp(`@(?:foreach|forelse)\\s*${parenRegex}`, 's'));
        if (loopMatch) {
          const parsedLoop = this.parseForeachExpression(loopMatch[1]);
          if (inSectionBlock) sectionContent += token;
          else if (inStackBlock) stackContent += token;
          else {
            jsCode += `{
              const __collection = ${parsedLoop.collection} || [];
              const __parentScope = __scope;
              const __isArray = Array.isArray(__collection);
              const __entries = __isArray ? __collection.map((v, i) => [i, v]) : Object.entries(__collection);
              const __count = __entries.length;
            `;
            if (isForelse) jsCode += `if (__count > 0) {\n`;
            jsCode += `for (let __i = 0; __i < __count; __i++) {
                const [__key, __val] = __entries[__i];
                __scope = Object.create(__parentScope);
                __scope['${parsedLoop.item}'] = __val;
                ${parsedLoop.key ? `__scope['${parsedLoop.key}'] = __key;` : ''}
                __scope['loop'] = {
                  index: __i, iteration: __i + 1, remaining: __count - __i - 1, count: __count,
                  first: __i === 0, last: __i === __count - 1,
                  depth: (__parentScope.loop ? __parentScope.loop.depth + 1 : 1),
                  parent: __parentScope.loop || null
                };
            `;
          }
        }
      } 
      else if (token === '@endforeach') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `}\n__scope = __parentScope;\n}\n`; 
      } 
      else if (token === '@empty') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `}\n} else {\n`; 
      }
      else if (token === '@endforelse') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `}\n__scope = __parentScope;\n}\n`; 
      }
      else if (token.startsWith('@push')) {
        const pushMatch = token.match(/@push\s*\(\s*'([^']+)'\s*\)/);
        if (pushMatch) {
          currentStackName = pushMatch[1];
          inStackBlock = true;
          stackContent = '';
        }
      }
      else if (token === '@endpush') {
        if (inStackBlock && currentStackName) {
          const stackJsCode = this.enhancedConvertToJsCode(stackContent);
          jsCode += `if(!__stacks['${currentStackName}']) __stacks['${currentStackName}'] = [];
          __stacks['${currentStackName}'].push(function(__parentScope, helpers) {
            let __scope = __parentScope;
            const __output = [];
            const __escape = helpers.filters.get('escape') || function(s){ return s; };
            const __filters = helpers.filters; const __functions = helpers.functions;
            ${this.getHelperFunctionsString()}
            try { ${stackJsCode} } catch (e) { throw new Error("Runtime error in stack: " + e.message); }
            return __output.join('');
          });\n`;
          inStackBlock = false; currentStackName = ''; stackContent = '';
        }
      }
      else if (token.startsWith('@stack')) {
        const stackMatch = token.match(/@stack\s*\(\s*'([^']+)'\s*\)/);
        if (stackMatch) {
          if (inSectionBlock) sectionContent += token;
          else jsCode += `if(__stacks['${stackMatch[1]}']) { __stacks['${stackMatch[1]}'].forEach(fn => __output.push(fn(__scope, helpers))); }\n`;
        }
      }
      else if (token === '@csrf') {
        if (inSectionBlock) sectionContent += token;
        else if (inStackBlock) stackContent += token;
        else jsCode += `__output.push(__functions.get('csrf')());\n`;
      }
      else if (token.startsWith('@yield')) {
        const yieldMatch = token.match(/@yield\s*\(\s*'([^']+)'(?:\s*,\s*'([^']*)')?\s*\)/);
        if (yieldMatch) {
          const name = yieldMatch[1], def = yieldMatch[2] || '';
          if (inSectionBlock) sectionContent += token;
          else jsCode += `__output.push(typeof __sections['${name}'] === 'function' ? __sections['${name}'](__scope, helpers) : (__sections['${name}'] !== undefined ? __sections['${name}'] : ${JSON.stringify(def)}));\n`;
        }
      } 
      else if (token.startsWith('@section') && token.includes(',')) {
        const sectionMatch = token.match(/@section\s*\(\s*'([^']+)'\s*,\s*'([^']*)'\s*\)/);
        if (sectionMatch) jsCode += `__sections['${sectionMatch[1]}'] = ${JSON.stringify(sectionMatch[2])};\n`;
      }
      else if (token.startsWith('@section') && !token.includes(',')) {
        const sectionMatch = token.match(/@section\s*\(\s*'([^']+)'\s*\)/);
        if (sectionMatch) { currentSectionName = sectionMatch[1]; inSectionBlock = true; sectionContent = ''; }
      }
      else if (token === '@endsection') {
        if (inSectionBlock && currentSectionName) {
          const sectionJsCode = this.enhancedConvertToJsCode(sectionContent);
          jsCode += `__sections['${currentSectionName}'] = function(__parentScope, helpers) {
            let __scope = __parentScope;
            const __output = []; const __sections = {};
            const __escape = helpers.filters.get('escape') || function(s){ return s; };
            const __filters = helpers.filters; const __functions = helpers.functions;
            ${this.getHelperFunctionsString()}
            try { ${sectionJsCode} } catch (e) { throw new Error("Runtime error in section: " + e.message); }
            return __output.join('');
          };\n`;
          inSectionBlock = false; currentSectionName = ''; sectionContent = '';
        }
      }
      else if (token.startsWith('@include')) {
        const includeMatch = token.match(/@include\s*\(\s*'([^']+)'\s*(?:,\s*([\s\S]*?))?\s*\)/);
        if (includeMatch) {
          const viewName = includeMatch[1];
          const dataExpr = includeMatch[2] ? includeMatch[2].trim() : '{}';
          
          if (inSectionBlock) sectionContent += token;
          else if (inStackBlock) stackContent += token;
          else jsCode += `__output.push(__include('${viewName}', ${dataExpr}));\n`;
        }
      }
      else if (token.startsWith('@extends')) {
        const extendsMatch = token.match(/@extends\s*\(\s*'([^']+)'\s*\)/);
        if (extendsMatch) jsCode += `const __layout = '${extendsMatch[1]}';\n`;
      }
    }
    
    const remainingText = template.slice(cursor);
    if (remainingText) {
      if (inSectionBlock) {
        sectionContent += remainingText;
        const sectionJsCode = this.enhancedConvertToJsCode(sectionContent);
        jsCode += `__sections['${currentSectionName}'] = function(__parentScope, helpers) {
          let __scope = __parentScope; const __output = []; const __sections = {};
          const __escape = helpers.filters.get('escape') || function(s){ return s; };
          const __filters = helpers.filters; const __functions = helpers.functions;
          ${this.getHelperFunctionsString()}
          try { ${sectionJsCode} } catch (e) { throw new Error("Runtime error in section: " + e.message); }
          return __output.join('');
        };\n`;
      } else if (inStackBlock) {
         stackContent += remainingText;
      } else {
        jsCode += `__output.push(${JSON.stringify(remainingText)});\n`;
      }
    }
    return jsCode;
  }

  getHelperFunctionsString() {
    return `
      function __get(name) {
        if (typeof __scope[name] !== 'undefined') return __scope[name];
        const parts = name.split('.');
        let value = __scope;
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) value = value[part];
          else return undefined; 
        }
        return value;
      }
      
      // [CRITICAL FIX] Preserve prototype chain to prevent losing root data variables (like langUrls, t, etc.)
      // Object.assign only copies own enumerable properties, ignoring the prototype chain where 
      // the original 'data' object properties reside.
      function __include(name, includeData = {}) {
        // 1. Create a new scope that inherits from the current scope's prototype (the original data)
        const mergedScope = Object.create(Object.getPrototypeOf(__scope));
        
        // 2. Copy own properties from current scope (e.g., loop variables) and includeData
        Object.assign(mergedScope, __scope, includeData);
        
        // 3. Prioritize pre-compiled includes (passed via render options)
        if (helpers.includes && helpers.includes[name]) {
            return helpers.includes[name](mergedScope, helpers);
        }
        
        // 4. Synchronously load and compile template from disk
        if (helpers.engine) {
            try {
                const content = helpers.engine.loadTemplateSync(name);
                const compiled = helpers.engine.compile(content);
                return compiled(mergedScope, helpers);
            } catch (e) {
                if (helpers.engine.options.debug) console.error('[AetherEngine] Include error:', e.message);
                return ''; // Fail silently or return empty in production
            }
        }
        return '';
      }
    `;
  }

  parseExpression(expr, isRaw = false) {
    if (!expr) return "''";
    if (expr.includes('|')) {
      const parts = expr.split('|').map(p => p.trim());
      let baseExpr = this.parseExpression(parts[0], isRaw);
      for (let i = 1; i < parts.length; i++) {
        const filterPart = parts[i];
        if (filterPart.includes(':')) {
          const [filterName, ...args] = filterPart.split(':');
          const parsedArgs = args.map(a => `'${a.trim()}'`).join(', ');
          baseExpr = `__filters.get('${filterName.trim()}')(${baseExpr}, ${parsedArgs})`;
        } else {
          baseExpr = `__filters.get('${filterPart}')(${baseExpr})`;
          if (filterPart === 'raw') isRaw = true;
        }
      }
      return baseExpr;
    }

    const keywords = ['true', 'false', 'null', 'undefined'];
    const tokenRegex = /(['"])(?:(?!\1|\\)[^\\]|\\.)*\1|(?<![.\w$])\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?:\s*\(((?:[^()]+|\([^()]*\))*)\))?/g;
    
    let parsed = expr.replace(tokenRegex, (match, quote, identifier, args) => {
      if (quote) return match;
      if (keywords.includes(identifier)) return match;
      if (args !== undefined) {
        const parsedArgs = args.trim() ? this.parseFunctionArguments(args.trim()) : '';
        return `((typeof __get('${identifier}') === 'function') ? __get('${identifier}')(${parsedArgs}) : __functions.get('${identifier}')(${parsedArgs}))`;
      }
      return `__get('${identifier}')`;
    });

    if (!isRaw) {
      if (/^__get\('[^']+'\)$/.test(parsed)) return `__escape(${parsed})`;
      if (!parsed.includes('__functions') && !parsed.includes('__filters') && !parsed.includes('__get(')) return `__escape(${parsed})`;
    }
    
    return parsed;
  }

  parseFunctionArguments(argsString) {
    const args = []; let currentArg = '', inString = false, stringChar = '';
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      if ((char === "'" || char === '"') && (i === 0 || argsString[i-1] !== '\\')) {
        if (!inString) { inString = true; stringChar = char; } 
        else if (char === stringChar) inString = false;
      }
      if (char === ',' && !inString) { args.push(currentArg.trim()); currentArg = ''; } 
      else currentArg += char;
    }
    if (currentArg.trim()) args.push(currentArg.trim());
    
    return args.map(arg => {
      if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) return arg;
      if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(arg)) return `__get('${arg}')`;
      if (!isNaN(arg) || arg === 'true' || arg === 'false' || arg === 'null') return arg;
      return `'${arg}'`;
    }).join(', ');
  }

  parseCondition(condition) {
    let parsed = condition || '';
    const keywords = ['true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'new', 'this'];
    const tokenRegex = /(['"])(?:(?!\1|\\)[^\\]|\\.)*\1|(?<![.\w$])\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?:\s*\(((?:[^()]+|\([^()]*\))*)\))?/g;
    parsed = parsed.replace(tokenRegex, (match, quote, identifier, args) => {
      if (quote) return match;
      if (keywords.includes(identifier)) return match;
      if (args !== undefined) {
        const parsedArgs = args.trim() ? this.parseFunctionArguments(args.trim()) : '';
        return `((typeof __get('${identifier}') === 'function') ? __get('${identifier}')(${parsedArgs}) : __functions.get('${identifier}')(${parsedArgs}))`;
      }
      return `__get('${identifier}')`;
    });
    return parsed;
  }

  parseForeachExpression(expression) {
    let match = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$.]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (match) return { collection: `__get('${match[1]}')`, key: match[2], item: match[3] };
    match = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$.]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (match) return { collection: `__get('${match[1]}')`, key: match[2], item: match[3] };
    match = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$.]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (match) return { collection: `__get('${match[1]}')`, key: null, item: match[2] };
    match = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s+in\s+([a-zA-Z_$][a-zA-Z0-9_$.]*)/);
    if (match) return { collection: `__get('${match[2]}')`, key: null, item: match[1] };
    return { collection: `__get('${expression.trim()}')`, key: null, item: 'item' };
  }
  
  compile(templateContent) {
    const cacheKey = crypto.createHash('md5').update(templateContent).digest('hex');
    if (this.options.cacheEnabled && this.options.compileCache.has(cacheKey)) return this.options.compileCache.get(cacheKey);
    
    let jsCode = '';
    try {
      jsCode = this.enhancedConvertToJsCode(templateContent);
      if (this.options.debug) console.log('\n--- Generated JS Code ---\n' + jsCode + '\n-------------------------\n');

      const renderFunc = new Function('data', 'helpers', `
        const __output = [];
        const __sections = {};
        const __stacks = {}; 
        const __escape = helpers.filters.get('escape') || function(s){ return s; };
        const __filters = helpers.filters;
        const __functions = helpers.functions;
        let __scope = Object.create(data || {}); 
        ${this.getHelperFunctionsString()}
        try { ${jsCode} } catch (e) { console.error('Template runtime error:', e); throw new Error("Runtime error in template: " + e.message); }
        return __output.join('');
      `);
      
      if (this.options.cacheEnabled) this.options.compileCache.set(cacheKey, renderFunc);
      return renderFunc;
    } catch (error) {
      console.error('\n--- FAILED JS CODE ---\n' + (jsCode || 'Code generation failed.') + '\n----------------------\n');
      throw new Error(`Template compilation failed: ${error.message}`);
    }
  }

  async render(templateName, data = {}, options = {}) {
    if (!this.initialized) this.initialize();
    let templateContent = templateName;
    
    const isFilePath = typeof templateName === 'string' && !templateName.includes('\n') && !templateName.includes('<') && (templateName.endsWith('.aether') || templateName.endsWith('.html') || templateName.includes('/') || templateName.includes('\\'));
    if (isFilePath) templateContent = await this.loadTemplate(templateName);
    
    // [FIX] Correct regex and match groups for layout inheritance
    const extendsMatch = templateContent.match(/@extends\s*\(\s*'([^']+)'\s*\)/);
    if (extendsMatch) {
      const layoutName = extendsMatch[1]; 
      try {
        const layoutContent = await this.loadTemplate(layoutName);
        const sections = {};
        
        const sectionRegex = /@section\s*\(\s*'([^']+)'\s*\)([\s\S]*?)@endsection/g;
        let sectionMatch;
        while ((sectionMatch = sectionRegex.exec(templateContent)) !== null) {
          sections[sectionMatch[1]] = sectionMatch[2].trim(); 
        }
        
        const inlineSectionRegex = /@section\s*\(\s*'([^']+)'\s*,\s*'([^']*)'\s*\)/g;
        let inlineMatch;
        while ((inlineMatch = inlineSectionRegex.exec(templateContent)) !== null) {
          sections[inlineMatch[1]] = inlineMatch[2]; 
        }
        
        const yieldRegex = /@yield\s*\(\s*'([^']+)'(?:\s*,\s*'([^']*)')?\s*\)/g;
        templateContent = layoutContent.replace(yieldRegex, (match, name, defaultValue) => 
          sections[name] !== undefined ? sections[name] : (defaultValue || '')
        );
      } catch (error) { 
        console.warn(`Warning: Could not load layout '${layoutName}':`, error.message); 
      }
    }
    
    const renderFunc = this.compile(templateContent);
    
    const renderedContent = renderFunc(data, { 
      filters: this.filters, 
      functions: this.functions, 
      includes: options.includes || {},
      engine: this 
    });
    
    if (this.options.compressionEnabled) {
      const compressionOptions = {
        minifyHTML: this.options.minifyHTML,
        minifyCSS: this.options.minifyCSS,
        minifyJS: this.options.minifyJS,
        mangleJS: this.options.mangleJS,
        removeComments: this.options.removeComments,
        collapseWhitespace: this.options.collapseWhitespace,
        removeAttributeQuotes: this.options.removeAttributeQuotes,
        removeEmptyAttributes: this.options.removeEmptyAttributes,
        cacheCompressed: this.options.cacheCompressed,
        ...options.compression 
      };
      
      if (this.compressionEngine) {
        const compressedContent = this.compressionEngine.processHTML(renderedContent, compressionOptions);
        
        if (this.options.debug) {
          const originalSize = renderedContent.length;
          const compressedSize = compressedContent.length;
          const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
          console.log(`[AetherEngine] Compression applied: ${originalSize} → ${compressedSize} bytes (${reduction}% reduction)`);
        }
        
        return compressedContent;
      }
    }
    
    return renderedContent;
  }

  _getTemplatePaths(templateName) {
    const paths = [
      path.join(this.options.templateDir, 'partials', `${templateName}.aether`),
      path.join(this.options.templateDir, 'components', `${templateName}.aether`),
      path.join(this.options.templateDir, 'pages', `${templateName}.aether`),
      path.join(this.options.templateDir, `${templateName}.aether`),
      path.join(this.options.templateDir, templateName),
      templateName 
    ];
    
    if (templateName.includes('.')) {
      const dotPath = templateName.replace(/\./g, path.sep) + '.aether';
      paths.unshift(path.join(this.options.templateDir, dotPath));
    }
    
    return paths;
  }

  async loadTemplate(templateName) {
    if (this.options.cacheEnabled && this.options.templateCache.has(templateName)) return this.options.templateCache.get(templateName);
    
    const possiblePaths = this._getTemplatePaths(templateName);
    for (const templatePath of possiblePaths) {
      try {
        const content = await fs.readFile(templatePath, 'utf-8');
        if (this.options.cacheEnabled) this.options.templateCache.set(templateName, content);
        return content;
      } catch (error) {}
    }
    throw new Error(`Template not found: ${templateName}`);
  }
  
  /**
   * [FIX] Synchronously load template from disk for runtime @include usage
   */
  loadTemplateSync(templateName) {
    if (this.options.cacheEnabled && this.options.templateCache.has(templateName)) {
      return this.options.templateCache.get(templateName);
    }
    
    const possiblePaths = this._getTemplatePaths(templateName);
    for (const templatePath of possiblePaths) {
      try {
        // Use readFileSync for synchronous loading required by __include
        const content = fs.readFileSync(templatePath, 'utf-8');
        if (this.options.cacheEnabled) this.options.templateCache.set(templateName, content);
        return content;
      } catch (error) {
        // Ignore and try next path
      }
    }
    throw new Error(`Template not found: ${templateName}`);
  }
}

export default AetherEngine;
