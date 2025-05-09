// popup.js - Handles the popup functionality

let searchEngines = [];
let activeEngineId = null;

document.addEventListener('DOMContentLoaded', initialize);

// Initialize the popup
function initialize() {
  // Load search engines
  browser.runtime.sendMessage({ action: 'getSearchEngines' })
    .then(response => {
      searchEngines = response.searchEngines || [];
      renderEngines();
      
      // If we have engines, select the first one by default
      if (searchEngines.length > 0) {
        setActiveEngine(searchEngines[0].id);
      }
    });

  // Add event listener for settings link
  document.getElementById('settings-link').addEventListener('click', openSettings);
  
  // Add event listener for search input
  document.getElementById('search-input').addEventListener('keydown', handleSearchKeyDown);
  
  // Focus the search input when popup opens
  document.getElementById('search-input').focus();
}

// Render the search engine buttons
function renderEngines() {
  const engineSelector = document.getElementById('engine-selector');
  const engineSelectorAddNew = document.getElementById('engine-selector-add');
  
  if (searchEngines.length === 0) {
    engineSelectorAddNew.style.display = 'block';
    document.getElementById('add-engine-link').addEventListener('click', openSettings);
    return;
  }
  
  searchEngines.forEach(engine => {
    const button = document.createElement('button');
    button.className = 'engine-button';
    button.dataset.id = engine.id;
    
    // Use default icon if none provided
    const iconUrl = engine.iconUrl || 'default-icon.png';
    
    const img = document.createElement('img');
    img.src = `${iconUrl}`
    img.classList = 'engine-icon'
    img.onerror = "this.src='default-icon.png'"
    const span = document.createElement('span');
    span.textContent = `${engine.name}`
    button.appendChild(img)
    button.appendChild(span)
    
    button.addEventListener('click', () => {
      setActiveEngine(engine.id);
    });
    
    engineSelector.appendChild(button);
  });
}

// Set the active search engine
function setActiveEngine(engineId) {
  activeEngineId = engineId;
  
  // Update UI to reflect active engine
  const buttons = document.querySelectorAll('.engine-button');
  buttons.forEach(button => {
    if (button.dataset.id === engineId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// Handle keydown in search input
function handleSearchKeyDown(event) {
  if (event.key === 'Enter') {
    const searchTerms = event.target.value.trim();
    
    if (searchTerms && activeEngineId) {
      performSearch(searchTerms);
    }
  }
}

// Perform a search with the active engine
function performSearch(searchTerms) {
  browser.runtime.sendMessage({
    action: 'performSearch',
    engineId: activeEngineId,
    searchTerms: searchTerms
  }).then(() => {
    // Close the popup after search is initiated
    window.close();
  });
}

// Open the options/settings page
function openSettings() {
  browser.runtime.openOptionsPage();
  window.close();
}
