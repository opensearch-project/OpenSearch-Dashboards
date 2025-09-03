OpenSearch Dashboards Context Provider

Problem Statement

1.1 The Context Definition in AI Systems

In AI and LLM systems, context refers to the background information provided to the model to help it understand and respond appropriately to user queries. Context typically includes:

Conversation History: Previous messages and responses in the current session
System Instructions: Role definitions and behavioral guidelines for the AI
Domain Knowledge: Relevant information about the current task or domain
Environmental State: Current application state, user preferences, and session data

For a context provider system, we focus specifically on Domain Knowledge and Environmental State - the OpenSearch Dashboards-specific information that enables AI to understand what users are looking at and working with. Conversation History and System Instructions are handled by the chatbot system itself.

For example, when a user asks "What's the trend in the last quarter?", an LLM without OSD context cannot know:

* What data source they're looking at
* What metrics they're interested in
* What time range constitutes "last quarter" in their context
* What visualizations are currently displayed

1.2 The Context Definition in OpenSearch Dashboards

OpenSearch Dashboards Context refers to the comprehensive application state and user interaction data that describes:

What the user is currently viewing (dashboards, visualizations, data)
How they've configured their view (filters, queries, time ranges)
What actions they've performed (clicks, selections, navigation)
What data they're working with (index patterns, fields, search results)

This context enables AI assistants to understand the user's current analytical context and provide relevant, specific assistance rather than generic responses.

Example Scenario:

User Context (in OSD):
- Viewing "Sales Performance" dashboard
- Applied filters: Region=West, Time=Last 30 days
- Looking at a bar chart showing revenue by product category
- Just clicked on "Electronics" category showing $2.3M revenue

User Question: "Why is this number so high compared to last month?"


AI Response (without context): "I'd be happy to help analyze numbers, but could you please tell me what specific number you're referring to and provide more details about your data?"

AI Response (with context): "The Electronics category showing $2.3M revenue in the West region for the last 30 days is significantly higher than usual. Looking at the trend data, this appears to be driven by a 40% increase in laptop sales during the recent back-to-school promotion. Would you like me to break down the contributing factors or compare with other regions?"


1.3 The Context Types in OpenSearch Dashboards

Based on our research of OSD's architecture, we can categorize the available context into three types:


Static Context (Page Load State)

Information available when a user loads a page or application:

Dashboard Page Load Context:
{
  app: "dashboard",
  dashboard: {
    title: "Sales Performance Dashboard",
    description: "Monthly sales analysis across regions",
    panelCount: 6,
    panels: [
      { type: "visualization", title: "Revenue by Region", chartType: "bar" },
      { type: "visualization", title: "Sales Trend", chartType: "line" },
      { type: "search", title: "Recent Transactions" }
    ],
    filters: [
      { field: "region", value: "West", type: "phrase" },
      { field: "date", from: "2024-01-01", to: "2024-01-31", type: "range" }
    ],
    query: { language: "kuery", query: "status:active" },
    timeRange: { from: "now-30d", to: "now" },
    viewMode: "view"
  }
}

Explore Page Load Context:
{
  app: "explore",
  explore: {
    activeTab: "logs",
    query: {
      query: "level:ERROR",
      language: "DQL",
      dataset: { id: "logs-*", title: "Application Logs", type: "INDEX_PATTERN" }
    },
    columns: ["timestamp", "level", "message", "service"],
    sort: [{ timestamp: { order: "desc" } }],
    showHistogram: true,
    globalState: {
      filters: [{ field: "environment", value: "production" }],
      timeRange: { from: "now-1h", to: "now" }
    }
  }
}



Dynamic Context (User Interactions)

Information captured when users interact with the interface. Examples are:

Value Click Context:

{
  trigger: "VALUE_CLICK_TRIGGER",
  interaction: {
    clickedValue: "Electronics",
    chartType: "bar",
    panelTitle: "Revenue by Category",
    dataValue: 2300000,
    timestamp: "2024-01-15T10:30:00Z"
  },
  dashboard: { /* current dashboard state */ }
}

Filter Application Context:

{
  trigger: "APPLY_FILTER_TRIGGER",
  interaction: {
    filterType: "phrase",
    field: "product_category",
    value: "Electronics",
    action: "add"
  },
  resultingState: { /* updated dashboard state */ }
}

Historical Context (User Patterns)

Information about user behavior over time. Example: 

{
  userPatterns: {
    frequentDashboards: ["Sales Performance", "Customer Analytics"],
    commonFilters: ["region:West", "status:active"],
    typicalTimeRanges: ["last 30 days", "last week"],
    recentActions: [
      { action: "filter_applied", field: "region", value: "West", timestamp: "..." },
      { action: "chart_clicked", panel: "Revenue by Category", value: "Electronics", timestamp: "..." }
    ]
  }
}



1.4 Current Context Capture Approaches

The CopilotKit Approach

Currently, the most common approach for capturing application context is using libraries like CopilotKit, which provides hooks like useCopilotReadable to make component state available to AI systems. Here is the CopilotKit Pattern:

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



The Challenge with OpenSearch Dashboards

To capture comprehensive OSD context using the CopilotKit approach, we would need to wrap numerous components. Examples: 

Dashboard Application:
- DashboardContainer - for dashboard title, description, panels
- DashboardGrid - for panel layout and configuration
- FilterBar - for applied filters
- QueryBar - for current query
- TimeRangePicker - for time range selection
- Each individual EmbeddablePanel - for visualization state
- GlobalQueryStateProvider - for global query state
- TimefilterService wrapper - for time filter state

~15-20 components requiring modification

Problems with this approach:
1. Massive Code Changes: Requires modifying dozens of existing components
2. Performance Impact: Each wrapped component adds overhead
3. Maintenance Burden: Every new feature needs context integration
4. Plugin Coupling: Tight coupling between UI components and context system
5. State Duplication: Multiple components may expose overlapping state


The Need for a New Approach

Given the complexity and maintenance burden of the traditional approach, we need a new context capture strategy for OpenSearch Dashboards that:

- Captures rich context without modifying existing components
- Leverages OSD's existing infrastructure and patterns
- Provides comprehensive coverage across all applications
- Maintains high performance and low maintenance overhead
- Works seamlessly across different state management patterns (embeddables, Redux, data services)


Proposed OSD Context Provider Architecture

2.1 Understanding OpenSearch Dashboards Infrastructure

Before explaining our solution, we need to understand the key OSD infrastructure components that enable context capture:

2.1.1 UI Actions Service

What it is: The UI Actions service is OSD's centralized event system that handles all user interactions across the entire platform. Every click, filter application, chart interaction, and navigation flows through this service.

Why it matters for context:Instead of wrapping 35+ individual components, we can register a single listener with UI Actions to capture ALL user interactions from a central location.

How it works:

// All user interactions trigger actions like these:
uiActions.executeTriggerActions('VALUE_CLICK_TRIGGER', context);
uiActions.executeTriggerActions('APPLY_FILTER_TRIGGER', context);
uiActions.executeTriggerActions('SELECT_RANGE_TRIGGER', context);


2.1.2 Embeddable System
What it is: OSD's component architecture where visualizations, dashboards, and other UI elements are "embeddables" - self-contained components with their own state management.

Why it matters for context: Dashboard panels, visualizations, and saved searches are all embeddables. Each embeddable maintains its own state and can be queried for current configuration.

How it works:

// Dashboard contains multiple embeddable panels
const dashboard = getDashboardContainer();
const panels = dashboard.getChildren(); // All visualization panels
const panelState = panel.getInput(); // Current panel configuration


2.1.3 OpenSearch Dashboards Utils
What it is: A utility library providing common services like state management, URL synchronization, and data access patterns used across plugins.

