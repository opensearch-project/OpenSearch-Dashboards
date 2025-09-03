
# OpenSearch Dashboards Context Provider - Comprehensive Design Document

## 1. Problem Statement

### 1.1 The Context Definition in AI Systems

In AI and LLM systems, context refers to the background information provided to the model to help it understand and respond appropriately to user queries. Context typically includes:

- **Conversation History**: Previous messages and responses in the current session
- **System Instructions**: Role definitions and behavioral guidelines for the AI
- **Domain Knowledge**: Relevant information about the current task or domain
- **Environmental State**: Current application state, user preferences, and session data

For a context provider system, we focus specifically on Domain Knowledge and Environmental State - the OpenSearch Dashboards-specific information that enables AI to understand what users are looking at and working with. Conversation History and System Instructions are handled by the chatbot system itself.

For example, when a user asks "What's the trend in the last quarter?", an LLM without OSD context cannot know:

* What data source they're looking at
* What metrics they're interested in
* What time range constitutes "last quarter" in their context
* What visualizations are currently displayed

### 1.2 The Context Definition in OpenSearch Dashboards

OpenSearch Dashboards Context refers to the comprehensive application state and user interaction data that describes:

- What the user is currently viewing (dashboards, visualizations, data)
- How they've configured their view (filters, queries, time ranges)
- What actions they've performed (clicks, selections, navigation)
- What data they're working with (index patterns, fields, search results)

This context enables AI assistants to understand the user's current analytical context and provide relevant, specific assistance rather than generic responses.

**Example Scenario:**

User Context (in OSD):
- Viewing "Sales Performance" dashboard
- Applied filters: Region=West, Time=Last 30 days
- Looking at a bar chart showing revenue by product category
- Just clicked on "Electronics" category showing $2.3M revenue

User Question: "Why is this number so high compared to last month?"

**AI Response (without context)**: "I'd be happy to help analyze numbers, but could you please tell me what specific number you're referring to and provide more details about your data?"

**AI Response (with context)**: "The Electronics category showing $2.3M revenue in the West region for the last 30 days is significantly higher than usual. Looking at the trend data, this appears to be driven by a 40% increase in laptop sales during the recent back-to-school promotion. Would you like me to break down the contributing factors or compare with other regions?"

### 1.3 Static Context Capture Approaches for Different Plugin Types

Based on our implementation experience, OpenSearch Dashboards plugins can be categorized into different types based on their context capture complexity:

#### 1.3.1 Simple URL-Based Context Plugins

**Characteristics:**
- Context is primarily stored in URL parameters
- State can be reconstructed from URL parsing
- Minimal complex internal state management

**Examples:** Discover, Management, Dev Tools

**Context Capture Approach:**
```typescript
// Simple URL parsing approach
export class DiscoverContextContributor implements ContextContributor {
  appId = 'discover';
  
  async captureStaticContext(): Promise<Record<string, any>> {
    const urlState = this.parseUrlState();
    return {
      type: 'discover',
      indexPattern: urlState.indexPattern,
      query: urlState.query,
      filters: urlState.filters,
      columns: urlState.columns,
      sort: urlState.sort,
      timeRange: urlState.timeRange
    };
  }
  
  private parseUrlState() {
    // Parse _a and _g parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appState = this.parseAppState(urlParams.get('_a'));
    const globalState = this.parseGlobalState(urlParams.get('_g'));
    return { ...appState, ...globalState };
  }
}
```

#### 1.3.2 Complex Embeddable-Based Context Plugins

**Characteristics:**
- Context involves multiple embeddable components (panels, visualizations)
- Rich internal state not fully represented in URL
- Requires deep inspection of embeddable containers and children

**Examples:** Dashboard, Canvas

