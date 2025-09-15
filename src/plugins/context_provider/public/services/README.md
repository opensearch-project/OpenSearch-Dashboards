# Context Capture Service

The `ContextCaptureService` is the core service that manages context capture, contributor registration, and action execution within the Context Provider plugin. It handles both static context (application state) and dynamic context (user interactions).

## Overview

The service acts as a central hub that:
- **Manages Context Contributors**: Registers and coordinates plugin-specific context providers
- **Captures Static Context**: Automatically captures application state on navigation and URL changes  
- **Handles Dynamic Context**: Processes real-time user interactions via UI actions
- **Executes Actions**: Provides a unified API for modifying application state
- **Manages Context Deduplication**: Ensures singleton context types have only one active instance

## Architecture

```
ContextCaptureService
├── Context Contributors Registry (Map<appId, ContextContributor>)
├── Static Context Stream (BehaviorSubject<StaticContext>)
├── Dynamic Context Stream (BehaviorSubject<DynamicContext>)
├── URL Monitoring System
└── Action Execution Engine
```

## Static vs Dynamic Context

### Static Context
Static context represents the **current state** of an application that persists in URLs or can be captured at a point in time:

```typescript
interface StaticContext {
  appId: string;           // Current application ID
  timestamp: number;       // When context was captured
  data: Record<string, any>; // Context data including:
    // - URL information (pathname, search, hash)
    // - Data context (timeRange, filters, query)
    // - App-specific state (dashboard config, index patterns)
    // - Contributor-provided context
}
```

**Examples of Static Context:**
- Current dashboard ID and configuration
- Applied filters and time range
- Active index patterns
- Query strings and search parameters
- Application settings and preferences

**When Static Context is Captured:**
- User navigates to a new application
- URL parameters change (time range, filters, etc.)
- Manual refresh via `refreshCurrentContext()`
- Custom events trigger recapture

### Dynamic Context
Dynamic context captures **real-time user interactions** and transient UI states not reflected in URLs:

```typescript
interface DynamicContext {
  appId?: string;          // App that generated the context
  trigger: string;         // UI action that triggered capture
  timestamp: number;       // When interaction occurred
  data: Record<string, any>; // Interaction-specific data
}
```

**Examples of Dynamic Context:**
- Document expansions in data tables
- Field selections and hover states
- Embeddable panel interactions
- Form field focus and selections
- Custom UI component interactions

**When Dynamic Context is Captured:**
- UI actions registered in `contextTriggerActions` occur
- Custom events are dispatched
- Direct calls to `captureDynamicContext()`

## How Plugin Developers Use the Service

### 1. Register as a Context Contributor

Create a contributor that implements the `ContextContributor` interface:

```typescript
import { ContextContributor } from '../types';

export class MyAppContextContributor implements ContextContributor {
  appId = 'my-app';
  
  // Define UI actions you want to monitor
  contextTriggerActions = [
    'DOCUMENT_EXPAND',
    'FIELD_SELECT',
    'CUSTOM_ACTION'
  ];

  // Capture static context when app loads or URL changes
  async captureStaticContext(): Promise<Record<string, any>> {
    return {
      type: 'my-app',
      currentView: this.getCurrentView(),
      selectedData: this.getSelectedData(),
      appSettings: this.getAppSettings(),
    };
  }

  // Handle dynamic user interactions
  captureDynamicContext(trigger: string, data: any): Record<string, any> {
    switch (trigger) {
      case 'DOCUMENT_EXPAND':
        return {
          documentId: data.documentId,
          documentData: data.documentData,
          expandedAt: Date.now(),
        };
      case 'FIELD_SELECT':
        return {
          fieldName: data.fieldName,
          fieldValue: data.fieldValue,
          selectionType: data.selectionType,
        };
      default:
        return { trigger, data, timestamp: Date.now() };
    }
  }

  // Optional: Handle apps with sub-routes
  canHandleApp(appId: string): boolean {
    return appId === this.appId || appId.startsWith(`${this.appId}/`);
  }
}
```

### 2. Register Your Contributor

In your plugin's start method:

```typescript
export class MyPlugin implements Plugin {
  public start(core: CoreStart, { contextProvider }: StartDeps) {
    const contributor = new MyAppContextContributor();
    contextProvider.registerContextContributor(contributor);
  }
}
```

### 3. Trigger Dynamic Context

From your UI components, trigger dynamic context capture:

```typescript
// Method 1: Using UI Actions (recommended)
uiActions.executeTriggerActions('DOCUMENT_EXPAND', {
  documentId: 'doc-123',
  documentData: { title: 'Sample Doc', content: '...' }
});

// Method 2: Custom events (fallback)
window.dispatchEvent(new CustomEvent('contextTrigger', {
  detail: {
    trigger: 'FIELD_SELECT', 
    data: { fieldName: 'status', fieldValue: 'active' }
  }
}));

// Method 3: Direct service call (if available)
contextCaptureService.captureDynamicContext('CUSTOM_ACTION', actionData);
```

