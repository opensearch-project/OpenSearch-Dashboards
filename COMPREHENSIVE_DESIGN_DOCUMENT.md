# Global User Interaction Capture System - Comprehensive Design Document
## Option 4: Hierarchical Context with UI Actions Integration

## Executive Summary

This document details the design for a **Hierarchical Global User Interaction Capture System** for OpenSearch Dashboards (OSD) that captures ALL user clicks across any page with zero component modifications. The system provides basic DOM context for all interactions and enriches them with semantic context from UI Actions and plugin-specific sources, organizing everything in a clean hierarchical structure.

## 1. Architecture Overview

### 1.1 Option 4: Hierarchical Context Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OpenSearch Dashboards                                 │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Explore   │  │  Dashboard  │  │   Discover  │  │    ...      │           │
│  │   Plugin    │  │   Plugin    │  │   Plugin    │  │   Plugins   │           │
│  │             │  │             │  │             │  │             │           │
│  │ Components  │  │ Components  │  │ Components  │  │ Components  │           │
│  │ (unchanged) │  │ (unchanged) │  │ (unchanged) │  │ (unchanged) │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                    🎯 GLOBAL INTERACTION INTERCEPTOR                           │
│                           (Core Application Level)                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  ONE SINGLE EVENT LISTENER FOR ENTIRE OSD                                  ││
│  │  document.addEventListener('click', handleGlobalClick, true)                ││
│  │                                                                             ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐││
│  │  │                    HIERARCHICAL CONTEXT ENGINE                         │││
│  │  │                                                                         │││
│  │  │  Phase 1: Basic DOM Context                                            │││
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐│││
│  │  │  │ testSubj, className, tagName, text, timestamp, app                 ││││
│  │  │  └─────────────────────────────────────────────────────────────────────┘│││
│  │  │                                                                         │││
│  │  │  Phase 2: Rich Context Enhancement (ASYNC)                             │││
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐│││
│  │  │  │ context: {                                                          ││││
│  │  │  │   uiAction: { /* UI Actions context */ },                          ││││
│  │  │  │   semantic: { /* Plugin semantic context */ },                     ││││
│  │  │  │   custom: { /* Custom context */ }                                 ││││
│  │  │  │ }                                                                   ││││
│  │  │  └─────────────────────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────────┤
│                         🔧 UI ACTIONS INTEGRATION                              │
│                            (Service Level)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  getUIActionContext(target, event)                                         ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐││
│  │  │  1. Map element to triggers (docTableExpandToggleColumn → ROW_CLICK)   │││
│  │  │  2. Execute UI Actions for context (without side effects)              │││
│  │  │  3. Return rich semantic context                                       │││
│  │  └─────────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────────┤
│                         📊 CONTEXT PROVIDER                                    │
│                            (Plugin Level)                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  captureGlobalInteraction(enrichedInteraction)                             ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐││
│  │  │                    Routing Logic                                        │││
│  │  │  if (interaction.app === 'explore') → ExploreContextContributor        │││
│  │  │  if (interaction.app === 'dashboard') → DashboardContextContributor    │││
│  │  │  if (interaction.app === 'discover') → DiscoverContextContributor      │││
│  │  └─────────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────────┤
│                      🎯 CONTEXT CONTRIBUTORS                                   │
│                         (Per Plugin Level)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  ExploreContextContributor.handleGlobalInteraction(enrichedInteraction)    ││
│  │  DashboardContextContributor.handleGlobalInteraction(enrichedInteraction)  ││
│  │  DiscoverContextContributor.handleGlobalInteraction(enrichedInteraction)   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Innovation: Hierarchical Context Structure

**Before (Flat Structure)**:
```javascript
{
  testSubj: "docTableExpandToggleColumn",
  interactionType: "BUTTON_CLICK",
  documentId: "doc_123", // Mixed with basic properties
  documentData: {...}, // Confusing structure
  type: "DOCUMENT_EXPAND" // Conflicts with interaction type
}
```

