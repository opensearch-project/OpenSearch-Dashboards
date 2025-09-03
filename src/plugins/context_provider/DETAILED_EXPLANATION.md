# Context Provider - Detailed Technical Explanation

## 1. Static Context Capture - Auto Navigation Detection

### How Auto Capture Works

The plugin subscribes to OpenSearch Dashboards' Application Service to detect navigation:

```typescript
// In context_capture_service.ts - line 35
public start(core: CoreStart, plugins: ContextProviderStartDeps): void {
  this.coreStart = core;
  this.pluginsStart = plugins;

  // 🔑 KEY: Subscribe to application changes
  core.application.currentAppId$.subscribe((appId) => {
    if (appId) {
      this.captureStaticContext(appId);  // Auto-trigger context capture
    }
  });
}
```

### What Happens When You Navigate

1. **User clicks Dashboard link** → `currentAppId$` emits `"dashboards"`
2. **Plugin detects change** → `captureStaticContext("dashboards")` called
3. **Context captured** → Dashboard-specific data extracted
4. **Console logged** → You see the context in browser console

### Dashboard Static Context Example

When you navigate to: `http://localhost:5601/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d`

```typescript
// Captured context structure:
{
  appId: "dashboards",
  timestamp: 1693123456789,
  data: {
    appId: "dashboards",
    url: "http://localhost:5601/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    pathname: "/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    search: "?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))",
    
    // Dashboard-specific context
    type: "dashboard",
    dashboardId: "7adfa750-4c81-11e8-b3d7-01146121b73d",
    dashboard: {
      title: "Sample eCommerce Dashboard",
      description: "A dashboard with sample eCommerce data",
      panelsJSON: "[{\"version\":\"7.10.0\",\"panelIndex\":\"1\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15},\"panelRefName\":\"panel_1\"}]"
    },
    
    // Current data context
    dataContext: {
      timeRange: { from: "now-15m", to: "now" },
      filters: [
        {
          meta: { alias: null, disabled: false, key: "category.keyword", negate: false, type: "phrase" },
          query: { match_phrase: { "category.keyword": "Women's Clothing" } }
        }
      ],
      query: { query: "", language: "kuery" }
    }
  }
}
```

### Discover Static Context Example

When you navigate to: `http://localhost:5601/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(_source),index:'ff959d40-b880-11e8-a6d9-e546fe2bba5f',interval:auto,query:(language:kuery,query:''),sort:!('@timestamp',desc))`

```typescript
// Captured context structure:
{
  appId: "discover",
  timestamp: 1693123456789,
  data: {
    appId: "discover",
    url: "http://localhost:5601/app/discover#/?_g=...",
    pathname: "/app/discover",
    search: "#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=...",
    
    // Discover-specific context
    type: "discover",
    indexPatternId: "ff959d40-b880-11e8-a6d9-e546fe2bba5f",
    
    // Current data context
    dataContext: {
      timeRange: { from: "now-15m", to: "now" },
      filters: [],
      query: { query: "", language: "kuery" }
    }
  }
}
```

## 2. Dynamic Context Capture - User Interactions

### UI Actions Workflow

```typescript
// 1. Register custom triggers in ui_actions_integration_service.ts
this.uiActionsSetup.registerTrigger({
  id: 'TABLE_ROW_SELECT_TRIGGER',
  title: 'Table row selection',
  description: 'Triggered when a table row is selected in Discover',
});

// 2. Register actions that respond to triggers
this.uiActionsSetup.registerAction({
  id: 'CAPTURE_TABLE_ROW_CONTEXT',
  type: 'TABLE_ROW_SELECT_TRIGGER',
  execute: async (context: any) => {
    // 3. When triggered, capture context
    if (this.contextCaptureCallback) {
      this.contextCaptureCallback('TABLE_ROW_SELECT_TRIGGER', {
        rowData: context.rowData,
        rowIndex: context.rowIndex,
        tableState: context.tableState,
        timestamp: Date.now(),
      });
    }
  },
});
```

### DOM Event Integration

```typescript
// Listen for table row clicks using DOM events
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
        this.contextCaptureCallback('TABLE_ROW_SELECT_TRIGGER', {
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

### Dynamic Context Examples

#### Table Row Click Context
```typescript
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

#### Embeddable Panel Hover Context
```typescript
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

#### Filter Applied Context
```typescript
{
  trigger: "FILTER_APPLIED_TRIGGER",
  timestamp: 1693123456789,
  data: {
    filter: {
      field: "category.keyword",
      value: "Electronics"
    },
    filterType: "phrase"
  }
}
```

## 3. Console Logging - Visual Feedback

### What You See When Switching Apps

#### When you navigate to Dashboard:
```
🚀 Context Provider Plugin Start
🔧 UI Actions Integration Service Setup
📝 Registering custom triggers
🎯 Registering context capture actions
👂 Setting up DOM event listeners
📊 Capturing static context for app: dashboards
📊 Capturing Dashboard context
📊 Static Context Updated: {
  appId: "dashboards",
  timestamp: 1693123456789,
  data: {
    type: "dashboard",
    dashboardId: "7adfa750-4c81-11e8-b3d7-01146121b73d",
    dashboard: {
      title: "Sample eCommerce Dashboard",
      description: "A dashboard with sample eCommerce data"
    },
    dataContext: {
      timeRange: { from: "now-15m", to: "now" },
      filters: [...],
      query: { query: "", language: "kuery" }
    }
  }
}
```

#### When you click a table row in Discover:
```
🔍 Table row clicked detected
⚡ Dynamic Context Captured: {
  trigger: "TABLE_ROW_SELECT_TRIGGER",
  timestamp: 1693123456789,
  data: {
    rowData: {
      "@timestamp": "Aug 30, 2023 @ 14:30:00.000",
      "response.keyword": "200"
    },
    rowIndex: 0,
    tableState: { totalRows: 50, selectedRow: 0 }
  }
}
```

#### When you hover over a dashboard panel:
```
🎯 Embeddable panel hover detected
⚡ Dynamic Context Captured: {
  trigger: "EMBEDDABLE_PANEL_HOVER_TRIGGER",
  timestamp: 1693123456789,
  data: {
    embeddableId: "panel_1",
    panelTitle: "Sales by Category"
  }
}
```

## 4. Complete Workflow Example

### Scenario: User navigates from Dashboard to Discover and clicks a table row

1. **User clicks "Discover" in navigation**
   ```
   📊 Capturing static context for app: discover
   📊 Static Context Updated: { appId: "discover", ... }
   ```

2. **User clicks on a table row**
   ```
   🔍 Table row clicked detected
   ⚡ Dynamic Context Captured: { trigger: "TABLE_ROW_SELECT_TRIGGER", ... }
   ```

3. **User applies a filter**
   ```
   🔍 Filter applied: { field: "status", value: "200" }
   ⚡ Dynamic Context Captured: { trigger: "FILTER_APPLIED_TRIGGER", ... }
   ```

### Testing in Browser

1. **Open OpenSearch Dashboards**
2. **Open Browser Console** (F12)
3. **Navigate between apps** - You'll see static context logs
4. **Interact with elements** - You'll see dynamic context logs
5. **Run test commands**:
   ```javascript
   // Get current context
   await window.contextProvider.getCurrentContext()
   
   // Test manual triggers
   window.contextProvider.testTableRowClick()
   ```

The console logging provides real-time feedback showing exactly what context is being captured as you navigate and interact with the interface.