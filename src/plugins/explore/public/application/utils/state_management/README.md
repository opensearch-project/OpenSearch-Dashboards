# Explore Plugin State Management

## Overview

The Explore plugin uses Redux Toolkit with a 5-slice architecture for state management, featuring direct cache key computation for optimal performance and maintainability.

## Architecture

### State Slices

```typescript
const store = configureStore({
  reducer: {
    legacy: legacyReducer,    // Legacy Discover state
    tab: tabReducer,          // Tab management state  
    query: queryReducer,      // Current query state
    ui: uiReducer,           // UI state and status
    results: resultsReducer, // Query results cache
  },
});
```

#### Query Slice
```typescript
interface QueryState {
  query: string;
  dataset?: DatasetConfig;
  language?: string;
  // ... other query properties
}
```

#### UI Slice
```typescript
interface UIState {
  activeTabId: string;           // Currently active tab
  status: ResultStatus;          // Loading/ready/error status
  transaction: {                 // Transaction management
    inProgress: boolean;
    pendingActions: string[];
  };
}
```

#### Results Slice
```typescript
interface ResultsState {
  [cacheKey: string]: ISearchResult;
}
```

### Cache Key Strategy

Components compute cache keys directly using prepared query strings:

- **Default Components**: Use `defaultPrepareQuery(queryString)` for histogram/sidebar components
- **Tab Components**: Use tab-specific `prepareQuery(queryString)` or fall back to `defaultPrepareQuery`
- **Direct Computation**: Components compute their own cache keys when needed
- **No Shared State**: Cache keys computed on-demand, not stored in UI state

## Query Execution Flow

### 1. Query Preparation
- Components extract query string from Redux state
- Apply appropriate `prepareQuery` function (default or tab-specific)
- Generate cache key from prepared query

### 2. Cache Check
- Check if results already exist for computed cache key
- Skip execution if results are cached
- Execute query only if cache miss

### 3. Query Execution
- `executeQueries` orchestrates the execution
- `executeHistogramQuery` for default components (with aggregations)
- `executeTabQuery` for tab components (without aggregations)

### 4. Result Storage
- Raw results stored in Redux state by cache key
- Components access results using their computed cache key
- Results shared across components with same cache key

## Component Patterns

### Default Components (Histogram, Sidebar)

```typescript
import { useSelector } from 'react-redux';
import { defaultPrepareQuery } from '../actions/query_actions';

const MyComponent = () => {
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);
  
  // Compute cache key directly
  const queryString = typeof query.query === 'string' ? query.query : '';
  const cacheKey = defaultPrepareQuery(queryString);
  const rawResults = results[cacheKey];
  
  // Process results as needed...
};
```

### Tab Components

```typescript
import { useSelector } from 'react-redux';
import { defaultPrepareQuery } from '../actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

const MyTabComponent = () => {
  const { services } = useOpenSearchDashboards();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const results = useSelector((state: RootState) => state.results);
  
  // Get tab-specific prepareQuery or fall back to default
  const activeTab = services.tabRegistry?.getTab(activeTabId);
  const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
  
  // Compute cache key directly
  const queryString = typeof query.query === 'string' ? query.query : '';
  const cacheKey = prepareQuery(queryString);
  const rawResults = results[cacheKey];
  
  // Process results as needed...
};
```

### Utility Hooks

For common patterns, use the provided utility hooks:

```typescript
import { useDefaultCacheKey, useTabCacheKey } from '../hooks/use_cache_keys';

// For default components
const MyHistogramComponent = () => {
  const cacheKey = useDefaultCacheKey();
  const results = useSelector((state: RootState) => state.results);
  const rawResults = results[cacheKey];
  // ...
};

// For tab components  
const MyTabComponent = () => {
  const cacheKey = useTabCacheKey();
  const results = useSelector((state: RootState) => state.results);
  const rawResults = results[cacheKey];
  // ...
};
```

## Tab Development

### Basic Tab Registration

```typescript
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';

// Register a basic tab
services.tabRegistry.registerTab({
  id: 'my_custom_tab',
  label: 'Custom Tab',
  component: MyTabComponent,
});
```

### Advanced Tab Registration

```typescript
// Register tab with custom query preparation and result processing
services.tabRegistry.registerTab({
  id: 'advanced_tab',
  label: 'Advanced Tab',
  component: AdvancedTabComponent,
  prepareQuery: (queryString: string) => {
    // Custom query transformation
    return queryString + ' | stats count by field';
  },
  resultsProcessor: (rawResults, indexPattern) => {
    // Custom result processing
    return processResults(rawResults);
  }
});
```

### Tab Component Implementation

```typescript
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../utils/state_management/store';
import { defaultPrepareQuery } from '../actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

export const MyTabComponent = () => {
  const { services } = useOpenSearchDashboards();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const results = useSelector((state: RootState) => state.results);
  
  // Compute cache key directly
  const activeTab = services.tabRegistry?.getTab(activeTabId);
  const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
  const queryString = typeof query.query === 'string' ? query.query : '';
  const cacheKey = prepareQuery(queryString);
  const rawResults = results[cacheKey];
  
  const rows = rawResults?.hits?.hits || [];
  const totalHits = (rawResults?.hits?.total as any)?.value || rawResults?.hits?.total || 0;

  if (!rawResults) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>My Custom Tab</h3>
      <p>Total hits: {totalHits}</p>
      {/* Render your tab content */}
    </div>
  );
};
```

