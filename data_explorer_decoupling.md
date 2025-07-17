# Decoupling from data_explorer

This document analyzes how the Explore plugin has been decoupled from the data_explorer plugin. It provides a detailed comparison of each major functionality provided by data_explorer and explains how the new architecture replaces it.

## 1. Component Wrapping and Rendering

### In data_explorer:
- Provides a wrapper component (`DataExplorerView`) that renders the Discover components
- Manages the layout and structure of the Discover UI
- Provides services to child components through context

```tsx
// data_explorer/public/application/view.tsx
export function DataExplorerView(props: ViewProps) {
  // ...
  return (
    <div className="dscView">
      <div className="dscViewContent">
        <DiscoverSidebar />
        <DiscoverCanvas />
      </div>
    </div>
  );
}
```

### In Explore:
- Directly renders components without a wrapper
- Uses Redux for state management
- Provides services through the Redux store

```tsx
// explore/public/application/app.tsx
export const ExploreApp: React.FC<{ services: ExploreServices }> = ({ services }) => {
  // ...
  return (
    <EuiPage className="exploreApp">
      <EuiPageBody>
        <div className="exploreApp__queryPanel">
          <QueryPanel />
        </div>
        <div className="exploreApp__tabBar">
          <TabBar />
        </div>
        <div className="exploreApp__tabContent">
          <TabContent />
        </div>
      </EuiPageBody>
    </EuiPage>
  );
};
```

### Key Differences:
- **Direct Rendering**: Explore directly renders components without a wrapper
- **Different Layout**: Explore uses a different layout with QueryPanel, TabBar, and TabContent
- **Redux Integration**: Explore uses Redux for state management instead of context

## 2. Service Provision

### In data_explorer:
- Provides services to child components through context
- Creates and initializes services in the wrapper component
- Passes services down to child components

```tsx
// data_explorer/public/application/view.tsx
export function DataExplorerView(props: ViewProps) {
  const services = createServices(props);
  
  return (
    <DataExplorerContext.Provider value={services}>
      {/* Child components */}
    </DataExplorerContext.Provider>
  );
}
```

### In Explore:
- Provides services through the Redux store
- Initializes services during store creation
- Components access services through selectors

```tsx
// explore/public/application/state_management/store.ts
export const getExploreStore = async (services: any, preloadedState?: any) => {
  // Create store with services in state
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...preloadedState,
      services, // Inject services into the store for thunks to access
    },
  });
  
  // ...
  
  return { store, unsubscribe };
};
```

### Key Differences:
- **Redux vs. Context**: Explore uses Redux store instead of React context for service provision
- **Centralized Access**: All components access services from the same source
- **Thunk Integration**: Services are available to thunks through getState

## 3. State Management

### In data_explorer:
- Uses React context for state management
- Provides a state management utility (`useSelector`, `useDispatch`)
- State is managed in a context provider

```tsx
// data_explorer/public/application/utils/state_management.tsx
export function useSelector<T>(selector: (state: State) => T): T {
  const { state } = useContext(StateContext);
  return selector(state);
}

export function useDispatch() {
  const { dispatch } = useContext(StateContext);
  return dispatch;
}
```

### In Explore:
- Uses Redux for state management
- State is divided into slices (query, ui, results, tab, transaction, legacy)
- Components use Redux hooks (`useSelector`, `useDispatch`)

```tsx
// explore/public/application/state_management/store.ts
const rootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  transaction: transactionReducer,
  legacy: legacyReducer,
  services: servicesReducer,
});
```

### Key Differences:
- **Redux vs. Context**: Explore uses Redux instead of React context
- **Sliced State**: State is divided into logical slices
- **Standard Redux Patterns**: Uses standard Redux patterns and hooks

## 4. URL State Management

### In data_explorer:
- Uses `osdUrlStateStorage` for URL state management
- Syncs state with URL parameters
- Handles loading state from URL

