// import { generateOpenSearchXML } from "./opensearch-template.js"
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

const instructionsToggleBtn = document.getElementById('toggle-instructions');

// Event listeners
addEngineBtn.addEventListener('click', showAddEngineModal);
cancelBtn.addEventListener('click', hideModal);
engineForm.addEventListener('submit', saveEngine);
iconUrlInput.addEventListener('input', updateIconPreview);

instructionsToggleBtn.addEventListener('click', showHideInstructionsModal);

// const service = { createPasteURL: 'https://paste.centos.org/api/create', getRawPasteURL: 'https://paste.centos.org/view/raw/' }
const service = { createPasteURL: 'https://dpaste.org/api/' }


function generateOpenSearchXML(engine) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>${escapeXML(engine.shortName || engine.name)}</ShortName>
  <Description>${escapeXML(engine.name)} Search</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${escapeXML(engine.iconUrl)}</Image>
  <Url type="text/html" method="${engine.method || 'GET'}" template="${escapeXML(engine.url.replace('{searchTerms}', '{searchTerms}'))}"/>
  <moz:SearchForm>${escapeXML(engine.url.split('?')[0])}</moz:SearchForm>
</OpenSearchDescription>`;
}

// Helper function to escape XML special characters
function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getPasteId(url) {
  const parts = url.split('/');
  // The pasteid is the last segment after the final '/'
  const pasteId = parts[parts.length - 1];
  return pasteId;
}

async function createPaste(opensearchXML) {
  try {
    let response = await fetch(service.createPasteURL, {
      method: "POST",
      body: new URLSearchParams({
        content: opensearchXML,
        // title: 'CustomSearchEngines-' + encodeURIComponent(engine.name) + Date.now().toString(),
        format: "json",
        expires: "onetime",
        lexer: "xml"
      })
    });

    const json = await response.json();
    console.log(json);

    const url = json.url + "/raw";
    return url
  } catch (error) {
    alert(error);
  };
}

// Function to create and install a custom search engine
async function createAndShowInstallSearchEnginePage(engine) {
  // Generate OpenSearch XML from the provided data
  const opensearchXML = generateOpenSearchXML(engine);

  const xmlURL = await createPaste(opensearchXML);

  // Doesn't work as Firefox requires an external url for the OpenSearch XML.
  // // Create a blob URL for the XML
  // const xmlBlob = new Blob([opensearchXML], { type: 'application/opensearchdescription+xml' });
  // const xmlURL = URL.createObjectURL(xmlBlob);
  // console.log(opensearchXML);

  // Create an HTML page that will help install the search engine
  const searchInstallPage = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Install ${engine.name}</title>
    <link rel="search" 
          type="application/opensearchdescription+xml" 
          title="${engine.name}" 
          href="${xmlURL}">
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 50dvw;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3vw;
        }

        h1 {
            margin: 0;
            color: #3366cc;
        }

        .icon-preview {
            width: 32px;
            height: 32px;
            display: inline-block;
            vertical-align: middle;
            margin-left: 10px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }

        .engine-preview {
            display: flex;
            flex-direction: row;
            gap: 2vw;
            margin-bottom: 3vw;
        }

        .install-engine-name {
            margin: 0;
            color: #6e6e6e;
            font-size: xx-large;
            font-weight: 700;
        }

        .separator {
            width: 100%;
            border: 1px solid #ddd;
            margin-top: 2vw;
            margin-bottom: 2vw;
            border-radius: 4px;
        }
    </style>
  </head>
  <body>
    <h1 id="install-engine-body-title" class="header">Install Search Engine</h1>
    <div class="engine-preview">
        <div class="icon-preview" style="background-image: url(${engine.iconUrl});"></div>
        <p id="install-engine-name" class="install-engine-name">${engine.name}</p>
    </div>
    <p>Look for the "+" icon in your address bar to add this search engine.</p>
    <p id="install-engine-body-name">If you don't see it, click the search icon (magnifying glass) in the address bar and look for an option to add "${engine.name}".</p>
    <div class="separator"></div>
  </body>
  </html>
`;

  // Create a blob URL for the HTML page
  const htmlBlob = new Blob([searchInstallPage], { type: 'text/html' });
  const installPageURL = URL.createObjectURL(htmlBlob);

  // Open the page to prompt installation
  browser.tabs.create({ url: installPageURL });

  //   browser.tabs.create({ url: 'install.html' }).then(tab => {
  //     browser.tabs.sendMessage(tab.id, {
  //         action: 'loadSearchEnginePage',
  //         engine: engine,
  //         xmlURL: xmlURL,
  //         method: 'GET'
  //     });
  // });
}

