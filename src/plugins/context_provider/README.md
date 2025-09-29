# Context Provider Plugin

A modern React hooks-based context capture system for OpenSearch Dashboards. This plugin provides a clean, declarative way to capture both static and dynamic context from user interactions using direct browser URL monitoring.

## Features

- **React Hooks Architecture**: Modern hooks for context capture (`usePageContext`, `useDynamicContext`)
- **Static Context Capture**: Automatically captures URL-based context (time range, queries, datasets)
- **Dynamic Context Capture**: Captures user interactions (document expansion, text selection, table rows)
- **Text Selection**: Built-in text selection capture with visual indicators
- **MCP Integration**: Global context store for AI assistant and MCP servers
- **Zero Plugin Modifications**: Works without modifying existing plugins
- **Direct Browser URL Monitoring**: Uses native browser APIs for universal compatibility

## Installation

1. Copy the `context_provider` plugin directory to `src/plugins/`
2. Add `contextProvider` to the `src/plugins/opensearch_dashboards.json` optional plugins list
3. Restart OpenSearch Dashboards

## Available Hooks

### `usePageContext` - Automatic URL State Capture

Automatically captures page context from URL state, including OpenSearch Dashboards-specific parameters like `_g` and `_a`. Uses direct browser URL monitoring for universal compatibility across all plugins.

#### Zero-config usage:
```typescript
import { usePageContext } from '../../../context_provider/public';

// Automatically captures current URL state
const pageContextId = usePageContext();
```

#### Custom usage with conversion:
```typescript
const pageContextId = usePageContext({
  description: "Current dashboard state",
  convert: (urlState) => ({
    dashboardId: urlState._a?.dashboardId,
    timeRange: urlState._g?.time,
    filters: urlState._g?.filters,
  }),
  categories: ['dashboard', 'page']
});
```

### `useDynamicContext` - Manual Context Registration

Base hook for registering context with the assistant context store. Tracks React state and automatically updates assistant context when state changes.

```typescript
import { useDynamicContext } from '../../../context_provider/public';

const contextId = useDynamicContext({
  description: "User preferences",
  value: { theme: 'dark', language: 'en' },
  label: "User Settings",
  categories: ['user', 'preferences']
});
```

#### State-aware usage:
```typescript
const [selectedItems, setSelectedItems] = useState([]);
const selectionContextId = useDynamicContext({
  description: "Currently selected items",
  value: selectedItems,
  label: `${selectedItems.length} items selected`,
  categories: ['selection', 'ui-state']
});
```

#### Conditional context:
```typescript
const TableRow: React.FC = ({ rowData, isExpanded }) => {
  useDynamicContext(isExpanded ? {
    description: `Expanded document: ${rowData.id}`,
    value: rowData,
    categories: ['dynamic', 'explore', 'document']
  } : null);

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
useDynamicContext (Base registration hook)
    ↓
AssistantContextStore (Global context storage)
```

### How It Works

1. **Registration**: Hooks automatically register context with the global `AssistantContextStore`
2. **Updates**: Context is updated when dependencies change (URL changes, React state changes)
3. **Cleanup**: Context is automatically removed when components unmount
4. **Categories**: Context can be categorized for filtering (e.g., only send 'chat' category contexts to chat)
5. **MCP Integration**: Context flows through global store → MCP servers → AI agents

### URL Monitoring Architecture

The system uses **direct browser URL monitoring** for universal compatibility:

- **Browser Events**: `hashchange`, `popstate` events for navigation detection
- **History Interception**: Monitors `pushState`, `replaceState` for programmatic navigation
- **Polling Fallback**: 1-second polling as safety net for edge cases
- **OpenSearch Dashboards Utilities**: Uses built-in `getStateFromOsdUrl` for automatic rison decoding
- **Plugin Boundary Respect**: No plugin dependencies, works universally

### State Change Detection
`useDynamicContext` automatically monitors React state changes using deep comparison to detect when context should be re-registered with updated values.

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

- **Static Context**: `['static', 'explore']` - URL-based, doesn't change during session
- **Dynamic Context**: `['dynamic', 'explore', 'document']` - User interactions, changes frequently
- **Selection Context**: `['dynamic', 'selection', 'text']` - Text/element selection

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
    categories: ['static', 'explore']
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
React Component
    ↓ (usePageContext/useDynamicContext)
AssistantContextStore
    ↓ (window.assistantContextStore)
MCP Server Integration
    ↓ (contextStore.getBackendFormattedContexts())
AI Agent
```

### Categories

Context can be categorized for different use cases:

- `static`, `page` - Page and URL-based context
- `dynamic`, `explore` - React state context
- `selection`, `text` - UI interaction context
- `document` - Document-specific context

### Best Practices

1. **Use descriptive descriptions**: The description is sent to the AI agent
2. **Categorize appropriately**: Use categories to control which contexts are sent to which agents
3. **Avoid large objects**: Context values are serialized, so keep them reasonably sized
4. **Use enabled flag**: Conditionally enable/disable context registration
5. **Leverage conversion functions**: Transform URL state into meaningful context for your use case

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

## Context Options Interface

```typescript
interface AssistantContextOptions {
  description: string;    // Backend description of the context
  value: any;            // Actual data payload for backend
  label?: string;        // User-friendly label for UI display
  categories?: string[]; // Optional categories for filtering (default: ['default'])
  id?: string;          // Optional unique ID (auto-generated if not provided)
}
```

## Backend Integration

The system formats contexts for backend consumption:

```typescript
// Only description and value are sent to backend
const backendContexts = contextStore.getBackendFormattedContexts('chat');
// Returns: Array<{ description: string; value: any }>
```

## Key Features

1. **Multi-Context Support**: Multiple contexts accumulate from different components simultaneously
2. **Automatic Lifecycle Management**: Contexts are automatically cleaned up when components unmount or state changes
3. **Category-Based Organization**: Contexts are organized by purpose for efficient filtering
4. **Optimized Backend Communication**: UI labels stay client-side, only essential data sent to backend
5. **Full TypeScript Support**: Type-safe interfaces for all context operations
6. **Direct Browser URL Monitoring**: Universal compatibility without plugin dependencies

## Action System

For executing actions (filters, navigation, etc.), use the modern `AssistantActionService` instead of the legacy action system. Actions are now handled through the dynamic action registration system for better modularity and flexibility.

## Migration from Manual Context Registration

If you're currently using manual context registration:

```typescript
// Old way
useEffect(() => {
  const contextStore = window.assistantContextStore;
  const id = contextStore.addContext({
    description: "My context",
    value: myValue,
    categories: ['my-category']
  });
  return () => contextStore.removeContext(id);
}, [myValue]);

// New way
const contextId = useDynamicContext({
  description: "My context",
  value: myValue,
  categories: ['my-category']
});
```

The new hooks provide automatic lifecycle management and better performance through memoization.

## Benefits of Hook Architecture

1. **Declarative**: Context is declared where it's used
2. **Automatic**: State changes automatically trigger context updates
3. **Type Safe**: Full TypeScript support
4. **Simple**: No complex registration or setup
5. **React Native**: Uses standard React patterns
6. **Performance**: Efficient re-registration only when needed
7. **Debugging**: Clear component-level context ownership
8. **Universal Compatibility**: Works across all plugins without dependencies

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
    categories: ['static', 'custom']
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
  useDynamicContext({
    description: 'User information',
    value: user,
    categories: ['static', 'user']
  });

  // Static settings context
  useDynamicContext({
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