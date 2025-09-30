# OpenSearch Dashboards Data Services and API Patterns

## Overview

OpenSearch Dashboards provides a comprehensive suite of data services that enable developers to fetch, manage, and visualize data from OpenSearch clusters. This document covers the core data services, API patterns, and best practices for working with data in OpenSearch Dashboards.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Data Plugin](#core-data-plugin)
3. [Search Services](#search-services)
4. [Query and Filter Management](#query-and-filter-management)
5. [Data Sources and Multi-tenancy](#data-sources-and-multi-tenancy)
6. [HTTP Services and API Clients](#http-services-and-api-clients)
7. [Aggregations and Data Processing](#aggregations-and-data-processing)
8. [Data Frames and Visualization Pipeline](#data-frames-and-visualization-pipeline)
9. [Real-time Data Handling](#real-time-data-handling)
10. [Best Practices and Examples](#best-practices-and-examples)

## Architecture Overview

The data services in OpenSearch Dashboards follow a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                   Applications/Plugins                   │
├─────────────────────────────────────────────────────────┤
│                    Data Plugin API                       │
│  ┌─────────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │SearchService│ │QueryService│ │DataSourceService   │   │
│  └─────────────┘ └──────────┘ └────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Core HTTP Service                       │
├─────────────────────────────────────────────────────────┤
│                 OpenSearch Clusters                      │
└─────────────────────────────────────────────────────────┘
```

## Core Data Plugin

The `data` plugin (`src/plugins/data`) is the central hub for all data-related operations in OpenSearch Dashboards. It provides:

### Key Services

1. **Search Service** - Handles all search operations
2. **Query Service** - Manages queries, filters, and time ranges
3. **Index Patterns** - Manages index pattern objects
4. **Field Formats** - Handles field formatting and display
5. **Autocomplete** - Provides query and value suggestions

### Plugin Initialization

```typescript
import { DataPublicPluginStart } from '../plugins/data/public';

// Access data services in your plugin
export class MyPlugin {
  public start(core: CoreStart, { data }: { data: DataPublicPluginStart }) {
    // Use data services
    const searchSource = data.search.searchSource.createEmpty();
    const queryString = data.query.queryString;
    const filterManager = data.query.filterManager;
  }
}
```

## Search Services

The search service provides multiple levels of abstraction for executing searches against OpenSearch.

### SearchSource API (High-level)

SearchSource provides a convenient, promise-based API for constructing and executing searches:

```typescript
// Create a new search source
const searchSource = await data.search.searchSource.create();

// Configure the search
const searchResponse = await searchSource
  .setParent(undefined)
  .setField('index', indexPattern)
  .setField('query', {
    query: 'status:active',
    language: 'kuery'
  })
  .setField('filter', filters)
  .setField('size', 100)
  .setField('from', 0)
  .setField('aggs', {
    status_count: {
      terms: { field: 'status.keyword' }
    }
  })
  .fetch();
```

#### SearchSource Inheritance

SearchSource objects can inherit from parent sources, creating a hierarchy of search configurations:

```typescript
// Create a parent search source with global filters
const parentSearchSource = await data.search.searchSource.create();
parentSearchSource.setField('filter', globalFilters);

// Create child search source that inherits from parent
const childSearchSource = await data.search.searchSource.create();
childSearchSource.setParent(parentSearchSource);
childSearchSource.setField('query', specificQuery);
// Child will include both global filters and specific query
```

### Low-level Search API

For more control and real-time updates, use the low-level search API:

```typescript
import { isCompleteResponse } from '../plugins/data/public';

const searchRequest = {
  params: {
    index: 'logs-*',
    body: {
      query: {
        match_all: {}
      },
      size: 100
    }
  }
};

// Execute search with observable for partial results
const search$ = data.search.search(searchRequest)
  .subscribe({
    next: (response) => {
      if (isCompleteResponse(response)) {
        // Final result
        console.log('Search complete:', response);
        search$.unsubscribe();
      } else {
        // Partial result - update UI with loading state
        console.log('Partial result:', response);
      }
    },
    error: (error) => {
      // Handle errors
      data.search.showError(error);
    }
  });
```

### Running PPL Queries with SearchSource

OpenSearch Dashboards supports Piped Processing Language (PPL) queries through the search source API. PPL provides a powerful alternative to traditional OpenSearch DSL queries with a more intuitive syntax.

#### Basic PPL Query Setup

```typescript
// Create a search source for PPL queries
const searchSource = await data.search.searchSource.create();

// Configure PPL query
searchSource
  .setField('index', indexPattern)
  .setField('query', {
    query: 'source=logs-* | where status="error" | stats count() by service',
    language: 'PPL',
    dataset: {
      type: 'INDEX_PATTERN', // or 'INDEXES', 'S3', etc.
      id: indexPattern.id,
      title: indexPattern.title,
      timeFieldName: '@timestamp' // Required for time-based filtering
    }
  })
  .setField('size', 0); // Set to 0 for aggregation queries

// Execute the PPL query
const response = await searchSource.fetch();
```

#### PPL Query with Time Filtering

PPL queries automatically integrate with the global time filter when a time field is specified:

```typescript
// Time filters are automatically added to PPL queries when timeFieldName is set
const pplQuery = {
  query: 'source=access_logs | fields timestamp, status, response_time',
  language: 'PPL',
  dataset: {
    type: 'INDEX_PATTERN',
    id: 'logs-*',
    title: 'Server Logs',
    timeFieldName: 'timestamp' // Enables automatic time filtering
  }
};

// The PPL search interceptor will automatically add WHERE clauses for:
// 1. Global time range from timefilter
// 2. Filters from filter manager (in supported apps like dashboards)
searchSource.setField('query', pplQuery);

// To skip time filtering for specific queries
searchSource.setField('skipTimeFilter', true);
```

#### PPL Search Strategies

OpenSearch Dashboards uses different search strategies based on the data source:

```typescript
// PPL strategies are automatically selected based on dataset type:
// - SEARCH_STRATEGY.PPL: Standard PPL queries against OpenSearch indices
// - SEARCH_STRATEGY.PPL_ASYNC: Asynchronous PPL for S3 and external data sources
// - SEARCH_STRATEGY.PPL_RAW: Direct PPL execution without processing

// Example: S3 dataset automatically uses async strategy
const s3Query = {
  query: 'source=s3.my_bucket.access_logs | head 100',
  language: 'PPL',
  dataset: {
    type: 'S3',
    id: 's3-datasource-id',
    title: 'S3 Access Logs',
    dataSource: {
      id: 'external-datasource-id',
      title: 'AWS S3 Data'
    }
  }
};
```

#### PPL with Aggregations

```typescript
// PPL aggregation query with date histogram
const aggQuery = {
  query: 'source=logs-* | stats count() by span(@timestamp, 1h)',
  language: 'PPL',
  dataset: {
    type: 'INDEX_PATTERN',
    id: indexPattern.id,
    title: indexPattern.title,
    timeFieldName: '@timestamp'
  }
};

searchSource.setField('query', aggQuery);
searchSource.setField('size', 0);

// The response will contain aggregation results
const response = await searchSource.fetch();
// Access results via response.aggregations or response.dataFrame
```

#### PPL Query with Custom Interceptor

For advanced use cases, you can create a custom PPL search interceptor:

```typescript
import { PPLSearchInterceptor } from '../plugins/query_enhancements/public';

// The PPL interceptor handles:
// - Automatic filter injection from filter manager
// - Time range filtering based on dataset configuration
// - Query strategy selection (sync/async)
// - Response formatting and data frame conversion

// Access the default PPL interceptor
const pplInterceptor = data.search.getSearchInterceptor('PPL');

// PPL queries support filter manager integration in dashboard contexts
// Filters are automatically converted to WHERE clauses
const filterManager = data.query.filterManager;
filterManager.addFilters([phraseFilter]);
// The filter will be added as: "| where field='value'"
```

#### Error Handling for PPL Queries

```typescript
try {
  const response = await searchSource.fetch();
  // Process PPL results
} catch (error) {
  if (error.name === 'PPLSyntaxError') {
    // Handle PPL syntax errors
    console.error('Invalid PPL syntax:', error.message);
  } else if (error.statusCode === 400) {
    // Handle query validation errors
    console.error('Query validation failed:', error.body?.error);
  } else {
    // Generic error handling
    data.search.showError(error);
  }
}
```

### Search Interceptors

Search interceptors allow you to modify requests and responses:

```typescript
// Access the search interceptor
const searchInterceptor = data.search.getDefaultSearchInterceptor();

// The search service automatically applies interceptors for:
// - Adding authentication headers
// - Request/response transformation
// - Error handling
// - Loading state management
```

## Query and Filter Management

The query service manages the global query state including filters, time range, and query strings.

### Filter Manager

Manages application-wide filters:

```typescript
// Get filter manager instance
const filterManager = data.query.filterManager;

// Add a filter
const filter = buildPhraseFilter(
  field,
  value,
  indexPattern
);
filterManager.addFilters([filter]);

// Get current filters
const currentFilters = filterManager.getFilters();

// Remove filters
filterManager.removeFilter(filter);
filterManager.removeAll();

// Listen to filter changes
filterManager.getUpdates$().subscribe(filters => {
  console.log('Filters updated:', filters);
});
```

### Time Filter

Manages time range filtering:

```typescript
const timefilter = data.query.timefilter.timefilter;

// Set time range
timefilter.setTime({
  from: 'now-15m',
  to: 'now'
});

// Get current time range
const timeRange = timefilter.getTime();

// Enable auto-refresh
timefilter.setRefreshInterval({
  pause: false,
  value: 10000 // 10 seconds
});

// Listen to time changes
timefilter.getTimeUpdate$().subscribe(() => {
  console.log('Time range updated');
});
```

### Query String Manager

Manages the query bar input:

```typescript
const queryString = data.query.queryString;

// Set query
queryString.setQuery({
  query: 'status:active AND user:admin',
  language: 'kuery'
});

// Get current query
const currentQuery = queryString.getQuery();

// Subscribe to query changes
queryString.getUpdates$().subscribe(query => {
  console.log('Query updated:', query);
});
```

### Building OpenSearch Queries

Combine filters, queries, and time ranges into OpenSearch queries:

```typescript
import { buildOpenSearchQuery } from '../plugins/data/common';

// Get the combined OpenSearch query
const opensearchQuery = data.query.getOpenSearchQuery(indexPattern);

// Or build manually
const query = buildOpenSearchQuery(
  indexPattern,
  queryString.getQuery(),
  [...filterManager.getFilters(), timeFilter],
  getOpenSearchQueryConfig(uiSettings)
);
```

## Data Sources and Multi-tenancy

The data source plugin enables connecting to multiple OpenSearch clusters.

### Data Source Service

```typescript
// Get data source client in server-side request handler
export const myRouteHandler = async (context, request, response) => {
  const dataSourceId = request.query.dataSourceId;

  // Get OpenSearch client for specific data source
  const client = await context.dataSource.opensearch.getClient(dataSourceId);

  // Execute query
  const result = await client.search({
    index: 'my-index',
    body: {
      query: { match_all: {} }
    }
  });

  return response.ok({ body: result });
};
```

### Data Source Configuration

Data sources support multiple authentication types:

```typescript
// Data source saved object structure
interface DataSourceAttributes {
  title: string;
  description?: string;
  endpoint: string;
  auth: {
    type: 'no_auth' | 'username_password' | 'sigv4';
    credentials?: {
      username?: string;
      password?: string; // Encrypted
      region?: string;
      accessKey?: string;
      secretKey?: string; // Encrypted
    };
  };
}
```

## HTTP Services and API Clients

The core HTTP service provides a unified interface for making HTTP requests.

### HTTP Client

```typescript
// Access HTTP client
const http = core.http;

// Make GET request
const response = await http.get('/api/my-endpoint', {
  query: { param: 'value' }
});

// Make POST request
const result = await http.post('/api/my-endpoint', {
  body: JSON.stringify({ data: 'value' })
});

// Add request interceptor
http.intercept({
  request: async (request) => {
    // Modify request
    request.headers.append('X-Custom-Header', 'value');
    return request;
  },
  response: async (response) => {
    // Process response
    return response;
  }
});
```

### Loading State Management

Loading state management in OpenSearch Dashboards provides a centralized way to track and display loading indicators across the application. This is essential for providing visual feedback during data fetching, processing, and other asynchronous operations.

#### Core Loading Count Service

The loading count service aggregates loading states from multiple sources:

```typescript
import { BehaviorSubject } from 'rxjs';

// Create a custom loading count source
const customLoadingCount$ = new BehaviorSubject(0);

// Register with HTTP service to track loading globally
http.addLoadingCountSource(customLoadingCount$);

// Manually control loading state
function startOperation() {
  customLoadingCount$.next(customLoadingCount$.getValue() + 1);

  performAsyncOperation()
    .finally(() => {
      // Decrement when operation completes
      customLoadingCount$.next(customLoadingCount$.getValue() - 1);
    });
}

// Subscribe to global loading state
const loadingSubscription = http.getLoadingCount$()
  .subscribe(count => {
    console.log(`Active loading operations: ${count}`);
    // Update UI loading indicators
    updateLoadingIndicator(count > 0);
  });
```

#### Automatic HTTP Request Tracking

HTTP requests are automatically tracked by the loading service:

```typescript
// All HTTP requests through core.http automatically update loading count
const fetchData = async () => {
  // Loading count increments when request starts
  const response = await http.get('/api/data');
  // Loading count decrements when request completes
  return response;
};

// Multiple concurrent requests are tracked correctly
Promise.all([
  http.get('/api/users'),
  http.get('/api/posts'),
  http.get('/api/comments')
]);
// Loading count will be 3 during requests, then 0 when all complete
```

#### Search Loading States

Search operations have built-in loading state management:

```typescript
// SearchSource automatically manages loading states
const searchSource = await data.search.searchSource.create();

// Track search loading state
let isSearching = false;

// Method 1: Using search interceptor
const searchInterceptor = data.search.getDefaultSearchInterceptor();
// The interceptor automatically updates loading count during searches

// Method 2: Manual loading state for custom searches
const performSearch = async () => {
  const loadingCount$ = new BehaviorSubject(0);
  http.addLoadingCountSource(loadingCount$);

  try {
    loadingCount$.next(1); // Start loading
    isSearching = true;

    const response = await searchSource.fetch({
      abortSignal: abortController.signal
    });

    return response;
  } finally {
    loadingCount$.next(0); // End loading
    isSearching = false;
  }
};
```

#### Component-Level Loading States

```typescript
import { EuiLoadingSpinner, EuiProgress } from '@elastic/eui';
import { useObservable } from 'react-use';

export const DataComponent: React.FC = () => {
  const loadingCount = useObservable(http.getLoadingCount$(), 0);
  const [localLoading, setLocalLoading] = useState(false);

  const fetchData = async () => {
    setLocalLoading(true);
    try {
      // Perform data operations
      await searchSource.fetch();
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div>
      {/* Global loading indicator */}
      {loadingCount > 0 && (
        <EuiProgress size="xs" position="fixed" />
      )}

      {/* Local loading state */}
      {localLoading ? (
        <EuiLoadingSpinner size="l" />
      ) : (
        <DataDisplay />
      )}
    </div>
  );
};
```

#### Loading State Best Practices

```typescript
// 1. Use abort controllers for cancellable operations
class DataService {
  private abortController?: AbortController;
  private loadingCount$ = new BehaviorSubject(0);

  constructor(private http: HttpStart) {
    http.addLoadingCountSource(this.loadingCount$);
  }

  async fetchData() {
    // Cancel previous request if still loading
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.loadingCount$.next(this.loadingCount$.getValue() + 1);

    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        throw error;
      }
    } finally {
      this.loadingCount$.next(Math.max(0, this.loadingCount$.getValue() - 1));
    }
  }

  cleanup() {
    this.abortController?.abort();
    this.loadingCount$.complete();
  }
}

// 2. Aggregate multiple loading sources
class AggregatedLoadingService {
  private loadingSources = new Map<string, BehaviorSubject<number>>();

  registerSource(id: string, http: HttpStart) {
    const source = new BehaviorSubject(0);
    this.loadingSources.set(id, source);
    http.addLoadingCountSource(source);
    return source;
  }

  setLoading(id: string, isLoading: boolean) {
    const source = this.loadingSources.get(id);
    if (source) {
      source.next(isLoading ? 1 : 0);
    }
  }

  isAnyLoading(): boolean {
    for (const source of this.loadingSources.values()) {
      if (source.getValue() > 0) return true;
    }
    return false;
  }
}

// 3. Debounce rapid loading state changes
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const debouncedLoading$ = http.getLoadingCount$().pipe(
  debounceTime(100), // Prevent flickering for quick operations
  distinctUntilChanged(),
  map(count => count > 0)
);
```

#### Loading State Integration with UI Settings

```typescript
// Loading states can be customized via UI settings
const loadingIndicatorDelay = uiSettings.get('loading.indicator.delay', 1000);

// Show loading indicator only for long-running operations
const delayedLoading$ = http.getLoadingCount$().pipe(
  switchMap(count =>
    count > 0
      ? timer(loadingIndicatorDelay).pipe(mapTo(true))
      : of(false)
  ),
  distinctUntilChanged()
);
```

### Base Path Management

Base path management is crucial for OpenSearch Dashboards deployments, especially when running behind reverse proxies, in subpaths, or with workspace configurations. The base path service ensures URLs work correctly regardless of deployment configuration.

#### Understanding Base Path Components

```typescript
// Base path consists of three parts:
// 1. basePath: The server's base path (e.g., '/app/dashboards')
// 2. serverBasePath: The configured server base path
// 3. clientBasePath: Additional client-side path (e.g., workspace paths)

const basePath = core.http.basePath;

// Get the full base path (includes client base path)
const fullBasePath = basePath.get(); // e.g., '/app/dashboards/w/workspace-id'

// Get only the server base path (without client additions)
const serverBasePath = basePath.serverBasePath; // e.g., '/app/dashboards'

// Get the original base path (without workspace)
const originalBasePath = basePath.getBasePath(); // e.g., '/app/dashboards'
```

#### URL Construction with Base Path

```typescript
// Always use basePath.prepend() for internal URLs
class MyPlugin {
  private buildUrl(path: string): string {
    // Correct: Prepends base path automatically
    return this.basePath.prepend(`/api/my-plugin${path}`);

    // Incorrect: Hardcoding paths breaks proxy deployments
    // return `/api/my-plugin${path}`;
  }

  // Building plugin asset URLs
  getAssetUrl(assetPath: string): string {
    return this.basePath.prepend(`/plugins/my-plugin/assets/${assetPath}`);
  }

  // Building API endpoints
  getApiEndpoint(endpoint: string): string {
    return this.basePath.prepend(`/api/v1/${endpoint}`);
  }
}
```

#### Navigation with Base Path

```typescript
// Navigating to application routes
const navigateToApp = (appId: string, path?: string) => {
  const appPath = basePath.prepend(`/app/${appId}${path || ''}`);
  window.location.href = appPath;
};

// Using core navigation with base path
core.application.navigateToUrl(
  basePath.prepend('/app/dashboard#/view/123')
);

// Navigating to a specific workspace
const navigateToWorkspace = (workspaceId: string, path: string) => {
  const workspacePath = basePath.prepend(
    `/w/${workspaceId}${path}`
  );
  core.application.navigateToUrl(workspacePath);
};
```

#### Removing Base Path from URLs

```typescript
// Extract the actual path from a full URL
const extractPath = (fullUrl: string): string => {
  // Remove base path to get the actual route
  return basePath.remove(fullUrl);
};

// Example: Processing current location
const currentPath = basePath.remove(window.location.pathname);
// If URL is '/app/dashboards/app/discover' and base is '/app/dashboards'
// Result: '/app/discover'

// Handle workspace URLs
const removeWorkspacePath = (url: string): string => {
  // Remove base path including workspace prefix
  return basePath.remove(url, { withoutClientBasePath: false });
};
```

#### Working with External URLs

```typescript
// Base path should NOT be added to external URLs
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const processUrl = (url: string): string => {
  if (isExternalUrl(url)) {
    return url; // Don't modify external URLs
  }
  return basePath.prepend(url); // Add base path to internal URLs
};

// Using modifyUrl for complex URL manipulation
import { modifyUrl } from '@osd/std';

const updateUrlWithBasePath = (url: string): string => {
  return modifyUrl(url, (parts) => {
    // Only modify relative URLs
    if (!parts.hostname && parts.pathname?.startsWith('/')) {
      parts.pathname = basePath.prepend(parts.pathname);
    }
  });
};
```

#### API Requests with Base Path

```typescript
// HTTP service automatically handles base path
class DataService {
  constructor(private http: HttpStart) {}

  async fetchData() {
    // Base path is automatically prepended
    return await this.http.get('/api/my-data');
  }

  async postData(data: any) {
    // No need to manually add base path
    return await this.http.post('/api/my-data', {
      body: JSON.stringify(data)
    });
  }
}

// For custom fetch requests, manually prepend base path
const customFetch = async (endpoint: string) => {
  const url = basePath.prepend(endpoint);
  const response = await fetch(url);
  return response.json();
};
```

#### Workspace-Aware Base Path

```typescript
// Handle workspace-specific paths
const WORKSPACE_PATH_PREFIX = '/w';

class WorkspaceAwareService {
  private getWorkspaceId(): string | null {
    const path = window.location.pathname;
    const match = path.match(/\/w\/([^/]+)/);
    return match ? match[1] : null;
  }

  buildWorkspaceUrl(path: string): string {
    const workspaceId = this.getWorkspaceId();
    if (workspaceId) {
      return basePath.prepend(`${WORKSPACE_PATH_PREFIX}/${workspaceId}${path}`);
    }
    return basePath.prepend(path);
  }

  // Build URL without workspace context
  buildGlobalUrl(path: string): string {
    return basePath.prepend(path, { withoutClientBasePath: true });
  }
}
```

#### Static Asset Handling

```typescript
// Serving static assets with correct base path
class AssetService {
  constructor(
    private basePath: IBasePath,
    private pluginName: string
  ) {}

  getImageUrl(imageName: string): string {
    return this.basePath.prepend(
      `/plugins/${this.pluginName}/assets/images/${imageName}`
    );
  }

  getStylesheetUrl(styleName: string): string {
    return this.basePath.prepend(
      `/plugins/${this.pluginName}/assets/styles/${styleName}.css`
    );
  }

  // For dynamically loaded assets
  async loadScript(scriptPath: string): Promise<void> {
    const script = document.createElement('script');
    script.src = this.basePath.prepend(
      `/plugins/${this.pluginName}/assets/js/${scriptPath}`
    );
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
```

#### Testing with Base Path

```typescript
// Mock base path in tests
const mockBasePath = {
  get: jest.fn(() => '/test-base'),
  prepend: jest.fn((path: string) => `/test-base${path}`),
  remove: jest.fn((path: string) => {
    const base = '/test-base';
    return path.startsWith(base) ? path.slice(base.length) : path;
  }),
  serverBasePath: '/test-base',
  getBasePath: jest.fn(() => '/test-base')
};

// Test URL construction
describe('URL Building', () => {
  it('should prepend base path to URLs', () => {
    const service = new MyService(mockBasePath);
    const url = service.buildApiUrl('/endpoint');

    expect(mockBasePath.prepend).toHaveBeenCalledWith('/api/endpoint');
    expect(url).toBe('/test-base/api/endpoint');
  });

  it('should handle workspace paths', () => {
    mockBasePath.get.mockReturnValue('/test-base/w/workspace-123');
    const url = mockBasePath.prepend('/app/discover');

    expect(url).toBe('/test-base/w/workspace-123/app/discover');
  });
});
```

#### Local Development with BasePath

Setting up basePath in your local development environment helps test real deployment scenarios:

```bash
# Start OpenSearch Dashboards with a custom basePath
npm start -- --server.basePath="/dev/dashboards"
```

Now your local instance runs at `http://localhost:5601/dev/dashboards/` instead of `http://localhost:5601/`

**Note:** By default in development mode, OpenSearch Dashboards automatically adds a random basePath (like `/abc`) for security reasons. You can override this with your own basePath or disable it entirely with `--server.basePath=""` if you need to run at the root path.

**Why this is useful in development:**

1. **Testing Real Deployment Scenarios**
```javascript
// Your plugin code - works the same locally and in production
const discoverUrl = core.http.basePath.prepend('/app/discover');
// Local: http://localhost:5601/dev/dashboards/app/discover
// Prod: https://company.com/analytics/dashboards/app/discover
```

2. **Multi-Service Development**
```
http://localhost:3000/          → Your main app
http://localhost:3000/api/      → Your API
http://localhost:5601/dev/dashboards/ → OpenSearch Dashboards
```

Your reverse proxy config (nginx/Apache) can route everything through port 3000:
```nginx
location /dashboards/ {
    proxy_pass http://localhost:5601/dev/dashboards/;
}
```

3. **Simulating Production Environment**
If production will be `company.com/analytics/dashboards/`, you can test locally with the same path structure to catch URL issues early.

4. **Plugin Development**
```javascript
// In your plugin
export class MyPlugin {
  setup(core) {
    // Register an app that works with any basePath
    core.application.register({
      id: 'myApp',
      title: 'My App',
      mount: (params) => {
        // All navigation automatically includes basePath
        const homeUrl = core.http.basePath.prepend('/app/myApp');
        return render(homeUrl, params.element);
      }
    });
  }
}
```

This way you're developing against the same URL patterns your users will experience in production.

#### Common Base Path Patterns

```typescript
// 1. Building shareable links
const createShareableLink = (path: string): string => {
  const origin = window.location.origin;
  const fullPath = basePath.prepend(path);
  return `${origin}${fullPath}`;
};

// 2. Handling route changes
window.addEventListener('popstate', (event) => {
  const currentPath = basePath.remove(window.location.pathname);
  // Process the path without base path prefix
  handleRouteChange(currentPath);
});

// 3. Redirecting after operations
const redirectAfterSave = (savedObjectId: string) => {
  const redirectUrl = basePath.prepend(
    `/app/dashboard#/view/${savedObjectId}`
  );
  window.location.href = redirectUrl;
};

// 4. Building download URLs
const getDownloadUrl = (reportId: string): string => {
  return basePath.prepend(
    `/api/reporting/download/${reportId}`
  );
};
```

## Aggregations and Data Processing

The aggregations service provides a powerful framework for data aggregation.

### Aggregation Types

OpenSearch Dashboards supports various aggregation types:

#### Metric Aggregations
```typescript
// Sum aggregation
const sumAgg = {
  id: '1',
  type: 'sum',
  schema: 'metric',
  params: {
    field: 'total_amount'
  }
};

// Average aggregation
const avgAgg = {
  id: '2',
  type: 'avg',
  schema: 'metric',
  params: {
    field: 'response_time'
  }
};

// Cardinality (unique count)
const cardinalityAgg = {
  id: '3',
  type: 'cardinality',
  schema: 'metric',
  params: {
    field: 'user_id.keyword'
  }
};
```

#### Bucket Aggregations
```typescript
// Terms aggregation
const termsAgg = {
  id: '4',
  type: 'terms',
  schema: 'segment',
  params: {
    field: 'category.keyword',
    size: 10,
    order: 'desc',
    orderBy: '1' // Order by metric aggregation id
  }
};

// Date histogram
const dateHistogramAgg = {
  id: '5',
  type: 'date_histogram',
  schema: 'segment',
  params: {
    field: '@timestamp',
    interval: 'auto',
    min_doc_count: 1
  }
};

// Range aggregation
const rangeAgg = {
  id: '6',
  type: 'range',
  schema: 'bucket',
  params: {
    field: 'price',
    ranges: [
      { from: 0, to: 50 },
      { from: 50, to: 100 },
      { from: 100 }
    ]
  }
};
```

### Using AggConfigs

```typescript
import { AggConfigs } from '../plugins/data/common';

// Create aggregation configuration
const aggConfigs = new AggConfigs(
  indexPattern,
  [
    {
      id: '1',
      type: 'count',
      schema: 'metric'
    },
    {
      id: '2',
      type: 'terms',
      schema: 'segment',
      params: {
        field: 'status.keyword',
        size: 5
      }
    }
  ],
  { typesRegistry: data.search.aggs.types }
);

// Convert to DSL
const dsl = aggConfigs.toDsl();

// Execute search with aggregations
const searchSource = await data.search.searchSource.create();
searchSource
  .setField('index', indexPattern)
  .setField('aggs', dsl);

const response = await searchSource.fetch();
```

## Data Frames and Visualization Pipeline

Data frames provide a unified structure for handling query results and enabling visualizations.

### Data Frame Structure

```typescript
interface IDataFrame {
  name?: string;
  fields: IFieldType[];
  size: number;
  // Data organized by column
  [fieldName: string]: any[];
}
```

### Data Frame Service

```typescript
// Access data frame service
const dfService = data.search.df;

// Set data frame
dfService.set({
  name: 'query_results',
  fields: [
    { name: 'timestamp', type: 'date' },
    { name: 'status', type: 'string' },
    { name: 'count', type: 'number' }
  ],
  timestamp: [1634567890000, 1634567900000],
  status: ['success', 'error'],
  count: [100, 5]
});

// Get current data frame
const currentDataFrame = dfService.get();

// Clear data frame
dfService.clear();

// Subscribe to data frame changes
dfService.df$.subscribe(dataFrame => {
  if (dataFrame) {
    console.log('Data frame updated:', dataFrame);
    // Update visualization
  }
});
```

### Converting Search Results to Data Frames

```typescript
import { convertResult, createDataFrame } from '../plugins/data/common';

// Convert OpenSearch response to data frame
const searchResponse = await searchSource.fetch();
const dataFrame = convertResult(searchResponse, {
  flattenHit: true,
  includeFields: ['timestamp', 'status', 'message']
});

// Create data frame from aggregation results
const aggResponse = await searchSource.fetch();
const aggDataFrame = createDataFrame({
  name: 'aggregations',
  fields: [
    { name: 'key', type: 'string' },
    { name: 'doc_count', type: 'number' }
  ],
  key: aggResponse.aggregations.status.buckets.map(b => b.key),
  doc_count: aggResponse.aggregations.status.buckets.map(b => b.doc_count)
});
```

## Real-time Data Handling

OpenSearch Dashboards supports real-time data updates through various mechanisms.

### Auto-refresh

```typescript
// Enable auto-refresh
const timefilter = data.query.timefilter.timefilter;

timefilter.setRefreshInterval({
  pause: false,
  value: 5000 // Refresh every 5 seconds
});

// Listen to refresh events
timefilter.getRefreshIntervalUpdate$().subscribe(() => {
  // Re-fetch data
  searchSource.fetch().then(updateVisualization);
});
```

### Polling for Long-running Queries

```typescript
interface PollingStrategy {
  pollInterval: number;
  maxAttempts: number;
}

async function pollQueryStatus(
  queryId: string,
  strategy: PollingStrategy
): Promise<QueryResult> {
  let attempts = 0;

  while (attempts < strategy.maxAttempts) {
    const response = await data.search.search({
      params: {
        queryId,
        checkStatus: true
      }
    }).toPromise();

    if (response.status === 'complete') {
      return response.result;
    }

    await new Promise(resolve =>
      setTimeout(resolve, strategy.pollInterval)
    );
    attempts++;
  }

  throw new Error('Query timeout');
}
```

### Observable Patterns for Real-time Updates

```typescript
import { interval, merge } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

// Create real-time data stream
const realTimeData$ = merge(
  // Initial fetch
  searchSource.fetch(),
  // Periodic updates
  interval(5000).pipe(
    switchMap(() => searchSource.fetch())
  )
).pipe(
  takeUntil(stopPolling$)
);

// Subscribe to updates
const subscription = realTimeData$.subscribe({
  next: (data) => updateVisualization(data),
  error: (error) => handleError(error)
});

// Clean up
subscription.unsubscribe();
```

## Best Practices and Examples

### 1. Error Handling

```typescript
// Wrap search operations in try-catch
try {
  const response = await searchSource.fetch();
  processResults(response);
} catch (error) {
  // Use built-in error display
  data.search.showError(error);

  // Or handle manually
  if (error.name === 'AbortError') {
    console.log('Search was cancelled');
  } else {
    notifications.toasts.addError(error, {
      title: 'Search failed'
    });
  }
}
```

### 2. Search Cancellation

```typescript
import { AbortController } from 'abort-controller';

// Create abort controller
const abortController = new AbortController();

// Pass abort signal to search
const search$ = data.search.search(request, {
  abortSignal: abortController.signal
});

// Cancel search when component unmounts
useEffect(() => {
  return () => {
    abortController.abort();
  };
}, []);
```

### 3. Optimizing Large Datasets

```typescript
// Use scroll API for large datasets
async function* scrollSearch(indexPattern: IndexPattern) {
  let scrollId: string | undefined;

  try {
    // Initial search
    const initialResponse = await data.search.search({
      params: {
        index: indexPattern.title,
        scroll: '1m',
        size: 1000,
        body: {
          query: { match_all: {} }
        }
      }
    }).toPromise();

    yield initialResponse.rawResponse.hits.hits;
    scrollId = initialResponse.rawResponse._scroll_id;

    // Continue scrolling
    while (true) {
      const scrollResponse = await data.search.search({
        params: {
          scroll: '1m',
          scrollId
        }
      }).toPromise();

      const hits = scrollResponse.rawResponse.hits.hits;
      if (hits.length === 0) break;

      yield hits;
      scrollId = scrollResponse.rawResponse._scroll_id;
    }
  } finally {
    // Clear scroll
    if (scrollId) {
      await data.search.search({
        params: {
          scrollId,
          clearScroll: true
        }
      }).toPromise();
    }
  }
}

// Usage
for await (const batch of scrollSearch(indexPattern)) {
  processBatch(batch);
}
```

### 4. Building Custom Visualizations

```typescript
import { DataPublicPluginStart } from '../plugins/data/public';

export class CustomVisualization {
  constructor(
    private data: DataPublicPluginStart,
    private container: HTMLElement
  ) {}

  async render(indexPattern: IndexPattern) {
    // Create search source
    const searchSource = await this.data.search.searchSource.create();

    // Configure aggregations
    searchSource
      .setField('index', indexPattern)
      .setField('size', 0)
      .setField('aggs', {
        timeline: {
          date_histogram: {
            field: '@timestamp',
            interval: 'hour'
          },
          aggs: {
            status_breakdown: {
              terms: {
                field: 'status.keyword'
              }
            }
          }
        }
      });

    // Apply global filters and query
    searchSource.setField('filter', this.data.query.filterManager.getFilters());
    searchSource.setField('query', this.data.query.queryString.getQuery());

    // Fetch data
    const response = await searchSource.fetch();

    // Transform to visualization data
    const chartData = this.transformData(response);

    // Render chart
    this.renderChart(chartData);
  }

  private transformData(response: any) {
    // Transform aggregation response to chart format
    return response.aggregations.timeline.buckets.map(bucket => ({
      x: bucket.key,
      y: bucket.doc_count,
      series: bucket.status_breakdown.buckets
    }));
  }

  private renderChart(data: any) {
    // Render using D3, Chart.js, etc.
  }
}
```

### 5. Custom Search Strategy

```typescript
// Register custom search strategy
data.search.__enhance({
  searchInterceptor: {
    search: (request, options) => {
      // Modify request
      if (options?.strategy === 'myCustomStrategy') {
        request.params.preference = '_local';
        request.params.timeout = '30s';
      }

      // Execute search
      return defaultSearchInterceptor.search(request, options);
    },
    showError: (error) => {
      // Custom error handling
      console.error('Custom search error:', error);
    }
  }
});

// Use custom strategy
const response = await data.search.search(request, {
  strategy: 'myCustomStrategy'
}).toPromise();
```

## Advanced Topics

### Correlation Service

OpenSearch Dashboards supports correlating data across different sources:

```typescript
// Find correlations by dataset
async function findCorrelations(datasetId: string) {
  const correlations = await savedObjectsClient.find({
    type: 'correlations',
    filter: `references.id: "${datasetId}"`
  });

  return correlations.savedObjects.map(correlation => ({
    id: correlation.id,
    type: correlation.attributes.type,
    entities: correlation.attributes.entities,
    references: correlation.references
  }));
}
```

### Query Language Extensions

Support for multiple query languages (DQL, Lucene, PPL, SQL):

```typescript
// Get current query language configuration
const queryString = data.query.queryString;
const language = queryString.getQuery().language;
const languageService = queryString.getLanguageService();

// Get language-specific search implementation
const languageConfig = languageService.getLanguage(language);
if (languageConfig) {
  // Use language-specific search
  const response = await languageConfig.search.search(request, options);
}
```

## Conclusion

The OpenSearch Dashboards data services provide a robust and flexible framework for working with data. Key takeaways:

1. **Use SearchSource** for high-level search operations with automatic filter inheritance
2. **Leverage the Query Service** for managing global application state
3. **Implement proper error handling** and loading states
4. **Optimize for performance** with appropriate aggregations and pagination
5. **Build on the Data Frame abstraction** for consistent data handling across visualizations
6. **Support multi-tenancy** through the data source service
7. **Enable real-time updates** through auto-refresh and observables

For more detailed information, refer to:
- [Data Plugin API Documentation](plugins/data/README.md)
- [Search Source Examples](../src/plugins/data/common/search/search_source/)
- [Aggregation Types](../src/plugins/data/common/search/aggs/)
- [Data Source Plugin Documentation](../src/plugins/data_source/README.md)