# Replacing use_search.ts with Redux Architecture

This document analyzes how the current Redux-based architecture replaces the functionality provided by `use_search.ts`. It provides a detailed comparison of each major functionality and explains how the new architecture handles it.

## 1. Data Fetching

### In use_search.ts:
- Uses a `fetch` function that creates and configures a SearchSource
- Executes the query using `searchSource.fetch()`
- Manages abort controllers for cancelling requests
- Triggered by:
  - Initial component mount
  - Time range changes via `timefilter.getTimeUpdate$()`
  - Filter changes via `filterManager.getFetches$()`
  - Auto-refresh via `timefilter.getRefreshIntervalUpdate$()`
  - Manual refetch via `refetch$` Subject

```typescript
// use_search.ts
const fetch = useCallback(async () => {
  // Abort any in-progress requests
  if (fetchStateRef.current.abortController) fetchStateRef.current.abortController.abort();
  fetchStateRef.current.abortController = new AbortController();
  
  // Create and configure SearchSource
  const searchSource = await updateSearchSource({
    indexPattern: dataset,
    services,
    sort,
    searchSource: savedSearch?.searchSource,
    histogramConfigs,
  });
  
  // Execute query
  const fetchResp = await searchSource.fetch({
    abortSignal: fetchStateRef.current.abortController.signal,
    // Other options...
  });
  
  // Process results...
});
```

### In Redux Architecture:
- Uses a Redux Thunk (`executeTabQuery`) that creates and configures a SearchSource
- Executes the query using `searchSource.fetch()`
- Manages abort controllers in the Redux store
- Triggered by:
  - Transaction completion via `handleTransactionChanges`
  - Tab changes via `handleTabChanges`
  - Query changes via `handleQueryStateChanges`
  - Time range changes via store subscriber

```typescript
// query_actions.ts
export const executeTabQuery = (options: { clearCache?: boolean } = {}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    // Abort any in-progress requests
    if (state.ui.abortController) {
      state.ui.abortController.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    dispatch(setAbortController(abortController));
    
    // Create and configure SearchSource
    const searchSource = await services.data.search.searchSource.create();
    searchSource
      .setField('index', indexPattern)
      .setField('query', {
        query: preparedQuery.query,
        language: preparedQuery.language,
      })
      .setField('filter', timeRangeFilter ? [timeRangeFilter] : []);
    
    // Execute query
    const results = await searchSource.fetch({
      abortSignal: abortController.signal,
      // Other options...
    });
    
    // Process results...
  };
};
```

### Key Differences:
- **Local Query State**: Redux uses a local query state in the store instead of relying on the global QueryStringManager
- **No Filters**: Redux doesn't use FilterManager, as filters are not part of the Explore plugin
- **Centralized Triggering**: Redux uses handlers and store subscribers to trigger queries instead of RxJS observables
- **Tab-Specific Transformations**: Redux applies tab-specific transformations to queries before execution

## 2. Result Processing

### In use_search.ts:
- Processes search results to extract field counts
- Calculates histogram data if needed
- Updates the `data$` BehaviorSubject with the processed results

```typescript
// use_search.ts
// Process field counts
for (const row of rows) {
  const fields = Object.keys(dataset!.flattenHit(row));
  for (const fieldName of fields) {
    fetchStateRef.current.fieldCounts[fieldName] =
      (fetchStateRef.current.fieldCounts[fieldName] || 0) + 1;
  }
}

// Process histogram data
if (histogramConfigs) {
  const bucketAggConfig = histogramConfigs.aggs[1];
  const tabifiedData = tabifyAggResponse(histogramConfigs, fetchResp);
  const dimensions = getDimensions(histogramConfigs, data);
  if (dimensions) {
    if (bucketAggConfig && search.aggs.isDateHistogramBucketAggConfig(bucketAggConfig)) {
      bucketInterval = bucketAggConfig.buckets?.getInterval();
    }
    chartData = buildPointSeriesData(tabifiedData, dimensions);
  }
}

// Update data$ BehaviorSubject
data$.next({
  status: rows.length > 0 ? ResultStatus.READY : ResultStatus.NO_RESULTS,
  fieldCounts: fetchStateRef.current.fieldCounts,
  hits,
  rows,
  bucketInterval,
  chartData,
  // Other properties...
});
```

### In Redux Architecture:
- Processes search results to extract field counts
- Calculates histogram data in a separate thunk (`executeHistogramQuery`)
- Dispatches actions to update the Redux store

```typescript
// query_actions.ts
// Process field counts
const fieldCounts: Record<string, number> = {};
if (results.hits && results.hits.hits) {
  for (const hit of results.hits.hits) {
    const fields = Object.keys(indexPattern.flattenHit(hit));
    for (const fieldName of fields) {
      fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
    }
  }
}

// Store results in Redux
dispatch(setResults({ 
  cacheKey, 
  results: {
    hits: results.hits,
    fieldCounts,
    elapsedMs: inspectorRequest.getTime(),
  }
}));
```

