# UI Actions in OpenSearch Dashboards: Complete Guide

## 1. What are UI Actions?

UI Actions is OpenSearch Dashboards' **event-driven action system** that allows plugins to:
- **Listen** to user interactions (triggers)
- **Execute** actions when those interactions happen
- **Extend** functionality without modifying existing code

Think of it as a **pub-sub system** for user interactions:
- **Triggers** = Events (user clicks, selections, etc.)
- **Actions** = Functions that run when events happen
- **Context** = Data about what the user interacted with

## 2. Current UI Actions in OSD

### **Core Triggers** (Event Types)
```typescript
// From src/plugins/ui_actions/public/triggers/
VALUE_CLICK_TRIGGER = 'VALUE_CLICK_TRIGGER'           // Chart data point clicks
SELECT_RANGE_TRIGGER = 'SELECT_RANGE_TRIGGER'         // Chart range selections  
APPLY_FILTER_TRIGGER = 'APPLY_FILTER_TRIGGER'         // Filter applications
ABORT_DATA_QUERY_TRIGGER = 'ABORT_DATA_QUERY_TRIGGER' // Query cancellations

// From src/plugins/embeddable/public/lib/triggers/
CONTEXT_MENU_TRIGGER = 'CONTEXT_MENU_TRIGGER'         // Gear icon menu clicks
PANEL_BADGE_TRIGGER = 'PANEL_BADGE_TRIGGER'           // Panel title bar badges
PANEL_NOTIFICATION_TRIGGER = 'PANEL_NOTIFICATION_TRIGGER' // Panel notifications
```

### **Current Actions** (What Happens)
```typescript
// Dashboard Actions (src/plugins/dashboard/public/plugin.tsx)
ACTION_EXPAND_PANEL = 'expandPanel'        // Expand panel to full screen
ACTION_REPLACE_PANEL = 'replacePanel'      // Replace visualization
ACTION_CLONE_PANEL = 'clonePanel'          // Clone panel
ACTION_ADD_TO_LIBRARY = 'addToLibrary'     // Save to library
ACTION_UNLINK_FROM_LIBRARY = 'unlinkFromLibrary' // Unlink from library

// Embeddable Actions (src/plugins/embeddable/public/lib/actions/)
ACTION_EDIT_PANEL = 'editPanel'            // Edit visualization
ACTION_CUSTOMIZE_PANEL = 'customizePanel'  // Edit panel title
ACTION_INSPECT_PANEL = 'openInspector'     // Inspect panel data
REMOVE_PANEL_ACTION = 'deletePanel'        // Remove panel
```

## 3. How UI Actions Capture User Actions (Code Examples)

### **Step 1: Register Trigger**
```typescript
// src/plugins/embeddable/public/bootstrap.ts
export const bootstrap = (uiActions: UiActionsSetup) => {
  // Register the trigger (event type)
  uiActions.registerTrigger(contextMenuTrigger);
};

// Define the trigger
export const contextMenuTrigger: Trigger<'CONTEXT_MENU_TRIGGER'> = {
  id: CONTEXT_MENU_TRIGGER,
  title: 'Context menu',
  description: 'Triggered on top-right corner context-menu select.',
};
```

### **Step 2: Create Action**
```typescript
// src/plugins/embeddable/public/lib/actions/edit_panel_action.ts
export class EditPanelAction implements Action<ActionContext> {
  public readonly type = ACTION_EDIT_PANEL;
  public readonly id = ACTION_EDIT_PANEL;
  
  // This runs when the action is triggered
  public async execute(context: ActionContext) {
    const { embeddable } = context;
    
    // Get edit URL from embeddable
    const editUrl = embeddable.getOutput().editUrl;
    const editApp = embeddable.getOutput().editApp;
    
    // Navigate to edit page
    if (editApp) {
      await this.application.navigateToApp(editApp, { 
        path: embeddable.getOutput().editPath 
      });
    } else if (editUrl) {
      window.location.href = editUrl;
    }
  }
  
  // Determine if action should be shown
  public async isCompatible({ embeddable }: ActionContext) {
    return Boolean(
      embeddable &&
      embeddable.getOutput().editable &&
      embeddable.getInput().viewMode === ViewMode.EDIT
    );
  }
}
```

