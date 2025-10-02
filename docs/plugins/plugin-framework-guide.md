# OpenSearch Dashboards Plugin Framework Guide

This comprehensive guide covers the essentials of developing plugins for OpenSearch Dashboards, including plugin structure, lifecycle management, creating custom plugins, and consuming APIs from other plugins.

## Table of Contents

1. [Overview](#1-overview)
2. [Plugin Structure](#2-plugin-structure)
3. [Plugin Manifest](#3-plugin-manifest)
4. [Creating a Plugin](#4-creating-a-plugin)
5. [Plugin Configuration](#5-plugin-configuration)
6. [Plugin Lifecycle](#6-plugin-lifecycle)
7. [Core Services](#7-core-services)
8. [Integrating Custom Datasources](#8-integrating-custom-datasources)
9. [Best Practices](#9-best-practices)
10. [Additional Resources](#10-additional-resources)

## 1. Overview

OpenSearch Dashboards uses a plugin architecture that allows developers to extend the platform's functionality. Plugins can:

- Add new visualizations and dashboards
- Integrate with external services
- Expose APIs for other plugins to consume
- Register routes and custom UI components
- Extend core functionality

Plugins integrate with the core system through three lifecycle events: `setup`, `start`, and `stop`. During each lifecycle method, plugins receive core services and interfaces from dependency plugins, and can expose their own APIs to downstream plugins.

> **See also:** [Contributing Guide](../../CONTRIBUTING.md) for information on contributing plugins to the OpenSearch Dashboards project.

## 2. Plugin Structure

A typical OpenSearch Dashboards plugin follows this directory structure:

```ini
my-plugin/
├── server/                        # Server-side code
│   ├── index.ts                   # Server entry point
│   ├── plugin.ts                  # Server plugin class
│   └── routes/                    # API routes
├── public/                        # Client-side code
│   ├── index.ts                   # Public entry point
│   ├── plugin.ts                  # Public plugin class
│   ├── components/                # React components
│   └── services/                  # Client services
├── common/                        # Shared code (server + client)
│   ├── types.ts                   # Shared TypeScript types
│   └── constants.ts               # Shared constants
└── opensearch_dashboards.json     # Plugin manifest (required)
```

### 2.1. Directory Breakdown

- **`opensearch_dashboards.json`**: Required manifest file that defines plugin metadata, dependencies, and capabilities
- **`server/`**: Server-side TypeScript code that runs in Node.js
- **`public/`**: Client-side TypeScript/React code that runs in the browser
- **`common/`**: Shared code and types used by both server and client

## 3. Plugin Manifest

Every plugin requires an `opensearch_dashboards.json` file at its root. This manifest defines static information about the plugin.

### 3.1. Manifest Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique plugin identifier in camelCase. Cannot contain `.` characters. Used by other plugins to reference this plugin. |
| `version` | string | Yes | Plugin version following semantic versioning. Can use `"opensearchDashboards"` to match platform version. |
| `opensearchDashboardsVersion` | string | No | Compatible OpenSearch Dashboards version. Defaults to the plugin's `version` field if not specified. Can use `"opensearchDashboards"` literal for automatic compatibility. |
| `server` | boolean | No | Whether plugin includes server-side functionality. Default: `false`. At least one of `server` or `ui` must be `true`. |
| `ui` | boolean | No | Whether plugin includes client-side functionality. Default: `false`. At least one of `server` or `ui` must be `true`. |
| `requiredPlugins` | string[] | No | List of plugins that must be installed and enabled for this plugin to work. |
| `optionalPlugins` | string[] | No | List of plugins that may be leveraged if available but aren't required. |
| `requiredBundles` | string[] | No | List of plugin IDs whose UI code this plugin imports (for cross-plugin imports). |
| `configPath` | string or string[] | No | Root configuration path. Defaults to plugin ID converted to snake_case. Can be an array for nested config paths. |
| `requiredEnginePlugins` | object | No | OpenSearch plugins required on the cluster (e.g., `{"plugin-name": ">=1.0.0"}`). |
| `supportedOSDataSourceVersions` | string | No | Supported version range for OpenSearch data sources (e.g., `">= 1.3.0"`). |
| `requiredOSDataSourcePlugins` | string[] | No | Backend plugins required on the data source cluster. |

### 3.2. Example

```json
{
  "id": "dataSourceManagement",
  "version": "opensearchDashboards",
  "server": true,
  "ui": true,
  "requiredPlugins": ["navigation", "management", "indexPatternManagement"],
  "optionalPlugins": ["dataSource"],
  "requiredBundles": ["opensearchDashboardsReact", "dataSource", "opensearchDashboardsUtils"],
  "extraPublicDirs": ["public/components/utils"],
  "configPath": ["data_source_management"]
}
```

## 4. Creating a Plugin

The easiest way to create a new plugin is to use the OpenSearch Dashboards Plugin Generator. Run the following command from the OpenSearch Dashboards repository root:

```bash
node scripts/generate_plugin --name my_plugin_name -y
```

Options:

```bash
node scripts/generate_plugin

Generate a fresh OpenSearch Dashboards plugin in the plugins/ directory

Options:
  --yes, -y          Answer yes to all prompts, requires passing --name
  --name             Set the plugin name
  --ui               Generate a UI plugin
  --server           Generate a Server plugin
  --verbose, -v      Log verbosely
  --debug            Log debug messages (less than verbose)
  --quiet            Only log errors
  --silent           Don't log anything
  --help             Show this message
```

> **See also:** [OpenSearch Dashboards Plugin Generator README](../../packages/osd-plugin-generator/README.md) for complete documentation on generating plugins.

## 5. Plugin Configuration

Plugins can define configuration schemas that validate and type-check user settings.

### 5.1. Define Configuration Schema

Create `config.ts`:

```typescript
import { schema, TypeOf } from '@osd/config-schema';
import { PluginConfigDescriptor } from 'opensearch-dashboards/server';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  apiTimeout: schema.number({ defaultValue: 30000 }),
  apiUrl: schema.string({ defaultValue: 'http://localhost:9200' }),
  secretKey: schema.string({ defaultValue: '' }),
  uiEnabled: schema.boolean({ defaultValue: true }),
});

export type MyPluginConfig = TypeOf<typeof configSchema>;
```

### 5.2. Export Configuration from Server Index

Update `server/index.ts`:

```typescript
import { PluginConfigDescriptor, PluginInitializerContext } from 'opensearch-dashboards/server';
import { MyPlugin } from './plugin';
import { configSchema, MyPluginConfig } from '../config';

export const config: PluginConfigDescriptor<MyPluginConfig> = {
  schema: configSchema,
  exposeToBrowser: {
    enabled: true,
    uiEnabled: true,
  },
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new MyPlugin(initializerContext);
}

export { MyPluginSetup, MyPluginStart } from './types';
```

### 5.3. Access Configuration in Plugin

```typescript
export class MyPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  private readonly config$: Observable<MyPluginConfig>;

  constructor(initializerContext: PluginInitializerContext<MyPluginConfig>) {
    this.config$ = initializerContext.config.create<MyPluginConfig>();
  }

  public async setup(core: CoreSetup) {
    const config = await this.config$.pipe(first()).toPromise();

    if (!config.enabled) {
      return {};
    }

    // Use configuration
    this.logger.info(`API URL: ${config.apiUrl}`);
    // ...
  }
}
```

### 5.4. Configuration File

Users configure your plugin in `opensearch_dashboards.yml`:

```yaml
my_plugin:
  enabled: true
  apiTimeout: 60000
  apiUrl: 'https://api.example.com'
  secretKey: 'secret123'
```

## 6. Plugin Lifecycle

Plugins integrate with OpenSearch Dashboards through three lifecycle methods: `setup`, `start`, and `stop`. Each plugin must implement a class that conforms to the `Plugin` interface.

### 6.1. Plugin Interface

```typescript
interface Plugin<TSetup, TStart, TPluginsSetup, TPluginsStart> {
  setup(core: CoreSetup<TPluginsStart, TStart>, plugins: TPluginsSetup): TSetup | Promise<TSetup>;
  start(core: CoreStart, plugins: TPluginsStart): TStart | Promise<TStart>;
  stop?(): void;
}
```

### 6.2. Lifecycle Phases

#### 6.2.1. Setup Phase

The `setup` method is called during OpenSearch Dashboards initialization. This is where you should register configurations and expose APIs.

**Server:**

```typescript
public setup(core: CoreSetup, plugins: MyPluginSetupDeps) {
  // Register HTTP routes
  const router = core.http.createRouter();
  router.get(
    {
      path: '/api/my-plugin/status',
      validate: false
    },
    async (context, req, res) => {
      return res.ok({ body: { status: 'ready' } });
    }
  );

  // Register UI settings
  core.uiSettings.register({
    'myPlugin:setting': {
      name: 'My Setting',
      value: 'default',
      description: 'A custom setting',
      schema: schema.string(),
    },
  });

  // Register saved object types
  core.savedObjects.registerType({
    name: 'my-type',
    hidden: false,
    namespaceType: 'single',
    mappings: { /* ... */ },
  });

  // Return APIs for downstream plugins
  return {
    doSomething: () => { /* ... */ },
  };
}
```

**Public:**

```typescript
public setup(core: CoreSetup, plugins: MyPluginSetupDeps) {
  // Register applications
  core.application.register({
    id: 'myPlugin',
    title: 'My Plugin',
    async mount(params: AppMountParameters) {
      const { renderApp } = await import('./application');
      const [coreStart] = await core.getStartServices();
      return renderApp(coreStart, params);
    },
  });

  // Register navigation items
  core.chrome.navGroup.addNavLinksToGroup(
    DEFAULT_NAV_GROUPS.all,
    [{
      id: 'myPlugin',
      category: { id: 'myCategory', label: 'My Category', order: 100 },
    }]
  );

  // Return APIs for downstream plugins
  return {
    doSomething: () => { /* ... */ },
  };
}
```

#### 6.2.2. Start Phase

The `start` method is called after all plugins have completed setup. This is where you should start services and access APIs from other plugins.

**Server:**

```typescript
public start(core: CoreStart, plugins: MyPluginStartDeps) {
  // Access other plugins' APIs
  const dataClient = plugins.data.search.searchClient;

  // Start services
  this.myService.start();

  // Return runtime APIs
  return {
    getRuntimeInfo: () => { /* ... */ },
  };
}
```

**Public:**

```typescript
public start(core: CoreStart, plugins: MyPluginStartDeps) {
  // Access other plugins' APIs
  const { data, navigation } = plugins;

  // Initialize services with dependencies
  this.myService.start({
    dataSearch: data.search,
    notifications: core.notifications,
  });

  // Subscribe to application state
  core.application.currentAppId$.subscribe((appId) => {
    // React to app changes
  });

  // Return runtime APIs
  return {
    getService: () => this.myService,
    performAction: (params) => { /* ... */ },
  };
}
```

#### 6.2.3. Stop Phase (Optional)

The `stop` method is called when the plugin is being stopped. Use this to clean up resources.

**Server:**

```typescript
public stop() {
  this.myService.stop();
  this.backgroundTasks.cancelAll();
  this.connections.forEach(conn => conn.close());
}
```

**Public:**

```typescript
public stop() {
  // Unsubscribe from observables
  this.subscriptions.forEach(sub => sub.unsubscribe());

  // Clean up event listeners
  this.eventListeners.forEach(listener => listener.remove());

  // Stop services
  this.myService.stop();
}
```

### 6.3. Lifecycle Timing

```
System Initialization
  ↓
Setup Phase (all plugins)
  ↓
Start Phase (all plugins)
  ↓
Runtime
  ↓
Stop Phase (all plugins)
  ↓
System Shutdown
```

### 6.4. Plugin Dependencies

Plugins can depend on other plugins to leverage their functionality. Dependencies are declared in the plugin manifest and accessed through the plugin lifecycle methods.

#### 6.4.1. Required Plugins

Required plugins must be installed and enabled for your plugin to load.

**1. Declare in `opensearch_dashboards.json`:**

```json
{
  "id": "myPlugin",
  "requiredPlugins": ["data", "navigation"]
}
```

**2. Define dependency types:**

```typescript
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';
import { NavigationPublicPluginStart } from '../../navigation/public';

export interface MyPluginSetupDeps {
  data: DataPublicPluginSetup;
}

export interface MyPluginStartDeps {
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
}
```

**3. Access dependencies in lifecycle methods:**

```typescript
export class MyPlugin implements Plugin<
  MyPluginSetup,
  MyPluginStart,
  MyPluginSetupDeps,
  MyPluginStartDeps
> {
  public setup(core: CoreSetup, plugins: MyPluginSetupDeps) {
    // Access setup APIs from required plugins
    const dataSearch = plugins.data.search;

    // Register with other plugins during setup
    plugins.data.search.registerSearchStrategy({
      name: 'myStrategy',
      search: (context, request) => { /* ... */ },
    });

    return {};
  }

  public start(core: CoreStart, plugins: MyPluginStartDeps) {
    // Access start APIs from required plugins
    const searchClient = plugins.data.search.searchClient;

    // Use plugin APIs at runtime
    searchClient.search(request).subscribe((response) => {
      // Handle search results
    });

    return {};
  }
}
```

#### 6.4.2. Optional Plugins

Optional plugins enhance functionality if available but aren't required.

**1. Declare in `opensearch_dashboards.json`:**

```json
{
  "id": "myPlugin",
  "optionalPlugins": ["dataSource"]
}
```

**2. Handle optional dependencies with conditional logic:**

```typescript
export interface MyPluginStartDeps {
  dataSource?: DataSourcePluginStart;
}

export class MyPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  public start(core: CoreStart, plugins: MyPluginStartDeps) {
    if (plugins.dataSource) {
      // Use data source plugin if available
      const isEnabled = plugins.dataSource.dataSourceEnabled;
      // Enhanced functionality with data source
    } else {
      // Fall back to default behavior
    }
  }
}
```

#### 6.4.3. Required Bundles

If your plugin imports code from another plugin without declaring it as a dependency, add it to `requiredBundles`:

```json
{
  "id": "myPlugin",
  "requiredBundles": ["opensearchDashboardsReact", "dataSource"]
}
```

This ensures the code is available in the browser bundle even if the plugin is disabled. This is commonly used for:
- Shared React components (e.g., `opensearchDashboardsReact`)
- Utility functions from other plugins
- Type definitions that need to be available at build time

### 6.5. Expose Extension APIs to Downstream Plugins

Plugins can expose APIs for other plugins to consume through dependencies. This enables building extensible systems.

#### 6.5.1. Simple Service APIs

The most common pattern is to expose services through your plugin's setup and start contracts.

**Public example:**

`public/types.ts`:

```typescript
export interface ThemeService {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  theme$: Observable<Theme>;
}

export interface ChartsPluginSetup {
  theme: ThemeService;
}

export interface ChartsPluginStart {
  theme: ThemeService;
}
```

`public/plugin.ts`:

```typescript
export class ChartsPlugin implements Plugin<ChartsPluginSetup, ChartsPluginStart> {
  private readonly themeService = new ThemeService();

  public setup(core: CoreSetup): ChartsPluginSetup {
    // Initialize service
    this.themeService.init(core.uiSettings);

    // Expose API
    return {
      theme: this.themeService,
    };
  }

  public start(core: CoreStart): ChartsPluginStart {
    // Same API in start phase
    return {
      theme: this.themeService,
    };
  }
}
```

#### 6.5.2. Registry Pattern

Create registries for extensions that other plugins can register with. This pattern works for both server and public plugins.

**Registry Implementation:**

```typescript
export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private authMethodsRegistry = new AuthenticationMethodRegistry();
  private started = false;

  public setup(core: CoreSetup): DataSourcePluginSetup {
    return {
      // Allow registration during setup phase
      registerAuthenticationMethod: (method: AuthenticationMethod) => {
        if (this.started) {
          throw new Error('Cannot register authentication methods after plugin start');
        }
        this.authMethodsRegistry.register(method);
      },
    };
  }

  public start(core: CoreStart): DataSourcePluginStart {
    this.started = true;
    // Provide read-only access during start phase
    return {
      getAuthenticationMethodRegistry: () => this.authMethodsRegistry,
    };
  }
}
```

**Consuming the Registry:**

```typescript
export class MyAuthPlugin implements Plugin {
  public setup(core: CoreSetup, plugins: { dataSource: DataSourcePluginSetup }) {
    // Register during setup phase
    plugins.dataSource.registerAuthenticationMethod({
      name: 'custom-auth',
      credentialProvider: async (options) => {
        // Custom authentication logic
        return credentials;
      },
    });
  }

  public start(core: CoreStart, plugins: { dataSource: DataSourcePluginStart }) {
    // Access registry during start phase
    const registry = plugins.dataSource.getAuthenticationMethodRegistry();
    const method = registry.get('custom-auth');
  }
}
```

## 7. Core Services

OpenSearch Dashboards core provides essential services in both setup and start phases. These services are available through the `core` parameter in your plugin's lifecycle methods.

### 7.1. API Reference Documentation

For complete and up-to-date information on all available core services, refer to the official API documentation:

- **Public (Browser) Core APIs**: [src/core/public/public.api.md](../../src/core/public/public.api.md)
  - `CoreSetup` - Services available during public plugin setup
  - `CoreStart` - Services available during public plugin start
  - Includes: application, chrome, http, notifications, overlays, savedObjects, uiSettings, and more

- **Server Core APIs**: [src/core/server/server.api.md](../../src/core/server/server.api.md)
  - `CoreSetup` - Services available during server plugin setup
  - `CoreStart` - Services available during server plugin start
  - Includes: opensearch, http, savedObjects, uiSettings, logging, metrics, and more

### 7.2. Common Core Service Usage Examples

#### 7.2.1. Make HTTP requests

```typescript
// GET request
const response = await core.http.get('/api/my-plugin/data');

// POST request
await core.http.post('/api/my-plugin/data', {
  body: JSON.stringify({ name: 'example' }),
});
```

#### 7.2.2. Create new Saved Object types

> **See also:** [Saved Objects Documentation](../saved_objects/saved_object_repository_factory_design.md) for advanced saved object patterns, including custom repository implementations.

```typescript
// Register type during setup
core.savedObjects.registerType({
  name: 'my-type',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: { type: 'text' },
      count: { type: 'integer' },
    },
  },
});

// Use in route handler
const savedObject = await context.core.savedObjects.client.create('my-type', {
  title: 'Example',
  count: 1,
});
```

#### 7.2.3. Create new UI Settings

```typescript
// Register during setup
core.uiSettings.register({
  'myPlugin:setting': {
    name: 'My Setting',
    value: 'default',
    description: 'Description of the setting',
    category: ['my-plugin'],
    schema: schema.string(),
  },
});

// Access in route handler
const value = await context.core.uiSettings.client.get('myPlugin:setting');
```

## 8. Integrating Custom Datasources

OpenSearch Dashboards can be extended to query and visualize data from arbitrary external datasources, such as custom microservices, data stores, REST APIs. This integration enables users to use Discover and Dashboards with data that isn't stored in OpenSearch.

This section explains how to integrate custom datasources by implementing:
1. **Server-side Search Strategy** - Handles query execution and result retrieval
2. **Dataset Type Configuration** - Defines how the datasource appears in the UI
3. **Data Structure Management** - Provides navigation of databases, tables, and schemas

### 8.1. Architecture Overview

Integrating a custom datasource requires coordination between server and client components:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Public)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Dataset Type Config                                    │ │
│  │ - UI metadata (icon, tooltip)                          │ │
│  │ - Data structure fetching (data sources, tables)       │ │
│  │ - Field schema fetching                                │ │
│  │ - Query string generation                              │ │
│  │ - Search strategy selection                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server (Backend)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Search Strategy                                        │ │
│  │ - Start query execution                                │ │
│  │ - Poll query status                                    │ │
│  │ - Fetch and transform results                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ HTTP Routes                                            │ │
│  │ - Get tables                                           │ │
│  │ - Get schema                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/gRPC/Custom Protocol
                           ▼
              ┌──────────────────────────┐
              │   External Datasource    │
              │  (microservice, REST     │
              │   API, etc.)             │
              └──────────────────────────┘
```

### 8.2. Server-Side: Implementing a Search Strategy

A search strategy handles the execution of queries against your external datasource. It must implement the `ISearchStrategy` interface from the `data` plugin.

> **See also:**
> - [ISearchStrategy interface](../../src/plugins/data/server/search/types.ts) - Full interface definition
> - [IDataFrameResponse type](../../src/plugins/data/common/data_frames/types.ts) - Response format
> - [Example: PPL Async Search Strategy](../../src/plugins/query_enhancements/server/search/ppl_async_search_strategy.ts) - Real-world implementation

#### 8.2.1. ISearchStrategy Interface

Your search strategy class must implement the following interface:

```typescript
/**
 * Search strategy interface contains a search method that takes in a request and returns a promise
 * that resolves to a response.
 */
interface ISearchStrategy<
  SearchStrategyRequest extends IOpenSearchDashboardsSearchRequest = IOpenSearchSearchRequest,
  SearchStrategyResponse extends
    | IOpenSearchDashboardsSearchResponse
    | IDataFrameResponse = IOpenSearchSearchResponse
> {
  search: (
    context: RequestHandlerContext,
    request: SearchStrategyRequest,
    options?: ISearchOptions
  ) => Promise<SearchStrategyResponse>;
  cancel?: (context: RequestHandlerContext, id: string) => Promise<void>;
}
```

**Key components:**

- **`search` method**: Main entry point that receives search requests and returns responses
- **`request`**: Contains the query, dataset info
- **`options`**: Optional search configuration (e.g., signal for abort)

#### 8.2.2. Implementation Example

Here's a general pattern for implementing an async search strategy:

```typescript
export const mySearchStrategyProvider = (
  logger: Logger,
  client: MyDataSourceClient
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  return {
    search: async (context, request, options) => {
      try {
        const query = request.body.query;
        const pollParams = request.body.pollQueryResultsParams;
        const queryId = pollParams?.queryId;

        // If no queryId, start a new query
        if (!queryId) {
          const response = await client.startQuery({
            query: query.query,
            language: query.language,
            dataSource: query.dataset?.dataSource?.title,
          });

          return {
            type: DATA_FRAME_TYPES.POLLING,
            status: 'started',
            body: {
              queryStatusConfig: {
                queryId: response.queryId,
                sessionId: response.sessionId,
              },
            },
          };
        }

        // Poll for query status
        const statusResponse = await client.getQueryStatus(queryId);
        const status = statusResponse.status?.toUpperCase();

        if (status === 'SUCCESS') {
          // Transform results to DataFrame
          const fields = statusResponse.schema.map(field => ({
            name: field.name,
            type: field.type,
            values: statusResponse.rows.map(row => row[field.name]),
          }));

          return {
            type: DATA_FRAME_TYPES.POLLING,
            status: 'success',
            body: {
              fields,
              size: statusResponse.rows.length,
            },
          };
        }

        if (status === 'FAILED') {
          return {
            type: DATA_FRAME_TYPES.POLLING,
            status: 'failed',
            body: {
              error: statusResponse.error,
            },
          };
        }

        // Still running
        return {
          type: DATA_FRAME_TYPES.POLLING,
          status: status.toLowerCase(),
        };
      } catch (error) {
        logger.error(`Search strategy error: ${error.message}`);
        throw error;
      }
    },
  };
};
```

#### 8.2.3. Registering the Search Strategy

Register your search strategy during plugin setup:

```typescript
// In server/plugin.ts setup() method
plugins.data.search.registerSearchStrategy(
  'myCustomStrategy',
  searchStrategy
);

plugins.queryEnhancements.defineSearchStrategyRoute(
  'myCustomStrategy',
  searchStrategy
);
```

### 8.3. Client-Side: Dataset Type Configuration

The dataset type configuration defines how your datasource appears and behaves in the OpenSearch Dashboards UI (Discover, Dashboards, etc.).

> **See also:**
> - [DatasetTypeConfig interface](../../src/plugins/data/public/query/query_string/dataset_service/types.ts) - Full interface definition
> - [DataStructure and Dataset interfaces](../../src/plugins/data/common/datasets/types.ts) - Data structure types
> - [Example: S3 Dataset Type Config](../../src/plugins/query_enhancements/public/datasets/s3_type.ts) - Real-world implementation

#### 8.3.1. DatasetTypeConfig Interface

Your dataset type must implement the `DatasetTypeConfig` interface with the following properties:

**Core Properties:**

- **`id`** (string): Unique identifier for the datasource type
- **`title`** (string): Display name shown in the UI
- **`meta`** (object): UI metadata
  - `icon`: Icon configuration (type, color)
  - `tooltip`: Description shown on hover
  - `isFieldLoadAsync`: Set to `true` if field loading is slow/async
  - `searchOnLoad`: Set to `false` to prevent automatic query execution

**Required Methods:**

- **`toDataset(path: DataStructure[]): Dataset`**
  - Converts a data structure path (connection → database → table) into a Dataset object
  - Returns dataset with `id`, `title`, `type`, and `dataSource` information

- **`fetch(services, path, options): Promise<DataStructure>`**
  - Fetches child data structures for the current path
  - Handles hierarchical navigation: connections → databases → tables
  - Returns structure with `columnHeader`, `hasNext`, and `children` array
  - Switch on `path[path.length - 1].type` to handle different levels

- **`fetchFields(dataset: Dataset): Promise<DatasetField[]>`**
  - Retrieves field schema for a specific dataset/table
  - Returns array of fields with `name` and `type` (e.g., 'string', 'number', 'date')

- **`supportedLanguages(dataset: Dataset): string[]`**
  - Returns list of query languages supported (e.g., `['SQL', 'PPL']`)

- **`getSearchOptions(): object`**
  - Returns search configuration including `strategy` name
  - Links this dataset type to your registered search strategy

**Optional Methods:**

- **`getInitialQueryString(query: Query): string | undefined`**
  - Generates starter query when user selects a dataset
  - Can customize based on query language and dataset

- **`languageOverrides`**: Per-language UI behavior overrides (e.g., hide date picker)
- **`combineDataStructures`**: Merge multiple data structures (for multi-select)

#### 8.3.2. Implementation Example

Here's a simplified dataset type configuration example:

```typescript
export const myDatasourceTypeConfig: DatasetTypeConfig = {
  id: 'myDatasource',
  title: 'My Custom Datasource',
  meta: {
    icon: { type: MY_DATASOURCE_ICON },
    tooltip: 'My Custom Datasource',
  },

  toDataset: (path: DataStructure[]): Dataset => {
    const table = path[path.length - 1];
    const connection = path.find(ds => ds.type === 'DATA_CONNECTION');

    return {
      id: table.id,
      title: table.title,
      type: 'myDatasource',
      dataSource: {
        id: connection.id,
        title: connection.title,
        type: connection.type,
      },
    };
  },

  fetch: async (services, path, options) => {
    const current = path[path.length - 1];

    switch (current.type) {
      case 'DATA_CONNECTION':
        // Fetch tables for this connection
        const tables = await services.http.get('/api/my-datasource/tables', {
          query: { connectionId: current.id },
        });
        return {
          ...current,
          columnHeader: 'Tables',
          hasNext: false,
          children: tables.map(table => ({
            id: `${current.id}.${table.name}`,
            title: table.name,
            type: 'TABLE',
          })),
        };

      default:
        // Fetch connections from saved objects
        const connections = await services.savedObjects.client.find({
          type: 'data-connection',
          perPage: 10000,
        });
        return {
          ...current,
          columnHeader: 'Connections',
          hasNext: true,
          children: connections.savedObjects
            .filter(obj => obj.attributes.type === 'My Datasource')
            .map(obj => ({
              id: obj.id,
              title: obj.attributes.connectionId,
              type: 'DATA_CONNECTION',
            })),
        };
    }
  },

  fetchFields: async (dataset: Dataset): Promise<DatasetField[]> => {
    const response = await services.http.get('/api/my-datasource/schema', {
      query: {
        connectionId: dataset.dataSource?.id,
        tableId: dataset.id,
      },
    });
    return response.fields.map(field => ({
      name: field.name,
      type: field.type,
    }));
  },

  supportedLanguages: () => ['PPL'],

  getSearchOptions: () => ({ strategy: 'myCustomStrategy' })
};
```

#### 8.3.3. Data Structure Hierarchy

The `fetch` method implements a two-level hierarchy in this simplified example:

1. **Root level**: Fetch data connections from saved objects
2. **DATA_CONNECTION level**: Fetch next level for the selected connection (e.g. databases)
3. Any other sub-level required (e.g. tables)

Each level returns a `DataStructure` with:
- **`columnHeader`**: Label for the column in the UI
- **`hasNext`**: Whether there are more levels to navigate
- **`children`**: Array of child structures with `id`, `title`, `type`

#### 8.3.4. Registering the Dataset Type

Register your dataset type during plugin setup:

```typescript
// In public/plugin.ts setup() method
const typeConfig = getMyDatasourceTypeConfig(core.http);
data.query.queryString.getDatasetService().registerType(typeConfig);
```

You should be able to see your datasource in Discover.

## 9. Best Practices

### 9.1. Type Safety

Always define clear TypeScript interfaces for your plugin contracts:

```typescript
// ✅ Good
export interface MyPluginSetup {
  doSomething: (param: string) => Promise<Result>;
}

// ❌ Bad
export interface MyPluginSetup {
  doSomething: (param: any) => any;
}
```

### 9.2. Separation of Concerns

Keep your plugin modular:

```
my-plugin/
├── server/
│   ├── plugin.ts          # Plugin orchestration only
│   ├── services/          # Business logic
│   ├── routes/            # Route handlers
│   └── types.ts           # Type definitions
```

### 9.3. Error Handling

Always handle errors gracefully:

```typescript
router.get({ path: '/api/data', validate: false }, async (context, req, res) => {
  try {
    const data = await fetchData();
    return res.ok({ body: data });
  } catch (error) {
    this.logger.error(`Failed to fetch data: ${error.message}`);
    return res.customError({
      statusCode: 500,
      body: { message: 'Failed to fetch data' },
    });
  }
});
```

### 9.4. Logging

Use structured logging with appropriate levels:

```typescript
this.logger.debug('Detailed debug information');
this.logger.info('Important state changes');
this.logger.warn('Potential issues');
this.logger.error('Errors that need attention');
```

### 9.5. Testing

Structure your code for testability:

> **See also:** [Plugin Testing Guide](../../TESTING.md) for comprehensive testing strategies and examples.

```typescript
// Inject dependencies
export class MyService {
  constructor(
    private readonly logger: Logger,
    private readonly config: MyConfig
  ) {}
}

// Easy to mock in tests
import { loggingSystemMock } from 'src/core/server/mocks';

const mockLogger = loggingSystemMock.createLogger();
const service = new MyService(mockLogger, mockConfig);
```

### 9.6. Backward Compatibility

When evolving APIs, maintain backward compatibility:

```typescript
export interface MyPluginSetup {
  // New preferred method
  getData: (options: GetDataOptions) => Promise<Data>;

  // Deprecated but still supported
  /** @deprecated Use getData instead */
  fetchData: (id: string) => Promise<Data>;
}
```

### 9.7. Documentation

Document your public APIs:

````typescript
/**
 * Fetches data from the data source
 *
 * @param id - The unique identifier for the data
 * @returns Promise resolving to the data object
 * @throws {DataNotFoundError} When data doesn't exist
 *
 * @example
 * ```typescript
 * const data = await myPlugin.getData('123');
 * ```
 */
getData(id: string): Promise<Data>;
````

### 9.8. Resource Cleanup

Always clean up in the `stop` method:

```typescript
public stop() {
  this.subscription?.unsubscribe();
  this.client?.close();
  this.timers.forEach(timer => clearTimeout(timer));
}
```

## 10. Additional Resources

- [OpenSearch Dashboards Plugin Examples](../../examples) - Working example plugins demonstrating various plugin patterns
- [Core API Documentation](../openapi) - Complete OpenAPI specifications for core services
- [Multi-Datasource Plugin Development](../multi-datasource/high_level_design.md) - Building plugins that work with multiple OpenSearch clusters
- [Saved Objects Documentation](../saved_objects/saved_object_repository_factory_design.md) - Advanced patterns for custom saved object repositories
- [Data Persistence Guide](./data_persistence.md) - How to persist application state and user data across sessions
- [Plugin Generator](../../packages/osd-plugin-generator/README.md) - Tool for scaffolding new plugins
- [Developer Guide](../../DEVELOPER_GUIDE.md) - Setting up your development environment