/**
 * Search Module Entry Point
 * Exposes all search-related functions to window.SearchModule
 */

import * as SearchModule from './search.js';

// Expose to window for onclick handlers
window.SearchModule = SearchModule;

// Export for ES6 imports
export * from './search.js';