**Context Capture Approach:**
```typescript
// Complex embeddable scanning approach
export class DashboardContextContributor implements ContextContributor {
  appId = 'dashboards';
  
  async captureStaticContext(): Promise<Record<string, any>> {
    const container = this.getDashboardContainer();
    if (!container) return { error: 'No dashboard container' };
    
    // Scan all embeddable panels
    const embeddables = await this.captureAllEmbeddableContexts(container);
    const dashboardMetadata = await this.getDashboardMetadata();
    
    return {
      type: 'dashboard',
      dashboard: dashboardMetadata,
      embeddables: {
        count: embeddables.length,
        panels: embeddables
      },
      // Container-level state
      viewMode: container.getInput().viewMode,
      timeRange: container.getInput().timeRange,
      filters: container.getInput().filters,
      query: container.getInput().query
    };
  }
  
  private async captureAllEmbeddableContexts(container: DashboardContainer) {
    const childIds = container.getChildIds();
    const contexts = [];
    
    for (const id of childIds) {
      const embeddable = container.getChild(id);
      const input = embeddable.getInput();
      const output = embeddable.getOutput();
      
      contexts.push({
        id,
        type: embeddable.type,
        title: embeddable.getTitle(),
        input: { ...input },
        output: { ...output },
        // Panel layout information
        gridData: container.getInput().panels[id]?.gridData
      });
    }
    
    return contexts;
  }
}
```

### 1.4 Understanding OpenSearch Dashboards Embeddables

Our investigation revealed key insights about how embeddables work in OpenSearch Dashboards:

#### 1.4.1 Embeddable Input vs Output

**Input Properties (Configuration passed TO embeddable):**
- `savedObjectId`: Reference to the saved visualization/search
- `id`: Unique panel identifier
- `title`: Panel title (may be undefined if using saved object title)
- Configuration parameters specific to embeddable type

**Output Properties (Runtime data produced BY embeddable):**
- `loading`: Boolean indicating if embeddable is still loading
- `error`: Any error that occurred during loading
- Runtime state and computed values

**Key Discovery:** `visState` and `uiState` are NOT stored in embeddable input/output directly. They are stored in the saved object referenced by `savedObjectId`.

#### 1.4.2 Accessing Visualization State

To get the actual visualization configuration, you need to:

1. **Get the savedObjectId** from embeddable input
2. **Fetch the saved object** using the saved objects client
3. **Parse the saved object attributes** to get `visState`, `uiState`, etc.

```typescript
// Correct approach to get visualization state
const input = embeddable.getInput();
const savedObjectId = input.savedObjectId;

if (savedObjectId) {
  const savedObject = await this.savedObjects.get('visualization', savedObjectId);
  const visState = JSON.parse(savedObject.attributes.visState);
  const uiState = JSON.parse(savedObject.attributes.uiState || '{}');
  
  // Now you have the actual visualization configuration
  console.log('Visualization type:', visState.type);
  console.log('Visualization params:', visState.params);
  console.log('UI state:', uiState);
}
```

### 1.5 The Context Types in OpenSearch Dashboards

Based on our research of OSD's architecture, we can categorize the available context into three types:

#### Static Context (Page Load State)

Information available when a user loads a page or application:

**Dashboard Page Load Context:**
```json
{
  "app": "dashboard",
  "dashboard": {
    "title": "Sales Performance Dashboard",
    "description": "Monthly sales analysis across regions",
    "embeddables": {
      "count": 6,
      "panels": [
        {
          "id": "panel_1",
          "type": "visualization",
          "title": "Revenue by Region",
          "input": {
            "savedObjectId": "vis_123",
            "id": "panel_1"
          },
          "output": {
            "loading": false,
            "error": null
          },
          "savedObject": {
            "visState": {
              "type": "histogram",
              "params": { "grid": { "categoryLines": false } }
            },
            "uiState": {}
          }
        }
      ]
    },
    "filters": [
      { "field": "region", "value": "West", "type": "phrase" }
    ],
    "query": { "language": "kuery", "query": "status:active" },
    "timeRange": { "from": "now-30d", "to": "now" },
    "viewMode": "view"
  }
}
```