```tsx
// data_explorer/public/application/view.tsx
useEffect(() => {
  const { pathname } = history.location;
  const { search } = history.location;
  
  // Sync state with URL
  const urlState = osdUrlStateStorage.get('_a', search);
  if (urlState) {
    dispatch({ type: 'SET_STATE', payload: urlState });
  }
  
  // ...
}, []);
```

### In Explore:
- Uses `redux_persistence.ts` for URL state management
- Separates concerns between `_a`, `_g`, and `_q` parameters
- Handles loading and persisting state

```tsx
// explore/public/application/state_management/utils/redux_persistence.ts
export const persistReduxState = (
  { ui, tab }: RootState,
  services: any
) => {
  try {
    services.osdUrlStateStorage.set(
      '_a',
      {
        ui: {
          activeTabId: ui.activeTabId,
          flavor: ui.flavor,
        },
        tab,
      },
      { replace: true }
    );
  } catch (err) {
    console.error('Error persisting state to URL:', err);
  }
};

export const persistQueryState = (
  { query }: RootState,
  services: any
) => {
  try {
    services.osdUrlStateStorage.set(
      '_q',
      {
        query: query.query,
        filters: [],
      },
      { replace: true }
    );
  } catch (err) {
    console.error('Error persisting query state to URL:', err);
  }
};
```

### Key Differences:
- **Separate Parameters**: Explore separates state across `_a`, `_g`, and `_q` parameters
- **Centralized Persistence**: Persistence is handled in a centralized utility
- **Redux Integration**: Persistence is integrated with Redux store

## 5. Search Functionality

### In data_explorer:
- Provides the `use_search` hook for search functionality
- Manages search state in a BehaviorSubject
- Handles query execution, result processing, and error handling

```tsx
// data_explorer/public/application/view_components/utils/use_search.ts
export const useSearch = (services: DiscoverViewServices) => {
  // ...
  
  const fetch = useCallback(async () => {
    // Create and configure SearchSource
    // Execute query
    // Process results
    // Update data$ BehaviorSubject
  }, [/* dependencies */]);
  
  // ...
  
  return {
    data$,
    refetch$,
    indexPattern,
    savedSearch,
    inspectorAdapters,
    fetchForMaxCsvOption,
  };
};
```

### In Explore:
- Uses Redux Thunk for search functionality
- Manages search state in the Redux store
- Handles query execution, result processing, and error handling through thunks

```tsx
// explore/public/application/state_management/actions/query_actions.ts
export const executeTabQuery = (options: { clearCache?: boolean } = {}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    // Create and configure SearchSource
    // Execute query
    // Process results
    // Update Redux store
  };
};
```

### Key Differences:
- **Redux Thunk vs. Hook**: Explore uses Redux Thunk instead of a custom hook
- **Centralized State**: Search state is managed in the Redux store
- **Tab-Specific Transformations**: Queries are transformed based on the active tab

## 6. Component Structure

### In data_explorer:
- Components are organized in a flat structure
- Components are tightly coupled with data_explorer
- Components use context for state and services

```
data_explorer/
  ├── public/
  │   ├── application/
  │   │   ├── view.tsx
  │   │   ├── view_components/
  │   │   │   ├── canvas/
  │   │   │   ├── panel/
  │   │   │   ├── context/
  │   │   │   └── utils/
```

### In Explore:
- Components are organized in a hierarchical structure
- Components are decoupled from data_explorer
- Components use Redux for state and services

```
explore/
  ├── public/
  │   ├── application/
  │   │   ├── app.tsx
  │   │   ├── components/
  │   │   │   ├── query_panel/
  │   │   │   ├── tab_bar/
  │   │   │   └── tab_content/
  │   │   ├── state_management/
  │   │   │   ├── slices/
  │   │   │   ├── actions/
  │   │   │   ├── handlers/
  │   │   │   ├── selectors/
  │   │   │   └── utils/
  │   │   └── legacy/
  │   │       └── discover/
```

