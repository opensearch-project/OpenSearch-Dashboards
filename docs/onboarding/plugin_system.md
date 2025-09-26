# OpenSearch Dashboards Plugin System

## Overview

The OpenSearch Dashboards plugin system provides a powerful, extensible architecture that enables developers to create modular features that seamlessly integrate with the core platform. Plugins are the primary mechanism for extending OpenSearch Dashboards functionality, allowing both internal features and third-party extensions to leverage the same robust framework.

### Key Concepts

- **Modular Architecture**: All features in OpenSearch Dashboards, including core functionality, are implemented as plugins
- **Lifecycle Management**: Plugins follow a predictable setup → start → stop lifecycle
- **Dependency Resolution**: Automatic topological sorting ensures plugins load in the correct order based on dependencies
- **Isomorphic Design**: Plugins can have both server-side and client-side components that work together
- **Configuration Management**: Plugins can expose configuration schemas with validation and browser exposure controls

## Plugin Architecture

### Plugin Structure

A typical plugin follows this directory structure:

```
my_plugin/
├── opensearch_dashboards.json  # Plugin manifest (required)
├── package.json                # NPM package definition
├── server/                     # Server-side code
│   ├── index.ts               # Server plugin export
│   ├── plugin.ts              # Server plugin class
│   └── types.ts               # Server-side types
├── public/                     # Client-side code
│   ├── index.ts               # Public plugin export
│   ├── plugin.ts              # Client plugin class
│   └── types.ts               # Client-side types
├── common/                     # Shared code between server and client
│   ├── constants.ts
│   └── types.ts
└── config.ts                   # Configuration schema
```

### Plugin Manifest

Every plugin requires an `opensearch_dashboards.json` manifest file that defines its metadata and dependencies:

```json
{
  "id": "myPlugin",
  "version": "opensearchDashboards",
  "server": true,
  "ui": true,
  "requiredPlugins": ["data", "navigation"],
  "optionalPlugins": ["advancedSettings"],
  "requiredBundles": ["opensearchDashboardsReact"],
  "configPath": "my_plugin",
  "requiredEnginePlugins": {
    "myBackendPlugin": ">=1.0.0"
  }
}
```

**Manifest Fields:**
- `id`: Unique plugin identifier in camelCase
- `version`: Plugin version (use "opensearchDashboards" to match platform version)
- `server`: Whether the plugin has server-side code
- `ui`: Whether the plugin has client-side code
- `requiredPlugins`: Plugins that must be installed and enabled
- `optionalPlugins`: Plugins that may enhance functionality if present
- `requiredBundles`: UI bundles needed for cross-plugin imports
- `configPath`: Configuration namespace (defaults to snake_case of id)
- `requiredEnginePlugins`: Required OpenSearch backend plugins with version constraints
- `supportedOSDataSourceVersions`: Supported OpenSearch versions for data sources
- `requiredOSDataSourcePlugins`: Required backend plugins for data source connections

## Plugin Lifecycle

### 1. Discovery Phase

The plugin discovery system automatically finds and validates plugins:

```typescript
// Core discovery process (simplified)
function discover(config: PluginsConfig, coreContext: CoreContext) {
  // Scan plugin directories
  const pluginPaths = [
    ...config.additionalPluginPaths,
    ...config.pluginSearchPaths
  ];

  // Parse manifest files
  const plugins = pluginPaths.map(path => {
    const manifest = parseManifest(path + '/opensearch_dashboards.json');
    return new PluginWrapper({ path, manifest, ... });
  });

  // Validate and sort by dependencies
  return topologicalSort(plugins);
}
```

### 2. Setup Phase

During setup, plugins initialize their core functionality and return contracts for other plugins:

```typescript
export class MyPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  private readonly logger: Logger;

  constructor(private initContext: PluginInitializerContext) {
    this.logger = initContext.logger.get();
  }

  public setup(core: CoreSetup, plugins: MyPluginSetupDeps): MyPluginSetup {
    this.logger.debug('Setting up MyPlugin');

    // Register HTTP routes
    core.http.createRouter().post({
      path: '/api/my_plugin/action',
      validate: { body: schema.object({...}) },
      handler: async (context, request, response) => {
        // Handle request
      }
    });

    // Register saved object types
    core.savedObjects.registerType({
      name: 'my-object',
      hidden: false,
      mappings: { properties: {...} }
    });

    // Return setup contract for other plugins
    return {
      doSomething: () => { ... }
    };
  }
}
```

### 3. Start Phase

The start phase activates runtime functionality:

```typescript
public start(core: CoreStart, plugins: MyPluginStartDeps): MyPluginStart {
  this.logger.debug('Starting MyPlugin');

  // Access started services
  const { savedObjects, opensearch } = core;

  // Initialize runtime features
  this.startBackgroundTasks();

  // Return start contract
  return {
    getActiveData: async () => { ... }
  };
}
```

