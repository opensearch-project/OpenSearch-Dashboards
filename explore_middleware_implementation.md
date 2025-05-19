# Explore Plugin: Middleware Implementation

This document outlines the detailed implementation of the middleware-based approach for the Explore plugin, combining transaction management, Redux state management, and language-agnostic query handling.

## 1. Redux Store Structure

### 1.1 Store Configuration

```typescript
// src/plugins/explore/public/application/state_management/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { queryReducer } from './slices/query_slice';
import { uiReducer } from './slices/ui_slice';
import { resultsReducer } from './slices/results_slice';
import { tabReducer } from './slices/tab_slice';
import { transactionReducer } from './slices/transaction_slice';
import { queryMiddleware } from './middleware/query_middleware';
import { urlSyncMiddleware } from './middleware/url_sync_middleware';

const rootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  transaction: transactionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const configureExploreStore = (preloadedState?: any) => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat(queryMiddleware, urlSyncMiddleware),
    preloadedState,
  });
};
```

### 1.2 State Slices

#### Query Slice

```typescript
// src/plugins/explore/public/application/state_management/slices/query_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query, Dataset } from '../../../../../../data/common';

export interface QueryState {
  query: Query;
}

const initialState: QueryState = {
  query: {
    query: '',
    language: 'ppl',
  },
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Query>) => {
      state.query = action.payload;
    },
    setQueryString: (state, action: PayloadAction<string>) => {
      if (typeof state.query.query === 'string') {
        state.query.query = action.payload;
      } else {
        state.query.query = { ...state.query.query, query: action.payload };
      }
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.query.language = action.payload;
    },
    setDataset: (state, action: PayloadAction<Dataset>) => {
      state.query.dataset = action.payload;
    },
#### UI Slice

```typescript
// src/plugins/explore/public/application/state_management/slices/ui_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  flavor: string;
  isLoading: boolean;
  error: Error | null;
  queryPanel: {
    promptQuery: string;
  };
}

const initialState: UIState = {
  activeTabId: 'logs',
  flavor: 'log',
  isLoading: false,
  error: null,
  queryPanel: {
    promptQuery: '',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    setFlavor: (state, action: PayloadAction<string>) => {
      state.flavor = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<Error | null>) => {
      state.error = action.payload;
    },
    setPromptQuery: (state, action: PayloadAction<string>) => {
      state.queryPanel.promptQuery = action.payload;
    },
  },
});

export const { setActiveTab, setFlavor, setLoading, setError, setPromptQuery } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
```

#### Results Slice

```typescript
// src/plugins/explore/public/application/state_management/slices/results_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ResultsState {
  [cacheKey: string]: any;
}

const initialState: ResultsState = {};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<{ cacheKey: string; results: any }>) => {
      const { cacheKey, results } = action.payload;
      state[cacheKey] = results;
    },
    clearResults: (state) => {
      return {};
    },
    clearResultsByKey: (state, action: PayloadAction<string>) => {
      const cacheKey = action.payload;
      delete state[cacheKey];
    },
  },
});

export const { setResults, clearResults, clearResultsByKey } = resultsSlice.actions;
export const resultsReducer = resultsSlice.reducer;
```

#### Tab Slice

```typescript
// src/plugins/explore/public/application/state_management/slices/tab_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TabState {
  [tabId: string]: {
    skipInitialFetch?: boolean;
    [key: string]: any;
  };
}

const initialState: TabState = {
  logs: {
    skipInitialFetch: false,
  },
  visualizations: {
    skipInitialFetch: false,
    chartOptions: {
      showLegend: true,
    },
  },
};

const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setTabState: (
      state,
      action: PayloadAction<{ tabId: string; state: { [key: string]: any } }>
    ) => {
      const { tabId, state: tabState } = action.payload;
      state[tabId] = { ...state[tabId], ...tabState };
    },
    setSkipInitialFetch: (
      state,
      action: PayloadAction<{ tabId: string; skip: boolean }>
    ) => {
      const { tabId, skip } = action.payload;
      if (state[tabId]) {
        state[tabId].skipInitialFetch = skip;
      }
    },
  },
});

