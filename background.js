// background.js - Handles the background logic for the search engine extension

// Store for custom search engines
let searchEngines = [];

// Initialize extension data when installed
browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get('searchEngines')
    .then(result => {
      if (result.searchEngines) {
        searchEngines = result.searchEngines;
      } else {
        // Initialize with empty array if not present
        browser.storage.local.set({ searchEngines: [] });
      }
    });
});

// Listen for messages from the popup or options page
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSearchEngines") {
    sendResponse({ searchEngines });
    return true;
  } else if (message.action === "addSearchEngine") {
    addSearchEngine(message.engine);
    sendResponse({ success: true });
    return true;
  } else if (message.action === "removeSearchEngine") {
    removeSearchEngine(message.id);
    sendResponse({ success: true });
    return true;
  } else if (message.action === "performSearch") {
    performSearch(message.engineId, message.searchTerms);
    sendResponse({ success: true });
    return true;
  }
});

// Add a new search engine
function addSearchEngine(engine) {
  // Generate a unique ID if not provided
  if (!engine.id) {
    engine.id = Date.now().toString();
  }
  
  // Check if this is an update to an existing engine
  const existingIndex = searchEngines.findIndex(e => e.id === engine.id);
  
  if (existingIndex >= 0) {
    searchEngines[existingIndex] = engine;
  } else {
    searchEngines.push(engine);
  }
  
  // Save to storage
  browser.storage.local.set({ searchEngines });
}

// Remove a search engine
function removeSearchEngine(id) {
  searchEngines = searchEngines.filter(engine => engine.id !== id);
  browser.storage.local.set({ searchEngines });
}

// Perform a search using the specified engine
function performSearch(engineId, searchTerms) {
  const engine = searchEngines.find(e => e.id === engineId);
  
  if (!engine) {
    console.error(`Search engine with ID ${engineId} not found`);
    return;
  }
  
  // Replace the placeholder with the search terms
  const url = engine.url.replace('{searchTerms}', encodeURIComponent(searchTerms));
  
  if (engine.method === 'POST') {
    // For POST requests, we need to open a new tab and submit a form
    browser.tabs.create({ url: 'search.html' }).then(tab => {
      browser.tabs.sendMessage(tab.id, { 
        action: 'submitForm',
        url: engine.url.split('?')[0], // Base URL without query parameters
        searchTerms,
        method: 'POST'
      });
    });
  } else {
    // For GET requests, simply open the URL
    browser.tabs.create({ url });
  }
}

// Listen for the omnibox input
browser.omnibox.onInputEntered.addListener((text, disposition) => {
  // Parse the input to determine search engine and query
  // Format: @engineName searchTerms
  const match = text.match(/^@(\w+)\s+(.+)$/);
  
  if (match) {
    const engineName = match[1].toLowerCase();
    const searchTerms = match[2];
    
    // Find the engine by name
    const engine = searchEngines.find(e => 
      e.name.toLowerCase() === engineName || 
      e.shortName?.toLowerCase() === engineName
    );
    
    if (engine) {
      performSearch(engine.id, searchTerms);
      return;
    }
  }
  
  // If no valid engine found or format incorrect, use default search
  browser.search.search({
    query: text
  });
});

// Update the search engines when storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.searchEngines) {
    searchEngines = changes.searchEngines.newValue;
  }
});