### **Step 3: Register and Attach Action**
```typescript
// src/plugins/dashboard/public/plugin.tsx
export class DashboardPlugin {
  public setup(core: CoreSetup, { uiActions }: SetupDependencies) {
    // Create action instance
    const expandPanelAction = new ExpandPanelAction();
    
    // Register the action
    uiActions.registerAction(expandPanelAction);
    
    // Attach action to trigger (this is the key!)
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, expandPanelAction.id);
  }
}
```

### **Step 4: Trigger the Action**
```typescript
// src/plugins/embeddable/public/lib/panel/embeddable_panel.tsx
export const EmbeddablePanel = ({ embeddable, getActions }) => {
  const handleContextMenuClick = async () => {
    // Get all actions for this trigger
    const actions = await getActions(CONTEXT_MENU_TRIGGER, { embeddable });
    
    // Show context menu with available actions
    showContextMenu(actions, { embeddable });
  };
  
  return (
    <div>
      <button onClick={handleContextMenuClick}>⚙️</button>
      {/* Panel content */}
    </div>
  );
};
```

## 4. UI Actions Output Details

### **Context Data Structure**
When a UI Action is triggered, it receives rich context data:

```typescript
// Example: CONTEXT_MENU_TRIGGER context
interface EmbeddableContext {
  embeddable: IEmbeddable;  // The panel that was clicked
}

// Example: VALUE_CLICK_TRIGGER context  
interface ValueClickContext {
  embeddable?: IEmbeddable;
  data: {
    data: Array<{
      table: { rows: any[], columns: any[] };  // Data table
      column: number;                          // Clicked column
      row: number;                            // Clicked row  
      value: any;                             // Clicked value
    }>;
    timeFieldName?: string;                   // Time field name
    negate?: boolean;                         // Whether to negate filter
  };
}

// Example: Actual output when clicking a chart
const clickContext = {
  embeddable: {
    id: "visualization_123",
    type: "visualization", 
    getInput: () => ({ title: "Sales by Region" }),
    getOutput: () => ({ editUrl: "/app/visualize/edit/123" })
  },
  data: {
    data: [{
      table: {
        rows: [["North", 1000], ["South", 800]],
        columns: [{ name: "region" }, { name: "sales" }]
      },
      column: 0,
      row: 1, 
      value: "South"
    }],
    timeFieldName: "@timestamp"
  }
};
```

### **Action Execution Output**
```typescript
// When action executes, you get detailed information:
export class MyContextCaptureAction implements Action<EmbeddableContext> {
  async execute(context: EmbeddableContext) {
    const { embeddable } = context;
    
    // Rich context information available:
    const contextData = {
      // Panel information
      panelId: embeddable.id,
      panelType: embeddable.type,
      panelTitle: embeddable.getInput().title,
      
      // Panel state
      panelInput: embeddable.getInput(),    // User configurations
      panelOutput: embeddable.getOutput(),  // Current state/data
      
      // Edit capabilities
      isEditable: embeddable.getOutput().editable,
      editUrl: embeddable.getOutput().editUrl,
      editApp: embeddable.getOutput().editApp,
      
      // Container context (if in dashboard)
      container: embeddable.parent ? {
        id: embeddable.parent.id,
        type: embeddable.parent.type,
        panels: embeddable.parent.getInput().panels
      } : null,
      
      // Timing
      timestamp: Date.now(),
      trigger: CONTEXT_MENU_TRIGGER
    };
    
    console.log('Captured context:', contextData);
    return contextData;
  }
}
```

## 5. Is it Easy to Add New Actions?

