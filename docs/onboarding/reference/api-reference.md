# API Reference Documentation

Complete API reference for OpenSearch Dashboards core services, plugin development, REST endpoints, and client-side APIs.

## Table of Contents
- [Core Services API](#core-services-api)
- [Plugin Development APIs](#plugin-development-apis)
- [REST API Endpoints](#rest-api-endpoints)
- [Client-Side APIs](#client-side-apis)
- [Data Services API](#data-services-api)
- [Saved Objects API](#saved-objects-api)
- [UI Services API](#ui-services-api)
- [Expression Functions API](#expression-functions-api)
- [Embeddable API](#embeddable-api)
- [UI Actions API](#ui-actions-api)
- [Navigation API](#navigation-api)
- [Field Formats API](#field-formats-api)
- [Inspector API](#inspector-api)

## Core Services API

### Core System
The core system provides fundamental services accessible to all plugins.

#### Server-Side Core Services

```typescript
// Core services available on server
interface CoreSetup {
  capabilities: CapabilitiesSetup;
  context: ContextSetup;
  opensearch: OpenSearchServiceSetup;
  http: HttpServiceSetup;
  savedObjects: SavedObjectsServiceSetup;
  uiSettings: UiSettingsServiceSetup;
  auditTrail: AuditTrailSetup;
  logging: LoggingServiceSetup;
  metrics: MetricsServiceSetup;
}

interface CoreStart {
  capabilities: CapabilitiesStart;
  opensearch: OpenSearchServiceStart;
  http: HttpServiceStart;
  savedObjects: SavedObjectsServiceStart;
  uiSettings: UiSettingsServiceStart;
  auditTrail: AuditTrailStart;
}
```

#### Client-Side Core Services

```typescript
// Core services available on client
interface CoreSetup {
  application: ApplicationSetup;
  chrome: ChromeSetup;
  docLinks: DocLinksSetup;
  http: HttpSetup;
  notifications: NotificationsSetup;
  uiSettings: IUiSettingsClient;
  injectedMetadata: InjectedMetadataSetup;
}

interface CoreStart {
  application: ApplicationStart;
  chrome: ChromeStart;
  docLinks: DocLinksStart;
  http: HttpStart;
  i18n: I18nStart;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
}
```

### HTTP Service API

#### Creating Routes (Server)
```typescript
// GET route
router.get({
  path: '/api/my_plugin/items/{id}',
  validate: {
    params: schema.object({
      id: schema.string(),
    }),
    query: schema.object({
      include_deleted: schema.boolean({ defaultValue: false }),
    }),
  },
}, async (context, request, response) => {
  const { id } = request.params;
  const data = await fetchData(id);
  return response.ok({ body: data });
});

// POST route with body validation
router.post({
  path: '/api/my_plugin/items',
  validate: {
    body: schema.object({
      name: schema.string({ minLength: 1, maxLength: 100 }),
      description: schema.maybe(schema.string()),
      tags: schema.arrayOf(schema.string(), { defaultValue: [] }),
    }),
  },
}, async (context, request, response) => {
  const newItem = await createItem(request.body);
  return response.ok({ body: newItem });
});
```

#### Making HTTP Requests (Client)
```typescript
// GET request
const response = await http.get('/api/my_plugin/items', {
  query: { page: 1, per_page: 20 },
});

// POST request with body
const newItem = await http.post('/api/my_plugin/items', {
  body: JSON.stringify({
    name: 'New Item',
    description: 'Item description',
  }),
});

// DELETE request
await http.delete(`/api/my_plugin/items/${itemId}`);

// Request with custom headers
const data = await http.get('/api/external', {
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },
});
```

### OpenSearch Client API

```typescript
// Server-side OpenSearch client usage
const client = context.core.opensearch.client.asCurrentUser;

// Search
const searchResponse = await client.search({
  index: 'my-index',
  body: {
    query: {
      match: { title: 'OpenSearch' }
    },
    size: 10,
    from: 0,
  },
});

// Index document
await client.index({
  index: 'my-index',
  body: {
    title: 'Document Title',
    content: 'Document content',
    timestamp: new Date(),
  },
});

// Bulk operations
const bulkResponse = await client.bulk({
  body: [
    { index: { _index: 'my-index' } },
    { title: 'Document 1' },
    { index: { _index: 'my-index' } },
    { title: 'Document 2' },
  ],
});

// Aggregations
const aggResponse = await client.search({
  index: 'my-index',
  body: {
    aggs: {
      categories: {
        terms: {
          field: 'category.keyword',
          size: 10,
        },
      },
    },
  },
});
```

## Plugin Development APIs

### Plugin Lifecycle

```typescript
import { Plugin, CoreSetup, CoreStart } from 'opensearch-dashboards/public';

export class MyPlugin implements Plugin {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, plugins: MyPluginSetupDeps): MyPluginSetup {
    // Register applications
    core.application.register({
      id: 'myApp',
      title: 'My Application',
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./application');
        return renderApp(params);
      },
    });

    // Register HTTP routes (server-side)
    core.http.createRouter().post({
      path: '/api/my_plugin/action',
      validate: { body: schema.object({}) },
    }, this.handleAction);

    return {
      doSomething: this.doSomething.bind(this),
    };
  }

  public start(core: CoreStart, plugins: MyPluginStartDeps): MyPluginStart {
    return {
      isReady: () => true,
    };
  }

  public stop() {
    // Cleanup resources
  }
}
```

### Plugin Configuration

```typescript
// config.ts
import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  maxItems: schema.number({ defaultValue: 100, min: 1, max: 1000 }),
  apiUrl: schema.string({ defaultValue: 'http://localhost:9200' }),
  features: schema.object({
    experimental: schema.boolean({ defaultValue: false }),
    advanced: schema.boolean({ defaultValue: false }),
  }),
});

export type MyPluginConfig = TypeOf<typeof configSchema>;
```

### Plugin Context API

```typescript
// Creating custom context
core.http.registerRouteHandlerContext(
  'myPlugin',
  (context, request) => {
    return {
      getClient: () => new MyCustomClient(context.core.opensearch.client),
      getUser: () => request.auth.isAuthenticated ? request.auth.credentials : null,
    };
  }
);

// Using context in route handler
router.get({
  path: '/api/my_plugin/data',
}, async (context, request, response) => {
  const client = context.myPlugin.getClient();
  const data = await client.fetchData();
  return response.ok({ body: data });
});
```

## REST API Endpoints

### Core REST APIs

#### Saved Objects API
```http
# Search saved objects
GET /api/saved_objects/_find?type=dashboard&search=sales*

# Get specific saved object
GET /api/saved_objects/dashboard/7adfa750-4c81-11e8-b3d7-01146121b73d

# Create saved object
POST /api/saved_objects/dashboard
{
  "attributes": {
    "title": "My Dashboard",
    "panels": []
  }
}

# Update saved object
PUT /api/saved_objects/dashboard/7adfa750-4c81-11e8-b3d7-01146121b73d
{
  "attributes": {
    "title": "Updated Dashboard"
  }
}

# Delete saved object
DELETE /api/saved_objects/dashboard/7adfa750-4c81-11e8-b3d7-01146121b73d
```

#### Index Patterns API
```http
# Get all index patterns
GET /api/index_patterns

# Create index pattern
POST /api/index_patterns/index_pattern
{
  "index_pattern": {
    "title": "logs-*",
    "timeFieldName": "@timestamp"
  }
}

# Update index pattern fields
POST /api/index_patterns/index_pattern/logs-*/_fields_update
```

#### UI Settings API
```http
# Get UI settings
GET /api/opensearch-dashboards/settings

# Update UI setting
POST /api/opensearch-dashboards/settings
{
  "changes": {
    "theme:darkMode": true,
    "dateFormat": "YYYY-MM-DD"
  }
}
```

### Authentication & Security APIs

```http
# Get current user info
GET /api/v1/auth/me

# Logout
POST /api/v1/auth/logout

# Get permissions
GET /api/v1/auth/permissions
```

## Client-Side APIs

### Application Service

```typescript
// Navigate to another app
core.application.navigateToApp('dashboard', {
  path: '/view/123',
  state: { fromApp: 'myApp' },
});

// Get all registered applications
const apps = core.application.applications$;

// Register custom app updater
core.application.registerMountContext(
  'myContext',
  () => ({ myData: 'value' })
);
```

### Chrome Service

```typescript
// Set breadcrumbs
core.chrome.setBreadcrumbs([
  { text: 'My App', href: '/app/myapp' },
  { text: 'Items', href: '/app/myapp/items' },
  { text: 'Item Details' },
]);

// Set custom navigation
core.chrome.setNavLinks([
  {
    id: 'myapp',
    title: 'My Application',
    url: '/app/myapp',
    icon: 'logoOpenSearch',
  },
]);

// Control visibility
core.chrome.setIsVisible(false); // Hide chrome
```

### Notifications Service

```typescript
// Show toast notifications
core.notifications.toasts.addSuccess('Operation completed!');

core.notifications.toasts.addWarning({
  title: 'Warning',
  text: 'This action cannot be undone',
  toastLifeTimeMs: 5000,
});

core.notifications.toasts.addDanger({
  title: 'Error occurred',
  text: mountReactNode(
    <div>
      <p>Failed to save document</p>
      <button onClick={retry}>Retry</button>
    </div>
  ),
});

// Add global toast
const toast = core.notifications.toasts.add({
  title: 'Processing...',
  color: 'primary',
  iconType: 'clock',
  toastLifeTimeMs: 60000,
});

// Remove toast
core.notifications.toasts.remove(toast);
```

### Overlays Service

```typescript
// Show modal
const modal = core.overlays.openModal(
  mountReactNode(
    <EuiModal onClose={() => modal.close()}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Modal Title</EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        Modal content here
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton onClick={() => modal.close()}>Close</EuiButton>
      </EuiModalFooter>
    </EuiModal>
  )
);

// Show flyout
const flyout = core.overlays.openFlyout(
  mountReactNode(
    <EuiFlyout onClose={() => flyout.close()}>
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2>Flyout Title</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        Flyout content
      </EuiFlyoutBody>
    </EuiFlyout>
  )
);

// Show confirmation modal
const confirmed = await core.overlays.openConfirm(
  'Are you sure you want to delete this item?',
  {
    title: 'Confirm Deletion',
    confirmButtonText: 'Delete',
    buttonColor: 'danger',
  }
);
```

## Data Services API

### Search Strategy

```typescript
// Define custom search strategy
export const mySearchStrategy: ISearchStrategy = {
  search: (request, options, context) => {
    // Custom search implementation
    return from(performSearch(request)).pipe(
      map(response => ({
        rawResponse: response,
        isPartial: false,
        isRunning: false,
      })),
    );
  },
  cancel: async (id, options, context) => {
    // Cancel search implementation
  },
};

// Register search strategy
data.search.registerSearchStrategy('myStrategy', mySearchStrategy);

// Use search strategy
const searchResponse = await data.search.search(
  {
    params: {
      index: 'logs-*',
      body: { query: { match_all: {} } },
    },
  },
  {
    strategy: 'myStrategy',
    sessionId: 'search-session-id',
  }
).toPromise();
```

### Query Service

```typescript
// Get query string
const query = data.query.queryString.getQuery();

// Set query string
data.query.queryString.setQuery({
  query: 'status:active',
  language: 'kuery',
});

// Subscribe to query changes
data.query.queryString.getUpdates$().subscribe(query => {
  console.log('Query updated:', query);
});

// Get filters
const filters = data.query.filterManager.getFilters();

// Add filter
data.query.filterManager.addFilters([
  {
    meta: {
      alias: 'Active Status',
      disabled: false,
      negate: false,
    },
    query: { match: { status: 'active' } },
  },
]);
```

### Index Patterns Service

```typescript
// Get index patterns
const indexPatterns = await data.indexPatterns.getIdsWithTitle();

// Load specific index pattern
const indexPattern = await data.indexPatterns.get('logs-*');

// Create index pattern
const newIndexPattern = await data.indexPatterns.create({
  title: 'metrics-*',
  timeFieldName: '@timestamp',
});

// Update index pattern
indexPattern.fields.getByName('status').customLabel = 'Status Label';
await data.indexPatterns.updateSavedObject(indexPattern);
```

## Saved Objects API

### Client-Side Saved Objects

```typescript
// Create saved object client
const savedObjectsClient = core.savedObjects.client;

// Find saved objects
const findResponse = await savedObjectsClient.find({
  type: 'dashboard',
  search: 'sales*',
  searchFields: ['title^3', 'description'],
  perPage: 20,
  page: 1,
});

// Get single saved object
const dashboard = await savedObjectsClient.get('dashboard', 'dashboard-id');

// Create saved object
const created = await savedObjectsClient.create('visualization', {
  title: 'My Viz',
  visState: JSON.stringify(visState),
});

// Update saved object
await savedObjectsClient.update('dashboard', 'dashboard-id', {
  title: 'Updated Dashboard Title',
});

// Delete saved object
await savedObjectsClient.delete('visualization', 'viz-id');

// Bulk operations
const bulkResponse = await savedObjectsClient.bulkCreate([
  { type: 'dashboard', attributes: { title: 'Dashboard 1' } },
  { type: 'dashboard', attributes: { title: 'Dashboard 2' } },
]);
```

### Server-Side Saved Objects

```typescript
// Get saved objects client
const client = context.core.savedObjects.client;

// Create with references
const savedObject = await client.create(
  'lens',
  {
    title: 'My Lens Visualization',
    state: lensState,
  },
  {
    references: [
      {
        id: 'index-pattern-id',
        name: 'indexPatternRef',
        type: 'index-pattern',
      },
    ],
  }
);

// Find with aggregations
const response = await client.find({
  type: 'dashboard',
  aggs: {
    tags: {
      terms: {
        field: 'dashboard.attributes.tags',
      },
    },
  },
});

// Export saved objects
const exportResponse = await client.export({
  type: ['dashboard', 'visualization'],
  includeReferencesDeep: true,
});

// Import saved objects
const importResponse = await client.import({
  file: savedObjectsFile,
  overwrite: true,
});
```

## UI Services API

### Theme Service

```typescript
// Get current theme
const darkMode = core.uiSettings.get('theme:darkMode');

// Subscribe to theme changes
core.uiSettings.get$('theme:darkMode').subscribe(isDark => {
  console.log('Dark mode:', isDark);
});

// Get theme variables
const euiTheme = core.theme.getTheme();
```

### Internationalization (i18n)

```typescript
import { i18n } from '@osd/i18n';

// Simple translation
const title = i18n.translate('myPlugin.title', {
  defaultMessage: 'My Plugin Title',
});

// Translation with values
const message = i18n.translate('myPlugin.itemCount', {
  defaultMessage: 'Found {count} {count, plural, one {item} other {items}}',
  values: { count: itemCount },
});

// Format component
<FormattedMessage
  id="myPlugin.welcome"
  defaultMessage="Welcome {name}!"
  values={{ name: userName }}
/>
```

### Doc Links Service

```typescript
// Get documentation links
const { DOC_LINK_VERSION, links } = core.docLinks;

// Use doc links
<EuiLink href={links.query.luceneQuerySyntax} target="_blank">
  Learn about query syntax
</EuiLink>

// Available link categories
links.dashboard      // Dashboard docs
links.discover      // Discover docs
links.query         // Query language docs
links.indexPatterns // Index pattern docs
links.scriptedFields // Scripted fields docs
```

## Advanced API Patterns

### Request Context Pattern

```typescript
// Server-side context provider
class MyContextProvider {
  constructor(private readonly core: CoreSetup) {
    core.http.registerRouteHandlerContext(
      'myPlugin',
      this.createContext.bind(this)
    );
  }

  private async createContext(context: RequestHandlerContext, request: OsdRequest) {
    const [coreStart] = await this.core.getStartServices();

    return {
      getService: () => new MyService(coreStart),
      getConfig: () => this.config,
      getUser: () => context.core.savedObjects.client.getCurrentUser(),
    };
  }
}
```

### Observable Patterns

```typescript
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// State management with observables
class MyStateService {
  private readonly state$ = new BehaviorSubject({
    isLoading: false,
    data: null,
    error: null,
  });

  public readonly isLoading$ = this.state$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );

  public readonly data$ = this.state$.pipe(
    map(state => state.data),
    distinctUntilChanged()
  );

  public loadData() {
    this.state$.next({ ...this.state$.value, isLoading: true });

    fetchData().then(
      data => this.state$.next({ isLoading: false, data, error: null }),
      error => this.state$.next({ isLoading: false, data: null, error })
    );
  }
}

// Combine multiple observables
const combined$ = combineLatest([
  data.query.queryString.getUpdates$(),
  data.query.filterManager.getUpdates$(),
  data.query.timefilter.timefilter.getTimeUpdate$(),
]).pipe(
  map(([query, filters, timeRange]) => ({
    query,
    filters,
    timeRange,
  }))
);
```

### Error Handling Patterns

```typescript
// Custom error classes
export class MyPluginError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MyPluginError';
  }
}

// Route error handling
router.post({
  path: '/api/my_plugin/action',
}, async (context, request, response) => {
  try {
    const result = await performAction(request.body);
    return response.ok({ body: result });
  } catch (error) {
    if (error instanceof MyPluginError) {
      return response.customError({
        statusCode: 400,
        body: {
          message: error.message,
          attributes: { code: error.code },
        },
      });
    }

    // Log unexpected errors
    context.core.logger.error('Unexpected error', error);
    throw error; // Let platform handle
  }
});
```

## Performance Considerations

### Lazy Loading

```typescript
// Lazy load heavy components
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Lazy load plugin features
core.application.register({
  id: 'myApp',
  mount: async (params) => {
    // Load only when app is accessed
    const { renderApp } = await import('./application');
    return renderApp(params);
  },
});
```

### Caching Strategies

```typescript
// Implement caching for expensive operations
class CachedDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async getData(key: string): Promise<any> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const data = await fetchData(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

## API Versioning and Compatibility

### Version Detection

```typescript
// Check OpenSearch Dashboards version
const version = core.injectedMetadata.getOpenSearchDashboardsVersion();

// Feature detection
if (core.application.capabilities.dashboard?.showWriteControls) {
  // Feature is available
}

// API compatibility check
const isCompatible = semver.satisfies(version, '>=2.0.0');
```

### Backward Compatibility

```typescript
// Support multiple API versions
class MyService {
  async callAPI(params: any) {
    const version = this.getAPIVersion();

    if (version >= 2) {
      return this.callV2API(params);
    } else {
      return this.callV1API(this.transformParamsToV1(params));
    }
  }

  private transformParamsToV1(params: any) {
    // Transform parameters for backward compatibility
    return { ...params, legacyField: params.newField };
  }
}
```

## Testing APIs

### Unit Testing

```typescript
// Mock core services
const coreSetupMock = {
  http: {
    createRouter: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
    })),
  },
  savedObjects: {
    registerType: jest.fn(),
  },
};

// Test plugin setup
describe('MyPlugin', () => {
  it('registers routes during setup', () => {
    const plugin = new MyPlugin();
    plugin.setup(coreSetupMock);

    expect(coreSetupMock.http.createRouter).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
// Test API endpoints
describe('API Integration', () => {
  let root: Root;

  beforeAll(async () => {
    root = osdTestServer.createRoot();
    await root.setup();
    await root.start();
  });

  afterAll(async () => {
    await root.shutdown();
  });

  it('creates item via API', async () => {
    const response = await supertest(root.server.listener)
      .post('/api/my_plugin/items')
      .send({ name: 'Test Item' })
      .expect(200);

    expect(response.body).toHaveProperty('id');
  });
});
```

## Expression Functions API

### Registering Expression Functions

```typescript
// Define expression function
export const myFunction = (): ExpressionFunctionDefinition<
  'myFunction',
  Context,
  Arguments,
  Output
> => ({
  name: 'myFunction',
  type: 'number',
  inputTypes: ['number', 'null'],
  help: i18n.translate('myPlugin.function.help', {
    defaultMessage: 'Performs calculation',
  }),
  args: {
    value: {
      types: ['number'],
      required: true,
      help: 'Input value',
    },
    multiplier: {
      types: ['number'],
      default: 1,
      help: 'Multiplication factor',
    },
  },
  fn: async (context, args) => {
    return args.value * args.multiplier;
  },
});

// Register function
expressions.registerFunction(myFunction());
```

### Expression Renderers

```typescript
// Define renderer
export const myRenderer: ExpressionRenderDefinition = {
  name: 'myRenderer',
  displayName: 'My Renderer',
  help: 'Renders custom visualization',
  reuseDomNode: true,
  render: async (domNode, config, handlers) => {
    ReactDOM.render(
      <MyVisualization config={config} />,
      domNode
    );

    handlers.done();

    return {
      destroy: () => {
        ReactDOM.unmountComponentAtNode(domNode);
      },
    };
  },
};

// Register renderer
expressions.registerRenderer(myRenderer);
```

### Expression Execution

```typescript
// Execute expression
const expression = 'myFunction value=10 multiplier=2';

const execution = expressions.execute(expression, {
  inspectorAdapters: {},
});

const result = await execution.getData();

// With React hook
const { loading, data, error } = useExpression(expression, input);
```

## Embeddable API

### Creating Custom Embeddables

```typescript
// Define embeddable
export class MyEmbeddable extends Embeddable<
  MyEmbeddableInput,
  MyEmbeddableOutput
> {
  public readonly type = MY_EMBEDDABLE_TYPE;
  private node?: HTMLElement;

  constructor(
    initialInput: MyEmbeddableInput,
    parent?: IContainer
  ) {
    super(
      initialInput,
      {
        defaultTitle: 'My Embeddable',
        editPath: '/edit',
      },
      parent
    );
  }

  public render(node: HTMLElement) {
    this.node = node;
    ReactDOM.render(
      <MyEmbeddableComponent
        input={this.input}
        onInputChange={this.updateInput}
      />,
      node
    );
  }

  public reload() {
    if (this.node) {
      this.render(this.node);
    }
  }

  public destroy() {
    super.destroy();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }
}
```

### Embeddable Factory

```typescript
// Define factory
export class MyEmbeddableFactory
  implements EmbeddableFactoryDefinition {
  public readonly type = MY_EMBEDDABLE_TYPE;
  public readonly savedObjectMetaData = {
    name: 'My Embeddable',
    type: 'my-embeddable',
    getIconForSavedObject: () => 'visArea',
  };

  public async isEditable() {
    return true;
  }

  public async create(
    initialInput: MyEmbeddableInput,
    parent?: IContainer
  ): Promise<MyEmbeddable> {
    return new MyEmbeddable(initialInput, parent);
  }

  public getDisplayName() {
    return i18n.translate('myPlugin.embeddable.displayName', {
      defaultMessage: 'My Embeddable',
    });
  }
}

// Register factory
embeddable.registerEmbeddableFactory(
  MY_EMBEDDABLE_TYPE,
  new MyEmbeddableFactory()
);
```

### Container API

```typescript
// Add embeddable to container
const container = embeddable.getContainer('dashboard');

const embeddableInput: MyEmbeddableInput = {
  id: 'unique-id',
  title: 'My Panel',
  // ... other input
};

container.addNewEmbeddable(
  MY_EMBEDDABLE_TYPE,
  embeddableInput
);

// Update child
container.updateInput({
  panels: {
    ...container.getInput().panels,
    'panel-1': {
      ...container.getInput().panels['panel-1'],
      gridData: { x: 0, y: 0, w: 24, h: 15 },
    },
  },
});
```

## UI Actions API

### Creating Actions

```typescript
// Define action
export const createMyAction = (): Action => ({
  id: 'MY_ACTION',
  type: 'MY_ACTION',
  getDisplayName: () => 'My Action',
  getIconType: () => 'gear',
  isCompatible: async (context) => {
    return context.embeddable?.type === MY_EMBEDDABLE_TYPE;
  },
  execute: async (context) => {
    // Perform action
    const embeddable = context.embeddable;
    await performAction(embeddable);
  },
});

// Register action
uiActions.registerAction(createMyAction());
```

### Triggers

```typescript
// Define trigger
const MY_TRIGGER: Trigger = {
  id: 'MY_TRIGGER',
  title: 'My Trigger',
  description: 'Triggered when something happens',
};

// Register trigger
uiActions.registerTrigger(MY_TRIGGER);

// Attach action to trigger
uiActions.attachAction('MY_TRIGGER', 'MY_ACTION');

// Execute trigger
await uiActions.executeTriggerActions('MY_TRIGGER', {
  embeddable,
  data,
});
```

### Context Menus

```typescript
// Add to context menu
const panelActions = await uiActions.getTriggerCompatibleActions(
  'CONTEXT_MENU_TRIGGER',
  { embeddable }
);

// Build menu items
const menuItems = panelActions.map(action => ({
  name: action.getDisplayName(context),
  icon: action.getIconType(context),
  onClick: () => action.execute(context),
}));
```

## Navigation API

### URL State Sync

```typescript
import { syncQueryStateWithUrl } from '@osd/data-plugin/public';

// Sync query state with URL
const { stop } = syncQueryStateWithUrl(
  data.query,
  osdUrlStateStorage
);

// Custom state sync
const stateStorage = createOsdUrlStateStorage({
  history,
  useHash: false,
});

const stateContainer = createStateContainer({
  myState: 'value',
});

const { start, stop } = syncState({
  storageKey: '_a',
  stateContainer,
  stateStorage,
});

start();
```

### Navigation Menu

```typescript
// Register navigation menu
core.chrome.navLinks.update('myApp', {
  hidden: false,
  disabled: false,
  url: '/app/myApp',
  order: 1000,
  category: {
    id: 'opensearchDashboards',
    label: 'OpenSearch Dashboards',
  },
});

// Get nav links
const navLinks$ = core.chrome.navLinks.getAll$();

// Navigate programmatically
core.application.navigateToUrl('/app/dashboard#/view/123');
```

### Breadcrumbs

```typescript
// Set breadcrumbs with navigation
core.chrome.setBreadcrumbs([
  {
    text: 'My App',
    href: '/app/myApp',
    onClick: (e) => {
      e.preventDefault();
      core.application.navigateToApp('myApp');
    },
  },
  {
    text: 'Section',
    href: '/app/myApp/section',
  },
  {
    text: 'Current Page',
  },
]);
```

## Field Formats API

### Custom Field Formatters

```typescript
import { FieldFormat } from '@osd/field-formats';

// Define formatter
export class MyFieldFormat extends FieldFormat {
  static id = 'my_format';
  static title = 'My Format';
  static fieldType = ['number', 'string'];

  textConvert = (value: any) => {
    return `Formatted: ${value}`;
  };

  htmlConvert = (value: any) => {
    return `<span class="my-format">${value}</span>`;
  };
}

// Register formatter
data.fieldFormats.register([MyFieldFormat]);
```

### Using Field Formats

```typescript
// Get formatter instance
const formatter = data.fieldFormats.getInstance('my_format');

// Format value
const formatted = formatter.convert(value, 'text');

// Get default formatter for field
const defaultFormatter = data.fieldFormats.getDefaultInstance(
  'number',
  { pattern: '0,0.[00]' }
);
```

### Format Serialization

```typescript
// Serialize format
const serialized = formatter.toJSON();

// Deserialize format
const formatter = data.fieldFormats.getInstance(
  serialized.id,
  serialized.params
);
```

## Inspector API

### Adding Inspector Adapters

```typescript
// Create inspector adapters
const inspectorAdapters: Adapters = {
  requests: new RequestAdapter(),
  data: new DataAdapter(),
};

// Log request
inspectorAdapters.requests.start('search', {
  title: 'Search Request',
  description: 'Fetching data',
});

inspectorAdapters.requests
  .getRequest('search')
  .json(searchRequest);

// Log response
inspectorAdapters.requests
  .getRequest('search')
  .response(searchResponse);
```

### Custom Inspector Views

```typescript
// Define inspector view
export class MyInspectorView extends InspectorView {
  constructor(adapters: Adapters) {
    super({
      title: 'My View',
      order: 100,
      help: 'Custom inspector view',
    });
  }

  public render(container: HTMLElement) {
    ReactDOM.render(
      <MyInspectorComponent adapters={this.adapters} />,
      container
    );
  }

  public destroy() {
    // Cleanup
  }
}

// Register view
inspector.registerView(MyInspectorView);
```

### Using Inspector in Embeddables

```typescript
class MyEmbeddable extends Embeddable {
  private inspectorAdapters = {
    requests: new RequestAdapter(),
  };

  public getInspectorAdapters() {
    return this.inspectorAdapters;
  }

  public async reload() {
    // Log in inspector
    const request = this.inspectorAdapters.requests.start(
      'fetch',
      { title: 'Fetching data' }
    );

    try {
      const data = await fetchData();
      request.response(data);
    } catch (error) {
      request.error(error);
    }
  }
}
```

## Advanced HTTP Patterns

### Request Interceptors

```typescript
// Add request interceptor
core.http.intercept({
  request: async (fetchOptions, controller) => {
    // Add custom header
    fetchOptions.headers.append('X-Custom-Header', 'value');
    return fetchOptions;
  },
  requestError: async ({ fetchOptions, error }) => {
    console.error('Request failed', error);
    throw error;
  },
  response: async (fetchResponse) => {
    // Log all responses
    console.log('Response:', fetchResponse);
    return fetchResponse;
  },
  responseError: async ({ response, error }) => {
    if (response?.status === 401) {
      // Handle unauthorized
      core.notifications.toasts.addDanger('Session expired');
    }
    throw error;
  },
});
```

### Streaming Responses

```typescript
// Server-side streaming
router.get(
  { path: '/api/stream' },
  async (context, request, response) => {
    const stream = new PassThrough();

    // Send data over time
    const interval = setInterval(() => {
      stream.write(JSON.stringify({ timestamp: Date.now() }) + '\n');
    }, 1000);

    // Cleanup on close
    request.events.aborted$.subscribe(() => {
      clearInterval(interval);
      stream.end();
    });

    return response.ok({
      body: stream,
      headers: {
        'content-type': 'application/x-ndjson',
      },
    });
  }
);

// Client-side consumption
const response = await fetch('/api/stream');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const data = JSON.parse(text);
  console.log('Received:', data);
}
```

### File Upload/Download

```typescript
// File upload route
router.post(
  {
    path: '/api/upload',
    validate: {
      body: schema.stream(),
    },
    options: {
      body: {
        maxBytes: 10 * 1024 * 1024, // 10MB
      },
    },
  },
  async (context, request, response) => {
    const stream = request.body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    // Process file

    return response.ok({ body: { size: buffer.length } });
  }
);

// File download route
router.get(
  { path: '/api/download/{id}' },
  async (context, request, response) => {
    const fileStream = await getFileStream(request.params.id);

    return response.ok({
      body: fileStream,
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="file.pdf"',
      },
    });
  }
);
```

## Security Patterns

### CSRF Protection

```typescript
// All state-changing requests require osd-xsrf header
await http.post('/api/my_plugin/action', {
  headers: {
    'osd-xsrf': 'true',
  },
  body: JSON.stringify(data),
});
```

### Authentication Context

```typescript
// Access authentication in route
router.get(
  { path: '/api/user/profile' },
  async (context, request, response) => {
    if (!request.auth.isAuthenticated) {
      return response.unauthorized();
    }

    const user = request.auth.credentials;
    return response.ok({
      body: {
        username: user.username,
        roles: user.roles,
      },
    });
  }
);
```

### Permission Checks

```typescript
// Check capabilities
if (!core.application.capabilities.myApp.save) {
  throw new Error('Insufficient permissions');
}

// Server-side permission check
const hasPermission = await context.core.capabilities.resolveCapabilities(
  request
).myApp.save;

if (!hasPermission) {
  return response.forbidden();
}
```

## Related Documentation

- [Core Framework Architecture](onboarding/core_framework_architecture.md)
- [Plugin System](onboarding/plugin_system.md)
- [Configuration Schema Reference](onboarding/reference/configuration-reference.md)
- [Troubleshooting Guide](onboarding/reference/troubleshooting-guide.md)
- [Plugin Development Templates](onboarding/reference/plugin-templates.md)
- [Migration Guide](onboarding/reference/migration-guide.md)