**After (Hierarchical Structure)**:
```javascript
{
  // Basic DOM interaction (always present)
  testSubj: "docTableExpandToggleColumn",
  interactionType: "BUTTON_CLICK", 
  timestamp: "2025-01-15T10:30:00.123Z",
  app: "explore/logs",
  
  // Rich context (organized hierarchically)
  context: {
    uiAction: {
      type: "DOCUMENT_EXPAND",
      documentId: "doc_123",
      documentData: {
        "_id": "doc_123",
        "message": "Error in application",
        "level": "ERROR"
      }
    },
    semantic: {
      userIntent: "data_exploration",
      analysisPattern: "error_investigation"
    }
  }
}
```

## 2. Detailed Component Analysis

### 2.1 Global Interaction Interceptor (Enhanced)

**Location**: `src/core/public/global_interaction/global_interaction_interceptor.ts`

**Purpose**: Capture basic interactions and enrich with hierarchical context

**Key Features**:
- **Phase 1**: Immediate basic context capture
- **Phase 2**: Asynchronous rich context enhancement
- **Hierarchical organization**: Clean separation of concerns
- **UI Actions integration**: Loose coupling with UI Actions service

**Core Interface**:
```typescript
export interface GlobalInteractionContext {
  uiAction?: {
    type: string;
    trigger?: string;
    actionId?: string;
    data?: any;
    [key: string]: any;
  };
  semantic?: {
    [key: string]: any;
  };
  custom?: {
    [key: string]: any;
  };
}

export interface GlobalInteraction {
  type: string;
  app?: string;
  testSubj?: string;
  className: string;
  tagName: string;
  text?: string;
  timestamp: string; // UTC ISO format
  interactionType?: string;
  context?: GlobalInteractionContext; // Hierarchical context
  [key: string]: any;
}
```

### 2.2 UI Actions Integration Layer

**Purpose**: Bridge between Global Interceptor and UI Actions system

**Key Innovation**: **Plugin-Agnostic Design**
- Global Interceptor doesn't need to know specific UI Action types
- UI Actions system provides context automatically
- Loose coupling enables extensibility

**Integration Flow**:
```typescript
// 1. Map element to triggers (generic mapping)
private getTriggersForElement(target: HTMLElement): string[] {
  const triggerMap = {
    'docTableExpandToggleColumn': ['ROW_CLICK_TRIGGER'],
    'filterButton': ['FILTER_TRIGGER'],
    // Extensible mapping
  };
  return triggerMap[target.getAttribute('data-test-subj')] || [];
}

// 2. Execute UI Actions for context (no side effects)
private async getUIActionContext(target, event): Promise<any> {
  const triggers = this.getTriggersForElement(target);
  const results = [];
  
  for (const trigger of triggers) {
    const actions = this.uiActions.getTriggerActions(trigger);
    for (const action of actions) {
      results.push({
        trigger,
        actionId: action.id,
        type: this.inferActionType(action, target),
        data: await this.executeActionForContext(action, context)
      });
    }
  }
  
  return results.length > 0 ? { triggers, actions: results } : null;
}
```

### 2.3 Context Provider (Enhanced)

**Location**: `src/plugins/context_provider/public/services/context_capture_service.ts`

**Enhancement**: Now receives fully enriched hierarchical interactions

**New Method**:
```typescript
public async captureGlobalInteraction(interaction: GlobalInteraction): Promise<void> {
  console.log('📊 Context Provider received enriched interaction:', interaction);
  
  // Route to appropriate plugin contributor
  const contributor = this.contributors.get(interaction.app);
  if (contributor && contributor.handleGlobalInteraction) {
    await contributor.handleGlobalInteraction(interaction);
  }
}
```

### 2.4 Context Contributors (Enhanced)

**Location**: Each plugin (e.g., `src/plugins/explore/public/context_contributor.ts`)

**Enhancement**: Process hierarchical context with rich UI Actions data