**YES! Very easy.** Here's how:

### **Add New Action (3 steps)**
```typescript
// Step 1: Create action class
export class MyCustomAction implements Action<EmbeddableContext> {
  public readonly type = 'MY_CUSTOM_ACTION';
  public readonly id = 'MY_CUSTOM_ACTION';
  
  public getDisplayName() {
    return 'My Custom Action';
  }
  
  public async execute(context: EmbeddableContext) {
    console.log('Custom action executed!', context);
  }
  
  public async isCompatible(context: EmbeddableContext) {
    return true; // Always show this action
  }
}

// Step 2: Register in plugin setup
export class MyPlugin {
  setup(core: CoreSetup, { uiActions }: Dependencies) {
    const myAction = new MyCustomAction();
    uiActions.registerAction(myAction);
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, myAction.id);
  }
}

// Step 3: That's it! Action now appears in gear menu
```

### **Add New Trigger (4 steps)**
```typescript
// Step 1: Define trigger
export const MY_CUSTOM_TRIGGER = 'MY_CUSTOM_TRIGGER';
export const myCustomTrigger: Trigger<'MY_CUSTOM_TRIGGER'> = {
  id: MY_CUSTOM_TRIGGER,
  title: 'My custom trigger',
  description: 'Triggered when something custom happens',
};

// Step 2: Register trigger
uiActions.registerTrigger(myCustomTrigger);

// Step 3: Create action for trigger
export class MyTriggerAction implements Action<MyCustomContext> {
  // ... action implementation
}

// Step 4: Fire trigger when needed
uiActions.executeTriggerActions(MY_CUSTOM_TRIGGER, { 
  customData: 'some data' 
});
```

## 6. Practical Implementation: Context Provider Plugin

### **Real Implementation Based on Our Research**

Based on our deep analysis and practical implementation, here's how we actually built a working context provider using UI Actions:

#### **Custom Triggers for Context Capture**
```typescript
// src/plugins/context_provider/public/services/ui_actions_integration_service.ts
export const TABLE_ROW_SELECT_TRIGGER = 'TABLE_ROW_SELECT_TRIGGER';
export const EMBEDDABLE_PANEL_HOVER_TRIGGER = 'EMBEDDABLE_PANEL_HOVER_TRIGGER';
export const FILTER_APPLIED_TRIGGER = 'FILTER_APPLIED_TRIGGER';

export class UIActionsIntegrationService {
  private registerCustomTriggers(): void {
    // Register table row selection trigger
    this.uiActionsSetup.registerTrigger({
      id: TABLE_ROW_SELECT_TRIGGER,
      title: 'Table row selection',
      description: 'Triggered when a table row is selected in Discover',
    });

    // Register embeddable panel hover trigger
    this.uiActionsSetup.registerTrigger({
      id: EMBEDDABLE_PANEL_HOVER_TRIGGER,
      title: 'Embeddable panel hover',
      description: 'Triggered when hovering over an embeddable panel',
    });
  }
}
```

#### **Context Capture Actions**
```typescript
// Register context capture actions
private registerContextCaptureActions(): void {
  // Table row selection action
  this.uiActionsSetup.registerAction({
    id: 'CAPTURE_TABLE_ROW_CONTEXT',
    type: TABLE_ROW_SELECT_TRIGGER,
    getDisplayName: () => 'Capture Table Row Context',
    execute: async (context: any) => {
      console.log('📊 Table row selected:', context);
      if (this.contextCaptureCallback) {
        this.contextCaptureCallback(TABLE_ROW_SELECT_TRIGGER, {
          rowData: context.rowData,
          rowIndex: context.rowIndex,
          tableState: context.tableState,
          timestamp: Date.now(),
        });
      }
    },
  });

  // Attach actions to triggers
  this.uiActionsSetup.attachAction(TABLE_ROW_SELECT_TRIGGER, 'CAPTURE_TABLE_ROW_CONTEXT');
}
```