### Key Differences:
- **Separate Histogram Query**: Redux uses a separate thunk for histogram queries
- **Redux Store**: Results are stored in the Redux store instead of a BehaviorSubject
- **Caching Strategy**: Results are cached by a composite key (query + time range)
- **Component Access**: Components use selectors to access results instead of subscribing to a BehaviorSubject

## 3. Inspector Integration

### In use_search.ts:
- Creates inspector adapters and requests
- Records request and response statistics
- Provides JSON representations of requests and responses

```typescript
// use_search.ts
// Initialize inspect adapter for search source
inspectorAdapters.requests.reset();
const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
  defaultMessage: 'data',
});
const description = i18n.translate('explore.discover.inspectorRequestDescription', {
  defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
});
const inspectorRequest = inspectorAdapters.requests.start(title, { description });
inspectorRequest.stats(getRequestInspectorStats(searchSource));
searchSource.getSearchRequestBody().then((body: object) => {
  inspectorRequest.json(body);
});

// After fetch
inspectorRequest
  .stats(getResponseInspectorStats(fetchResp, searchSource))
  .ok({ json: fetchResp });
```

### In Redux Architecture:
- Creates inspector adapters and requests in the thunk
- Records request and response statistics
- Provides JSON representations of requests and responses
- Stores inspector adapters in the services object

```typescript
// query_actions.ts
// Create inspector adapter if not already in services
if (!services.inspectorAdapters) {
  services.inspectorAdapters = {
    requests: new RequestAdapter(),
  };
}

// Reset inspector adapter
services.inspectorAdapters.requests.reset();

// Create inspector request
const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
  defaultMessage: 'data',
});
const description = i18n.translate('explore.discover.inspectorRequestDescription', {
  defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
});
const inspectorRequest = services.inspectorAdapters.requests.start(title, { description });

// Add inspector stats
if (services.getRequestInspectorStats) {
  inspectorRequest.stats(services.getRequestInspectorStats(searchSource));
}

// Get search request body for inspector
searchSource.getSearchRequestBody().then((body: object) => {
  inspectorRequest.json(body);
});

// After fetch
if (services.getResponseInspectorStats) {
  inspectorRequest.stats(services.getResponseInspectorStats(results, searchSource))
    .ok({ json: results });
} else {
  inspectorRequest.ok({ json: results });
}
```

### Key Differences:
- **Service-Based Storage**: Inspector adapters are stored in the services object instead of being returned from the hook
- **Conditional Stats**: Stats are added conditionally based on service availability
- **Centralized Creation**: Inspector adapters are created once and reused

## 4. Error Handling

### In use_search.ts:
- Catches errors during fetch
- Handles AbortError specially
- Parses error messages from different sources
- Updates the `data$` BehaviorSubject with error information

```typescript
// use_search.ts
try {
  // Fetch and process results...
} catch (error: any) {
  // If the request was aborted then no need to surface this error in the UI
  if (error instanceof Error && error.name === 'AbortError') return;

  const queryLanguage = data.query.queryString.getQuery().language;
  if (queryLanguage === 'kuery' || queryLanguage === 'lucene') {
    data$.next({
      status: ResultStatus.NO_RESULTS,
      rows: [],
    });

    data.search.showError(error as Error);
    return;
  }
  
  // Parse error body
  let errorBody;
  try {
    errorBody = JSON.parse(error.body);
  } catch (e) {
    if (error.body) {
      errorBody = error.body;
    } else {
      errorBody = error;
    }
  }
  
  // Parse error message
  errorBody.message = safeJSONParse(errorBody.message);
  
  // Update data$ with error
  data$.next({
    status: ResultStatus.ERROR,
    queryStatus: {
      body: { error: errorBody },
      elapsedMs,
    },
  });
}
```

### In Redux Architecture:
- Catches errors during fetch
- Handles AbortError specially
- Dispatches actions to update the Redux store

```typescript
// query_actions.ts
try {
  // Fetch and process results...
} catch (error: any) {
  // Handle abort errors
  if (error instanceof Error && error.name === 'AbortError') {
    return;
  }
  
  dispatch(setError(error as Error));
  throw error;
} finally {
  dispatch(setLoading(false));
  dispatch(setAbortController(null));
}
```

### Key Differences:
- **Simplified Error Handling**: Redux uses a simpler error handling approach
- **Error in UI State**: Errors are stored in the UI slice of the Redux store
- **No Special Language Handling**: No special handling for different query languages
- **No Error Parsing**: Errors are stored as-is without parsing

## 5. Reactive Programming

### In use_search.ts:
- Uses RxJS BehaviorSubject for search data
- Uses RxJS Subject for refetch triggers
- Subscribes to various observables for triggering fetches
- Components subscribe to the BehaviorSubject to get updates

```typescript
// use_search.ts
// Create BehaviorSubject for search data
const data$ = useMemo(
  () =>
    new BehaviorSubject<SearchData>({
      status: shouldSearchOnPageLoad() ? ResultStatus.LOADING : ResultStatus.UNINITIALIZED,
      queryStatus: { startTime },
    }),
  []
);

// Create Subject for refetch triggers
const refetch$ = useMemo(() => new Subject<SearchRefetch>(), []);

// Subscribe to various observables
useEffect(() => {
  const fetch$ = merge(
    refetch$,
    filterManager.getFetches$(),
    timefilter.getTimeUpdate$(),
    timefilter.getRefreshIntervalUpdate$().pipe(
      filter(() => {
        return timefilter.getRefreshInterval().pause === false;
      })
    )
  ).pipe(debounceTime(100));

  const subscription = fetch$.subscribe(() => {
    if (initalSearchComplete.current) {
      (async () => {
        await fetch();
      })();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [fetch, filterManager, refetch$, timefilter]);
```