**Discover Page Load Context:**
```json
{
  "app": "discover",
  "discover": {
    "indexPattern": "logs-*",
    "query": {
      "query": "level:ERROR",
      "language": "kuery"
    },
    "columns": ["timestamp", "level", "message", "service"],
    "sort": [{ "timestamp": { "order": "desc" } }],
    "filters": [{ "field": "environment", "value": "production" }],
    "timeRange": { "from": "now-1h", "to": "now" }
  }
}
```

#### Dynamic Context (User Interactions)

Information captured when users interact with the interface:

**Value Click Context:**
```json
{
  "trigger": "VALUE_CLICK_TRIGGER",
  "interaction": {
    "clickedValue": "Electronics",
    "chartType": "bar",
    "panelTitle": "Revenue by Category",
    "dataValue": 2300000,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "dashboard": { /* current dashboard state */ }
}
```

**Table Row Selection Context:**
```json
{
  "trigger": "TABLE_ROW_SELECT_TRIGGER",
  "interaction": {
    "rowData": {
      "@timestamp": "2024-01-15T10:30:00Z",
      "user.name": "john.doe",
      "event.action": "login",
      "source.ip": "192.168.1.100"
    },
    "rowIndex": 5,
    "tableState": {
      "totalRows": 100,
      "selectedRow": 5
    }
  }
}
```

#### Historical Context (User Patterns)

Information about user behavior over time:

```json
{
  "userPatterns": {
    "frequentDashboards": ["Sales Performance", "Customer Analytics"],
    "commonFilters": ["region:West", "status:active"],
    "typicalTimeRanges": ["last 30 days", "last week"],
    "recentActions": [
      { "action": "filter_applied", "field": "region", "value": "West", "timestamp": "..." },
      { "action": "chart_clicked", "panel": "Revenue by Category", "value": "Electronics", "timestamp": "..." }
    ]
  }
}
```

### 1.4 Current Context Capture Approaches

#### The CopilotKit Approach

Currently, the most common approach for capturing application context is using libraries like CopilotKit, which provides hooks like `useCopilotReadable` to make component state available to AI systems:

```typescript
// Each component needs to be wrapped with context hooks
function DashboardComponent() {
  const dashboardState = useDashboardState();
  
  // Make dashboard state readable to AI
  useCopilotReadable({
    description: "Current dashboard configuration",
    value: dashboardState
  });
  
  return <Dashboard />;
}

function FilterComponent() {
  const filters = useFilters();
  
  // Make filter state readable to AI
  useCopilotReadable({
    description: "Applied filters",
    value: filters
  });
  
  return <FilterBar />;
}
```

#### The Challenge with OpenSearch Dashboards

To capture comprehensive OSD context using the CopilotKit approach, we would need to wrap numerous components:

**Dashboard Application:**
- DashboardContainer - for dashboard title, description, panels
- DashboardGrid - for panel layout and configuration
- FilterBar - for applied filters
- QueryBar - for current query
- TimeRangePicker - for time range selection
- Each individual EmbeddablePanel - for visualization state
- GlobalQueryStateProvider - for global query state
- TimefilterService wrapper - for time filter state

**~15-20 components requiring modification**

**Problems with this approach:**
1. **Massive Code Changes**: Requires modifying dozens of existing components
2. **Performance Impact**: Each wrapped component adds overhead
3. **Maintenance Burden**: Every new feature needs context integration
4. **Plugin Coupling**: Tight coupling between UI components and context system
5. **State Duplication**: Multiple components may expose overlapping state

#### The Need for a New Approach

Given the complexity and maintenance burden of the traditional approach, we need a new context capture strategy for OpenSearch Dashboards that:

- Captures rich context without modifying existing components
- Leverages OSD's existing infrastructure and patterns
- Provides comprehensive coverage across all applications
- Maintains high performance and low maintenance overhead
- Works seamlessly across different state management patterns (embeddables, Redux, data services)