### 4. Stop Phase

Clean up resources when the plugin stops:

```typescript
public stop() {
  this.logger.debug('Stopping MyPlugin');
  this.stopBackgroundTasks();
  this.cleanup();
}
```

## Plugin APIs and Extension Points

### Core Services Available to Plugins

#### Server-side Core Services (CoreSetup/CoreStart)

- **HTTP Service**: Register routes and middleware
- **SavedObjects**: Register types and access client
- **OpenSearch Client**: Access configured OpenSearch clusters
- **UiSettings**: Register and access UI settings
- **Capabilities**: Register application capabilities
- **Context Service**: Register context providers
- **Logging**: Plugin-scoped logging

#### Client-side Core Services

- **Application**: Register and navigate between apps
- **HTTP Client**: Make API requests
- **Notifications**: Display toasts and banners
- **Overlays**: Show modals and flyouts
- **Chrome**: Customize browser chrome (header, navigation)
- **DocLinks**: Access documentation links
- **SavedObjects Client**: CRUD operations on saved objects

### Common Extension Patterns

#### 1. Registering an Application

```typescript
// public/plugin.ts
public setup(core: CoreSetup): MyPluginSetup {
  core.application.register({
    id: 'myApp',
    title: 'My Application',
    async mount(params: AppMountParameters) {
      const { renderApp } = await import('./application');
      return renderApp(params);
    }
  });
}
```

#### 2. Adding Management Sections

```typescript
// public/plugin.ts
public setup(core: CoreSetup, { management }: MyPluginSetupDeps) {
  management.sections.section.opensearchDashboards.registerApp({
    id: 'my_management',
    title: 'My Management',
    order: 100,
    mount: async (params) => {
      const { mountManagementSection } = await import('./management');
      return mountManagementSection(params);
    }
  });
}
```

#### 3. Extending Visualizations

```typescript
// public/plugin.ts
public setup(core: CoreSetup, { visualizations }: MyPluginSetupDeps) {
  visualizations.createBaseVisualization({
    name: 'my_vis',
    title: 'My Visualization',
    icon: 'myIcon',
    description: 'Custom visualization type',
    visConfig: {
      defaults: { ... },
      component: MyVisComponent
    }
  });
}
```

#### 4. Contributing Search Strategies

```typescript
// server/plugin.ts
public setup(core: CoreSetup, { data }: MyPluginSetupDeps) {
  data.search.registerSearchStrategy(
    'myStrategy',
    mySearchStrategyProvider(core.opensearch)
  );
}
```

## Plugin Configuration

### Defining Configuration Schema

```typescript
// config.ts
import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  apiUrl: schema.string({ defaultValue: 'http://localhost:9200' }),
  advanced: schema.object({
    timeout: schema.duration({ defaultValue: '30s' }),
    retries: schema.number({ min: 0, max: 10, defaultValue: 3 })
  })
});

export type MyPluginConfig = TypeOf<typeof configSchema>;
```

### Exposing Configuration

```typescript
// server/index.ts
import { PluginConfigDescriptor } from 'opensearch-dashboards/server';
import { configSchema } from '../config';

export const config: PluginConfigDescriptor = {
  schema: configSchema,
  exposeToBrowser: {
    apiUrl: true,
    // advanced.timeout is NOT exposed
  },
  deprecations: ({ rename, unused }) => [
    rename('oldKey', 'newKey'),
    unused('deprecatedKey')
  ]
};

export const plugin = (context) => new MyPlugin(context);
```

### Accessing Configuration

```typescript
// server/plugin.ts
constructor(private initContext: PluginInitializerContext) {
  // Create observables for configuration
  this.config$ = initContext.config.create<MyPluginConfig>();
}

public async setup(core: CoreSetup) {
  // Get current config value
  const config = await this.config$.pipe(first()).toPromise();

  // Subscribe to config changes
  this.configSubscription = this.config$.subscribe(config => {
    this.updateSettings(config);
  });
}
```

## Dependency Management

### Required vs Optional Dependencies

```typescript
// Types for dependency contracts
interface MyPluginSetupDeps {
  // Required dependencies (must be present)
  data: DataPluginSetup;
  navigation: NavigationSetup;

  // Optional dependencies (may be undefined)
  advancedSettings?: AdvancedSettingsSetup;
}

// Handling optional dependencies
public setup(core: CoreSetup, plugins: MyPluginSetupDeps) {
  // Required dependency - safe to use directly
  plugins.data.search.registerSearchStrategy(...);

  // Optional dependency - check before use
  if (plugins.advancedSettings) {
    plugins.advancedSettings.addGlobalSetting(...);
  }
}
```

### Circular Dependencies

Avoid circular dependencies by:
1. Using dependency injection patterns
2. Leveraging the start phase for runtime dependencies
3. Using core services as intermediaries

