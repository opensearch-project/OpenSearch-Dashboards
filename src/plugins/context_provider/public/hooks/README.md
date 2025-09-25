# Context Provider Hooks

This directory contains React hooks for integrating with the OpenSearch Dashboards AI Assistant context system. These hooks provide a CopilotKit-inspired API for registering context that gets automatically sent to AI agents.

## Available Hooks

### `useAssistantContext`

Base hook for registering context with the assistant context store. All other context hooks build on this foundation.

```typescript
import { useAssistantContext } from '@osd/context-provider';

const contextId = useAssistantContext({
  description: "User preferences",
  value: { theme: 'dark', language: 'en' },
  label: "User Settings",
  categories: ['user', 'preferences']
});
```

### `usePageContext`

Automatically captures page context from URL state, including OpenSearch Dashboards-specific parameters like `_g` and `_a`.

#### Zero-config usage:
```typescript
import { usePageContext } from '@osd/context-provider';

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

### `useDynamicContext`

Tracks React state and automatically updates assistant context when state changes. Similar to CopilotKit's `useCopilotReadable`.

```typescript
import { useDynamicContext } from '@osd/context-provider';

const [selectedItems, setSelectedItems] = useState([]);
const selectionContextId = useDynamicContext({
  description: "Currently selected items",
  value: selectedItems,
  label: `${selectedItems.length} items selected`,
  categories: ['selection', 'ui-state']
});
```

### Convenience Hooks

#### `useStringContext`
```typescript
const contextId = useStringContext("Current user", userName, ['user']);
```

#### `useObjectContext`
```typescript
const contextId = useObjectContext("Form data", formState, ['form']);
```

#### `useArrayContext`
```typescript
const contextId = useArrayContext("Selected items", selectedItems, ['selection']);
```

## How It Works

1. **Registration**: Hooks automatically register context with the global `AssistantContextStore`
2. **Updates**: Context is updated when dependencies change (URL changes, React state changes)
3. **Cleanup**: Context is automatically removed when components unmount
4. **Categories**: Context can be categorized for filtering (e.g., only send 'chat' category contexts to chat)
5. **AG-UI Integration**: Context flows through `ChatService` → AG-UI protocol → AI agents

## Context Flow

```
React Component
    ↓ (usePageContext/useDynamicContext)
AssistantContextStore
    ↓ (window.assistantContextStore)
ChatService.sendMessage()
    ↓ (contextStore.getBackendFormattedContexts('chat'))
AG-UI Protocol (RunAgentInput.context[])
    ↓
AI Agent
```

## Categories

Context can be categorized for different use cases:

- `page`, `url` - Page and URL-based context
- `dynamic`, `state` - React state context
- `selection`, `ui-state` - UI interaction context
- `form`, `user-input` - Form and input context
- `dashboard`, `visualization` - Dashboard-specific context
- `chat` - Context specifically for chat interactions

## Best Practices

1. **Use descriptive descriptions**: The description is sent to the AI agent
2. **Categorize appropriately**: Use categories to control which contexts are sent to which agents
3. **Avoid large objects**: Context values are serialized, so keep them reasonably sized
4. **Use enabled flag**: Conditionally enable/disable context registration
5. **Leverage conversion functions**: Transform URL state into meaningful context for your use case

## Examples

See `../examples/context_hooks_example.tsx` for comprehensive usage examples.

## Integration with Existing System

These hooks integrate seamlessly with the existing context infrastructure:

- **AssistantContextStore**: Uses the existing global context store
- **AG-UI Protocol**: Context flows through the existing `RunAgentInput.context[]` array
- **Chat Integration**: Works with the current chat system without changes
- **Tool Access**: Tools can access context through the AG-UI server

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