### Key Differences:
- **Hierarchical Structure**: Explore uses a more hierarchical component structure
- **State Management Separation**: State management is separated into its own directory
- **Legacy Support**: Legacy components are kept in a separate directory

## 7. Plugin Integration

### In data_explorer:
- Integrates with Discover plugin through imports
- Provides a wrapper for Discover components
- Manages the lifecycle of Discover components

```tsx
// data_explorer/public/plugin.ts
export class DataExplorerPlugin implements Plugin<DataExplorerPluginSetup, DataExplorerPluginStart> {
  public setup(core: CoreSetup, plugins: DataExplorerSetupPlugins): DataExplorerPluginSetup {
    // ...
    
    core.application.register({
      id: 'data_explorer',
      title: 'Data Explorer',
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart] = await core.getStartServices();
        return renderApp(coreStart, pluginsStart, params);
      },
    });
    
    // ...
  }
}
```

### In Explore:
- Directly implements functionality without depending on data_explorer
- Registers its own application
- Manages its own lifecycle

```tsx
// explore/public/plugin.ts
export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private readonly tabRegistry = new TabRegistryService();
  
  public setup(core: CoreSetup, plugins: ExploreSetupPlugins): ExplorePluginSetup {
    // ...
    
    core.application.register({
      id: 'explore',
      title: 'Explore',
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart] = await core.getStartServices();
        return renderApp(coreStart, pluginsStart, params);
      },
    });
    
    // Register built-in tabs
    this.registerBuiltInTabs();
    
    // ...
  }
}
```

### Key Differences:
- **Direct Implementation**: Explore directly implements functionality without depending on data_explorer
- **Tab Registry**: Explore introduces a tab registry for extensibility
- **Built-in Tabs**: Explore registers built-in tabs during setup

## 8. Services

### In data_explorer:
- Creates and provides services for Discover components
- Services are created in the wrapper component
- Services are passed down through context

```tsx
// data_explorer/public/application/view.tsx
function createServices(props: ViewProps): DataExplorerServices {
  // ...
  
  return {
    core: props.core,
    plugins: props.plugins,
    // Other services...
  };
}
```

### In Explore:
- Creates and provides services during store initialization
- Services are stored in the Redux store
- Services are accessed through selectors

```tsx
// explore/public/application/app.tsx
export const renderApp = async (
  coreStart: CoreStart,
  plugins: ExploreStartDependencies,
  params: AppMountParameters
) => {
  // ...
  
  // Create services object
  const services: ExploreServices = {
    core: coreStart,
    plugins,
    scopedHistory: history,
    osdUrlStateStorage,
  };
  
  // Register tabs
  const tabRegistry = {};
  services.tabRegistry = tabRegistry;
  registerTabs(services);
  
  // Initialize store
  const { store, unsubscribe } = await getExploreStore(services);
  
  // ...
};
```

### Key Differences:
- **Store Integration**: Services are integrated with the Redux store
- **Centralized Creation**: Services are created in a centralized location
- **Tab Registry**: Explore introduces a tab registry service

## Conclusion

The Explore plugin has been successfully decoupled from the data_explorer plugin by:

1. **Replacing Context with Redux**: Using Redux for state management instead of React context
2. **Direct Component Rendering**: Directly rendering components without a wrapper
3. **Centralized Service Provision**: Providing services through the Redux store
4. **Improved URL State Management**: Separating URL state across multiple parameters
5. **Redux Thunk for Search**: Using Redux Thunk for search functionality
6. **Hierarchical Component Structure**: Organizing components in a more hierarchical structure
7. **Direct Plugin Integration**: Directly implementing functionality without depending on data_explorer
8. **Centralized Service Creation**: Creating services in a centralized location

This decoupling allows the Explore plugin to be more independent, maintainable, and extensible, while still providing all the functionality that was previously provided by data_explorer.