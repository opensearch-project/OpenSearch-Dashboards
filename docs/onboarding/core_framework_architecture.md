# OpenSearch Dashboards Core Framework Architecture

## Overview

OpenSearch Dashboards' core framework provides a robust, modular platform that enables developers to build scalable, extensible analytics applications. The framework follows a **plugin-based architecture** where almost all functionality, including core features, is implemented as plugins that interact through well-defined contracts and lifecycle methods.

## Directory Structure

The core framework is organized into three main sections:

```
src/core/
├── common/     # Shared types and utilities
├── public/     # Browser-side core system
└── server/     # Server-side core system
```

### Server-Side Core (`src/core/server`)

Key directories:
- **`http/`** - HTTP service for routing and request handling
- **`opensearch/`** - Client for communicating with OpenSearch
- **`saved_objects/`** - Persistence layer for application state
- **`plugins/`** - Plugin discovery, loading, and lifecycle management
- **`config/`** - Configuration management and validation
- **`logging/`** - Structured logging system
- **`capabilities/`** - Feature access control
- **`context/`** - Dependency injection framework
- **`ui_settings/`** - User preference management
- **`workspace/`** - Multi-tenancy support

### Client-Side Core (`src/core/public`)

Key directories:
- **`application/`** - Single-page application framework
- **`chrome/`** - UI shell (navigation, header, etc.)
- **`overlays/`** - Modal, flyout, and banner services
- **`notifications/`** - Toast and notification system
- **`http/`** - HTTP client for API communication
- **`saved_objects/`** - Client for saved objects API
- **`plugins/`** - Client-side plugin system
- **`injected_metadata/`** - Server-to-client data transfer

## Application Bootstrapping

### 1. Server Initialization

The bootstrap process begins in `/Users/ashwinpc/Documents/Dev/Code/OpenSearch-Dashboards-Sandbox1/src/core/server/root/index.ts`:

```typescript
export class Root {
  private readonly server: Server;

  public async setup() {
    await this.server.setupCoreConfig();
    await this.setupLogging();
    return await this.server.setup();
  }

  public async start() {
    return await this.server.start();
  }
}
```

### 2. Server Setup Phase

The `Server` class (`/Users/ashwinpc/Documents/Dev/Code/OpenSearch-Dashboards-Sandbox1/src/core/server/server.ts`) orchestrates service initialization:

```typescript
public async setup() {
  // 1. Environment setup
  const environmentSetup = await this.environment.setup();

  // 2. Plugin discovery
  const { pluginTree, uiPlugins } = await this.plugins.discover();

  // 3. Configuration validation
  await this.configService.validate();

  // 4. Core services setup
  const contextServiceSetup = this.context.setup();
  const httpSetup = await this.http.setup();
  const opensearchServiceSetup = await this.opensearch.setup();
  const savedObjectsSetup = await this.savedObjects.setup();

  // 5. Plugin setup phase
  await this.plugins.setup(coreSetup);
}
```

### 3. Client Initialization

The client-side `CoreSystem` (`/Users/ashwinpc/Documents/Dev/Code/OpenSearch-Dashboards-Sandbox1/src/core/public/core_system.ts`) mirrors the server architecture:

```typescript
export class CoreSystem {
  public async setup() {
    // Setup core services
    const injectedMetadata = this.injectedMetadata.setup();
    const http = this.http.setup({ injectedMetadata });
    const uiSettings = this.uiSettings.setup({ http });
    const application = this.application.setup({ http });

    // Setup plugins
    await this.plugins.setup(core);
  }

  public async start() {
    // Start all services and mount the application
    const application = await this.application.start();
    await this.plugins.start(core);
  }
}
```

## Core Services

### 1. HTTP Service

Provides request routing and middleware capabilities:

```typescript
// Server-side route registration
router.post({
  path: '/api/my_plugin/data',
  validate: {
    body: schema.object({
      query: schema.string()
    })
  }
}, async (context, request, response) => {
  const data = await context.core.opensearch.client.asCurrentUser.search({
    body: request.body
  });
  return response.ok({ body: data });
});
```

### 2. OpenSearch Service

Manages connections to OpenSearch clusters:

```typescript
// Access OpenSearch client
const client = context.core.opensearch.client;

// Current user's client (with security context)
const userClient = client.asCurrentUser;

// Internal client (with system privileges)
const internalClient = client.asInternalUser;
```

### 3. Saved Objects Service

Provides structured data persistence:

```typescript
// Register a saved object type
savedObjects.registerType({
  name: 'dashboard',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: { type: 'text' },
      panels: { type: 'object', enabled: false }
    }
  }
});

// Use saved objects client
const dashboard = await savedObjectsClient.create('dashboard', {
  title: 'My Dashboard',
  panels: []
});
```

### 4. UI Settings Service

Manages user preferences:

```typescript
// Register a UI setting
uiSettings.register({
  'theme:darkMode': {
    name: 'Dark mode',
    value: false,
    schema: schema.boolean(),
    category: ['appearance']
  }
});

// Read UI settings
const isDarkMode = await uiSettingsClient.get('theme:darkMode');
```

## Plugin System Architecture

### Plugin Lifecycle

Plugins follow a three-phase lifecycle:

1. **Setup Phase**: Initialize plugin, register capabilities
2. **Start Phase**: Start services, return public contracts
3. **Stop Phase**: Cleanup resources