Why it matters for context: Provides standardized ways to access application state, making our context capture consistent across different plugins.


2.2 Overall architecture

Based on the AI architecture diagram, here's how the context provider fits into the broader system:

Page → Chat UI (Static Context Flow):
- When a user loads an OSD page (Dashboard, Explore, etc.), the Page captures initial static context
- This includes application (page) configuration, applied filters, time ranges, and panel layouts
- Static context flows directly to Chat UI as "Page static context Resources"
- This gives the Chat UI immediate awareness of what the user is currently viewing

Page → Page Tools (Dynamic Context Flow):
- As users interact with OSD (clicking charts, applying filters, navigating), the Page captures these as "Page dynamic context"
- The Context Provider system (Page Tools) receives these UI Actions and stores the interaction data
- Page Tools contains two components:
Context Tools: Capture and store current state, interaction history, user patterns
Action Tools: Enable AI to modify dashboards, apply filters, create visualizations (This is future scope)


Page Tools → OSD Agent (Tool Provision):
- Page Tools provides context and action tools to OSD Agent
- These tools allow the AI system to both read current context and require additional context to the page
- Example method in the context tool could be get_current_context  for page level and panel level


Chat UI → OSD Agent (Task Flow):
- When users interact with Chat UI, tasks are sent to OSD Agent
- OSD Agent can then use the tools provided by Page Tools to understand context and take actions
- This creates a complete loop: User interacts with page → Context captured → AI understands context → AI can act on page


Example - Complete Flow:

1. User loads Sales Dashboard → Page static context → Chat UI knows current dashboard
2. User clicks "Electronics" chart → Page dynamic context → Page Tools captures interaction
3. User asks Chat UI: "Why is this number high?" → Task → OSD Agent
4. OSD Agent calls get_current_context tool → Page Tools returns with additional context like panel state + "User clicked Electronics showing $2.3M"
5. AI provides contextual response about Electronics performance

2.3 Page Static Context Capture

What we capture: Current application state (both initial load AND after user changes)
Key Insight:"Static" doesn't mean "never changes" - it means "current page state" that gets updated when users make changes.
Implementation Location: Built into each OSD application, with state change listeners

Example 1: Dashboard 

* Uses: Pure Embeddable System (DashboardContainer)
* Specific APIs: container.getDashboardTitle(), container.getInput().filters, container.getChildIds(), panel.getTitle()

export class DashboardApp {
  private chatUIConnection: ChatUIConnection;
  
  async mount(params: AppMountParameters) {
    const dashboardContainer = await this.setupDashboard();
    
    // Initial static context capture
    this.sendCurrentContextToChatUI(dashboardContainer);
    
    // Listen for dashboard changes (user adds panels, changes filters, etc.)
    dashboardContainer.getInput$().subscribe(() => {
      this.sendCurrentContextToChatUI(dashboardContainer);
    });
    
    return () => dashboardContainer.destroy();
  }
  
  private sendCurrentContextToChatUI(container: DashboardContainer) {
    const currentContext = {
      app: 'dashboard',
      timestamp: Date.now(),
      dashboard: {
        // Embeddable System APIs:
        id: container.getDashboardSavedObjectId(),           // From embeddable
        title: container.getDashboardTitle(),                // From embeddable
        description: container.getDashboardDescription(),    // From embeddable
        panels: this.extractPanelStates(container),         // From embeddable
        filters: container.getInput().filters,              // From embeddable
        query: container.getInput().query,                  // From embeddable
        timeRange: container.getInput().timeRange,          // From embeddable
        viewMode: container.getInput().viewMode             // From embeddable
      }
    };
    
    // Send to Chat UI (Page → Chat UI flow)
    this.chatUIConnection.updateStaticContext(currentContext);
  }
  
