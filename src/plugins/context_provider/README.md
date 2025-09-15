# Context Provider Plugin

A practical implementation of a context provider for OpenSearch Dashboards that captures both static and dynamic context from Dashboard and Discover applications.

## Features

- **Static Context Capture**: Automatically captures context when navigating between applications
- **Dynamic Context Capture**: Captures user interactions through UI Actions and DOM events
- **Console Logging**: All context is logged to browser console for verification
- **Simple API**: Methods available for chatbot/OSD agent integration
- **Zero Plugin Modifications**: Works without modifying existing Dashboard or Discover plugins

## Installation

1. Copy the `context_provider` plugin directory to `src/plugins/`
2. Add `contextProvider` to the `src/plugins/opensearch_dashboards.json` optional plugins list
3. Restart OpenSearch Dashboards

## Usage

### Browser Console API

Once the plugin is loaded, a global `contextProvider` object is available in the browser console:

```javascript
// Get current static context
await window.contextProvider.getCurrentContext()

// Execute actions (for chatbot/OSD agent)
await window.contextProvider.executeAction('ADD_FILTER', { field: 'status', value: 'active' })

// Get available actions
window.contextProvider.getAvailableActions()

// Test context capture manually
window.contextProvider.testTableRowClick()
window.contextProvider.testEmbeddableHover()
window.contextProvider.testFilterApplication()
```

### Testing Context Capture

#### 1. Dashboard Context
1. Navigate to a dashboard: `/app/dashboards`
2. Check console for static context capture
3. Hover over dashboard panels to see dynamic context
4. Apply filters to see filter context

#### 2. Discover Context
1. Navigate to Discover: `/app/discover`
2. Check console for static context capture
3. Click on table rows to see row selection context
4. Apply filters to see filter context

### Available Actions

The plugin supports these actions that chatbot/OSD agent can call:

- `ADD_FILTER`: Add a filter to current view
- `REMOVE_FILTER`: Remove filters
- `CHANGE_TIME_RANGE`: Change the time range
- `REFRESH_DATA`: Refresh current data
- `NAVIGATE_TO_DISCOVER`: Navigate to Discover app
- `NAVIGATE_TO_DASHBOARD`: Navigate to Dashboard app

### Example Usage

```javascript
// Add a filter
await window.contextProvider.executeAction('ADD_FILTER', {
  field: 'response.keyword',
  value: '200'
})

// Change time range
await window.contextProvider.executeAction('CHANGE_TIME_RANGE', {
  from: 'now-1h',
  to: 'now'
})

// Navigate to discover
await window.contextProvider.executeAction('NAVIGATE_TO_DISCOVER', {
  path: '?_a=(index:logstash-*)'
})
```

## Context Structure

### Static Context
Captured when navigating to an application:

```javascript
{
  appId: "dashboards",
  timestamp: 1693123456789,
  data: {
    appId: "dashboards",
    url: "http://localhost:5601/app/dashboards/dashboard-id",
    pathname: "/app/dashboards/dashboard-id",
    type: "dashboard",
    dashboardId: "dashboard-id",
    dashboard: {
      title: "My Dashboard",
      description: "Dashboard description",
      panelsJSON: "[...]"
    },
    dataContext: {
      timeRange: { from: "now-15m", to: "now" },
      filters: [...],
      query: { query: "", language: "kuery" }
    }
  }
}
```

### Dynamic Context
Captured from user interactions:

```javascript
// Table row selection
{
  trigger: "TABLE_ROW_SELECT_TRIGGER",
  timestamp: 1693123456789,
  data: {
    rowData: { field1: "value1", field2: "value2" },
    rowIndex: 0,
    tableState: { totalRows: 100, selectedRow: 0 }
  }
}

// Embeddable panel hover
{
  trigger: "EMBEDDABLE_PANEL_HOVER_TRIGGER",
  timestamp: 1693123456789,
  data: {
    embeddableId: "panel-123",
    panelTitle: "My Visualization",
    embeddableType: "visualization"
  }
}
```

## Architecture

### Services

1. **ContextCaptureService**: Core service that handles static/dynamic context capture, contributor management, and action execution
   - See [detailed service documentation](./public/services/README.md) for plugin developer integration guide
2. **UIActionsIntegrationService**: Manages UI Actions triggers and DOM event listeners

### Integration Points

- **Application Service**: Subscribes to `currentAppId$` for app navigation
- **Data Plugin**: Accesses filters, queries, and time range
- **UI Actions**: Registers custom triggers and actions
- **DOM Events**: Listens for table clicks and panel hovers

## Development

For plugin developers who want to integrate with the context system, see the [ContextCaptureService documentation](./public/services/README.md) which includes:

- How to create and register context contributors
- Static vs dynamic context capture patterns  
- Integration examples for different app types
- Chat UI consumption patterns
- Advanced usage with stateful contributors

### Adding New Context Capture

1. Add trigger in `UIActionsIntegrationService`
2. Register corresponding action
3. Add DOM event listener or UI Action integration
4. Handle context in `ContextCaptureService`

### Adding New Actions

1. Add action type to `getAvailableActions()`
2. Implement action handler in `ContextCaptureService.executeAction()`
3. Use existing OSD services (data, application, etc.)

## Debugging

All context capture and actions are logged to console with emojis for easy identification:

- 🔧 Setup messages
- 🚀 Start messages
- 📊 Static context updates
- ⚡ Dynamic context capture
- 🎯 Action execution
- 🧪 Test triggers
- 🔍 Discover events
- 🎯 Dashboard events

## Limitations

- Custom UI Actions triggers may show TypeScript warnings (expected)
- DOM event listeners use generic selectors (may need adjustment for different OSD versions)
- Static context capture depends on URL patterns and saved object access
- Some advanced dashboard features may not be captured

## Future Enhancements

- Plugin-specific context providers
- Real-time context streaming
- Context history and caching
- Advanced action execution with validation
- Integration with existing chatbot/OSD agent plugins