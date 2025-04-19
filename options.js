// options.js - Handles the options page functionality

document.addEventListener('DOMContentLoaded', loadSearchEngines);

// DOM references
const addEngineBtn = document.getElementById('add-engine-btn');
const engineModal = document.getElementById('engine-modal');
const engineForm = document.getElementById('engine-form');
const cancelBtn = document.getElementById('cancel-btn');
const engineList = document.getElementById('engine-list');
const modalTitle = document.getElementById('modal-title');
const iconPreview = document.getElementById('icon-preview');
const iconUrlInput = document.getElementById('engine-icon');

// Event listeners
addEngineBtn.addEventListener('click', showAddEngineModal);
cancelBtn.addEventListener('click', hideModal);
engineForm.addEventListener('submit', saveEngine);
iconUrlInput.addEventListener('input', updateIconPreview);

// Load and display search engines
function loadSearchEngines() {
  browser.storage.local.get('searchEngines')
    .then(result => {
      const engines = result.searchEngines || [];
      
      if (engines.length === 0) {
        engineList.innerHTML = `
          <div class="no-engines">
            <p>No custom search engines added yet.</p>
            <p>Click "Add New Engine" to get started.</p>
          </div>
        `;
        return;
      }
      
      engineList.innerHTML = '';
      engines.forEach(engine => {
        const engineEl = createEngineElement(engine);
        engineList.appendChild(engineEl);
      });
    });
}

// Create HTML element for a search engine
function createEngineElement(engine) {
  const engineEl = document.createElement('div');
  engineEl.className = 'engine-item';
  
  const iconUrl = engine.iconUrl || 'default-icon.png';
  
  engineEl.innerHTML = `
    <img src="${iconUrl}" class="engine-icon" onerror="this.src='default-icon.png'">
    <div class="engine-details">
      <div class="engine-name">${engine.name}</div>
      <div class="engine-url">${engine.url}</div>
    </div>
    <div class="engine-actions">
      <button class="edit-btn" data-id="${engine.id}">Edit</button>
      <button class="delete-btn" data-id="${engine.id}">Delete</button>
    </div>
  `;
  
  // Add event listeners for edit and delete buttons
  engineEl.querySelector('.edit-btn').addEventListener('click', () => {
    showEditEngineModal(engine);
  });
  
  engineEl.querySelector('.delete-btn').addEventListener('click', () => {
    deleteEngine(engine.id);
  });
  
  return engineEl;
}

// Show modal to add a new engine
function showAddEngineModal() {
  modalTitle.textContent = 'Add New Search Engine';
  engineForm.reset();
  document.getElementById('engine-id').value = '';
  iconPreview.style.backgroundImage = '';
  engineModal.style.display = 'block';
}

// Show modal to edit an existing engine
function showEditEngineModal(engine) {
  modalTitle.textContent = 'Edit Search Engine';
  
  document.getElementById('engine-id').value = engine.id;
  document.getElementById('engine-name').value = engine.name;
  document.getElementById('engine-url').value = engine.url;
  document.getElementById('engine-icon').value = engine.iconUrl || '';
  document.getElementById('engine-method').value = engine.method || 'GET';
  document.getElementById('engine-shortname').value = engine.shortName || '';
  
  if (engine.iconUrl) {
    iconPreview.style.backgroundImage = `url('${engine.iconUrl}')`;
  } else {
    iconPreview.style.backgroundImage = '';
  }
  
  engineModal.style.display = 'block';
}

// Hide the modal
function hideModal() {
  engineModal.style.display = 'none';
}

// Update icon preview when URL changes
function updateIconPreview() {
  const iconUrl = iconUrlInput.value;
  
  if (iconUrl) {
    iconPreview.style.backgroundImage = `url('${iconUrl}')`;
  } else {
    iconPreview.style.backgroundImage = '';
  }
}

// Save a search engine
function saveEngine(event) {
  event.preventDefault();
  
  const engine = {
    id: document.getElementById('engine-id').value || Date.now().toString(),
    name: document.getElementById('engine-name').value,
    url: document.getElementById('engine-url').value,
    iconUrl: document.getElementById('engine-icon').value,
    method: document.getElementById('engine-method').value,
    shortName: document.getElementById('engine-shortname').value
  };
  
  // Validate the URL contains the search terms placeholder
  if (!engine.url.includes('{searchTerms}')) {
    alert('Search URL must contain {searchTerms} placeholder');
    return;
  }
  
  browser.runtime.sendMessage({
    action: 'addSearchEngine',
    engine: engine
  }).then(() => {
    hideModal();
    loadSearchEngines();
  });
}

// Delete a search engine
function deleteEngine(id) {
  if (confirm('Are you sure you want to delete this search engine?')) {
    browser.runtime.sendMessage({
      action: 'removeSearchEngine',
      id: id
    }).then(() => {
      loadSearchEngines();
    });
  }
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === engineModal) {
    hideModal();
  }
});