  private extractPanelStates(container: DashboardContainer) {
    // All from Embeddable System:
    return Object.values(container.getChildIds()).map(panelId => {
      const panel = container.getChild(panelId);           // Embeddable API
      return {
        id: panelId,
        type: panel.type,                                  // Embeddable API
        title: panel.getTitle(),                           // Embeddable API
        chartType: panel.getOutput().defaultTitle || 'unknown'
      };
    });
  }
}

* What triggers updates:
    * User adds new visualization panel → container.getInput$() fires → Chat UI gets updated context
    * User changes filters → container.getInput$() fires → Chat UI knows new filters
    * User changes time range → container.getInput$() fires → Chat UI knows new time range



Example 2: Explore

* Uses: Three OSD infrastructure components:
    * Redux Store: services.store.getState() for dataset, columns, activeTab
    * opensearch_dashboards_utils: services.osdUrlStateStorage.get('_q') for URL state
    * Data Services: services.data.query.filterManager.getGlobalFilters() for global state

export class ExploreApp {
  private chatUIConnection: ChatUIConnection;
  
  async mount(params: AppMountParameters) {
    const services = getServices();
    await this.setupExploreApp(services);
    
    // Initial static context capture
    this.sendCurrentContextToChatUI(services);
    
    // Listen for Redux state changes (user changes query, dataset, etc.)
    services.store.subscribe(() => {
      this.sendCurrentContextToChatUI(services);
    });
    
    // Listen for global state changes (filters, time range)
    services.data.query.filterManager.getUpdates$().subscribe(() => {
      this.sendCurrentContextToChatUI(services);
    });
    
    return () => this.cleanup();
  }
  
  private sendCurrentContextToChatUI(services: ExploreServices) {
    const reduxState = services.store.getState();
    
    const currentContext = {
      app: 'explore',
      timestamp: Date.now(),
      explore: {
        // opensearch_dashboards_utils APIs:
        query: services.osdUrlStateStorage.get('_q'),       // From utils
        appState: services.osdUrlStateStorage.get('_a'),    // From utils
        globalState: services.osdUrlStateStorage.get('_g'), // From utils
        
        // Redux Store APIs:
        dataset: reduxState.explore.dataset,               // From Redux
        columns: reduxState.explore.columns,               // From Redux
        activeTab: reduxState.explore.ui.activeTab,        // From Redux
        results: reduxState.explore.results,               // From Redux
        
        // Data Services APIs:
        globalFilters: services.data.query.filterManager.getGlobalFilters(), // Data services
        timeRange: services.data.query.timefilter.timefilter.getTime()       // Data services
      }
    };
    
    // Send to Chat UI (Page → Chat UI flow)
    this.chatUIConnection.updateStaticContext(currentContext);
  }
}

* What triggers updates:
    * User changes query in query editor → Redux store changes → Chat UI gets updated context
    * User changes dataset → Redux store changes → Chat UI knows new dataset
    * User changes date range → filterManager.getUpdates$() fires → Chat UI knows new time range
    * User switches tabs → Redux store changes → Chat UI knows active tab

Chat UI Integration

Needs to listen for static context updates from OSD pages

Example workflow
1. User loads Sales Dashboard → provide static context for initial page load to Chat UI
2. User adds new panel → Dashboard detects change → update context in Chat UI: "I see Sales Dashboard with 7 panels"
3. User changes filter to "East region" → Dashboard detects change → update context in Chat UI: "I see Sales Dashboard filtered to East region"
4. User changes query → Dashboard detects change → update context in Chat UI: "I see updated query: status:active AND region:East"

TODO: 2.4 Page Dynamic Context Capture

What we capture: Real-time user interactions and resulting state changes
How we leverage OSD infrastructure:
- Single Universal Action: Register once in opensearch_dashboards_utils
- Multi-Plugin State Access: Adapt to each plugin's state pattern
- Existing UI Actions Triggers: Leverage all existing triggers across plugins