```typescript
export class MyPlugin implements Plugin {
  public setup(core: CoreSetup, deps: PluginDeps): MyPluginSetup {
    // Register routes, saved object types, UI settings
    core.http.createRouter();
    core.savedObjects.registerType(myType);

    return {
      // Expose setup contract to other plugins
      registerDataSource: this.registerDataSource
    };
  }

  public start(core: CoreStart): MyPluginStart {
    // Return runtime contract
    return {
      search: this.search
    };
  }

  public stop() {
    // Cleanup
  }
}
```

### Plugin Discovery

The framework automatically discovers plugins through manifest files:

```json
// opensearch_dashboards.json
{
  "id": "myPlugin",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "2.18.0",
  "server": true,
  "ui": true,
  "requiredPlugins": ["data", "navigation"],
  "optionalPlugins": ["security"]
}
```

### Plugin Dependencies

The `PluginsService` manages dependency resolution:

```typescript
class PluginsService {
  private async handleDiscoveredPlugins(plugin$: Observable<DiscoveredPlugin>) {
    // Build dependency graph
    const pluginTree = this.pluginsSystem.getPluginDependencies();

    // Validate dependencies
    this.validatePluginDependencies(pluginTree);

    // Sort plugins by dependency order
    const sortedPlugins = this.sortPluginsByDependency(pluginTree);
  }
}
```

## Dependency Injection & Context

### Context Service

The context service provides scoped dependency injection:

```typescript
// Register a context provider
core.context.registerContext('myPlugin', 'services', () => ({
  search: new SearchService(),
  analytics: new AnalyticsService()
}));

// Create a handler with injected context
const handler = core.context.createHandler((context) => {
  const { search } = context.myPlugin.services;
  return search.execute();
});
```

### Request Context

Each request has an isolated context with scoped services:

```typescript
router.get({
  path: '/api/data'
}, async (context, request, response) => {
  // Context provides scoped services
  const { opensearch, savedObjects, uiSettings } = context.core;

  // Plugin-specific context
  const { myService } = context.myPlugin;

  return response.ok({ body: await myService.getData() });
});
```

## Configuration Management

### Schema Validation

Configuration uses `@osd/config-schema` for validation:

```typescript
import { schema, TypeOf } from '@osd/config-schema';

const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  host: schema.string({ defaultValue: 'localhost' }),
  port: schema.number({ min: 1024, max: 65535 }),
  ssl: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    certificate: schema.conditional(
      schema.siblingRef('enabled'),
      true,
      schema.string(),
      schema.never()
    )
  })
});

type ConfigType = TypeOf<typeof configSchema>;
```

### Dynamic Configuration

The framework supports runtime configuration updates:

```typescript
class DynamicConfigService {
  public async setup() {
    // Register async configuration provider
    this.registerConfigProvider(async () => {
      const remoteConfig = await fetchRemoteConfig();
      return remoteConfig;
    });
  }
}
```

## Platform Abstractions

### Service Contracts

Each service exposes setup and start contracts:

```typescript
interface ServiceSetupContract {
  // Methods available during setup phase
  register(item: Item): void;
}

interface ServiceStartContract {
  // Methods available at runtime
  get(id: string): Item;
  getAll(): Item[];
}
```

### Core-Plugin Boundary

The framework maintains clear boundaries between core and plugins:

- **Core provides**: Infrastructure, common services, plugin management
- **Plugins provide**: Business logic, features, UI components
- **Communication**: Through contracts and lifecycle methods

## Best Practices

### 1. Service Initialization

- Initialize services in dependency order
- Handle async operations properly
- Provide meaningful error messages

### 2. Plugin Development

- Keep plugins focused on single responsibilities
- Declare all dependencies explicitly
- Follow the lifecycle pattern consistently

### 3. Configuration

- Use schema validation for all config
- Provide sensible defaults
- Document configuration options

### 4. Error Handling

- Use the fatal errors service for critical issues
- Log errors with appropriate context
- Provide user-friendly error messages

### 5. Performance

- Lazy-load plugin code when possible
- Use async imports for large dependencies
- Minimize startup time impact

## Advanced Features

### Multi-tenancy (Workspaces)

```typescript
const workspace = await workspaceClient.create({
  name: 'Analytics Team',
  features: ['dashboards', 'visualize']
});
```

### Cross-Compatibility Service

Ensures compatibility across OpenSearch versions:

```typescript
const compatibility = await crossCompatibility.checkCompatibility({
  opensearchVersion: '2.11.0',
  pluginVersion: '2.11.0'
});
```

### Audit Trail

Track system operations for compliance:

```typescript
auditTrail.add({
  message: 'Dashboard created',
  type: 'creation',
  user: request.user
});
```

## Extension Points

The framework provides multiple extension points:

1. **HTTP Routes**: Add custom API endpoints
2. **Saved Object Types**: Define custom data types
3. **UI Settings**: Add user preferences
4. **Context Providers**: Inject custom services
5. **Capabilities**: Control feature access
6. **Chrome Navigation**: Add navigation items
7. **Application Mounting**: Register SPA routes

## Summary

The OpenSearch Dashboards core framework provides a powerful, extensible platform for building analytics applications. Its plugin-based architecture, combined with robust service abstractions and dependency injection, enables developers to create modular, maintainable features while leveraging a rich set of platform capabilities.

Key takeaways:
- **Plugin-first architecture** enables modularity and extensibility
- **Lifecycle management** ensures proper initialization and cleanup
- **Service contracts** provide stable APIs between components
- **Context system** enables dependency injection and isolation
- **Configuration framework** ensures type-safe, validated settings
- **Platform services** provide common functionality out-of-the-box

For detailed API documentation, refer to the TypeScript definitions in the source code and the generated API docs.