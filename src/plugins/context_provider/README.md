# Context Provider Plugin

A modern React hooks-based context capture system for OpenSearch Dashboards. This plugin provides a clean, declarative way to capture both static and dynamic context from user interactions using RFC-compliant hooks.

## Features

- **React Hooks Architecture**: Modern hooks for context capture (`usePageContext`, `useDynamicContext`, `useAssistantContext`)
- **Static Context Capture**: Automatically captures URL-based context (time range, queries, datasets)
- **Dynamic Context Capture**: Captures user interactions (document expansion, text selection, table rows)
- **Context Pills UI**: Removable context badges in chat interface
- **Assistant Integration**: Global context store for AI assistant and MCP servers
- **Zero Plugin Modifications**: Works without modifying existing plugins

## Installation

1. Copy the `context_provider` plugin directory to `src/plugins/`
2. Add `contextProvider` to the `src/plugins/opensearch_dashboards.json` optional plugins list
3. Restart OpenSearch Dashboards

## Core Hooks

### `usePageContext` - Static Context from URLs
Automatically captures context from URL parameters (`_g`, `_a`, `_q`):

```typescript
import { usePageContext } from '../../../context_provider/public';

const MyApp: React.FC = () => {
  usePageContext({
    description: 'Explore page context',
    convert: (urlState) => ({
      appId: 'explore',
      timeRange: urlState._g?.time || { from: 'now-15m', to: 'now' },
      query: {
        query: urlState._q?.query || '',
        language: urlState._q?.language || 'PPL'
      },
      dataset: urlState._q?.dataset,
      dataSource: urlState._q?.dataset?.dataSource
    }),
    categories: ['page', 'explore', 'static']
  });

  return <YourAppContent />;
};
```

### `useDynamicContext` - State-Aware Context
Automatically re-registers context when React state changes:

```typescript
import { useDynamicContext } from '../../../context_provider/public';

const TableRow: React.FC = ({ rowData, isExpanded }) => {
  useDynamicContext(isExpanded ? {
    description: `Expanded document: ${rowData.id}`,
    value: rowData,
    categories: ['dynamic', 'explore', 'document']
  } : null);

  return <div>...</div>;
};
```

### `useAssistantContext` - Base Context Registration
Direct context registration without state monitoring:

```typescript
import { useAssistantContext } from '../../../context_provider/public';

const MyComponent: React.FC = () => {
  useAssistantContext({
    description: 'User preferences',
    value: { theme: 'dark', language: 'en' },
    categories: ['static', 'user']
  });

  return <div>...</div>;
};
```

### `useTextSelection` - Built-in Text Selection
Automatically captures text selections:

```typescript
import { useTextSelection } from '../../../context_provider/public';

const SelectableContent: React.FC = () => {
  useTextSelection(); // Automatically captures text selections

  return <div>Selectable content...</div>;
};
```

## Hook Architecture

### Hook Hierarchy
```
usePageContext (URL-based static context)
    ↓
useDynamicContext (React state-aware wrapper)
    ↓  
useAssistantContext (Base registration hook)
    ↓
AssistantContextStore (Global context storage)
```

### State Change Detection
`useDynamicContext` automatically monitors React state changes:

```typescript
// The hook uses useMemo with JSON.stringify to detect state changes
const contextOptions = useMemo(() => {
  return options ? {
    description: options.description,
    value: options.value, // ← React state value
    categories: options.categories || ['dynamic', 'state'],
  } : null;
}, [
  options?.description,
  JSON.stringify(options?.value), // ← Deep comparison detects React state changes
  options?.label,
  JSON.stringify(options?.categories),
]);
```

When React state changes, `JSON.stringify(options?.value)` produces a different string, triggering `useMemo` to recalculate, which causes `useAssistantContext` to re-register the context with updated values.

## Context Structure

### Static Context (from usePageContext)
```json
{
  "appId": "explore",
  "timeRange": { "from": "now-15m", "to": "now" },
  "query": { "query": "", "language": "PPL" },
  "dataset": {
    "id": "3mN8Jy_d2303840-7f1d-11f0-9eda...",
    "title": "opensearch_dashboards_sample_data_flights",
    "type": "INDEX_PATTERN",
    "timeFieldName": "timestamp"
  },
  "dataSource": {
    "id": "d2303840-7f1d-11f0-9eda-7d8a3a...",
    "title": "ai",
    "type": "OpenSearch"
  }
}
```

### Dynamic Context (from useDynamicContext)
```json
{
  "description": "Expanded document: doc_001",
  "value": {
    "@timestamp": "2024-01-15T10:30:00Z",
    "host.name": "web-server-01",
    "response.keyword": "200"
  },
  "categories": ["dynamic", "explore", "document"],
  "timestamp": 1693123456789
}
```

## Context Categories

- **Static Context**: `['page', 'explore', 'static']` - URL-based, doesn't change during session
- **Dynamic Context**: `['dynamic', 'explore', 'document']` - User interactions, changes frequently  
- **Selection Context**: `['dynamic', 'selection', 'text']` - Text/element selection
- **Chat Context**: `['dynamic', 'selection', 'chat']` - Chat-specific interactions

## Integration Examples

