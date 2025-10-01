# Context Provider Plugin

A React hooks-based context capture system for OpenSearch Dashboards that enables AI assistants to understand user interactions and page state.

## Overview

The Context Provider plugin provides React hooks that automatically capture user context and make it available to AI assistants. It uses a simple hook-based architecture that integrates seamlessly with existing React components.

## Plugin Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Provider Plugin                   │
├─────────────────────────────────────────────────────────────┤
│  React Hooks Layer                                          │
│  ├── usePageContext()     - URL-based static context       │
│  ├── useDynamicContext()  - React state context            │
│  ├── useTextSelection()   - Text selection capture         │
│  └── useAssistantAction() - AI tool definitions            │
├─────────────────────────────────────────────────────────────┤
│  Context Management Layer                                   │
│  ├── AssistantContextStore - Global context storage        │
│  └── AssistantActionService - Tool registration            │
├─────────────────────────────────────────────────────────────┤
│  Integration Layer                                          │
│  ├── Chat Plugin Integration - Context → AI requests       │
│  └── Browser API Integration - URL monitoring              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interactions → React Components → Context Hooks → AssistantContextStore → Chat Plugin → AI Assistant
     ↓                    ↓                ↓               ↓                    ↓              ↓
URL Changes         Component State    Context Updates   Global Store      AGUIRequest    Tool Calls
Text Selection      Props Changes     Hook Registration  Categories        Formatting     Responses
Document Expansion  Event Handlers    Automatic Cleanup  Filtering         Backend API    Results
```

## Available Hooks

### usePageContext Hook

Automatically captures page context from URL state, including OpenSearch Dashboards-specific parameters like `_g`, `_a`, and `_q`.

#### Zero-config usage:
```typescript
import { usePageContext } from '../../../context_provider/public';

export function MyApp() {
  // Automatically captures current URL state
  usePageContext();
  
  return <div>Your App UI...</div>;
}
```

#### Custom usage with conversion:
```typescript
export function MyApp() {
  usePageContext({
    description: "Current application state",
    convert: (urlState) => ({
      appId: 'my-app',
      timeRange: urlState._g?.time,
      query: urlState._q?.query,
      filters: urlState._g?.filters,
    }),
    categories: ['static', 'my-app']
  });
  
  return <div>Your App UI...</div>;
}
```

### useDynamicContext Hook

Base hook for registering any React state with the assistant context store.

```typescript
import { useDynamicContext } from '../../../context_provider/public';

export function DataTable() {
  const [selectedRows, setSelectedRows] = useState([]);
  
  // AI knows about selected rows
  useDynamicContext({
    description: "Currently selected table rows",
    value: selectedRows,
    label: `${selectedRows.length} rows selected`,
    categories: ['dynamic', 'selection']
  });
  
  return <div>Your table UI...</div>;
}
```

#### Conditional context:
```typescript
export function TableRow({ rowData, isExpanded }) {
  useDynamicContext(isExpanded ? {
    description: `Expanded document: ${rowData.id}`,
    value: rowData,
    label: `Document ${rowData.id}`,
    categories: ['dynamic', 'document']
  } : null);

  return <div>...</div>;
}
```

### useTextSelection Hook

Automatically captures text selections:

```typescript
import { useTextSelection } from '../../../context_provider/public';

export function SelectableContent() {
  useTextSelection(); // Automatically captures text selections
  
  return <div>Selectable content...</div>;
}
```

## Assistant Actions

The `useAssistantAction` hook enables plugins to define interactive tools that the AI assistant can call.

### Simple Query Action Example

```typescript
import { useAssistantAction } from '../../../context_provider/public';

interface QueryArgs {
  query: string;
  autoExecute?: boolean;
}

export function useQueryAction() {
  const dispatch = useDispatch();
  
  useAssistantAction<QueryArgs>({
    name: 'execute_query',
    description: 'Execute a query in the application',
    
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query to execute'
        },
        autoExecute: {
          type: 'boolean',
          description: 'Whether to run the query immediately'
        }
      },
      required: ['query']
    },
    
    handler: async ({ query, autoExecute = true }) => {
      if (autoExecute) {
        dispatch(executeQuery(query));
        return { success: true, message: 'Query executed' };
      } else {
        dispatch(setQuery(query));
        return { success: true, message: 'Query updated' };
      }
    },
    
    render: ({ status, args, result }) => {
      if (status === 'executing') {
        return <div>Executing: {args?.query}</div>;
      }
      if (status === 'complete') {
        return <div>✓ {result?.message}</div>;
      }
      return null;
    }
  });
}
```

## Context Categories and Filtering

Context can be organized by categories for different use cases. Here are some example categories:

- `['static', 'page']` - URL-based context that doesn't change during session
- `['dynamic', 'selection']` - User interactions that change frequently  
- `['dynamic', 'document']` - Document-specific context
- `['chat']` - Contexts specifically for chat interactions

```typescript
// Example: Get only chat-specific contexts
const chatContexts = contextStore.getBackendFormattedContexts('chat');
```

## Browser Console API

Global `assistantContextStore` is available for debugging:

```javascript
// Get all contexts
window.assistantContextStore.getAllContexts()

// Get contexts by category  
window.assistantContextStore.getContextsByCategory('dynamic')

// Get formatted contexts for backend
window.assistantContextStore.getBackendFormattedContexts('chat')

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
  id?: string;          // Optional unique ID for context management
  description: string;  // Description sent to backend
  value: any;          // Data payload sent to backend
  label: string;       // User-friendly label for UI display
  categories?: string[]; // Categories for filtering (default: ['default'])
}
```

## How It Works

### URL Monitoring
The system uses direct browser URL monitoring for universal compatibility:
- **Browser Events**: `hashchange`, `popstate` events for navigation detection
- **History Interception**: Monitors `pushState`, `replaceState` for programmatic navigation
- **OpenSearch Dashboards Utilities**: Uses built-in `getStateFromOsdUrl` for automatic rison decoding

### Context Lifecycle
1. **Registration**: Hooks automatically register context with the global `AssistantContextStore`
2. **Updates**: Context is updated when dependencies change (URL changes, React state changes)
3. **Cleanup**: Context is automatically removed when components unmount
4. **Categories**: Context can be categorized for filtering
5. **Backend Integration**: Context flows through global store → chat plugin → AI assistant

## Best Practices

1. **Use descriptive descriptions**: The description is sent to the AI agent
2. **Categorize appropriately**: Use categories to control which contexts are sent to which agents
3. **Avoid large objects**: Context values are serialized, so keep them reasonably sized
4. **Use conditional context**: Only register context when it's relevant
5. **Leverage conversion functions**: Transform URL state into meaningful context

## Architecture Benefits

1. **Declarative**: Context is declared where it's used
2. **Automatic**: State changes automatically trigger context updates  
3. **Type Safe**: Full TypeScript support
4. **Simple**: No complex registration or setup
5. **React Native**: Uses standard React patterns
6. **Performance**: Efficient re-registration only when needed
7. **Universal Compatibility**: Works across all plugins without dependencies