// Load and display search engines
function loadSearchEngines() {
  browser.storage.local.get('searchEngines')
    .then(result => {
      const engines = result.searchEngines || [];

      if (engines.length === 0) {
        const engineSelectorNoEngines = getElementById("engine-list-no-engines");
        engineSelectorNoEngines.style.display = 'block';
        return;
      }

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

  const img = document.createElement('img');
  img.src = `${iconUrl}`
  img.classList = 'engine-icon'
  img.onerror = "this.src='default-icon.png'"
  const engineDetailsEl = document.createElement('div');
  engineDetailsEl.classList = 'engine-details'
  const engineDetailsNameEl = document.createElement('div');
  engineDetailsNameEl.classList = 'engine-name'
  engineDetailsNameEl.textContent = `${engine.name}`
  const engineDetailsURLEl = document.createElement('div');
  engineDetailsURLEl.classList = 'engine-url'
  engineDetailsURLEl.textContent = `${engine.url}`
  const engineDetailsShortNameEl = document.createElement('div');
  engineDetailsShortNameEl.classList = 'engine-shortname'
  engineDetailsShortNameEl.textContent = `${engine.shortName ? `Short name: ${engine.shortName}` : ''}`
  engineDetailsEl.appendChild(engineDetailsNameEl)
  engineDetailsEl.appendChild(engineDetailsURLEl)
  engineDetailsEl.appendChild(engineDetailsShortNameEl)

  const engineActionsEl = document.createElement('div');
  engineActionsEl.classList = 'engine-actions'
  const engineActionsInstallButton = document.createElement('button');
  engineActionsInstallButton.classList = 'install-btn'
  engineActionsInstallButton.dataId = `${engine.id}`
  engineActionsInstallButton.textContent = `Install`
  const engineActionsEditButton = document.createElement('button');
  engineActionsEditButton.classList = 'edit-btn'
  engineActionsEditButton.dataId = `${engine.id}`
  engineActionsEditButton.textContent = `Edit`
  const engineActionsDeleteButton = document.createElement('button');
  engineActionsDeleteButton.classList = 'delete-btn'
  engineActionsDeleteButton.dataId = `${engine.id}`
  engineActionsDeleteButton.textContent = `Delete`
  engineActionsEl.appendChild(engineActionsInstallButton)
  engineActionsEl.appendChild(engineActionsEditButton)
  engineActionsEl.appendChild(engineActionsDeleteButton)

  engineEl.appendChild(img)
  engineEl.appendChild(engineDetailsEl)
  engineEl.appendChild(engineActionsEl)

  // Add event listeners for edit and delete buttons
  engineEl.querySelector('.install-btn').addEventListener('click', () => {
    createAndShowInstallSearchEnginePage(engine);
  });

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
  const shortName = engine.shortName ? engine.shortName.toLowerCase() : '';

  document.getElementById('engine-id').value = engine.id;
  document.getElementById('engine-name').value = engine.name;
  document.getElementById('engine-url').value = engine.url;
  document.getElementById('engine-icon').value = engine.iconUrl || '';
  document.getElementById('engine-method').value = engine.method || 'GET';
  document.getElementById('engine-shortname').value = shortName;

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

  // Validate that a short name is provided
  if (!engine.shortName) {
    alert('Short name is required for Awesome Bar integration');
    return;
  }

  // Show loading indicator or message
  const saveBtn = document.getElementById('save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  browser.runtime.sendMessage({
    action: 'addSearchEngine',
    engine: engine
  }).then((response) => {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;

    if (response.success) {
      hideModal();
      loadSearchEngines();
    } else {
      alert(`Error saving search engine: ${response.error || 'Unknown error'}`);
    }
  }).catch(error => {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    alert(`Failed to save search engine: ${error.message}`);
  });

  createAndShowInstallSearchEnginePage(engine);
}

// Delete a search engine
function deleteEngine(id) {
  if (confirm('Are you sure you want to delete this search engine?')) {
    browser.runtime.sendMessage({
      action: 'removeSearchEngine',
      id: id
    }).then((response) => {
      if (response.success) {
        loadSearchEngines();
      } else {
        alert(`Error deleting search engine: ${response.error || 'Unknown error'}`);
      }
    }).catch(error => {
      alert(`Failed to delete search engine: ${error.message}`);
    });
  }
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === engineModal) {
    hideModal();
  }
});


// Instructions Modal
function showHideInstructionsModal() {
  const instructionsContent = document.getElementById('instructions-content');
  if (instructionsContent.style.display === 'none') {
    instructionsContent.style.display = 'block';
    instructionsToggleBtn.textContent = 'Hide Instructions';

    // Lazy load the instructions content
    if (!instructionsContent.hasChildNodes()) {
      instructionsContent.appendChild(createInstructionsElement());
    }
  } else {
    instructionsContent.style.display = 'none';
    instructionsToggleBtn.textContent = 'Show Instructions';
  }
}