#### **DOM Event Integration (Hybrid Approach)**
```typescript
// Since Discover doesn't use UI Actions for table rows, we use DOM events
private setupTableRowClickListener(): void {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Check if click is on a table row in Discover
    const tableRow = target.closest('tr[data-test-subj="docTableRow"]');
    if (tableRow) {
      console.log('🔍 Table row clicked detected');
      
      // Extract row data from DOM
      const rowIndex = Array.from(tableRow.parentElement?.children || []).indexOf(tableRow);
      const cells = tableRow.querySelectorAll('td');
      const rowData: Record<string, any> = {};
      
      cells.forEach((cell, index) => {
        const fieldName = cell.getAttribute('data-test-subj') || `field_${index}`;
        rowData[fieldName] = cell.textContent?.trim() || '';
      });

      // Trigger context capture
      if (this.contextCaptureCallback) {
        this.contextCaptureCallback(TABLE_ROW_SELECT_TRIGGER, {
          rowData,
          rowIndex,
          tableState: {
            totalRows: tableRow.parentElement?.children.length || 0,
            selectedRow: rowIndex,
          },
          timestamp: Date.now(),
        });
      }
    }
  }, { capture: true });
}
```

## 7. Application Service Integration for Static Context

### **Automatic Context Capture on Navigation**
```typescript
// src/plugins/context_provider/public/services/context_capture_service.ts
public start(core: CoreStart, plugins: ContextProviderStartDeps): void {
  this.coreStart = core;
  this.pluginsStart = plugins;

  // 🔑 KEY: Subscribe to application changes using currentAppId$
  core.application.currentAppId$.subscribe((appId) => {
    if (appId) {
      this.captureStaticContext(appId);  // Auto-trigger context capture
    }
  });
}
```

### **Dashboard Static Context Capture**
```typescript
private async captureDashboardContext(): Promise<Record<string, any>> {
  console.log('📊 Capturing Dashboard context');
  
  try {
    // Extract dashboard ID from URL
    const urlParts = window.location.pathname.split('/');
    const dashboardIndex = urlParts.indexOf('dashboard');
    const dashboardId = dashboardIndex !== -1 && urlParts[dashboardIndex + 1] 
      ? urlParts[dashboardIndex + 1] 
      : null;

    const context: Record<string, any> = {
      type: 'dashboard',
      dashboardId,
    };

    if (dashboardId && this.coreStart) {
      try {
        // Get dashboard from saved objects
        const dashboard = await this.coreStart.savedObjects.client.get('dashboard', dashboardId);
        context.dashboard = {
          title: dashboard.attributes.title,
          description: dashboard.attributes.description,
          panelsJSON: dashboard.attributes.panelsJSON,
        };
      } catch (error) {
        console.warn('Could not fetch dashboard details:', error);
        context.dashboardError = error.message;
      }
    }

    return context;
  } catch (error) {
    console.error('Error capturing dashboard context:', error);
    return { type: 'dashboard', error: error.message };
  }
}
```

## 8. Real Context Output Examples

### **Static Context - Dashboard Navigation**
```typescript
// When navigating to dashboard, you see in console:
{
  appId: "dashboards",
  timestamp: 1693123456789,
  data: {
    appId: "dashboards",
    url: "http://localhost:5601/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    pathname: "/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    type: "dashboard",
    dashboardId: "7adfa750-4c81-11e8-b3d7-01146121b73d",
    dashboard: {
      title: "Sample eCommerce Dashboard",
      description: "A dashboard with sample eCommerce data",
      panelsJSON: "[{\"version\":\"7.10.0\",\"panelIndex\":\"1\"}]"
    },
    dataContext: {
      timeRange: { from: "now-15m", to: "now" },
      filters: [
        {
          meta: { key: "category.keyword", type: "phrase" },
          query: { match_phrase: { "category.keyword": "Women's Clothing" } }
        }
      ],
      query: { query: "", language: "kuery" }
    }
  }
}
```

