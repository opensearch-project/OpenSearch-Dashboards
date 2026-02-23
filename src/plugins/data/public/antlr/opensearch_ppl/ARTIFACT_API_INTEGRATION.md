# PPL Autocomplete Artifact API Integration

## Overview

This directory contains the integration with the OpenSearch PPL plugin's autocomplete artifact API. The API provides grammar artifacts and language catalogs that enhance the frontend autocomplete experience.

## Architecture

### Components

1. **ppl_artifact_loader.ts**
   - Fetches artifact bundles from the backend API endpoint `/_plugins/_ppl/_autocomplete/artifact`
   - Handles caching with ETag support in localStorage
   - Deserializes base64-encoded ATN and packed string arrays
   - Provides deserialized artifacts ready for use

2. **ppl_catalog_provider.ts**
   - Singleton service that manages catalog data from artifacts
   - Provides suggestion helpers for commands, functions, keywords, operators, and snippets
   - Lazily initializes on first use
   - Thread-safe initialization with promise deduplication

3. **code_completion.ts** (modified)
   - Integrates catalog provider into existing autocomplete flow
   - Enhances suggestions with backend catalog data when available
   - Gracefully degrades to frontend-only suggestions if API unavailable

## Data Flow

```
User types in editor
  ↓
getSimplifiedPPLSuggestions() called
  ↓
Initialize catalog provider (background, non-blocking)
  ↓
Parse query with existing ANTLR grammar
  ↓
Generate base suggestions from parse tree
  ↓
Enhance with catalog suggestions (if available)
  ↓
Return merged suggestions to user
```

## API Contract

### Endpoint
```
GET /_plugins/_ppl/_autocomplete/artifact
```

### Caching
- Uses ETag-based HTTP caching (If-None-Match header)
- Server returns 304 Not Modified if grammar unchanged
- Client caches in localStorage with key `ppl_autocomplete_artifact`
- Cache is indefinite - validated with ETag on each request

### Response Format
See API contract documentation for full details. Key fields:
- `lexerATN_b64`: Base64-encoded lexer ATN
- `parserATN_b64`: Base64-encoded parser ATN
- `catalogs`: Language-specific catalogs (commands, functions, keywords, etc.)
- `grammarHash`: SHA-256 hash for cache validation

## Usage

### Initialization

The catalog provider automatically initializes on first use:

```typescript
// Automatic initialization in getSimplifiedPPLSuggestions
if (!pplCatalogProvider.isInitialized()) {
  pplCatalogProvider.initialize(http, dataSourceId);
}
```

### Getting Suggestions

```typescript
// Get function suggestions
const functions = pplCatalogProvider.getFunctionSuggestions();

// Get all catalog suggestions
const allSuggestions = pplCatalogProvider.getAllCatalogSuggestions();
```

### Cache Management

```typescript
// Force refresh artifacts
await pplCatalogProvider.refresh(http, dataSourceId);

// Clear local cache
import { clearArtifactCache } from './ppl_artifact_loader';
clearArtifactCache();
```

## Graceful Degradation

The integration is designed to work gracefully when:
1. Backend API is unavailable (uses existing frontend grammar)
2. Network is offline (uses localStorage cache)
3. API returns errors (silently falls back)

The existing autocomplete continues to work without any backend dependency.

## Benefits

### Dynamic Updates
- Grammar catalogs can be updated on the backend without frontend redeployment
- New commands/functions become available immediately after OpenSearch plugin update

### Consistency
- Single source of truth for PPL language features
- Frontend and backend share same grammar artifacts

### Performance
- Efficient caching reduces network requests
- Base64 encoding reduces payload size (~50-80 KB uncompressed, ~15-20 KB gzipped)
- Non-blocking initialization doesn't delay autocomplete

## Testing

### Manual Testing

1. **Test API Fetch**
```bash
curl -s http://localhost:9200/_plugins/_ppl/_autocomplete/artifact | jq '.language, .grammarHash'
```

2. **Test Cache**
```javascript
// In browser console
localStorage.getItem('ppl_autocomplete_artifact')
localStorage.getItem('ppl_grammar_hash')
```

3. **Test Autocomplete**
- Open query editor
- Type PPL query
- Verify suggestions include catalog items
- Check Network tab for API call (should see 304 after first fetch)

### Unit Testing

To add tests for the new modules:

```typescript
import { deserializeArtifacts } from './ppl_artifact_loader';
import { pplCatalogProvider } from './ppl_catalog_provider';

describe('PPL Artifact Integration', () => {
  it('should deserialize artifacts correctly', () => {
    const bundle = { /* mock bundle */ };
    const artifacts = deserializeArtifacts(bundle);
    expect(artifacts.vocabulary).toBeDefined();
  });

  it('should provide catalog suggestions', () => {
    // Initialize with mock artifacts
    const suggestions = pplCatalogProvider.getFunctionSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

1. **Runtime Parser Generation**
   - Use deserialized ATN to create LexerInterpreter/ParserInterpreter
   - Eliminate need for compiled ANTLR grammar in frontend
   - Reduces bundle size and enables true dynamic grammar updates

2. **Incremental Updates**
   - Separate endpoint for catalog-only updates
   - Reduce payload when only catalogs change

3. **Multi-Language Support**
   - Extend to SQL, DQL, and other query languages
   - Shared artifact loading infrastructure

4. **Schema Integration**
   - Include index/field metadata in artifact bundle
   - Field-aware autocomplete without separate API calls

## Troubleshooting

### Artifact not loading
- Check browser console for errors
- Verify backend endpoint is accessible: `GET /_plugins/_ppl/_autocomplete/artifact`
- Check localStorage quota (may be full)

### Stale suggestions
- Clear cache: `localStorage.removeItem('ppl_autocomplete_artifact')`
- Force refresh: `pplCatalogProvider.refresh(http)`

### Performance issues
- Check Network tab for repeated API calls (should be cached)
- Verify ETag header is being sent
- Consider IndexedDB for larger artifacts

## References

- [Backend API Contract](./ARTIFACT_API_CONTRACT.md)
- [ANTLR 4 Documentation](https://github.com/antlr/antlr4/tree/master/doc)
- [antlr4ng Runtime](https://github.com/mike-lischke/antlr4ng)
- [HTTP Conditional Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