## 2. Proposed OSD Context Provider Architecture

### 2.1 Understanding OpenSearch Dashboards Infrastructure

Before explaining our solution, we need to understand the key OSD infrastructure components that enable context capture:

#### 2.1.1 UI Actions Service

**What it is**: The UI Actions service is OSD's centralized event system that handles all user interactions across the entire platform. Every click, filter application, chart interaction, and navigation flows through this service.

**Why it matters for context**: Instead of wrapping 35+ individual components, we can register a single listener with UI Actions to capture ALL user interactions from a central location.

**How it works**:
```typescript
// All user interactions trigger actions like these:
uiActions.executeTriggerActions('VALUE_CLICK_TRIGGER', context);
uiActions.executeTriggerActions('APPLY_FILTER_TRIGGER', context);
uiActions.executeTriggerActions('SELECT_RANGE_TRIGGER', context);
```

#### 2.1.2 Application Service

**What it is**: The Application Service manages navigation between different OSD applications and provides observables for tracking the current application state.

**Why it matters for context**: The `currentAppId$` observable allows us to automatically detect when users navigate between applications and capture static context without any plugin modifications.

**How it works**:
```typescript
// Subscribe to application changes
core.application.currentAppId$.subscribe((appId) => {
  if (appId) {
    this.captureStaticContext(appId);  // Auto-trigger context capture
  }
});
```

#### 2.1.3 Embeddable System

**What it is**: OSD's component architecture where visualizations, dashboards, and other UI elements are "embeddables" - self-contained components with their own state management.

**Why it matters for context**: Dashboard panels, visualizations, and saved searches are all embeddables. Each embeddable maintains its own state and can be queried for current configuration.

**How it works**:
```typescript
// Dashboard contains multiple embeddable panels
const dashboard = getDashboardContainer();
const panels = dashboard.getChildren(); // All visualization panels
const panelState = panel.getInput(); // Current panel configuration
```

#### 2.1.4 Data Services

**What it is**: Centralized services for managing queries, filters, time ranges, and data sources across all OSD applications.

**Why it matters for context**: Provides unified access to current data context (filters, queries, time ranges) regardless of which application the user is in.

**How it works**:
```typescript
// Access current data context
const timeRange = data.query.timefilter.timefilter.getTime();
const filters = data.query.filterManager.getFilters();
const queryState = data.query.getState();
```

### 2.2 Overall Architecture

Based on our research and implementation, here's how the context provider fits into the broader system:

#### Context Provider Plugin Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Provider Plugin                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │ Context Capture     │  │ UI Actions Integration          │ │
│  │ Service             │  │ Service                         │ │
│  │                     │  │                                 │ │
│  │ • Static Context    │  │ • Custom Triggers               │ │
│  │ • Dynamic Context   │  │ • DOM Event Listeners          │ │
│  │ • Action Execution  │  │ • Context Capture Actions      │ │
│  └─────────────────────┘  └─────────────────────────────────┘ │
│              │                           │                    │
│              └───────────┬───────────────┘                    │
│                          │                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Global Context Provider API                   │ │
│  │                                                         │ │
│  │ • window.contextProvider.getCurrentContext()            │ │
│  │ • window.contextProvider.executeAction()                │ │
│  │ • window.contextProvider.getAvailableActions()          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 OpenSearch Dashboards Core                  │
├─────────────────────────────────────────────────────────────┤
│  Application Service  │  UI Actions  │  Data Services       │
│  • currentAppId$      │  • Triggers  │  • FilterManager     │
│  • Navigation         │  • Actions   │  • TimeFilter        │
│                       │  • Context   │  • QueryString       │
└─────────────────────────────────────────────────────────────┘
```

#### Integration Flow

**Page → Context Provider (Static Context Flow):**
- When a user loads an OSD page (Dashboard, Discover, etc.), the Application Service emits `currentAppId$`
- Context Provider automatically captures initial static context including application configuration, applied filters, time ranges, and panel layouts
- Static context is immediately available via the global API

**Page → Context Provider (Dynamic Context Flow):**
- As users interact with OSD (clicking charts, applying filters, navigating), UI Actions triggers are fired
- Context Provider captures these interactions through registered actions and DOM event listeners
- Dynamic context is stored and logged for immediate access

**Context Provider → Chatbot/OSD Agent (API Integration):**
- Context Provider exposes a global API (`window.contextProvider`) for external integration
- Chatbot and OSD Agent can call methods to get current context and execute actions
- This creates a complete loop: User interacts with page → Context captured → AI understands context → AI can act on page

### 2.3 Static Context Capture Implementation

#### Automatic Navigation Detection

**Key Innovation**: Using Application Service's `currentAppId$` observable for zero-modification context capture:

```typescript
// src/plugins/context_provider/public/services/context_capture_service.ts
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