### In Redux Architecture:
- Uses Redux store for state management
- Uses store subscribers to react to state changes
- Uses handlers to trigger actions based on state changes
- Components use selectors to get state from the Redux store

```typescript
// store.ts
// Set up store subscriber for side effects
const unsubscribe = store.subscribe(() => {
  const currentState = store.getState();
  
  // Skip if state hasn't changed
  if (isEqual(currentState, previousState)) return;
  
  // Apply side effects based on what changed
  
  // Handle query state changes
  if (!isEqual(currentState.query, previousState.query)) {
    handleQueryStateChanges(store, currentState, previousState);
  }
  
  // Handle transaction state changes
  if (!isEqual(currentState.transaction, previousState.transaction)) {
    handleTransactionChanges(store, currentState, previousState);
  }
  
  // Handle tab state changes
  if (currentState.ui.activeTabId !== previousState.ui.activeTabId) {
    handleTabChanges(store, currentState, previousState);
  }
  
  // Update previous state reference
  previousState = { ...currentState };
});
```

### Key Differences:
- **Redux vs. RxJS**: Uses Redux store and subscribers instead of RxJS observables
- **Centralized State**: All state is managed in the Redux store
- **Handler-Based Side Effects**: Side effects are triggered by handlers based on state changes
- **Selector-Based Access**: Components use selectors to access state instead of subscribing to observables

## 6. CSV Export

### In use_search.ts:
- Provides a `fetchForMaxCsvOption` function for CSV export
- Creates a new SearchSource for the export
- Configures the SearchSource with a larger size
- Returns the raw hits for processing

```typescript
// use_search.ts
const fetchForMaxCsvOption = useCallback(
  async (size: number) => {
    const dataset = indexPattern;
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    // Abort any in-progress requests
    if (fetchForMaxCsvStateRef.current.abortController)
      fetchForMaxCsvStateRef.current.abortController.abort();
    fetchForMaxCsvStateRef.current.abortController = new AbortController();

    const searchSource = await updateSearchSource({
      indexPattern: dataset,
      services,
      sort,
      searchSource: savedSearch?.searchSource,
      histogramConfigs: undefined,
      size,
    });

    // Execute the search
    const fetchResp = await searchSource.fetch({
      abortSignal: fetchForMaxCsvStateRef.current.abortController.signal,
      // Other options...
    });

    return fetchResp.hits.hits;
  },
  [/* dependencies */]
);
```

### In Redux Architecture:
- Provides two thunks for CSV export:
  - `exportToCsv`: Uses existing results from the Redux store
  - `exportMaxSizeCsv`: Creates a new SearchSource for larger exports
- Generates CSV and triggers download

```typescript
// export_actions.ts
export const exportToCsv = (options: { fileName?: string } = {}) => {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    
    // Get results from cache
    const results = state.results[cacheKey];
    
    // Generate CSV and download
    const csv = generateCsv(rows, indexPattern, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, fileName);
  };
};

export const exportMaxSizeCsv = (options: { maxSize?: number, fileName?: string } = {}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    // Create new SearchSource for export
    const searchSource = await services.data.search.searchSource.create();
    
    // Configure SearchSource with larger size
    searchSource
      .setField('index', indexPattern)
      .setField('query', {
        query: preparedQuery.query,
        language: preparedQuery.language,
      })
      .setField('filter', timeRangeFilter ? [timeRangeFilter] : [])
      .setField('size', options.maxSize || 500);
    
    // Execute query and download CSV
    const results = await searchSource.fetch();
    const csv = generateCsv(results.hits.hits, indexPattern, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, fileName);
  };
};
```

### Key Differences:
- **Complete Export Flow**: Redux provides complete export flow including CSV generation and download
- **Two Export Options**: Redux provides two export options (use existing results or fetch more)
- **Thunk-Based Implementation**: Export is implemented as Redux thunks
- **No External Processing**: No need for external processing of the results

## Conclusion

The Redux-based architecture successfully replaces all the functionality provided by `use_search.ts` while improving the overall architecture:

1. **Centralized State Management**: All state is managed in the Redux store, making it easier to understand and debug.
2. **Improved Separation of Concerns**: Each aspect of the functionality is handled by a dedicated part of the architecture.
3. **Better Testability**: Redux thunks and actions are easier to test than complex hooks.
4. **Reduced Complexity**: The architecture is simpler and more straightforward, with fewer moving parts.
5. **Backward Compatibility**: The context provider still provides data$ and refetch$ for backward compatibility, but they're now backed by Redux.

This architecture aligns with the design principles outlined in current_design.txt and update.txt, and follows the pattern used in vis_builder.