## Query Processing

### Query Types

#### Histogram Query (`executeHistogramQuery`)
- **Purpose**: Provides data for histogram charts and sidebar components
- **Features**: Includes aggregations for time-based visualization
- **Cache Key**: Generated using `defaultPrepareQuery(queryString)`
- **Configuration**: Uses interval from Redux state

#### Tab Query (`executeTabQuery`)
- **Purpose**: Provides data for active tab components
- **Features**: Raw search results without aggregations
- **Cache Key**: Generated using tab-specific `prepareQuery` or `defaultPrepareQuery`
- **Optimization**: Only executes if different from default query

### Query Preparation

#### Default Query Preparation
```typescript
export const defaultPrepareQuery = (queryString: string): string => {
  // Remove stats pipe for histogram compatibility
  return typeof queryString === 'string' ? queryString.replace(/\s*\|\s*stats.*$/i, '') : queryString;
};
```

#### Tab-Specific Query Preparation
```typescript
// Tab registration with custom prepareQuery
services.tabRegistry.registerTab({
  id: 'my_custom_tab',
  label: 'Custom Tab',
  component: MyTabComponent,
  prepareQuery: (queryString: string) => {
    // Custom query transformation
    return queryString + ' | stats count by field';
  }
});
```

## Cache Management

### Tab Switching Optimization

When switching tabs, the system:
1. Computes new tab's cache key using `prepareQuery`
2. Checks if results already exist in cache
3. Only executes queries for missing results
4. Preserves existing cache entries

```typescript
// Tab switching logic
const activeTab = services.tabRegistry?.getTab(selectedTab.id);
const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
const cacheKey = prepareQuery(queryString);
const needsQuery = !results[cacheKey];
```

### Performance Benefits

- **Direct Access**: Cache keys computed on-demand when needed
- **Memoization**: Cache keys computed only when query changes
- **Reduced State**: Smaller UI state without cache key storage
- **Component Independence**: Each component computes its own cache key
- **Type Safety**: TypeScript can better validate cache key usage

## Best Practices

### For Component Developers
1. **Cache Key Computation**: Use appropriate `prepareQuery` function for your component type
2. **State Access**: Access query and results state directly from Redux
3. **Memoization**: Memoize cache key computation to prevent unnecessary recalculation
4. **Error Handling**: Handle missing results gracefully

### For Tab Developers
1. **Custom prepareQuery**: Only implement custom `prepareQuery` when query transformation is needed
2. **Result Processing**: Use custom processors for tab-specific data transformations
3. **Performance**: Ensure processors are memoized to avoid re-computation
4. **Testing**: Mock cache keys and results for component testing

### Component Access Patterns

#### 1. Histogram Component
- **Access**: `defaultPrepareQuery(queryString)` (always uses default query with histogram)
- **Processor**: `histogramResultsProcessor(rawResults, indexPattern, data, interval)`
- **Purpose**: Chart visualization with aggregation data

#### 2. Side Panel Component  
- **Access**: `defaultPrepareQuery(queryString)` (uses default query)
- **Processor**: `defaultResultsProcessor(rawResults, indexPattern)`
- **Purpose**: Field counts and metadata (no histogram needed)

#### 3. Default Tab (Logs)
- **Access**: `defaultPrepareQuery(queryString)` (uses default query)
- **Processor**: Direct access to raw results
- **Purpose**: Display search results in table format

#### 4. Custom Tabs
- **Access**: `tab.prepareQuery(queryString)` or `defaultPrepareQuery(queryString)`
- **Processor**: Tab's custom `resultsProcessor` or direct access
- **Purpose**: Tab-specific data visualization

## Troubleshooting

### Common Issues

1. **Empty Results**: Check if correct cache key is being computed (`defaultPrepareQuery` or tab-specific `prepareQuery`)
2. **Stale Data**: Verify cache keys are recomputing on query changes
3. **Performance**: Ensure cache key computation is memoized properly
4. **Tab Switching**: Confirm cache preservation logic is working

### Debug Commands

```typescript
// Debug cache state
const queryString = typeof query.query === 'string' ? query.query : '';
const defaultCacheKey = defaultPrepareQuery(queryString);
const activeTab = services.tabRegistry?.getTab(activeTabId);
const tabCacheKey = (activeTab?.prepareQuery || defaultPrepareQuery)(queryString);

console.log('Query String:', queryString);
console.log('Default Cache Key:', defaultCacheKey);
console.log('Tab Cache Key:', tabCacheKey);
console.log('Available Results:', Object.keys(results));

// Debug query comparison
console.log('Queries Equal:', defaultCacheKey === tabCacheKey);
console.log('Query Object:', query);
```

## Implementation Status

### ✅ Current Features
- Direct cache key computation eliminates complex state management
- Simplified query execution with shared `executeQueryBase` helper
- Eliminated code duplication between query execution functions
- Multi-tab query optimization with direct cache key comparison
- Cache-based result storage by prepared query strings
- Tab switching without unnecessary re-queries
- Modular result processors
- Utility hooks for common cache key patterns

This architecture provides a clean, performant, and maintainable approach to query execution and result caching in the Explore plugin.