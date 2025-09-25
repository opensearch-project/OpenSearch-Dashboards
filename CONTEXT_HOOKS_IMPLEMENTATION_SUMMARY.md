# Context Hooks Implementation Summary

## Overview

Successfully implemented CopilotKit-inspired context hooks for OpenSearch Dashboards AI Assistant integration. These hooks provide a simple, declarative API for registering context that automatically flows to AI agents through the existing AG-UI protocol.

## Implemented Files

### Core Hooks
1. **`src/plugins/context_provider/public/hooks/use_assistant_context.ts`**
   - Base hook for context registration
   - Handles automatic lifecycle management (register on mount, cleanup on unmount)
   - Deep comparison for value changes using JSON.stringify

2. **`src/plugins/context_provider/public/hooks/use_page_context.ts`**
   - Zero-config URL state capture
   - Custom conversion functions for app-specific context
   - Automatic URL change monitoring (popstate, hashchange, polling)
   - OpenSearch Dashboards parameter parsing (`_g`, `_a`)

3. **`src/plugins/context_provider/public/hooks/use_dynamic_context.ts`**
   - React state tracking (similar to CopilotKit's `useCopilotReadable`)
   - Automatic context updates when state changes
   - Convenience hooks: `useStringContext`, `useObjectContext`, `useArrayContext`

### Supporting Files
4. **`src/plugins/context_provider/public/index.ts`** - Updated exports
5. **`src/plugins/context_provider/public/examples/context_hooks_example.tsx`** - Usage examples
6. **`src/plugins/context_provider/public/hooks/README.md`** - Comprehensive documentation

## Key Features

### 🎯 CopilotKit-Inspired API
- **Automatic Registration**: Hooks handle context lifecycle automatically
- **Deep Value Comparison**: Detects React state changes using JSON.stringify
- **Category-based Organization**: Filter contexts for different use cases
- **Declarative API**: Simple, hook-based interface

### 🔗 Seamless Integration
- **Existing Infrastructure**: Uses current `AssistantContextStore`
- **AG-UI Protocol**: Flows through existing `RunAgentInput.context[]`
- **Chat Compatibility**: Works with current chat system without changes
- **Tool Access**: Tools can access context through AG-UI server

### 📊 OpenSearch Dashboards Optimizations
- **URL State Parsing**: Automatic `_g`, `_a` parameter extraction
- **URL Change Detection**: Monitors both browser events and programmatic changes
- **App-specific Context**: Custom conversion functions for different apps

## Usage Examples

### Zero-config Page Context
```typescript
const pageContextId = usePageContext();
```

### Custom Page Context
```typescript
const pageContextId = usePageContext({
  description: "Dashboard state",
  convert: (urlState) => ({
    dashboardId: urlState._a?.dashboardId,
    timeRange: urlState._g?.time,
  }),
  categories: ['dashboard', 'page']
});
```

### Dynamic React State Context
```typescript
const [selectedItems, setSelectedItems] = useState([]);
const selectionContextId = useDynamicContext({
  description: "Currently selected items",
  value: selectedItems,
  categories: ['selection', 'ui-state']
});
```

## Context Flow Architecture

```
React Component
    ↓ (usePageContext/useDynamicContext)
AssistantContextStore (window.assistantContextStore)
    ↓ (addContext/removeContext)
ChatService.sendMessage()
    ↓ (contextStore.getBackendFormattedContexts('chat'))
AG-UI Protocol (RunAgentInput.context[])
    ↓ (HTTP POST to AG-UI server)
AI Agent
```

## Integration Points

### 1. **AssistantContextStore**
- Global context store at `window.assistantContextStore`
- Category-based organization and filtering
- Automatic cleanup and lifecycle management

### 2. **ChatService**
- Retrieves contexts via `contextStore.getBackendFormattedContexts('chat')`
- Sends contexts in `RunAgentInput.context[]` array
- Maintains existing AG-UI protocol compatibility

### 3. **AG-UI Protocol**
- Contexts sent as `{ description: string, value: any }[]`
- Tools can access contexts through AG-UI server
- No changes needed to existing tool implementations

## Performance Optimizations

### 1. **Memoization**
- `useMemo` for context options to prevent unnecessary re-registrations
- Deep comparison only when dependencies actually change

### 2. **Efficient URL Monitoring**
- Event-based detection for browser navigation
- Polling fallback for programmatic URL changes
- Debounced updates to prevent excessive captures

### 3. **Automatic Cleanup**
- Context automatically removed on component unmount
- No memory leaks or stale context entries

## Categories System

Contexts can be categorized for different use cases:
- `page`, `url` - Page and URL-based context
- `dynamic`, `state` - React state context  
- `selection`, `ui-state` - UI interaction context
- `form`, `user-input` - Form and input context
- `dashboard`, `visualization` - Dashboard-specific context
- `chat` - Context specifically for chat interactions

## Migration Path

### From Manual Context Registration
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

## Testing

The implementation includes:
- **Example Component**: Comprehensive usage examples in `context_hooks_example.tsx`
- **TypeScript Support**: Full type definitions and interfaces
- **Error Handling**: Graceful fallbacks when context store is unavailable
- **Documentation**: Detailed README with best practices

## Next Steps

1. **Plugin Integration**: Update existing plugins to use new hooks
2. **Testing**: Add unit tests for hook behavior
3. **Performance Monitoring**: Monitor context registration/cleanup performance
4. **Documentation**: Update main RFC with implemented hooks
5. **Migration Guide**: Create migration guide for existing manual context usage

## Compatibility

- ✅ **Backward Compatible**: Existing manual context registration still works
- ✅ **No Breaking Changes**: Current chat system unchanged
- ✅ **Tool Compatibility**: Existing tools work without modification
- ✅ **AG-UI Protocol**: Maintains existing protocol structure

The implementation successfully provides CopilotKit-style simplicity while leveraging OpenSearch Dashboards' existing, well-tested context infrastructure.