### Explore Plugin Integration
```typescript
// src/plugins/explore/public/application/index.tsx
import { usePageContext } from '../../../context_provider/public';

const ExploreApp: React.FC = ({ flavor }) => {
  usePageContext({
    description: `Explore ${flavor} page context`,
    convert: (urlState) => ({
      appId: 'explore',
      timeRange: urlState._g?.time,
      query: { query: urlState._q?.query, language: urlState._q?.language },
      dataset: urlState._q?.dataset,
      dataSource: urlState._q?.dataset?.dataSource
    }),
    categories: ['page', 'explore', 'static']
  });

  return <ExploreContent />;
};
```

### Table Row Context
```typescript
// src/plugins/explore/public/components/data_table/table_row.tsx
import { useDynamicContext } from '../../../../../context_provider/public';

const TableRow: React.FC = ({ hit, isExpanded }) => {
  useDynamicContext(isExpanded ? {
    description: `Expanded document data`,
    value: hit._source,
    categories: ['dynamic', 'explore', 'document']
  } : null);

  return <TableRowContent />;
};
```

### Text Selection Context
```typescript
// Any component with selectable text
import { useTextSelection } from '../../../context_provider/public';

const DocumentViewer: React.FC = () => {
  useTextSelection(); // Automatically handles text selection

  return (
    <div>
      <p>This text can be selected and will be captured as context.</p>
    </div>
  );
};
```

## Context Flow

```
URL Parameters → usePageContext → Static Context
     ↓
User Interactions → useDynamicContext → Dynamic Context
     ↓
Context Store → Chat Interface → Context Pills
     ↓
Assistant Context → MCP Server → AI Response
```

## Browser Console API

Global `assistantContextStore` is available for testing:

```javascript
// Get all contexts
window.assistantContextStore.getAllContexts()

// Get contexts by category
window.assistantContextStore.getContextsByCategory('dynamic')

// Clear all contexts
window.assistantContextStore.clearAll()

// Subscribe to context changes
const unsubscribe = window.assistantContextStore.subscribe(
  contexts => console.log('Contexts updated:', contexts)
)
```

## Available Actions

The plugin supports actions for AI assistant integration:

- `ADD_FILTER`: Add a filter to current view
- `REMOVE_FILTER`: Remove filters  
- `CHANGE_TIME_RANGE`: Change the time range
- `REFRESH_DATA`: Refresh current data
- `NAVIGATE_TO_DISCOVER`: Navigate to Discover app
- `NAVIGATE_TO_DASHBOARD`: Navigate to Dashboard app

```javascript
// Execute actions via global API
await window.contextProvider.executeAction('ADD_FILTER', {
  field: 'response.keyword',
  value: '200'
})

await window.contextProvider.executeAction('CHANGE_TIME_RANGE', {
  from: 'now-1h',
  to: 'now'
})
```

## Benefits of Hook Architecture

1. **Declarative**: Context is declared where it's used
2. **Automatic**: State changes automatically trigger context updates
3. **Type Safe**: Full TypeScript support
4. **Simple**: No complex registration or setup
5. **React Native**: Uses standard React patterns
6. **Performance**: Efficient re-registration only when needed
7. **Debugging**: Clear component-level context ownership

## Debugging

Context capture is logged to console:

- 🔧 Setup messages
- 🚀 Start messages  
- 📊 Context registration
- ⚡ Dynamic context updates
- 🎯 Action execution

## Testing

```typescript
// Test static context
// Navigate to /app/explore/logs and check console

// Test dynamic context  
// Expand table rows and check context store
window.assistantContextStore.getContextsByCategory('dynamic')

// Test text selection
// Select text and check context store
window.assistantContextStore.getContextsByCategory('selection')
```

## Advanced Usage

### Custom Context Processing
```typescript
const MyApp: React.FC = () => {
  usePageContext({
    description: 'Custom app context',
    convert: (urlState) => {
      // Custom URL parameter processing
      const customParam = urlState.searchParams.custom;
      return {
        appId: 'my-app',
        customData: customParam ? JSON.parse(customParam) : null,
        timestamp: Date.now()
      };
    },
    categories: ['page', 'custom']
  });

  return <AppContent />;
};
```

### Conditional Dynamic Context
```typescript
const ConditionalContext: React.FC = ({ data, shouldCapture }) => {
  useDynamicContext(shouldCapture && data ? {
    description: 'Conditional context',
    value: data,
    categories: ['dynamic', 'conditional']
  } : null);

  return <Content />;
};
```

### Multiple Context Registration
```typescript
const MultiContextComponent: React.FC = ({ user, settings, data }) => {
  // Static user context
  useAssistantContext({
    description: 'User information',
    value: user,
    categories: ['static', 'user']
  });

  // Static settings context
  useAssistantContext({
    description: 'Application settings',
    value: settings,
    categories: ['static', 'settings']
  });

  // Dynamic data context
  useDynamicContext(data ? {
    description: 'Current data',
    value: data,
    categories: ['dynamic', 'data']
  } : null);

  return <ComponentContent />;
};
```

## Future Enhancements

- Additional built-in hooks for common patterns
- Context persistence across page reloads
- Advanced context filtering and transformation
- Real-time context streaming to external services
- Integration with more OpenSearch Dashboards plugins