## Best Practices

### 1. Plugin Initialization

- Keep the constructor lightweight - only store context
- Defer heavy initialization to setup/start phases
- Use async/await for asynchronous operations
- Handle errors gracefully with proper logging

### 2. Contract Design

```typescript
// Good: Explicit, typed contracts
export interface MyPluginSetup {
  registerDataProvider: (provider: DataProvider) => void;
  getConfiguration: () => MyPluginConfig;
}

export interface MyPluginStart {
  getActiveProviders: () => DataProvider[];
  executeQuery: (query: Query) => Promise<Results>;
}
```

### 3. Resource Management

- Clean up subscriptions in stop()
- Cancel ongoing async operations
- Remove registered items if possible
- Clear caches and temporary data

### 4. Testing Plugins

```typescript
// Mock plugin context
const mockContext = {
  logger: {
    get: () => ({ debug: jest.fn(), error: jest.fn() })
  },
  config: {
    create: () => of(defaultConfig)
  }
};

// Test plugin lifecycle
describe('MyPlugin', () => {
  it('should setup correctly', async () => {
    const plugin = new MyPlugin(mockContext);
    const setup = await plugin.setup(coreMock, depsMock);
    expect(setup.doSomething).toBeDefined();
  });
});
```

### 5. Performance Considerations

- Lazy load large components
- Use dynamic imports for code splitting
- Minimize setup/start phase work
- Cache expensive computations

## Example: Creating a Simple Plugin

Here's a complete example of a minimal plugin that adds a custom application:

### 1. Plugin Manifest

```json
// my_plugin/opensearch_dashboards.json
{
  "id": "myPlugin",
  "version": "opensearchDashboards",
  "server": false,
  "ui": true,
  "requiredPlugins": ["navigation"],
  "optionalPlugins": []
}
```

### 2. Public Plugin

```typescript
// my_plugin/public/plugin.ts
import { Plugin, CoreSetup, AppMountParameters } from 'opensearch-dashboards/public';

export class MyPlugin implements Plugin {
  public setup(core: CoreSetup) {
    core.application.register({
      id: 'myPlugin',
      title: 'My Plugin',
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        return renderApp(params);
      }
    });

    return {};
  }

  public start() {
    return {};
  }

  public stop() {}
}
```

### 3. Application Component

```typescript
// my_plugin/public/application.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';

export const renderApp = ({ element }: AppMountParameters) => {
  ReactDOM.render(<MyApp />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};

const MyApp = () => (
  <div>
    <h1>Welcome to My Plugin!</h1>
  </div>
);
```

### 4. Plugin Export

```typescript
// my_plugin/public/index.ts
import { MyPlugin } from './plugin';

export const plugin = () => new MyPlugin();
```

## Advanced Topics

### Cross-Plugin Communication

Plugins communicate through contracts returned from lifecycle methods:

```typescript
// Plugin A exposes a service
public setup(): PluginASetup {
  return {
    registerHandler: (handler: Handler) => {
      this.handlers.push(handler);
    }
  };
}

// Plugin B uses the service
public setup(core: CoreSetup, { pluginA }: Deps) {
  pluginA.registerHandler(myHandler);
}
```

### Plugin Context System

Share context between different parts of your plugin:

```typescript
// Register context provider
core.context.createContextContainer();

// Add context providers
core.http.registerRouteHandlerContext(
  'myPlugin',
  async (context, request) => {
    return {
      client: await this.getClient(request)
    };
  }
);

// Use in route handlers
router.get({
  path: '/api/my_plugin/data',
  handler: async (context, request, response) => {
    const data = await context.myPlugin.client.getData();
    return response.ok({ body: data });
  }
});
```

### Dynamic Plugin Loading

While plugins are typically loaded at startup, you can lazy-load plugin components:

```typescript
// Lazy load heavy components
const loadVisualization = () => import('./visualizations/heavy_vis');

// Load on demand
public async renderVisualization() {
  const { HeavyVis } = await loadVisualization();
  return <HeavyVis />;
}
```

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Check manifest syntax and required dependencies
2. **Dependency errors**: Ensure all required plugins are installed and enabled
3. **Configuration issues**: Validate schema matches expected format
4. **Lifecycle errors**: Check for proper async/await usage and error handling

### Debugging Tips

- Enable debug logging: `logging.verbose: true`
- Check browser console for client-side errors
- Verify plugin appears in `/api/status` response
- Use `--plugin-path` flag for development plugins

## Conclusion

The OpenSearch Dashboards plugin system provides a robust foundation for extending the platform. By following the lifecycle patterns, leveraging core services, and adhering to best practices, developers can create powerful, maintainable plugins that seamlessly integrate with the ecosystem. Whether building internal features or third-party extensions, the plugin architecture ensures consistency, reliability, and extensibility across the entire platform.