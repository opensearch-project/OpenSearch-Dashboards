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

## 6. Table Selection in Discover - Current State & Solutions

### **Current State: NO**
Table row selection in Discover is **NOT** currently captured by UI Actions because:

```typescript
// src/plugins/discover/public/application/components/doc_table/doc_table_row.tsx
// Current implementation uses regular React onClick
const DocTableRow = ({ row, onRowClick }) => {
  return (
    <tr onClick={() => onRowClick(row)}>  {/* Regular React event */}
      <td>{row.field1}</td>
      <td>{row.field2}</td>
    </tr>
  );
};
```

### **Solution: YES, We Can Add It!**

#### **Option A: Add Trigger to Existing Component**
```typescript
// Modify src/plugins/discover/public/application/components/doc_table/doc_table_row.tsx
const DocTableRow = ({ row, onRowClick, uiActions }) => {
  const handleRowClick = async (row) => {
    // Fire UI Actions trigger
    await uiActions.executeTriggerActions(TABLE_ROW_CLICK_TRIGGER, {
      rowData: row,
      indexPattern: this.props.indexPattern,
      searchSource: this.props.searchSource,
      selectedFields: this.props.selectedFields
    });
    
    // Keep existing functionality
    onRowClick(row);
  };
  
  return (
    <tr onClick={() => handleRowClick(row)}>
      <td>{row.field1}</td>
      <td>{row.field2}</td>
    </tr>
  );
};
```

#### **Option B: Create New Trigger**
```typescript
// 1. Define trigger
export const TABLE_ROW_CLICK_TRIGGER = 'TABLE_ROW_CLICK_TRIGGER';
export const tableRowClickTrigger: Trigger<'TABLE_ROW_CLICK_TRIGGER'> = {
  id: TABLE_ROW_CLICK_TRIGGER,
  title: 'Table row click',
  description: 'Triggered when user clicks on a table row in Discover',
};

// 2. Define context
interface TableRowClickContext {
  rowData: any;                    // The clicked row data
  indexPattern: IndexPattern;      // Current index pattern
  searchSource: SearchSource;     // Current search
  selectedFields: string[];       // Selected columns
  rowIndex: number;               // Row position
  timestamp: number;              // When clicked
}

// 3. Register trigger
uiActions.registerTrigger(tableRowClickTrigger);

// 4. Create context capture action
export class TableRowContextAction implements Action<TableRowClickContext> {
  public readonly type = 'TABLE_ROW_CONTEXT_ACTION';
  public readonly id = 'TABLE_ROW_CONTEXT_ACTION';
  
  async execute(context: TableRowClickContext) {
    const contextData = {
      trigger: 'table_row_click',
      app: 'discover',
      rowData: context.rowData,
      indexPattern: context.indexPattern.title,
      searchQuery: context.searchSource.getField('query'),
      filters: context.searchSource.getField('filter'),
      selectedFields: context.selectedFields,
      rowIndex: context.rowIndex,
      timestamp: context.timestamp
    };
    
    // Send to context provider
    this.contextProvider.captureContext(contextData);
    
    console.log('Table row context captured:', contextData);
  }
}

// 5. Register and attach action
uiActions.registerAction(new TableRowContextAction());
uiActions.attachAction(TABLE_ROW_CLICK_TRIGGER, 'TABLE_ROW_CONTEXT_ACTION');
```

#### **Expected Output for Table Row Click**
```typescript
// When user clicks a table row, context capture would receive:
{
  trigger: 'table_row_click',
  app: 'discover',
  timestamp: 1640995200000,
  
  // Row data
  rowData: {
    "_id": "doc123",
    "_source": {
      "@timestamp": "2021-12-31T12:00:00Z",
      "user.name": "john.doe",
      "event.action": "login",
      "source.ip": "192.168.1.100"
    },
    "_index": "logs-2021.12.31"
  },
  
  // Context
  indexPattern: "logs-*",
  searchQuery: {
    "query": {
      "match": { "event.action": "login" }
    }
  },
  filters: [
    {
      "range": {
        "@timestamp": {
          "gte": "2021-12-31T00:00:00Z",
          "lte": "2021-12-31T23:59:59Z"
        }
      }
    }
  ],
  selectedFields: ["@timestamp", "user.name", "event.action", "source.ip"],
  rowIndex: 5
}
```

## Summary

**UI Actions is extremely powerful and extensible:**

1. ✅ **Easy to add new actions** - Just 3 steps
2. ✅ **Easy to add new triggers** - Just 4 steps  
3. ✅ **Rich context data** - Full access to application state
4. ✅ **Can capture table selections** - With minimal code changes
5. ✅ **Follows OSD patterns** - Native integration
6. ✅ **Type-safe** - Full TypeScript support

The key insight: **UI Actions can be extended to capture ANY user interaction** by adding custom triggers and actions. It's not limited to the current set - it's a platform for comprehensive interaction capture.