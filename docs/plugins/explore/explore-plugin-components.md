# Explore Plugin Components Architecture

## Overview

The Explore plugin is a modern data exploration interface for OpenSearch Dashboards, providing capabilities for exploring logs, traces, and metrics. It's built with React, TypeScript, and Redux, featuring a plugin-based architecture that allows extensibility.

## Directory Structure

```
src/plugins/explore/
├── public/
│   ├── plugin.ts                      # Main plugin entry point
│   ├── types.ts                       # Core type definitions
│   ├── build_services.ts              # Service initialization
│   ├── application/                   # Application layer
│   │   ├── index.tsx                  # App rendering & routing
│   │   ├── pages/                     # Page components
│   │   │   ├── logs/                  # Logs exploration page
│   │   │   ├── traces/                # Traces exploration page
│   │   │   └── metrics/               # Metrics exploration page
│   │   ├── context/                   # React contexts
│   │   │   ├── dataset_context.tsx    # Dataset selection context
│   │   │   └── editor_context.tsx     # Query editor context
│   │   ├── hooks/                     # Custom React hooks
│   │   └── utils/                     # Utilities
│   │       └── state_management/      # Redux store & slices
│   ├── components/                    # Reusable UI components
│   │   ├── query_panel/               # Query editor components
│   │   ├── data_table/                # Data table display
│   │   ├── chart/                     # Visualizations
│   │   ├── fields_selector/           # Field picker
│   │   └── tabs/                      # Tab components
│   ├── services/                      # Plugin services
│   │   ├── query_panel_actions_registry/  # Action registration
│   │   ├── tab_registry/              # Tab registration
│   │   └── visualization_registry_service/ # Viz types
│   └── embeddable/                    # Dashboard integration
└── server/                            # Server-side code
```

## Component Hierarchy

```
ExplorePlugin (plugin.ts)
└── renderApp (application/index.tsx)
    ├── OpenSearchDashboardsContextProvider (services)
    ├── ReduxProvider (Redux store)
    ├── EditorContextProvider (query editor)
    └── DatasetProvider (dataset selection)
        └── Router
            ├── LogsPage / TracesPage / MetricsPage
            │   ├── TopNav (save, open, share)
            │   ├── QueryPanel
            │   │   ├── QueryPanelWidgets (toolbar)
            │   │   │   ├── LanguageToggle
            │   │   │   ├── DatasetSelectWidget
            │   │   │   ├── RecentQueriesButton
            │   │   │   ├── SaveQueryButton
            │   │   │   └── QueryPanelActions (registered actions)
            │   │   └── QueryPanelEditor (Monaco)
            │   └── BottomContainer (resizable panels)
            │       ├── FieldsSelector (left)
            │       └── BottomRightContainer (right)
            │           ├── Chart (histogram)
            │           └── Tabs (results)
            └── TraceDetails (detail page)
```

## Core Components

### Plugin Entry Point

**File:** `src/plugins/explore/public/plugin.ts`

The main plugin class that manages the plugin lifecycle:

```typescript
export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private queryPanelActionsRegistryService = new QueryPanelActionsRegistryService();
  private tabRegistryService = new TabRegistryService();
  private visualizationRegistryService = new VisualizationRegistryService();

  public setup(core, deps): ExplorePluginSetup {
    // Initialize registries
    const queryPanelActionsRegistry = this.queryPanelActionsRegistryService.setup();
    const tabRegistry = this.tabRegistryService.setup();
    const visualizationRegistry = this.visualizationRegistryService.setup();

    // Register app flavors (logs, traces, metrics)
    // Return public API for other plugins
    return {
      queryPanelActionsRegistry,
      tabRegistry,
      visualizationRegistry,
    };
  }

  public start(core, deps): ExplorePluginStart {
    return {};
  }
}
```

**Responsibilities:**
- Initialize plugin services and registries
- Register multiple app flavors (Logs, Traces, Metrics)
- Expose public APIs for extensibility
- Manage plugin lifecycle

### Application Entry Point

**File:** `src/plugins/explore/application/index.tsx`

Sets up the React application with all necessary providers:

```typescript
export const renderApp = (
  { element, history }: AppMountParameters,
  services: ExploreServices
) => {
  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <ReduxProvider store={store}>
        <EditorContextProvider>
          <DatasetProvider>
            <Router history={history}>
              {/* Routes for different pages */}
            </Router>
          </DatasetProvider>
        </EditorContextProvider>
      </ReduxProvider>
    </OpenSearchDashboardsContextProvider>,
    element
  );
};
```

**Responsibilities:**
- Set up React context providers
- Initialize Redux store
- Configure routing
- Mount the application

### Query Panel

**File:** `src/plugins/explore/public/components/query_panel/query_panel.tsx`

The main query editor container:

```typescript
export const QueryPanel = () => {
  return (
    <EuiPanel>
      <QueryPanelWidgets />
      <QueryPanelEditor />
      {isLoading && <ProgressBar />}
    </EuiPanel>
  );
};
```

**Child Components:**

#### QueryPanelWidgets
**File:** `src/plugins/explore/public/components/query_panel/query_panel_widgets/query_panel_widgets.tsx`

Toolbar with query controls:
- Language toggle (PPL/SQL/DQL)
- Dataset selector
- Recent queries button
- Save query button
- Query panel actions dropdown
- Ask AI button (if available)
- Reference documentation link

#### QueryPanelEditor
**File:** `src/plugins/explore/public/components/query_panel/query_panel_widgets/query_panel_editor.tsx`

Monaco-based code editor for writing queries with:
- Syntax highlighting
- Auto-completion
- Multi-line editing
- Keyboard shortcuts (Ctrl+Enter to run)

#### QueryPanelActions
**File:** `src/plugins/explore/public/components/query_panel/query_panel_widgets/query_panel_actions/query_panel_actions.tsx`

Renders registered actions from the QueryPanelActionsRegistry:

```typescript
export const QueryPanelActions = ({ registry }: QueryPanelActionsProps) => {
  // Get fresh dependencies on every render (intentionally not memoized)
  // This ensures flyouts always receive current editor content
  const dependencies = useQueryPanelActionDependencies();

  const handleActionClick = (action: QueryPanelActionConfig) => {
    if (action.actionType === 'button') {
      action.onClick(dependencies);
    } else if (action.actionType === 'flyout') {
      action.onFlyoutOpen?.(dependencies);
      setOpenFlyoutId(action.id);
    }
  };

  return (
    <>
      <EuiPopover button={<ActionButton />}>
        <EuiListGroup>
          {registry.getSortedActions().map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() => handleActionClick(action)}
              dependencies={dependencies}
            />
          ))}
        </EuiListGroup>
      </EuiPopover>

      {/* Render flyout if one is open */}
      {openFlyoutConfig && (
        <openFlyoutConfig.component
          closeFlyout={closeFlyout}
          dependencies={dependencies}
          services={services}
        />
      )}
    </>
  );
};
```

**Note:** Dependencies are not memoized to ensure fresh editor content is always passed to actions. This approach maintains performance because the component only re-renders on state changes (not on every keystroke).

### Results Display

#### BottomContainer
**File:** `src/plugins/explore/public/components/container/bottom_container/bottom_container.tsx`

Resizable container with fields selector and results:

```typescript
export const BottomContainer = () => {
  return (
    <EuiResizableContainer>
      <EuiResizablePanel initialSize={20}>
        <FieldsSelector />
      </EuiResizablePanel>
      <EuiResizablePanel initialSize={80}>
        <BottomRightContainer />
      </EuiResizablePanel>
    </EuiResizableContainer>
  );
};
```

#### Chart (Histogram)
**File:** `src/plugins/explore/public/components/chart/histogram/histogram.tsx`

Time-based histogram visualization showing data distribution over time.

#### Tabs
**File:** `src/plugins/explore/public/components/tabs/`

Tabbed interface for different result views:
- **LogsTab**: Table view of log results
- **VisualizationTab**: Chart/visualization builder
- **PatternsTab**: Log pattern analysis

Each tab reads results from Redux using its cache key.

## State Management

### Redux Store Structure

```typescript
interface RootState {
  query: QueryState;           // Current query (persisted to URL)
  ui: UIState;                 // UI preferences (persisted to URL)
  results: ResultsState;       // Cached query results (NOT persisted)
  tab: TabState;               // Tab-specific state (persisted to URL)
  legacy: LegacyState;         // Legacy discover state (persisted to URL)
  queryEditor: QueryEditorState;  // Query editor state
  meta: MetaState;             // Metadata
}
```