export const { setTabState, setSkipInitialFetch } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
```
  },
});

export const { setQuery, setQueryString, setLanguage, setDataset } = querySlice.actions;
export const queryReducer = querySlice.reducer;
#### Transaction Slice

```typescript
// src/plugins/explore/public/application/state_management/slices/transaction_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TransactionState {
  inProgress: boolean;
  previousState: any | null;
  error: Error | null;
}

const initialState: TransactionState = {
  inProgress: false,
  previousState: null,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    startTransaction: (state, action: PayloadAction<{ previousState: any }>) => {
      state.inProgress = true;
      state.previousState = action.payload.previousState;
      state.error = null;
    },
    commitTransaction: (state) => {
      state.inProgress = false;
    },
    rollbackTransaction: (state, action: PayloadAction<Error>) => {
      state.inProgress = false;
      state.error = action.payload;
    },
  },
});

export const { startTransaction, commitTransaction, rollbackTransaction } = transactionSlice.actions;
export const transactionReducer = transactionSlice.reducer;
```

## 2. Transaction Management

### 2.1 Transaction Action Creators

```typescript
// src/plugins/explore/public/application/state_management/actions/transaction_actions.ts
import { Dispatch, GetState } from 'redux';
import { startTransaction, commitTransaction, rollbackTransaction } from '../slices/transaction_slice';

// Action types
export const COMMIT_STATE_TRANSACTION = 'transaction/commitState';
export const RESTORE_STATE = 'transaction/restoreState';

export const beginTransaction = () => (dispatch: Dispatch, getState: GetState) => {
  // Save current state for potential rollback
  const state = getState();
  const previousState = {
    query: { ...state.query },
    ui: { ...state.ui },
    tab: { ...state.tab },
  };
  
  dispatch(startTransaction({ previousState }));
};

export const finishTransaction = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  
  // Validate transaction state
  if (!state.transaction.inProgress) {
    console.warn('Attempting to commit when no transaction is in progress');
    return;
  }
  
  // Mark transaction as complete
  dispatch(commitTransaction());
  
  // Trigger the actual state commit that middleware listens for
  dispatch({ type: COMMIT_STATE_TRANSACTION });
};

export const abortTransaction = (error: Error) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(rollbackTransaction(error));
  
  // Restore previous state
  const { previousState } = getState().transaction;
  if (previousState) {
    dispatch({ type: RESTORE_STATE, payload: previousState });
  }
};
## 3. Middleware Implementation

### 3.1 Query Middleware

```typescript
// src/plugins/explore/public/application/state_management/middleware/query_middleware.ts
import { Middleware } from 'redux';
import { COMMIT_STATE_TRANSACTION, RESTORE_STATE } from '../actions/transaction_actions';
import { setLoading, setError } from '../slices/ui_slice';
import { setResults } from '../slices/results_slice';
import { createCacheKey } from '../utils/cache';
import { RootState } from '../store';

export const queryMiddleware: Middleware = ({ getState, dispatch }) => {
  let searchSource = null;
  
  // Initialize SearchSource
  const initSearchSource = async (services) => {
    if (!searchSource) {
      searchSource = await services.data.search.searchSource.create();
    }
    return searchSource;
  };
  
  return next => async action => {
    // Let the action go through first
    const result = next(action);
    
    // Handle transaction commit
    if (action.type === COMMIT_STATE_TRANSACTION) {
      const state = getState() as RootState;
      const { query } = state.query;
      const { activeTabId } = state.ui;
      const services = state.services;
      
      // Get tab definition
      const tabDefinition = services.tabRegistry.getTab(activeTabId);
      if (!tabDefinition) return result;
      
      // Check if tab supports this query language
      if (!tabDefinition.supportedLanguages.includes(query.language)) {
        dispatch(setError(new Error(`Tab ${activeTabId} doesn't support ${query.language} queries`)));
        return result;
      }
      
      // Let the tab prepare the query (transform if needed)
      const preparedQuery = tabDefinition.prepareQuery(query);
      
      // Get current time range from timefilter service
      const timeRange = services.data.query.timefilter.timefilter.getTime();
      
      // Create cache key with prepared query and time range
      const cacheKey = createCacheKey(preparedQuery, timeRange);
      
      // Check if we should skip initial fetch for this tab
      const skipInitialFetch = state.tab[activeTabId]?.skipInitialFetch;
      if (skipInitialFetch) {
        dispatch(setSkipInitialFetch({ tabId: activeTabId, skip: false }));
        return result;
      }
      
      // Initialize SearchSource
      const searchSource = await initSearchSource(services);
      
      // Update SearchSource with language-agnostic approach
      const indexPattern = preparedQuery.dataset || services.indexPattern;
      const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);
      
      searchSource
        .setField('index', indexPattern)
        .setField('query', { 
          query: preparedQuery.query, 
          language: preparedQuery.language
        })
        .setField('filter', timeRangeFilter ? [timeRangeFilter] : []);
      
      // Execute query
      dispatch(setLoading(true));
      
      try {
        const results = await searchSource.fetch();
        dispatch(setResults({ cacheKey, results }));
      } catch (error) {
        dispatch(setError(error));
      } finally {
        dispatch(setLoading(false));
      }
    }
    
    // Handle state restoration after transaction rollback
    if (action.type === RESTORE_STATE) {
      const previousState = action.payload;
      
      // Restore previous state slices
      if (previousState.query) {
        dispatch(setQuery(previousState.query.query));
      }
      
      if (previousState.ui) {
        dispatch(setActiveTab(previousState.ui.activeTabId));
        dispatch(setFlavor(previousState.ui.flavor));
      }
      
      if (previousState.tab) {
        Object.entries(previousState.tab).forEach(([tabId, tabState]) => {
          dispatch(setTabState({ tabId, state: tabState }));
        });
      }
    }
    
    return result;
  };
};
```

### 3.2 URL Sync Middleware

```typescript
// src/plugins/explore/public/application/state_management/middleware/url_sync_middleware.ts
import { Middleware } from 'redux';
import { debounce } from 'lodash';
import { RootState } from '../store';

