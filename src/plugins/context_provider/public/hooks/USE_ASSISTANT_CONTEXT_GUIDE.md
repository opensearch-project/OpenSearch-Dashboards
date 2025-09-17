# useAssistantContext Hook - OSD Assistant Framework

## Overview
`useAssistantContext` is a React hook that's part of the OpenSearch Dashboards Assistant framework. It enables components to register contextual data with the assistant system, providing rich context for AI-powered interactions. The hook automatically manages the lifecycle of context entries and supports multiple concurrent contexts through a category-based accumulation system.

## Implementation Architecture

### Core Components
1. **AssistantContextStore** (`/src/plugins/context_provider/public/services/assistant_context_store.ts`)
   - Central store managing all contexts with Map-based storage
   - Category indexing for efficient filtering
   - Exposed globally via `window.assistantContextStore`

2. **useAssistantContext Hook** (`/src/plugins/context_provider/public/hooks/use_assistant_context.ts`)
   - React hook for easy context registration
   - Automatic cleanup on unmount
   - Null-safe design (pass null to remove context)

3. **Context Pills UI** (`/src/plugins/chat/public/components/context_pills.tsx`)
   - Visual representation of active contexts
   - Click-to-remove functionality
   - Category-based filtering

## Usage Guide

### Basic Usage
```typescript
import { useAssistantContext } from '../path/to/context_provider/public';

function MyComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Register context when state changes
  useAssistantContext(
    isExpanded
      ? {
          description: 'Detailed description for backend',  // Sent to backend
          value: dataObject,                                // Sent to backend
          label: 'UI Display Label',                        // UI only
          categories: ['explore', 'chat']                   // Filtering
        }
      : null  // Pass null to remove context
  );
}
```

### Context Options
```typescript
interface AssistantContextOptions {
  description: string;    // Backend description of the context
  value: any;            // Actual data payload for backend
  label: string;         // User-friendly label for UI display
  categories?: string[]; // Optional categories for filtering (default: ['default'])
  id?: string;          // Optional unique ID (auto-generated if not provided)
}
```

### Backend Integration
The chat service formats contexts for backend consumption:
```typescript
// Only description and value are sent to backend
const backendContexts = contextStore.getBackendFormattedContexts('chat');
// Returns: Array<{ description: string; value: any }>
```

### Real Example - Table Row Expansion
```typescript
export const TableRowUI = ({ row, index, ...props }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useAssistantContext(
    isExpanded
      ? {
          description: `Expanded row ${index + 1} from data table`,
          value: row._source,  // Log entry data
          label: `Row ${index + 1}`,
          categories: ['explore', 'chat'],
        }
      : null
  );

  return <TableRowContent />;
};
```

## Key Features
1. **Multi-Context Support**: Multiple contexts accumulate from different components simultaneously
2. **Automatic Lifecycle Management**: Contexts are automatically cleaned up when components unmount or state changes
3. **Category-Based Organization**: Contexts are organized by purpose (e.g., 'chat', 'explore') for efficient filtering
4. **Optimized Backend Communication**: UI labels stay client-side, only essential data (description & value) sent to backend
5. **Full TypeScript Support**: Type-safe interfaces for all context operations

## Integration Checklist
- [x] Import hook from context_provider public exports
- [x] Define context with description, value, and label
- [x] Add appropriate categories for your use case
- [x] Pass null when context should be removed
- [x] Context Pills automatically display in chat UI

## Architecture Design
The OSD Assistant framework uses direct React hook integration to provide:
- **Simplicity**: Direct component integration without complex event systems
- **Type Safety**: Full TypeScript support with compile-time checking
- **Debuggability**: Clear data flow and straightforward troubleshooting
- **React-Native Patterns**: Idiomatic React patterns for state and lifecycle management
- **Performance**: Efficient updates through React's rendering optimization