### Query State
```typescript
interface QueryState {
  query: string;               // Query text
  language: string;            // PPL, SQL, DQL, or natural language
  dataset?: Dataset;           // Selected dataset/index
  dateRange: TimeRange;        // Time range filter
}
```

### Results State
```typescript
interface ResultsState {
  [cacheKey: string]: {
    status: QueryExecutionStatus;
    data?: SearchResponse;
    error?: Error;
  };
}
```

Cache keys are generated based on query + context, allowing multiple result sets to coexist.

### State Persistence

The plugin uses middleware to sync state with URL parameters:
- Query, UI, tab states → URL query parameters
- Results are NOT persisted (generated on demand)
- Allows sharing URLs with full context

## Query Execution Flow

```
1. User enters query in QueryPanelEditor
   ↓
2. Query saved to Redux (query slice)
   ↓
3. User presses Run or Ctrl+Enter
   ↓
4. executeQueries() dispatched
   ↓
5. Two queries prepared:
   - Histogram query (with time aggregations)
   - Tab query (raw results)
   ↓
6. Queries executed via data plugin
   ↓
7. Results cached in Redux by cache key
   ↓
8. Components select results using cache key
   ↓
9. Chart and tabs update with new data
```

## Context Providers

### DatasetProvider
**File:** `src/plugins/explore/application/context/dataset_context.tsx`

Manages currently selected dataset/index pattern:

```typescript
interface DatasetContextValue {
  dataset?: Dataset;
  setDataset: (dataset: Dataset) => void;
  datasetType?: string;
}
```

### EditorContextProvider
**File:** `src/plugins/explore/application/context/editor_context.tsx`

Manages query editor state and refs:

```typescript
interface EditorContextValue {
  editorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor>;
  // ... other editor state
}
```

### TraceFlyoutProvider
**File:** (traces-specific)

Manages trace detail flyout state for the traces flavor.

## Extension Points

The Explore plugin provides three primary extension mechanisms:

### 1. Query Panel Actions Registry

**Service:** `QueryPanelActionsRegistryService`
**File:** `src/plugins/explore/public/services/query_panel_actions_registry/`

Allows plugins to add actions to the query panel actions dropdown.

**API:**
```typescript
// Button action - executes onClick callback
interface ButtonActionConfig {
  id: string;
  actionType: 'button';
  order: number;
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  getLabel(deps: QueryPanelActionDependencies): string;
  getIcon?(deps: QueryPanelActionDependencies): IconType;
  onClick(deps: QueryPanelActionDependencies): void;
}

// Flyout action - renders React component
interface FlyoutActionConfig {
  id: string;
  actionType: 'flyout';
  order: number;
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  getLabel(deps: QueryPanelActionDependencies): string;
  getIcon?(deps: QueryPanelActionDependencies): IconType;
  component: React.ComponentType<FlyoutComponentProps>;
  onFlyoutOpen?(deps: QueryPanelActionDependencies): void;
}

type QueryPanelActionConfig = ButtonActionConfig | FlyoutActionConfig;

interface QueryPanelActionDependencies {
  query: QueryWithQueryAsString;    // Last executed query (pre-transformed with source clause)
  resultStatus: QueryResultStatus;  // Query execution status
  queryInEditor: string;             // Current editor content (pre-transformed, ready to execute)
}
```

**Important:** Both `query.query` and `queryInEditor` are pre-transformed with the `source = <dataset>` clause by the explore plugin. External plugins receive ready-to-execute queries.

**Example Usage:**
```typescript
// In another plugin's setup
export class MyPlugin {
  public setup(core, { explore }) {
    explore.queryPanelActionsRegistry.register({
      id: 'export-results',
      order: 10,
      getLabel: () => 'Export Results',
      getIcon: () => 'exportAction',
      getIsEnabled: (deps) => deps.resultStatus.status === 'READY',
      onClick: (deps) => {
        // Export logic using deps.query
      }
    });
  }
}
```

**See:** [query-panel-actions.md](./query-panel-actions.md) for detailed documentation.

### 2. Tab Registry

**Service:** `TabRegistryService`