**Example - Enhanced Explore Context Contributor**:
```typescript
export class ExploreContextContributor implements ContextContributor {
  async handleGlobalInteraction(interaction: GlobalInteraction): Promise<void> {
    console.log('🔍 Explore processing enriched interaction:', interaction);
    
    // Access hierarchical context
    const uiActionContext = interaction.context?.uiAction;
    const semanticContext = interaction.context?.semantic;
    
    if (uiActionContext?.type === 'DOCUMENT_EXPAND') {
      await this.handleDocumentExpand({
        documentId: uiActionContext.documentId,
        documentData: uiActionContext.documentData,
        source: 'global_capture_enhanced',
        enrichedContext: interaction.context
      });
    }
    
    // Handle other interaction types...
  }
}
```

## 3. Complete System Flow

### 3.1 Runtime Flow (Document Expansion Example)

```
1. User clicks [data-test-subj="docTableExpandToggleColumn"] in Explore
   ↓
2. Global Interaction Interceptor captures click
   ↓
3. Phase 1: Extract basic context immediately
   {
     testSubj: "docTableExpandToggleColumn",
     interactionType: "BUTTON_CLICK",
     timestamp: "2025-01-15T10:30:00.123Z",
     app: "explore/logs",
     context: {} // Empty initially
   }
   ↓
4. Phase 2: Enrich with UI Actions context (ASYNC)
   - Map element to triggers: docTableExpandToggleColumn → ROW_CLICK_TRIGGER
   - Execute UI Actions for context (no side effects)
   - Extract document data from table row
   - Add to hierarchical context:
   {
     ...basicContext,
     context: {
       uiAction: {
         type: "DOCUMENT_EXPAND",
         documentId: "doc_123",
         documentData: { "_id": "doc_123", "message": "Error log" }
       }
     }
   }
   ↓
5. Send enriched interaction to Context Provider
   ↓
6. Context Provider routes to ExploreContextContributor
   ↓
7. ExploreContextContributor processes with full context
   ↓
8. Complete interaction with rich context captured
```

### 3.2 Benefits of Waiting for Rich Context

**Why we wait for UI Actions context**:
- **Meaningful Data**: A click on `docTableExpandToggleColumn` without document data is meaningless
- **Complete Context**: One object contains everything needed for analysis
- **No Correlation Needed**: No need to match separate data sources
- **AI-Ready**: Perfect for AI analysis with complete context

**Performance Considerations**:
- **Async Enhancement**: Basic context captured immediately, rich context added asynchronously
- **Selective Enhancement**: Only elements with UI Actions get enhanced
- **Efficient Mapping**: Simple trigger mapping, no complex logic

## 4. Implementation Details

### 4.1 Core Application Service Integration

```typescript
// src/core/public/application/application_service.tsx
export class ApplicationService {
  private globalInteractionInterceptor?: GlobalInteractionInterceptor;

  public async start({ http, overlays, workspaces }: StartDeps) {
    // Initialize Global Interaction Interceptor with UI Actions
    this.globalInteractionInterceptor = new GlobalInteractionInterceptor({
      getCurrentApp: () => this.currentAppId$.getValue(),
      contextProvider: (window as any).contextProvider,
      uiActions: (window as any).uiActions // UI Actions integration
    });

    // Start capturing with hierarchical context
    this.globalInteractionInterceptor.start();

    return {
      globalInteractionInterceptor: this.globalInteractionInterceptor
    };
  }
}
```

### 4.2 Enhanced Global Interaction Interceptor

