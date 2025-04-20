// Generate an OpenSearch description XML for a search engine
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

// Export the function
export { generateOpenSearchXML };