### **Dynamic Context - Table Row Click**
```typescript
// When clicking table row in Discover, you see:
{
  trigger: "TABLE_ROW_SELECT_TRIGGER",
  timestamp: 1693123456789,
  data: {
    rowData: {
      "@timestamp": "Aug 30, 2023 @ 14:30:00.000",
      "host.name": "web-server-01",
      "response.keyword": "200",
      "bytes": "1,024",
      "url.keyword": "/api/products"
    },
    rowIndex: 2,
    tableState: {
      totalRows: 50,
      selectedRow: 2
    }
  }
}
```

### **Dynamic Context - Panel Hover**
```typescript
// When hovering over dashboard panel, you see:
{
  trigger: "EMBEDDABLE_PANEL_HOVER_TRIGGER",
  timestamp: 1693123456789,
  data: {
    embeddableId: "panel_1",
    panelTitle: "Sales by Category",
    embeddableType: "visualization",
    panelElement: "[HTMLElement object]"
  }
}
```

## 9. Action Execution for Chatbot/OSD Agent Integration

### **Available Actions Implementation**
```typescript
public async executeAction(actionType: string, params: any): Promise<any> {
  console.log(`🎯 Executing action: ${actionType}`, params);

  try {
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
  } catch (error) {
    console.error(`Error executing action ${actionType}:`, error);
    throw error;
  }
}

private async addFilter(params: any): Promise<any> {
  console.log('➕ Adding filter:', params);
  
  const filter = {
    meta: {
      alias: null,
      disabled: false,
      negate: false,
      key: params.field,
      type: 'phrase',
    },
    query: {
      match_phrase: {
        [params.field]: params.value,
      },
    },
  };

  this.pluginsStart!.data.query.filterManager.addFilters([filter]);
  return { success: true, filter };
}
```

## 10. Testing and Verification

### **Browser Console API**
```typescript
// Global API available for testing and chatbot integration
(window as any).contextProvider = {
  getCurrentContext: this.getCurrentContext.bind(this),
  executeAction: this.executeAction.bind(this),
  getAvailableActions: this.getAvailableActions.bind(this),
  // Test methods
  testTableRowClick: () => this.testTableRowClick(),
  testEmbeddableHover: () => this.testEmbeddableHover(),
};

// Usage in browser console:
await window.contextProvider.getCurrentContext()
await window.contextProvider.executeAction('ADD_FILTER', { field: 'status', value: 'active' })
window.contextProvider.testTableRowClick()
```

## Summary

**UI Actions is extremely powerful and extensible:**

1. ✅ **Easy to add new actions** - Just 3 steps
2. ✅ **Easy to add new triggers** - Just 4 steps  
3. ✅ **Rich context data** - Full access to application state
4. ✅ **Can capture table selections** - With hybrid DOM/UI Actions approach
5. ✅ **Follows OSD patterns** - Native integration
6. ✅ **Type-safe** - Full TypeScript support
7. ✅ **Real-time context capture** - Automatic static and dynamic context
8. ✅ **Action execution** - Direct integration with OSD services
9. ✅ **Console logging** - Visual feedback for development and testing
10. ✅ **Chatbot/OSD Agent ready** - Global API for external integration

**Key Insights from Implementation:**
- **Application Service integration** via `currentAppId$` enables automatic static context capture
- **Hybrid approach** (UI Actions + DOM events) handles gaps in current trigger coverage
- **Context provider pattern** unifies static and dynamic context management
- **Zero plugin modifications** achieved through external event capture and service integration
- **Real-time logging** provides immediate feedback for development and debugging

The key insight: **UI Actions can be extended to capture ANY user interaction** by adding custom triggers and actions, combined with Application Service integration for comprehensive context awareness. It's not limited to the current set - it's a platform for comprehensive interaction capture that we've successfully implemented and tested.