```typescript
// src/core/public/global_interaction/global_interaction_interceptor.ts
export class GlobalInteractionInterceptor {
  constructor(private deps: {
    getCurrentApp: () => string | undefined;
    contextProvider?: any;
    uiActions?: any; // UI Actions service for rich context
  }) {}

  private handleGlobalClick = async (event: MouseEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    
    // Phase 1: Extract basic context immediately
    const basicContext = this.extractBasicContextFromTarget(target, 'click');
    
    if (basicContext) {
      // Phase 2: Enhance with rich context from UI Actions
      const enrichedContext = await this.enrichWithContext(basicContext, target, event);
      this.captureInteraction(enrichedContext);
    }
  };

  private async enrichWithContext(
    basicContext: GlobalInteraction, 
    target: HTMLElement, 
    event: MouseEvent
  ): Promise<GlobalInteraction> {
    const enrichedContext = { ...basicContext };
    
    try {
      // Get UI Actions context
      const uiActionContext = await this.getUIActionContext(target, event);
      if (uiActionContext) {
        enrichedContext.context!.uiAction = uiActionContext;
      }

      // Get semantic context from plugins
      const semanticContext = await this.getSemanticContext(target, basicContext);
      if (semanticContext) {
        enrichedContext.context!.semantic = semanticContext;
      }

    } catch (error) {
      console.warn('Error enriching context:', error);
    }

    return enrichedContext;
  }
}
```

### 4.3 Plugin Integration (Explore Example)

```typescript
// src/plugins/explore/public/plugin.ts
export class ExplorePlugin {
  public start(core: CoreStart, plugins: ExploreStartDependencies) {
    // Register context contributor for hierarchical interactions
    if (plugins.contextProvider) {
      const contextContributor = new ExploreContextContributor(core.savedObjects.client);
      plugins.contextProvider.registerContextContributor(contextContributor);
    }

    // No need to register context rules - UI Actions provide the context!
    // This is the key benefit of Option 4: loose coupling
  }
}
```

## 5. Architectural Advantages

### 5.1 Option 4 vs Other Approaches

| Aspect | Option 1 (Direct Merge) | Option 4 (Hierarchical) |
|--------|-------------------------|-------------------------|
| **Structure** | Flat, mixed properties | Clean hierarchy |
| **Coupling** | Tight (must know all UI Actions) | Loose (generic integration) |
| **Extensibility** | Limited (hardcoded rules) | Excellent (automatic) |
| **Maintainability** | Poor (giant switch statements) | Excellent (separation of concerns) |
| **Naming Conflicts** | High risk | No conflicts |
| **Context Clarity** | Confusing | Crystal clear |

### 5.2 Key Benefits

✅ **Clean Architecture**: Basic context vs rich context clearly separated
✅ **Loose Coupling**: Global Interceptor doesn't need to know specific UI Action types
✅ **Automatic Extensibility**: New UI Actions work automatically
✅ **No Naming Conflicts**: Hierarchical structure prevents property conflicts
✅ **Complete Context**: Everything needed in one organized object
✅ **AI-Ready**: Perfect structure for AI analysis and context understanding

### 5.3 Zero Component Changes

**Still maintains the core benefit**:
- No React component modifications needed
- Single global event listener captures everything
- Automatic context enhancement
- Plugin-specific processing

## 6. Example Output

### 6.1 Document Expansion Interaction

```javascript
// Complete hierarchical interaction object
{
  // Basic DOM context (always present)
  type: "click",
  testSubj: "docTableExpandToggleColumn", 
  className: "euiButtonIcon euiButtonIcon--text",
  tagName: "BUTTON",
  text: undefined,
  timestamp: "2025-01-15T10:30:00.123Z",
  app: "explore/logs",
  interactionType: "BUTTON_CLICK",
  
  // Rich hierarchical context (when available)
  context: {
    uiAction: {
      type: "DOCUMENT_EXPAND",
      trigger: "ROW_CLICK_TRIGGER",
      actionId: "expand-document-action",
      data: {
        documentId: "doc_123",
        rowIndex: 2,
        documentData: {
          "_id": "doc_123",
          "timestamp": "2024-01-15T10:30:00Z",
          "message": "Error in application",
          "level": "ERROR",
          "host": "server-01"
        },
        tableInfo: {
          totalRows: 50,
          tableTestSubj: "discoverTable"
        }
      }
    },
    semantic: {
      userIntent: "data_exploration",
      analysisPattern: "error_investigation",
      contextualRelevance: "high"
    }
  }
}
```

