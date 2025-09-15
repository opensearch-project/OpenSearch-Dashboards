# Glossary and Key Concepts

Comprehensive glossary of OpenSearch Dashboards terminology, technical concepts, architecture patterns, and common abbreviations.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Architecture Terms](#architecture-terms)
- [Plugin System Terms](#plugin-system-terms)
- [Data and Query Terms](#data-and-query-terms)
- [UI and Visualization Terms](#ui-and-visualization-terms)
- [Security Terms](#security-terms)
- [Development Terms](#development-terms)
- [Common Abbreviations](#common-abbreviations)
- [OpenSearch Specific Terms](#opensearch-specific-terms)

## Core Concepts

### Application
**Definition**: A top-level feature or functionality module in OpenSearch Dashboards that provides a complete user experience.
- **Example**: Discover, Dashboard, Visualize
- **Related**: Plugin, Mount Point, Navigation

### Core Services
**Definition**: Fundamental services provided by the OpenSearch Dashboards platform that are available to all plugins.
- **Includes**: HTTP, SavedObjects, UiSettings, Notifications, Chrome
- **Usage**: Accessed through `core.services` in plugins
- **Lifecycle**: Available in setup() and start() phases

### Plugin
**Definition**: A modular extension that adds functionality to OpenSearch Dashboards.
- **Types**: Built-in plugins, Custom plugins, Community plugins
- **Structure**: Contains public (client) and/or server code
- **Manifest**: Defined in `opensearch_dashboards.json`

### Lifecycle
**Definition**: The phases a plugin goes through from initialization to shutdown.
- **Phases**: `setup()` → `start()` → `stop()`
- **Setup Phase**: Configure and register functionality
- **Start Phase**: Begin operations and return public contracts
- **Stop Phase**: Cleanup resources

### Contract
**Definition**: The public API that a plugin exposes to other plugins.
- **Setup Contract**: API available during setup phase
- **Start Contract**: API available during start phase
- **Example**: `data.search`, `expressions.registerFunction`

## Architecture Terms

### Platform
**Definition**: The core framework that provides infrastructure for building OpenSearch Dashboards applications.
- **Components**: Core system, Plugin system, Service architecture
- **Responsibilities**: Dependency injection, Lifecycle management, Service orchestration

### Service
**Definition**: A singleton module providing specific functionality across the application.
- **Examples**: HTTP Service, SavedObjects Service, Data Service
- **Pattern**: Constructor → setup() → start() → stop()
- **Access**: Via dependency injection

### Mount Point
**Definition**: The mechanism for rendering plugin UI within the application shell.
```typescript
mount: async (params: AppMountParameters) => {
  // Render application
  return () => { /* cleanup */ };
}
```

### Context
**Definition**: Shared state and services passed to plugins and request handlers.
- **Request Context**: Server-side context for route handlers
- **Application Context**: Client-side context for mounted applications
- **Provider Pattern**: Allows plugins to extend context

### Registry
**Definition**: A pattern for collecting and managing extensible features from multiple plugins.
- **Examples**: Visualization types, Embeddables, Search strategies
- **Operations**: register(), get(), getAll()

## Plugin System Terms

### Required Plugins
**Definition**: Dependencies that must be present for a plugin to function.
- **Declaration**: In `opensearch_dashboards.json`
- **Enforcement**: Plugin fails to load if requirements not met
- **Access**: Via setup/start dependencies

### Optional Plugins
**Definition**: Plugins that enhance functionality if present but aren't required.
- **Usage**: Check for presence before using
- **Pattern**: `if (deps.optionalPlugin) { ... }`

### Plugin Initializer
**Definition**: Factory function that creates a plugin instance.
```typescript
export function plugin(initContext: PluginInitializerContext) {
  return new MyPlugin(initContext);
}
```

### Capabilities
**Definition**: Fine-grained permissions system for controlling feature access.
- **Registration**: During setup phase
- **Checking**: `capabilities.myApp.show`
- **UI Control**: Hide/show features based on capabilities

### Extension Points
**Definition**: Interfaces where plugins can add custom functionality.
- **Examples**: Custom visualizations, Search strategies, UI Actions
- **Pattern**: Registry-based or hook-based

## Data and Query Terms

### Index Pattern (Data View)
**Definition**: A configuration object that defines how to query and display data from OpenSearch indices.
- **Components**: Index name pattern, Field mappings, Formatters
- **Note**: Being renamed to "Data View" in newer versions

### Query
**Definition**: A request for data from OpenSearch using specific search criteria.
- **Types**: Lucene, KQL (Kibana Query Language), DQL, SQL, PPL
- **Components**: Query string, Filters, Time range

### Filter
**Definition**: A non-scoring query clause that limits results.
- **Types**: Term, Range, Exists, Phrase
- **Pinned Filters**: Persist across applications
- **Negated Filters**: Exclude matching documents

### Aggregation
**Definition**: Calculations performed on data to produce summary statistics.
- **Types**: Metric (sum, avg), Bucket (terms, histogram), Pipeline
- **Usage**: Visualizations, Dashboards, Discover

### Search Source
**Definition**: Abstraction layer for building and executing OpenSearch queries.
```typescript
const searchSource = data.search.searchSource.createEmpty();
searchSource.setField('index', indexPattern);
searchSource.setField('query', query);
```

### Search Strategy
**Definition**: Pluggable search execution mechanism for different query types.
- **Built-in**: ES search, EQL, SQL, PPL
- **Custom**: Plugins can register new strategies
- **Async**: Support for long-running searches

## UI and Visualization Terms

### Embeddable
**Definition**: A reusable UI component that can be embedded in dashboards or other containers.
- **Examples**: Visualizations, Saved searches, Maps
- **Container**: Dashboard, Canvas
- **Input/Output**: Configuration and rendered state

### Expression
**Definition**: A pipeline-based computation and rendering system.
- **Functions**: Building blocks of expressions
- **Pipeline**: Chain functions with pipe operator
- **Execution**: Client or server side

### Visualization
**Definition**: A graphical representation of data query results.
- **Types**: Line, Bar, Pie, Table, Metric, etc.
- **Pipeline**: Data → Expression → Renderer
- **Configuration**: Stored as saved object

### Dashboard
**Definition**: A collection of visualizations and other embeddables arranged on a grid.
- **Panels**: Individual embeddables
- **Layouts**: Responsive grid system
- **Interactions**: Filtering, time range, drill-down

### Chrome
**Definition**: The application shell UI including header, navigation, and global controls.
- **Components**: Header, Breadcrumbs, Navigation menu
- **Services**: chrome.setBreadcrumbs(), chrome.setHelpExtension()

### Flyout
**Definition**: A slide-out panel for displaying contextual information or forms.
- **Usage**: Details view, Settings, Help content
- **API**: `core.overlays.openFlyout()`

## Security Terms

### Authentication
**Definition**: Process of verifying user identity.
- **Methods**: Basic auth, SAML, OIDC, JWT
- **Flow**: Login → Session → Token

### Authorization
**Definition**: Process of determining user permissions.
- **Levels**: Cluster, Index, Document, Field
- **Roles**: Collection of permissions
- **Backend Roles**: External group mappings

### Tenant
**Definition**: Isolated workspace for saved objects and dashboards.
- **Types**: Private, Global, Custom
- **Switching**: Via tenant selector
- **Isolation**: Complete saved object separation

### Role-Based Access Control (RBAC)
**Definition**: Permission system based on user roles.
- **Components**: Users, Roles, Permissions, Mappings
- **Granularity**: Feature, Index, Field level

### Session
**Definition**: Authenticated user context maintained across requests.
- **Storage**: Cookie or token based
- **Timeout**: Configurable idle and lifetime
- **Management**: Login, Logout, Refresh

## Development Terms

### Hot Module Replacement (HMR)
**Definition**: Development feature that updates modules without full reload.
- **Benefit**: Faster development iteration
- **Usage**: Automatic in development mode
- **Limitation**: Some changes require full restart

### Bundle
**Definition**: Compiled and optimized JavaScript/CSS output.
- **Optimizer**: Webpack-based build system
- **Splitting**: Automatic code splitting
- **Loading**: Dynamic imports for lazy loading

### Type Generation
**Definition**: Automatic TypeScript type definition creation.
- **Source**: API surface, Configurations
- **Output**: `.d.ts` files
- **Usage**: Improved IDE support

### Mock
**Definition**: Test double simulating real service behavior.
- **Location**: `src/core/*/mocks`
- **Usage**: Unit and integration testing
- **Pattern**: `coreMock.createSetup()`

### Functional Test
**Definition**: End-to-end test simulating user interactions.
- **Framework**: Custom FTR (Functional Test Runner)
- **Services**: Browser automation, API clients
- **Pages**: Page object pattern

## Common Abbreviations

### Technical Abbreviations
- **API**: Application Programming Interface
- **APM**: Application Performance Monitoring
- **CRUD**: Create, Read, Update, Delete
- **DSL**: Domain Specific Language
- **DQL**: Dashboards Query Language
- **ECS**: Elastic Common Schema
- **EQL**: Event Query Language
- **FTR**: Functional Test Runner
- **HMR**: Hot Module Replacement
- **HTTP**: Hypertext Transfer Protocol
- **i18n**: Internationalization
- **JSON**: JavaScript Object Notation
- **JWT**: JSON Web Token
- **KQL**: Kibana Query Language (legacy name)
- **MVC**: Model-View-Controller
- **OIDC**: OpenID Connect
- **OSD**: OpenSearch Dashboards
- **PPL**: Piped Processing Language
- **RBAC**: Role-Based Access Control
- **REST**: Representational State Transfer
- **SAML**: Security Assertion Markup Language
- **SPA**: Single Page Application
- **SQL**: Structured Query Language
- **SSL/TLS**: Secure Sockets Layer/Transport Layer Security
- **UI/UX**: User Interface/User Experience
- **URI/URL**: Uniform Resource Identifier/Locator
- **UUID**: Universally Unique Identifier
- **YAML**: YAML Ain't Markup Language

### File Extensions
- **.ts/.tsx**: TypeScript/TypeScript React
- **.js/.jsx**: JavaScript/JavaScript React
- **.json**: JSON configuration
- **.yml/.yaml**: YAML configuration
- **.scss**: Sass stylesheets
- **.mdx**: Markdown with JSX
- **.test.ts**: Test files
- **.mock.ts**: Mock files
- **.d.ts**: TypeScript declarations

## OpenSearch Specific Terms

### OpenSearch
**Definition**: Open-source search and analytics engine fork of Elasticsearch.
- **Cluster**: Group of connected OpenSearch nodes
- **Node**: Single OpenSearch instance
- **Index**: Collection of documents

### Document
**Definition**: Basic unit of information in OpenSearch.
- **Structure**: JSON object
- **Identification**: Index, Type (deprecated), ID
- **Operations**: Index, Get, Update, Delete

### Mapping
**Definition**: Schema defining how documents and fields are stored and indexed.
- **Types**: Text, Keyword, Numeric, Date, etc.
- **Dynamic**: Automatic field detection
- **Strict**: Reject unmapped fields

### Shard
**Definition**: Subdivision of an index for distribution and parallelization.
- **Primary**: Original shard
- **Replica**: Copy for redundancy
- **Allocation**: Distribution across nodes

### Analyzer
**Definition**: Text processing pipeline for indexing and searching.
- **Components**: Character filters, Tokenizer, Token filters
- **Built-in**: Standard, Simple, Whitespace, etc.
- **Custom**: User-defined combinations

### Query DSL
**Definition**: JSON-based domain-specific language for queries.
- **Query Context**: Scoring relevance
- **Filter Context**: Binary matching
- **Compound**: Bool, Dis-max, etc.

### Bulk API
**Definition**: API for performing multiple index/delete operations.
- **Operations**: Index, Create, Update, Delete
- **Format**: NDJSON (newline-delimited JSON)
- **Performance**: Reduces overhead

### Snapshot
**Definition**: Backup of cluster state and indices.
- **Repository**: Storage location
- **Incremental**: Only changed data
- **Restore**: Recovery mechanism

## Saved Objects Terms

### Saved Object
**Definition**: Persisted configuration or content object.
- **Types**: Dashboard, Visualization, Search, Index Pattern
- **Storage**: `.opensearch_dashboards` index
- **Migration**: Version upgrade handling

### Saved Object Type
**Definition**: Schema and behavior definition for saved objects.
- **Registration**: During plugin setup
- **Mappings**: OpenSearch field mappings
- **Migrations**: Version transformation functions

### Import/Export
**Definition**: Mechanism for moving saved objects between instances.
- **Format**: NDJSON
- **References**: Automatic relationship handling
- **Conflict Resolution**: Overwrite or skip

### References
**Definition**: Relationships between saved objects.
- **Types**: Parent-child, Dependency
- **Integrity**: Automatic validation
- **Deep Export**: Include all dependencies

## Advanced Concepts

### Observables (RxJS)
**Definition**: Reactive programming pattern for handling asynchronous data streams.
- **Usage**: Search responses, UI state
- **Operators**: map, filter, switchMap
- **Subscription**: Subscribe/unsubscribe pattern

### Dependency Injection
**Definition**: Design pattern for providing dependencies to components.
- **Container**: Core system
- **Registration**: Setup phase
- **Resolution**: Start phase

### Server-Side Rendering (SSR)
**Definition**: Generating HTML on the server before sending to client.
- **Current State**: Limited SSR in OpenSearch Dashboards
- **Benefits**: Performance, SEO
- **Challenge**: Plugin architecture complexity

### Telemetry
**Definition**: Usage data collection for product improvement.
- **Opt-in/out**: User controlled
- **Data Types**: Feature usage, Performance metrics
- **Privacy**: Anonymized collection

### Cross-Cluster Search
**Definition**: Searching across multiple OpenSearch clusters.
- **Configuration**: Remote cluster settings
- **Syntax**: `remote_cluster:index_pattern`
- **Use Cases**: Federated search, Data isolation

## Usage Examples

### Understanding Plugin Relationships
```typescript
// Plugin A depends on Plugin B
// opensearch_dashboards.json
{
  "id": "pluginA",
  "requiredPlugins": ["pluginB"],  // Hard dependency
  "optionalPlugins": ["pluginC"]   // Soft dependency
}

// Accessing dependencies
class PluginA {
  setup(core: CoreSetup, deps: { pluginB: PluginBSetup }) {
    // pluginB is guaranteed to exist
    deps.pluginB.someMethod();

    // pluginC might not exist
    if (deps.pluginC) {
      deps.pluginC.optionalMethod();
    }
  }
}
```

### Service Lifecycle Example
```typescript
// Understanding service lifecycle
class MyService {
  private subscription?: Subscription;

  // Setup: Configuration phase
  public setup() {
    // Register capabilities, routes, etc.
    return {
      registerExtension: (ext: Extension) => { }
    };
  }

  // Start: Operational phase
  public start() {
    // Begin operations
    this.subscription = interval(1000).subscribe();
    return {
      getData: () => { }
    };
  }

  // Stop: Cleanup phase
  public stop() {
    // Clean up resources
    this.subscription?.unsubscribe();
  }
}
```

## Related Documentation
- [Core Framework Architecture](../core_framework_architecture.md)
- [Plugin System](../plugin_system.md)
- [API Reference](./api-reference.md)
- [OpenSearch Glossary](https://opensearch.org/docs/latest/opensearch/glossary/)
- [Development Guide](../getting_started.md)