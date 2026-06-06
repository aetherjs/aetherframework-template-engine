/**
 * @license MIT
 * Copyright (c) 2026-present AetherFramework Contributors.
 * SPDX-License-Identifier: MIT
 * @module @aetherframework/template-engine/src/utils/ErrorHandler
 */

/**
 * Error Handler - Handles and formats template engine errors
 * This class provides comprehensive error handling for template engine operations,
 * including error formatting, logging, and user-friendly error messages.
 */
class ErrorHandler {
  /**
   * Constructor for ErrorHandler class
   * @param {Object} options - Configuration options for error handling
   * @param {boolean} options.debug - Enable debug mode for detailed error information
   * @param {boolean} options.logErrors - Enable error logging to console
   * @param {boolean} options.formatErrors - Enable error formatting with context
   */
  constructor(options = {}) {
    this.options = {
      debug: options.debug || false,
      logErrors: options.logErrors !== false,
      formatErrors: options.formatErrors !== false,
      ...options
    };
  }
  
  /**
   * Static method to handle template engine errors
   * @param {Error} error - Original error object
   * @param {Object} context - Error context information
   * @returns {Error} Formatted error object
   */
  static handle(error, context = {}) {
    const handler = new ErrorHandler();
    return handler.formatError(error, context);
  }
  
  /**
   * Format error with additional context information
   * @param {Error} error - Original error object
   * @param {Object} context - Error context information
   * @returns {Error} Formatted error object
   */
  formatError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context
    };
    
    // Log error to console if logging is enabled
    if (this.options.logErrors) {
      console.error('Template Engine Error:', errorInfo);
    }
    
    // Format error if formatting is enabled
    if (this.options.formatErrors) {
      return this.createFormattedError(error, context);
    }
    
    return error;
  }
  
  /**
   * Create formatted error with helpful message and context
   * @param {Error} error - Original error object
   * @param {Object} context - Error context information
   * @returns {Error} Formatted error object
   * @private
   */
  createFormattedError(error, context) {
    let message = error.message;
    
    // Add template context information to error message
    if (context.template) {
      const templatePreview = typeof context.template === 'string' 
        ? context.template.substring(0, 100) + (context.template.length > 100 ? '...' : '')
        : 'Function';
      message += `\nTemplate: ${templatePreview}`;
    }
    
    // Add engine context information
    if (context.engine) {
      message += `\nEngine: ${context.engine}`;
    }
    
    // Add mode context information
    if (context.mode) {
      message += `\nMode: ${context.mode}`;
    }
    
    // Add data keys context information
    if (context.data && Object.keys(context.data).length > 0) {
      message += `\nData Keys: ${Object.keys(context.data).join(', ')}`;
    }
    
    // Create new error with formatted message
    const formattedError = new Error(message);
    formattedError.originalError = error;
    formattedError.context = context;
    formattedError.stack = error.stack;
    
    return formattedError;
  }
  
  /**
   * Handle template compilation errors
   * @param {Error} error - Compilation error object
   * @param {string} template - Template content
   * @param {string} templateName - Name of the template
   * @returns {Error} Formatted compilation error
   */
  handleCompilationError(error, template, templateName = 'anonymous') {
    const context = {
      type: 'compilation',
      templateName,
      templateLength: template.length,
      errorLocation: this.findErrorLocation(error, template)
    };
    
    return this.formatError(error, context);
  }
  
  /**
   * Handle template rendering errors
   * @param {Error} error - Rendering error object
   * @param {string} templateName - Name of the template
   * @param {Object} data - Template data object
   * @returns {Error} Formatted rendering error
   */
  handleRenderingError(error, templateName, data = {}) {
    const context = {
      type: 'rendering',
      templateName,
      dataKeys: Object.keys(data),
      dataSize: JSON.stringify(data).length
    };
    
    return this.formatError(error, context);
  }
  
  /**
   * Handle file system errors
   * @param {Error} error - File system error object
   * @param {string} filePath - Path to the file
   * @param {string} operation - File operation being performed
   * @returns {Error} Formatted file system error
   */
  handleFileSystemError(error, filePath, operation = 'read') {
    const context = {
      type: 'filesystem',
      filePath,
      operation,
      errorCode: error.code
    };
    
    return this.formatError(error, context);
  }
  
  /**
   * Find error location in template content
   * @param {Error} error - Error object
   * @param {string} template - Template content
   * @returns {Object|null} Error location information or null if not found
   * @private
   */
  findErrorLocation(error, template) {
    const stack = error.stack || '';
    const lines = template.split('\n');
    
    // Try to find line number from error message
    const lineMatch = error.message.match(/line (\d+)/i) || stack.match(/line (\d+)/i);
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1]) - 1;
      if (lineNumber >= 0 && lineNumber < lines.length) {
        return {
          line: lineNumber + 1,
          column: 0,
          snippet: lines[lineNumber].substring(0, 100)
        };
      }
    }
    
    // Try to find column from error message
    const columnMatch = error.message.match(/column (\d+)/i) || stack.match(/column (\d+)/i);
    if (columnMatch) {
      const column = parseInt(columnMatch[1]);
      return {
        line: 1,
        column,
        snippet: template.substring(column - 10, column + 10)
      };
    }
    
    return null;
  }
  
  /**
   * Create user-friendly error message for end users
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  getUserFriendlyMessage(error) {
    const errorType = error.originalError ? error.originalError.name : error.name;
    
    switch (errorType) {
      case 'SyntaxError':
        return 'Template syntax error, please check if the template syntax is correct.';
      case 'ReferenceError':
        return 'Template variable reference error, please check if the variable name is correct.';
      case 'TypeError':
        return 'Template type error, please check if the data types match.';
      case 'RangeError':
        return 'Template range error, please check loops or conditional statements.';
      case 'EvalError':
        return 'Template execution error, please check if the expressions are correct.';
      case 'URIError':
        return 'Template URL error, please check URL-related functions.';
      default:
        return 'An error occurred during template processing, please check the template and data.';
    }
  }
  
  /**
   * Get error recovery suggestions based on error type
   * @param {Error} error - Error object
   * @returns {Array<string>} Array of recovery suggestions
   */
  getRecoverySuggestions(error) {
    const suggestions = [];
    const message = error.message.toLowerCase();
    
    if (message.includes('not found') || message.includes('cannot find')) {
      suggestions.push('Check if the template file path is correct');
      suggestions.push('Confirm that the template file exists');
      suggestions.push('Check template file permissions');
    }
    
    if (message.includes('syntax') || message.includes('syntax error')) {
      suggestions.push('Check if the template syntax is correct');
      suggestions.push('Confirm all directives are properly closed');
      suggestions.push('Check variable reference format');
    }
    
    if (message.includes('variable') || message.includes('undefined')) {
      suggestions.push('Check if the variable name is correct');
      suggestions.push('Confirm the variable is defined in the data');
      suggestions.push('Check variable scope');
    }
    
    if (message.includes('cache') || message.includes('caching')) {
      suggestions.push('Try clearing the cache');
      suggestions.push('Check cache configuration');
      suggestions.push('Restart the template engine');
    }
    
    if (message.includes('permission') || message.includes('access denied')) {
      suggestions.push('Check file read/write permissions');
      suggestions.push('Confirm the running user has sufficient permissions');
      suggestions.push('Check directory permissions');
    }
    
    // Always add general suggestions
    suggestions.push('View detailed error logs');
    suggestions.push('Check template engine configuration');
    suggestions.push('Simplify the template and debug step by step');
    
    return suggestions;
  }
}

export default ErrorHandler;
