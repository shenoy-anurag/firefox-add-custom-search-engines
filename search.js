// search.js - Handles form submissions for POST search requests

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'submitForm') {
    submitForm(message.url, message.searchTerms, message.method);
  }
});

// Submit the form with the search terms
function submitForm(url, searchTerms, method) {
  const form = document.getElementById('post-form');
  
  // Set the form action and method
  form.action = url;
  form.method = method || 'POST';
  
  // Create a hidden input field for the search terms
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'q'; // Default name, might need to be configurable
  input.value = searchTerms;
  
  // Add the input to the form
  form.appendChild(input);
  
  // Submit the form
  form.submit();
}