### 6.2 Filter Action Interaction

```javascript
{
  // Basic context
  type: "click",
  testSubj: "fieldToggle-extension",
  interactionType: "BUTTON_CLICK",
  timestamp: "2025-01-15T10:31:00.456Z",
  app: "explore/logs",
  
  // Rich context
  context: {
    uiAction: {
      type: "FILTER_ACTION",
      trigger: "FILTER_TRIGGER", 
      data: {
        fieldName: "extension",
        fieldValue: ".jpg",
        filterType: "include",
        currentFilters: ["level:ERROR"]
      }
    }
  }
}
```

## 7. Testing and Validation

### 7.1 Access Methods

```javascript
// Get all interactions with hierarchical context
window.getInteractionHistory()

// Example output:
[
  {
    testSubj: "docTableExpandToggleColumn",
    interactionType: "BUTTON_CLICK",
    context: {
      uiAction: {
        type: "DOCUMENT_EXPAND",
        data: { documentId: "doc_123", documentData: {...} }
      }
    }
  },
  {
    testSubj: "fieldToggle-extension", 
    interactionType: "BUTTON_CLICK",
    context: {
      uiAction: {
        type: "FILTER_ACTION",
        data: { fieldName: "extension", fieldValue: ".jpg" }
      }
    }
  }
]
```

### 7.2 Validation Steps

1. **Start OSD**: `yarn start`
2. **Navigate to Explore**: Any Explore page
3. **Perform interactions**: Click expand buttons, filters, etc.
4. **Check console**: `window.getInteractionHistory()`
5. **Verify structure**: Hierarchical context with UI Actions data

## 8. Future Extensibility

### 8.1 Adding New Context Sources

```typescript
// Easy to add new context sources
private async enrichWithContext(basicContext, target, event) {
  const enrichedContext = { ...basicContext };
  
  // Existing sources
  const uiActionContext = await this.getUIActionContext(target, event);
  const semanticContext = await this.getSemanticContext(target, basicContext);
  
  // Future sources (easy to add)
  const aiContext = await this.getAIContext(target, basicContext);
  const userBehaviorContext = await this.getUserBehaviorContext(target);
  const performanceContext = await this.getPerformanceContext(target);
  
  enrichedContext.context = {
    uiAction: uiActionContext,
    semantic: semanticContext,
    ai: aiContext,
    userBehavior: userBehaviorContext,
    performance: performanceContext
  };
  
  return enrichedContext;
}
```

### 8.2 Plugin-Specific Enhancements

```typescript
// Plugins can add their own context enhancement
// src/plugins/dashboard/public/dashboard_context_enhancer.ts
export class DashboardContextEnhancer {
  async enhanceContext(basicContext, target) {
    if (target.closest('.dashboard-panel')) {
      return {
        panelType: this.getPanelType(target),
        panelConfig: this.getPanelConfig(target),
        dashboardState: this.getDashboardState()
      };
    }
    return null;
  }
}
```

## 9. Conclusion

The **Option 4: Hierarchical Context with UI Actions Integration** provides the optimal solution that:

1. **Maintains Zero Component Changes**: Single global event listener captures all interactions
2. **Provides Complete Context**: Rich hierarchical structure with UI Actions integration
3. **Ensures Loose Coupling**: Global Interceptor doesn't need to know specific UI Action types
4. **Enables Automatic Extensibility**: New UI Actions work without additional configuration
5. **Delivers Clean Architecture**: Clear separation between basic and rich context
6. **Supports Future Growth**: Easy to add new context sources and enhancements

This design satisfies all requirements while providing a scalable, maintainable, and performant solution for comprehensive user interaction tracking with rich semantic context across OpenSearch Dashboards.

**Key Innovation**: By waiting for UI Actions to provide rich context and organizing it hierarchically, we achieve the perfect balance of completeness, clarity, and extensibility without sacrificing the zero-component-change requirement.