export const urlSyncMiddleware: Middleware = ({ getState }) => {
  // Debounced function to update URL
  const updateUrl = debounce((services, state) => {
    const { query, ui, tab } = state;
    
    // Update application state in URL
    services.osdUrlStateStorage.set(
      '_a',
      {
        query: query.query,
        ui: {
          activeTabId: ui.activeTabId,
          flavor: ui.flavor,
        },
## 4. Tab Registry Implementation

```typescript
// src/plugins/explore/public/services/tab_registry/tab_registry_service.ts
import { Query } from '../../../../../data/common';

export interface TabDefinition {
  id: string;
  label: string;
  flavor: string[];
  order?: number;
  
  // Language-aware query handling
  supportedLanguages: string[];
  
  // Transform complete query object instead of just string
  prepareQuery: (query: Query) => Query;
  
  // UI Components
  component: React.ComponentType<TabComponentProps>;
  
  // Optional lifecycle hooks
  onActive?: () => void;
  onInactive?: () => void;
}

export interface TabComponentProps {
  query: Query;
  results: any;
  isLoading: boolean;
  error: Error | null;
}

export class TabRegistryService {
  private tabs: Map<string, TabDefinition> = new Map();
  
  public registerTab(tabDefinition: TabDefinition): void {
    this.tabs.set(tabDefinition.id, tabDefinition);
  }
  
  public getTab(id: string): TabDefinition | undefined {
    return this.tabs.get(id);
  }
  
  public getAllTabs(): TabDefinition[] {
    return Array.from(this.tabs.values()).sort((a, b) => {
      return (a.order || 100) - (b.order || 100);
    });
  }
}
```

## 5. Workflow Implementations

### 5.1 Application Initialization

```typescript
// src/plugins/explore/public/application/explore_app.tsx
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { configureExploreStore } from './state_management/store';
import { ExploreServices } from '../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { setQuery } from './state_management/slices/query_slice';
import { setActiveTab, setFlavor } from './state_management/slices/ui_slice';
import { setTabState } from './state_management/slices/tab_slice';
import { beginTransaction, finishTransaction } from './state_management/actions/transaction_actions';

export const ExploreApp = () => {
  const services = useOpenSearchDashboards<ExploreServices>();
  const [store, setStore] = useState(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      // Load state from URL
      const urlState = services.osdUrlStateStorage.get('_a') || {};
      const globalState = services.osdUrlStateStorage.get('_g') || {};
      
      // Create store with preloaded state
      const preloadedState = {
        query: {
          query: urlState.query || {
            query: '',
            language: 'ppl',
          },
        },
        ui: {
          activeTabId: urlState.ui?.activeTabId || 'logs',
          flavor: urlState.ui?.flavor || 'log',
          isLoading: false,
          error: null,
          queryPanel: {
            promptQuery: '',
          },
        },
        tab: urlState.tab || {
          logs: {
            skipInitialFetch: false,
          },
          visualizations: {
            skipInitialFetch: false,
            chartOptions: {
              showLegend: true,
            },
          },
        },
        services,
      };
      
      const store = configureExploreStore(preloadedState);
      setStore(store);
      
      // Register built-in tabs
      registerBuiltInTabs(services.tabRegistry);
      
      // Sync global state with services
      if (globalState.time) {
        services.data.query.timefilter.timefilter.setTime(globalState.time);
      }
      
      // Set up bidirectional sync between URL and services
      services.syncQueryStateWithUrl(
        services.data.query,
        services.osdUrlStateStorage
      );
      
      // Execute initial query if needed
      if (urlState.query && urlState.query.query) {
        store.dispatch(beginTransaction());
        store.dispatch(finishTransaction());
      }
    };
    
    initializeApp();
  }, [services]);
  
  if (!store) {
    return <div>Loading...</div>;
  }
  
  return (
    <Provider store={store}>
      <ExploreLayout />
    </Provider>
  );
};

const registerBuiltInTabs = (tabRegistry) => {
  // Register Logs Tab
  tabRegistry.registerTab({
    id: 'logs',
    label: 'Logs',
    flavor: ['log'],
    order: 10,
    supportedLanguages: ['ppl', 'sql'],
    
    prepareQuery: (query) => {
      if (query.language === 'ppl') {
        // Remove stats pipe for logs view
        return {
          ...query,
          query: typeof query.query === 'string' 
            ? query.query.replace(/\s*\|\s*stats.*$/i, '')
            : query.query,
        };
      }
      return query;
    },
    
    component: LogsTabComponent,
  });
  
  // Register Visualizations Tab
  tabRegistry.registerTab({
    id: 'visualizations',
    label: 'Visualizations',
    flavor: ['line', 'bar', 'pie'],
    order: 20,
    supportedLanguages: ['ppl', 'sql', 'promql'],
    
    prepareQuery: (query) => {
      // No transformation needed for visualizations
      return query;
    },
    
    component: VisualizationTabComponent,
  });
};
```

### 5.2 Fire a Query When Query is Updated

```typescript
// src/plugins/explore/public/application/components/query_panel.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiButton, EuiFieldText } from '@elastic/eui';
import { setQueryString } from '../state_management/slices/query_slice';
import { beginTransaction, finishTransaction } from '../state_management/actions/transaction_actions';
import { clearResults } from '../state_management/slices/results_slice';
import { RootState } from '../state_management/store';

export const QueryPanel = () => {
  const dispatch = useDispatch();
  const queryState = useSelector((state: RootState) => state.query);
  const [localQuery, setLocalQuery] = useState(
    typeof queryState.query.query === 'string' ? queryState.query.query : ''
  );
  
  const handleQueryChange = (e) => {
    setLocalQuery(e.target.value);
  };
  
  const handleRunQuery = () => {
    // Start transaction
    dispatch(beginTransaction());
    
    // Update query state
    dispatch(setQueryString(localQuery));
    
    // Clear results cache
    dispatch(clearResults());
    
    // Commit transaction to trigger query execution
    dispatch(finishTransaction());
  };
  
  return (
    <div className="exploreQueryPanel">
      <EuiFieldText
        fullWidth
        value={localQuery}
        onChange={handleQueryChange}
        placeholder="Enter query..."
        data-test-subj="queryInput"
      />
      <EuiButton
        fill
        onClick={handleRunQuery}
        data-test-subj="querySubmitButton"
      >
        Run
      </EuiButton>
    </div>
  );
};
```
        tab,
      },
      { replace: true }
### 5.3 Fire a Query When Time Filter is Updated

```typescript
// src/plugins/explore/public/application/components/explore_layout.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { beginTransaction, finishTransaction } from '../state_management/actions/transaction_actions';
import { clearResults } from '../state_management/slices/results_slice';
import { RootState } from '../state_management/store';

export const ExploreLayout = () => {
  const dispatch = useDispatch();
  const services = useSelector((state: RootState) => state.services);
  
  // Subscribe to time filter changes
  useEffect(() => {
    const subscription = services.data.query.timefilter.timefilter.getTimeUpdate$().subscribe(() => {
      // Start transaction
      dispatch(beginTransaction());
      
      // Clear results cache since time range changed
      dispatch(clearResults());
      
      // Commit transaction to trigger query execution
      dispatch(finishTransaction());
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, services.data.query.timefilter.timefilter]);
  
  return (
    <div className="exploreLayout">
      <QueryPanel />
      <TabBar />
      <TabContent />
    </div>
  );
};
```

### 5.4 Load a Saved Explore

```typescript
// src/plugins/explore/public/application/actions/saved_explore_actions.ts
import { Dispatch } from 'redux';
import { setQuery, setDataset } from '../state_management/slices/query_slice';
import { setActiveTab, setFlavor } from '../state_management/slices/ui_slice';
import { setTabState } from '../state_management/slices/tab_slice';
import { beginTransaction, finishTransaction } from '../state_management/actions/transaction_actions';

export const loadSavedExplorer = (id: string) => async (dispatch: Dispatch, getState: any) => {
  const services = getState().services;
  
  try {
    // Fetch saved explorer
    const savedExplorer = await services.savedExplorers.get(id);
    
    // Start transaction to batch state updates
    dispatch(beginTransaction());
    
    // Update query state
    dispatch(setQuery(savedExplorer.attributes.queryState));
    
    // Update dataset if available
    if (savedExplorer.attributes.searchSourceFields?.index) {
      dispatch(setDataset(savedExplorer.attributes.searchSourceFields.index));
    }
    
    // Update UI state
    const uiState = JSON.parse(savedExplorer.attributes.uiState || '{}');
    dispatch(setActiveTab(uiState.activeTabId || 'logs'));
    dispatch(setFlavor(uiState.flavor || 'log'));
    
    // Update tab state
    const tabState = JSON.parse(savedExplorer.attributes.tabState || '{}');
    Object.entries(tabState).forEach(([tabId, state]) => {
      dispatch(setTabState({ tabId, state }));
    });
    
    // Update time range in timefilter service
    if (savedExplorer.attributes.timeRange) {
      services.data.query.timefilter.timefilter.setTime(savedExplorer.attributes.timeRange);
    }
    
    // Apply all updates and execute a single query
    dispatch(finishTransaction());
    
    return savedExplorer;
  } catch (error) {
    console.error('Failed to load saved explorer:', error);
    throw error;
  }
};
```

### 5.5 Switch Tab

```typescript
// src/plugins/explore/public/application/components/tab_bar.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiTabs, EuiTab } from '@elastic/eui';
import { setActiveTab } from '../state_management/slices/ui_slice';
import { beginTransaction, finishTransaction } from '../state_management/actions/transaction_actions';
import { RootState } from '../state_management/store';
import { createCacheKey } from '../state_management/utils/cache';

export const TabBar = () => {
  const dispatch = useDispatch();
  const { activeTabId } = useSelector((state: RootState) => state.ui);
  const { query } = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);
  const services = useSelector((state: RootState) => state.services);
  const tabs = services.tabRegistry.getAllTabs();
  
  const handleTabClick = (tabId: string) => {
    if (tabId === activeTabId) return;
    
    // Start transaction
    dispatch(beginTransaction());
    
    // Update active tab
    dispatch(setActiveTab(tabId));
    
    // Get tab definition
    const tabDefinition = services.tabRegistry.getTab(tabId);
    
    // Call onActive hook if defined
    if (tabDefinition?.onActive) {
      tabDefinition.onActive();
    }
    
    // Call onInactive hook for previous tab if defined
    const previousTabDefinition = services.tabRegistry.getTab(activeTabId);
    if (previousTabDefinition?.onInactive) {
      previousTabDefinition.onInactive();
    }
    
    // Check if we need to execute a query
    if (tabDefinition) {
      // Prepare query for the new tab
      const preparedQuery = tabDefinition.prepareQuery(query);
      
      // Get current time range
      const timeRange = services.data.query.timefilter.timefilter.getTime();
      
      // Create cache key
      const cacheKey = createCacheKey(preparedQuery, timeRange);
      
      // Check if we have cached results
      if (!results[cacheKey]) {
        // No cached results, commit transaction to trigger query
        dispatch(finishTransaction());
      } else {
        // We have cached results, just finish the transaction without triggering query
        dispatch({ type: 'transaction/commitTransaction' });
      }
    } else {
      // Just finish the transaction
      dispatch({ type: 'transaction/commitTransaction' });
    }
  };
  
  return (
    <EuiTabs>
      {tabs.map((tab) => (
        <EuiTab
          key={tab.id}
          isSelected={tab.id === activeTabId}
          onClick={() => handleTabClick(tab.id)}
        >
          {tab.label}
        </EuiTab>
      ))}
    </EuiTabs>
  );
};
```

## 6. Handling Action Blocking During Transactions

To address the concern about action loss during transactions, we implement a more nuanced approach to action blocking:

```typescript
// src/plugins/explore/public/application/state_management/middleware/transaction_middleware.ts
import { Middleware } from 'redux';

// Actions that should be blocked during a transaction
const BLOCKED_ACTIONS = [
  'EXECUTE_QUERY',
  'TIME_RANGE_CHANGED',
];

// Actions that should be queued during a transaction
const QUEUED_ACTIONS = [
  'query/setQueryString',
  'ui/setFlavor',
];

export const transactionMiddleware: Middleware = ({ getState, dispatch }) => {
  const actionQueue = [];
  
  return next => action => {
    const state = getState();
    const { inProgress } = state.transaction;
    
    // If we're in a transaction
    if (inProgress) {
      // Block certain actions completely
      if (BLOCKED_ACTIONS.includes(action.type)) {
        console.log(`Action ${action.type} blocked during transaction`);
        return;
      }
      
      // Queue certain actions to be replayed after transaction
      if (QUEUED_ACTIONS.includes(action.type)) {
        console.log(`Action ${action.type} queued during transaction`);
        actionQueue.push(action);
        return;
      }
    } else {
      // If transaction just ended, process queued actions
      if (action.type === 'transaction/commitTransaction' && actionQueue.length > 0) {
        console.log(`Processing ${actionQueue.length} queued actions`);
        setTimeout(() => {
          actionQueue.forEach(queuedAction => dispatch(queuedAction));
          actionQueue.length = 0; // Clear the queue
        }, 0);
      }
    }
    
    return next(action);
  };
};
```

This approach:

1. **Blocks critical actions** that would trigger redundant queries during a transaction
2. **Queues less critical actions** to be replayed after the transaction completes
3. **Allows non-conflicting actions** to proceed normally

This ensures that no important user actions are lost, while still maintaining transaction integrity.

## 7. Conclusion

This middleware-based implementation for the Explore plugin provides several key benefits:

1. **Transaction-based state management** prevents race conditions by batching related state changes
2. **Language-agnostic query handling** supports multiple query languages without middleware changes
3. **Composite cache keys** ensure correct caching with time-based queries
4. **Tab-specific query preparation** allows each tab to handle queries appropriately
5. **Efficient state persistence** with URL synchronization

The implementation follows the same pattern as vis_builder's Redux store setup but adds transaction management to prevent race conditions when loading saved objects or switching tabs.

By separating state updates from query execution, we ensure that the UI remains consistent and that only one query executes with the complete state, improving both performance and user experience.
    );
    
    // Update global state in URL
    const timeRange = services.data.query.timefilter.timefilter.getTime();
    services.osdUrlStateStorage.set(
      '_g',
      {
        time: timeRange,
      },
      { replace: true }
    );
  }, 300);
  
  return next => action => {
    const result = next(action);
    const state = getState() as RootState;
    const services = state.services;
    
    // Skip URL updates during transaction
    if (!state.transaction.inProgress) {
      updateUrl(services, state);
    }
    
    return result;
  };
};
```

### 3.3 Cache Utility

```typescript
// src/plugins/explore/public/application/state_management/utils/cache.ts
import { Query } from '../../../../../../data/common';

export const createCacheKey = (query: Query, timeRange: any): string => {
  return JSON.stringify({
    query: query.query,
    language: query.language,
    dataset: query.dataset,
    timeRange,
  });
};
```
```