#### Dashboard Static Context Capture

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

#### Discover Static Context Capture

```typescript
private async captureDiscoverContext(): Promise<Record<string, any>> {
  console.log('🔍 Capturing Discover context');
  
  try {
    const context: Record<string, any> = {
      type: 'discover',
    };

    // Try to get current index pattern from URL or state
    const urlParams = new URLSearchParams(window.location.search);
    const indexPatternId = urlParams.get('_a') ? this.extractIndexPatternFromState(urlParams.get('_a')) : null;
    
    if (indexPatternId) {
      context.indexPatternId = indexPatternId;
    }

    return context;
  } catch (error) {
    console.error('Error capturing discover context:', error);
    return { type: 'discover', error: error.message };
  }
}
```

#### Data Context Integration

```typescript
private async captureDataContext(): Promise<Record<string, any>> {
  if (!this.pluginsStart) return {};

  try {
    const dataContext: Record<string, any> = {};

    // Capture current time range
    const timeRange = this.pluginsStart.data.query.timefilter.timefilter.getTime();
    dataContext.timeRange = timeRange;

    // Capture current filters
    const filters = this.pluginsStart.data.query.filterManager.getFilters();
    dataContext.filters = filters.map(filter => ({
      meta: filter.meta,
      query: filter.query,
    }));

    // Capture current query
    const queryState = this.pluginsStart.data.query.getState();
    dataContext.query = queryState.query;

    return { dataContext };
  } catch (error) {
    console.error('Error capturing data context:', error);
    return { dataContextError: error.message };
  }
}
```

### 2.4 Dynamic Context Capture Implementation

#### UI Actions Integration

**Custom Triggers Registration:**

```typescript
// src/plugins/context_provider/public/services/ui_actions_integration_service.ts
export const TABLE_ROW_SELECT_TRIGGER = 'TABLE_ROW_SELECT_TRIGGER';
export const EMBEDDABLE_PANEL_HOVER_TRIGGER = 'EMBEDDABLE_PANEL_HOVER_TRIGGER';
export const FILTER_APPLIED_TRIGGER = 'FILTER_APPLIED_TRIGGER';

private registerCustomTriggers(): void {
  console.log('📝 Registering custom triggers');

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

  // Register filter applied trigger
  this.uiActionsSetup.registerTrigger({
    id: FILTER_APPLIED_TRIGGER,
    title: 'Filter applied',
    description: 'Triggered when a filter is applied',
  });
}
```

**Context Capture Actions:**

