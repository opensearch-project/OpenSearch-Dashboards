# Explore Plugin State Management

## Overview

The Explore plugin uses Redux Toolkit with a slice architecture for state management, featuring middleware-based persistence and logical separation of UI and infrastructure state.

## State Architecture

### State Slices

```typescript
const store = configureStore({
  reducer: {
    query: queryReducer,     // Query state
    ui: uiReducer,           // UI state (persisted to URL)
    results: resultsReducer, // Query results cache (not persisted)
    tab: tabReducer,         // Tab-specific state (persisted to URL)
    legacy: legacyReducer,   // Legacy Discover state (persisted to URL)
    system: systemReducer,   // Infrastructure state (not persisted)
  },
});
```

### State Persistence

Middleware-based persistence triggers only on specific action types:

```typescript
// Persisted to URL: ['query/', 'ui/', 'tab/', 'legacy/']
// Not persisted: ['system/', 'results/']
```

## State Slices

### Query Slice
```typescript
interface QueryState {
  query: string;
  dataset?: DatasetConfig;
  language?: string;
}
```

### UI Slice
```typescript
interface UIState {
  activeTabId: string;        // Currently active tab
  flavor: string;             // Current flavor setting
  showDatasetFields: boolean; // Dataset fields visibility
  prompt?: string;            // Query prompt text
}
```

### System Slice
```typescript
interface SystemState {
  status: ResultStatus;       // Loading/ready/error status
}
```

### Tab Slice
```typescript
interface TabState {
  logs: {};
  visualizations: {
    styleOptions?: ChartStyleControlMap[ChartType];
    chartType: ChartType;
  };
}
```

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

  return (
    <div>
      <h3>My Custom Tab</h3>
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

## State Management Features

### Middleware-Based Persistence
- Only triggers on relevant actions for performance
- Replaces store subscription approach
- Selective persistence based on action types

### State Separation
- **UI State**: User interface preferences that should be bookmarkable
- **System State**: Infrastructure state that shouldn't persist (status, loading states)
- **Tab State**: Tab-specific configuration
- **Results State**: Cached data that shouldn't persist