Allows plugins to add custom result tabs.

**API:**
```typescript
interface TabConfig {
  id: string;
  name: string;
  component: React.ComponentType<TabProps>;
  queryTransformer?: (query: Query) => Query;
}
```

### 3. Visualization Registry

**Service:** `VisualizationRegistryService`

Allows plugins to add custom visualization types to the Visualization tab.

## Data Flow Patterns

### Pattern 1: Redux → Component
Most components read state directly from Redux:

```typescript
const MyComponent = () => {
  const query = useSelector(selectQuery);
  const results = useSelector(selectResults(cacheKey));
  // ... render based on state
};
```

### Pattern 2: Context → Component
Some state is managed via React Context:

```typescript
const MyComponent = () => {
  const { dataset, setDataset } = useDataset();
  // ... use dataset context
};
```

### Pattern 3: Services → Component
Services are accessed via OpenSearchDashboards context:

```typescript
const MyComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { data, notifications, queryPanelActionsRegistry } = services;
  // ... use services
};
```

## Best Practices

### Component Organization
- Keep components focused and single-purpose
- Place related components in same directory
- Use barrel exports (index.ts) for clean imports

### State Management
- Use Redux for global, serializable state
- Use Context for React-specific state (refs, UI)
- Avoid prop drilling - use selectors or context

### Naming Conventions
- Files: snake_case (e.g., `query_panel.tsx`)
- Components: PascalCase (e.g., `QueryPanel`)
- Hooks: camelCase with `use` prefix (e.g., `useDataset`)
- Types: PascalCase with descriptive names

### Performance
- Use `React.memo` for expensive renders
- Leverage cache keys for result caching
- Avoid unnecessary re-renders with proper selectors
- **Query panel action dependencies are NOT memoized** to ensure fresh editor content
- Components re-render only on state changes, not on every keystroke (editor text is in local state, not Redux)

### Testing
- Place test files next to source: `component.test.tsx`
- Test user interactions, not implementation
- Mock external dependencies (services, data plugin)
- Use React Testing Library for component tests

## Common Development Tasks

### Adding a Query Panel Action
See [query-panel-actions.md](./query-panel-actions.md)

### Adding a New Tab
1. Create tab component implementing `TabProps`
2. Register in plugin setup via `tabRegistry.register()`
3. Optionally provide query transformer

### Accessing Query Results
```typescript
const MyComponent = () => {
  // Generate cache key for your query
  const cacheKey = useMemo(() =>
    generateCacheKey(query, 'my-component'),
    [query]
  );

  // Select results from Redux
  const results = useSelector(selectResults(cacheKey));

  // Use results
};
```

### Modifying Query State
```typescript
import { setQuery } from 'application/utils/state_management/slices/query_slice';

const MyComponent = () => {
  const dispatch = useDispatch();

  const updateQuery = (newQuery: string) => {
    dispatch(setQuery({ query: newQuery }));
  };
};
```

## Troubleshooting

### Component Not Receiving Updates
- Check if using correct Redux selector
- Verify cache key matches query execution
- Ensure component is within provider tree

### Action Not Appearing in Dropdown
- Verify registration happens in plugin setup
- Check if action is enabled via `getIsEnabled`
- Verify order is set correctly

### State Not Persisting
- Check if slice is configured for URL sync
- Verify middleware is properly set up
- Ensure state is serializable

## Architecture Decisions

### Why Redux?
- Serializable state for URL sync
- Time-travel debugging
- Clear data flow
- Easy testing

### Why Multiple Registries?
- Separation of concerns
- Clear extension APIs
- Type safety per registry
- Independent versioning

### Why Monaco Editor?
- Rich editing features
- Syntax highlighting
- Auto-completion
- Industry standard

## Future Extensibility

Potential future extension points:
- Field renderer registry (custom field formatters)
- Context menu actions (right-click on results)
- Toolbar button registry (custom toolbar buttons)
- Result row actions (per-row action buttons)

**Note:** Flyout actions are already supported via `actionType: 'flyout'` in the Query Panel Actions Registry.

## References

- [Query Panel Actions](./query-panel-actions.md)
- [OpenSearch Dashboards Plugin Development](../../CONTRIBUTING.md)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [OUI Component Library](https://oui.opensearch.org/)