```typescript
private registerContextCaptureActions(): void {
  console.log('🎯 Registering context capture actions');

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

#### Hybrid DOM Event Integration

**Key Innovation**: Since some interactions (like table row clicks in Discover) don't use UI Actions, we use DOM event listeners as a fallback:

```typescript
private setupTableRowClickListener(): void {
  // Use event delegation to capture table row clicks
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Check if click is on a table row in Discover
    const tableRow = target.closest('tr[data-test-subj="docTableRow"]');
    if (tableRow) {
      console.log('🔍 Table row clicked detected');
      
      // Extract row data
      const rowIndex = Array.from(tableRow.parentElement?.children || []).indexOf(tableRow);
      const cells = tableRow.querySelectorAll('td');
      const rowData: Record<string, any> = {};
      
      cells.forEach((cell, index) => {
        const fieldName = cell.getAttribute('data-test-subj') || `field_${index}`;
        rowData[fieldName] = cell.textContent?.trim() || '';
      });

      // Trigger the context capture
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

#### Panel Hover Detection

```typescript
private setupEmbeddablePanelHoverListener(): void {
  // Listen for mouse enter events on embeddable panels
  document.addEventListener('mouseenter', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Check if hover is on an embeddable panel
    const embeddablePanel = target.closest('[data-test-subj="embeddablePanel"]');
    if (embeddablePanel) {
      console.log('🎯 Embeddable panel hover detected');
      
      // Extract panel information
      const panelTitle = embeddablePanel.querySelector('[data-test-subj="dashboardPanelTitle"]')?.textContent?.trim();
      const panelId = embeddablePanel.getAttribute('data-embeddable-id');
      
      // Trigger the context capture
      if (this.contextCaptureCallback) {
        this.contextCaptureCallback(EMBEDDABLE_PANEL_HOVER_TRIGGER, {
          embeddableId: panelId,
          panelTitle,
          panelElement: embeddablePanel,
          timestamp: Date.now(),
        });
      }
    }
  }, { capture: true });
}
```

### 2.5 Action Execution for AI Integration

#### Available Actions Implementation

```typescript
public async executeAction(actionType: string, params: any): Promise<any> {
  console.log(`🎯 Executing action: ${actionType}`, params);

  if (!this.coreStart || !this.pluginsStart) {
    throw new Error('Services not available for action execution');
  }

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
```

#### Filter Management

```typescript
private async addFilter(params: any): Promise<any> {
  console.log('➕ Adding filter:', params);
  
  if (!params.field || !params.value) {
    throw new Error('Filter requires field and value');
  }

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

private async removeFilter(params: any): Promise<any> {
  console.log('➖ Removing filter:', params);
  
  const filters = this.pluginsStart!.data.query.filterManager.getFilters();
  const updatedFilters = filters.filter((filter, index) => {
    if (params.index !== undefined) {
      return index !== params.index;
    }
    if (params.field) {
      return filter.meta?.key !== params.field;
    }
    return true;
  });

  this.pluginsStart!.data.query.filterManager.setFilters(updatedFilters);
  return { success: true, removedCount: filters.length - updatedFilters.length };
}
```

#### Time Range Management

```typescript
private async changeTimeRange(params: any): Promise<any> {
  console.log('⏰ Changing time range:', params);
  
  if (!params.from || !params.to) {
    throw new Error('Time range requires from and to parameters');
  }

  this.pluginsStart!.data.query.timefilter.timefilter.setTime({
    from: params.from,
    to: params.to,
  });

  return { success: true, timeRange: { from: params.from, to: params.to } };
}
```

#### Navigation Actions

```typescript
private async navigateToDiscover(params: any): Promise<any> {
  console.log('🧭 Navigating to Discover:', params);
  
  await this.coreStart!.application.navigateToApp('discover', {
    path: params.path || '',
  });
  
  return { success: true, destination: 'discover' };
}

private async navigateToDashboard(params: any): Promise<any> {
  console.log('🧭 Navigating to Dashboard:', params);
  
  const path = params.dashboardId ? `/${params.dashboardId}` : '';
  await this.coreStart!.application.navigateToApp('dashboards', {
    path,
  });
  
  return { success: true, destination: 'dashboards' };
}
```

### 2.6 Global API for External Integration

#### Browser Console API

```typescript
// Make service globally available for testing and chatbot/OSD agent integration
(window as any).contextProvider = {
  getCurrentContext: this.getCurrentContext.bind(this),
  executeAction: this.executeAction.bind(this),
  getAvailableActions: this.getAvailableActions.bind(this),
  // Test methods
  testTableRowClick: () => this.testTableRowClick(),
  testEmbeddableHover: () => this.testEmbeddableHover(),
  testFilterApplication: () => this.testFilterApplication(),
};

console.log('🌐 Context Provider API available at window.contextProvider');
console.log('📖 Available methods:', Object.keys((window as any).contextProvider));
```

#### API Usage Examples

```javascript
// Get current static context
await window.contextProvider.getCurrentContext()

// Execute actions (for chatbot/OSD agent)
await window.contextProvider.executeAction('ADD_FILTER', {
  field: 'status.keyword', 
  value: 'active'
})

// Get available actions
window.contextProvider.getAvailableActions()

// Test context capture manually
window.contextProvider.testTableRowClick()
window.contextProvider.testEmbeddableHover()
window.contextProvider.testFilterApplication()
```

## 3. Real-World Context Examples

### 3.1 Static Context - Dashboard Navigation

When navigating to a dashboard, the console shows:

```json
{
  "appId": "dashboards",
  "timestamp": 1693123456789,
  "data": {
    "appId": "dashboards",
    "url": "http://localhost:5601/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    "pathname": "/app/dashboards/7adfa750-4c81-11e8-b3d7-01146121b73d",
    "type": "dashboard",
    "dashboardId": "7adfa750-4c81-11e8-b3d7-01146121b73d",
    "dashboard": {
      "title": "Sample eCommerce Dashboard",
      "description": "A dashboard with sample eCommerce data",
      "panelsJSON": "[{\"version\":\"7.10.0\",\"panelIndex\":\"1\"}]"
    },
    "dataContext": {
      "timeRange": { "from": "now-15m", "to": "now" },
      "filters": [
        {
          "meta": { "key": "category.keyword", "type": "phrase" },
          "query": { "match_phrase": { "category.keyword": "Women's Clothing" } }
        }
      ],
      "query": { "query": "", "language": "kuery" }
    }
  }
}
```

### 3.2 Dynamic Context - Table Row Click

When clicking a table row in Discover:

```json
{
  "trigger": "TABLE_ROW_SELECT_TRIGGER",
  "timestamp": 1693123456789,
  "data": {
    "rowData": {
      "@timestamp": "Aug 30, 2023 @ 14:30:00.000",
      "host.name": "web-server-01",
      "response.keyword": "200",
      "bytes": "1,024",
      "url.keyword": "/api/products"
    },
    "rowIndex": 2,
    "tableState": {
      "totalRows": 50,
      "selectedRow": 2
    }
  }
}
```

### 3.3 Dynamic Context - Panel Hover

When hovering over a dashboard panel:

```json
{
  "trigger": "EMBEDDABLE_PANEL_HOVER_TRIGGER",
  "timestamp": 1693123456789,
  "data": {
    "embeddableId": "panel_1",
    "panelTitle": "Sales by Category",
    "embeddableType": "visualization",
    "panelElement": "[HTMLElement object]"
  }
}
```

## 4. Implementation Benefits

### 4.1 Zero Plugin Modifications

**Achievement**: Complete context capture without modifying any existing Dashboard or Discover plugin code.

**How**: 
- Application Service integration for automatic navigation detection
- UI Actions service for centralized interaction capture
- DOM event listeners for interaction gaps
- Data Services integration for unified data context access

### 4.2 Real-Time Context Awareness

**Achievement**: Immediate context capture and availability as users navigate and interact.

**How**:
- Observable-based architecture with instant updates
- Console logging for immediate visual feedback
- Global API for real-time access by external systems

### 4.3 Comprehensive Coverage

**Achievement**: Captures both static (page state) and dynamic (user interactions) context across multiple applications.

**Coverage**:
- ✅ Dashboard navigation and state
- ✅ Discover navigation and state  