## How Chat UI Consumes Context

The Chat UI uses the `ChatContextManager` to consume context from the service:

### 1. Subscribe to Context Streams

```typescript
export class ChatContextManager {
  public start(core: CoreStart): void {
    // Get the global context provider service
    this.contextProvider = (window as any).contextProvider;

    // Subscribe to static context updates
    this.contextProvider.getStaticContext$().subscribe((staticContext) => {
      if (staticContext) {
        this.processStaticContext(staticContext);
      }
    });

    // Subscribe to dynamic context updates  
    this.contextProvider.getDynamicContext$().subscribe((dynamicContext) => {
      if (dynamicContext) {
        this.processDynamicContext(dynamicContext);
      }
    });
  }
}
```

### 2. Process Context into UI Elements

The Chat UI converts raw context into structured `ContextItem` objects:

```typescript
private processStaticContext(staticContext: any): void {
  const contextItems: ContextItem[] = [];
  const data = staticContext.data || {};

  // Extract time range
  if (data.dataContext?.timeRange) {
    contextItems.push({
      id: 'time_range',
      type: ContextType.TIME_RANGE,
      label: `${data.dataContext.timeRange.from} to ${data.dataContext.timeRange.to}`,
      data: data.dataContext.timeRange,
      source: 'static',
      timestamp: staticContext.timestamp,
    });
  }

  // Extract filters, queries, dashboard info, etc.
  // ...

  this.updateContexts(contextItems);
}
```

### 3. Display Context as Interactive Pills

Context appears in the chat UI as colored pills that users can:
- **Pin**: Keep context persistent across navigation
- **Exclude**: Remove from current chat session  
- **Refresh**: Manually trigger context recapture

## Service Implementation Details

### URL Monitoring System

The service automatically monitors URL changes to refresh context:

```typescript:src/plugins/context_provider/public/services/context_capture_service.ts:54-107
private setupUrlMonitoring(): void {
  let lastUrl = window.location.href;
  let lastHash = window.location.hash;

  const handleUrlChange = () => {
    const currentUrl = window.location.href;
    const currentHash = window.location.hash;

    if (currentUrl !== lastUrl || currentHash !== lastHash) {
      // Get current app and refresh context
      const currentAppId = window.location.pathname.split('/app/')[1]?.split('/')[0];
      if (currentAppId) {
        this.captureStaticContext(currentAppId);
      }
      
      lastUrl = currentUrl;
      lastHash = currentHash;
    }
  };

  // Listen for browser navigation
  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);
  
  // Poll for programmatic URL changes
  const urlCheckInterval = setInterval(handleUrlChange, 1000);
}
```

### Context Deduplication

Singleton context types (time range, query, etc.) are automatically deduplicated:

```typescript:src/plugins/context_provider/public/services/context_capture_service.ts:25
const SINGLETON_CONTEXT_TYPES = new Set(['time_range', 'query', 'index_pattern', 'app_state']);
```

```typescript:src/plugins/context_provider/public/services/context_capture_service.ts:203-221
private deduplicateContext(contextData: Record<string, any>): Record<string, any> {
  const deduplicated: Record<string, any> = {};

  Object.keys(contextData).forEach((key) => {
    const contextType = this.inferContextType(key);
    
    if (contextType && SINGLETON_CONTEXT_TYPES.has(contextType)) {
      // For singleton types, always replace existing value
      deduplicated[key] = contextData[key];
      this.contextStore.set(contextType, contextData[key]);
    } else {
      // For non-singleton types, preserve the value
      deduplicated[key] = contextData[key];
    }
  });

  return deduplicated;
}
```

### Action Execution Engine

The service provides a unified API for executing actions:

```typescript:src/plugins/context_provider/public/services/context_capture_service.ts:458-486
public async executeAction(actionType: string, params: any): Promise<any> {
  switch (actionType) {
    case 'ADD_FILTER':
      return this.addFilter(params);
    case 'REMOVE_FILTER':
      return this.removeFilter(params);
    case 'CHANGE_TIME_RANGE':
      return this.changeTimeRange(params);
    case 'REFRESH_DATA':
      return this.refreshData();
    case 'NAVIGATE_TO_DISCOVER':
      return this.navigateToDiscover(params);
    case 'NAVIGATE_TO_DASHBOARD':
      return this.navigateToDashboard(params);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
```

## Advanced Usage

### Stateful Context Contributors

For complex applications with transient state, implement `StatefulContextContributor`:

```typescript
import { 
  StatefulContextContributor, 
  ContextCapturePattern 
} from '../types';

export class AdvancedContextContributor implements StatefulContextContributor {
  appId = 'advanced-app';
  capturePattern = ContextCapturePattern.HYBRID;
  
  // Track transient state
  private expandedDocuments = new Map<string, any>();
  private selectedFields = new Set<string>();
  
  contextTriggerActions = ['DOCUMENT_EXPAND', 'FIELD_SELECT'];

  async captureStaticContext(): Promise<Record<string, any>> {
    // Combine URL state + transient state
    const urlContext = this.parseUrlState();
    const transientState = this.getTransientState();
    
    return {
      type: 'advanced-app',
      ...urlContext,
      ...transientState,
      metadata: this.getStateMetadata(),
    };
  }

  getTransientState(): Record<string, any> {
    return {
      expandedDocuments: Array.from(this.expandedDocuments.values()),
      selectedFields: Array.from(this.selectedFields),
      hasActiveInteractions: this.expandedDocuments.size > 0,
    };
  }

  updateTransientState(trigger: string, data: any): void {
    // Update internal state based on interactions
  }
  
  clearTransientState(): void {
    this.expandedDocuments.clear();
    this.selectedFields.clear();
  }
  
  getStateMetadata() {
    return {
      hasTransientState: this.expandedDocuments.size > 0,
      stateComplexity: this.expandedDocuments.size > 3 ? 'complex' : 'simple',
      lastInteraction: Date.now(),
      customProperties: {}
    };
  }
}
```

### Custom Action Execution

Contributors can implement their own action handlers:

```typescript
export class ActionCapableContributor implements ContextContributor {
  // ... other methods ...

  getAvailableActions(): string[] {
    return ['EXPAND_DOCUMENT', 'COLLAPSE_ALL', 'REFRESH_VIEW'];
  }

  async executeAction(actionType: string, params: any): Promise<any> {
    switch (actionType) {
      case 'EXPAND_DOCUMENT':
        return this.expandDocument(params.documentId);
      case 'COLLAPSE_ALL':
        return this.collapseAllDocuments();
      case 'REFRESH_VIEW':
        return this.refreshCurrentView();
      default:
        throw new Error(`Unknown action: ${actionType}`);
    }
  }
}
```

## Debugging and Troubleshooting

### Debug Logging

The service provides extensive debug logging:

```typescript
console.log('🔧 Context Capture Service Setup');
console.log('🚀 Context Capture Service Start');  
console.log('📊 Capturing static context for app:', appId);
console.log('⚡ Context Capture: Processing dynamic context for trigger:', trigger);
console.log('🎯 Executing action:', actionType);
```

### Common Issues

1. **Context Not Captured**: 
   - Verify contributor is registered with correct `appId`
   - Check `canHandleApp()` method covers your use case
   - Ensure required services are available

2. **Dynamic Context Not Working**:
   - Verify `contextTriggerActions` includes your trigger
   - Check UI action execution is working
   - Ensure `captureDynamicContext()` method exists and returns data

3. **Actions Not Executing**:
   - Check action is listed in `getAvailableActions()`
   - Verify required parameters are provided
   - Ensure core services (data, application) are available

### Browser Console Testing

Access the service via the global `contextProvider` object:

```javascript
// Test static context capture
await window.contextProvider.getCurrentContext()

// Test dynamic context
window.contextProvider.captureDynamicContext('TEST_ACTION', { test: true })

// Test actions
await window.contextProvider.executeAction('ADD_FILTER', { 
  field: 'status', 
  value: 'active' 
})

// View available actions
window.contextProvider.getAvailableActions()
```

## API Reference

### Core Methods

```typescript
class ContextCaptureService {
  // Context streams
  getStaticContext$(): Observable<StaticContext | null>
  getDynamicContext$(): Observable<DynamicContext | null>
  
  // Context capture
  captureDynamicContext(trigger: string, data: any): void
  
  // Contributor management  
  registerContextContributor(contributor: ContextContributor): void
  unregisterContextContributor(appId: string): void
  
  // Action execution
  executeAction(actionType: string, params: any): Promise<any>
  
  // Lifecycle
  setup(): void
  start(core: CoreStart, plugins: ContextProviderStartDeps): void
  stop(): void
}
```

### Context Types

```typescript
interface StaticContext {
  appId: string;
  timestamp: number;
  data: Record<string, any>;
}

interface DynamicContext {
  appId?: string;
  trigger: string;
  timestamp: number;
  data: Record<string, any>;
}
```

This service forms the foundation for context-aware AI assistance in OpenSearch Dashboards by providing a unified way to capture, manage, and act upon user context across all applications.