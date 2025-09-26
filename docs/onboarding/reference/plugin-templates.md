# Plugin Development Templates

Ready-to-use templates, patterns, and boilerplate code for building OpenSearch Dashboards plugins.

## Table of Contents
- [Basic Plugin Template](#basic-plugin-template)
- [Advanced Plugin Templates](#advanced-plugin-templates)
- [Common Plugin Patterns](#common-plugin-patterns)
- [Plugin Types and Structures](#plugin-types-and-structures)
- [Configuration Examples](#configuration-examples)
- [Testing Templates](#testing-templates)
- [Build Configuration](#build-configuration)

## Basic Plugin Template

### Generate a New Plugin
```bash
# Using the built-in generator
yarn osd generate <plugin_name>

# Example
yarn osd generate my_awesome_plugin
```

### Basic Plugin Structure
```
my_plugin/
├── opensearch_dashboards.json    # Plugin manifest
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── .i18nrc.json                  # Internationalization
├── README.md                      # Documentation
├── common/                        # Shared code
│   ├── index.ts
│   └── types.ts
├── public/                        # Client-side code
│   ├── index.ts                  # Client entry point
│   ├── plugin.ts                 # Plugin class
│   ├── components/               # React components
│   ├── services/                 # Client services
│   └── types.ts
├── server/                        # Server-side code
│   ├── index.ts                  # Server entry point
│   ├── plugin.ts                 # Plugin class
│   ├── routes/                   # HTTP routes
│   ├── services/                 # Server services
│   └── types.ts
└── translations/                  # i18n files
```

### Minimal Plugin Manifest
```json
{
  "id": "myPlugin",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "2.x",
  "server": true,
  "ui": true,
  "requiredPlugins": ["data"],
  "optionalPlugins": ["visualizations"],
  "requiredBundles": []
}
```

### Basic Client Plugin
```typescript
// public/plugin.ts
import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';

export interface MyPluginSetup {
  getGreeting: () => string;
}

export interface MyPluginStart {
  renderApp: (element: HTMLElement) => void;
}

export class MyPlugin implements Plugin<MyPluginSetup, MyPluginStart> {
  public setup(core: CoreSetup): MyPluginSetup {
    // Register application
    core.application.register({
      id: 'myPlugin',
      title: 'My Plugin',
      async mount(params) {
        const { renderApp } = await import('./application');
        return renderApp(params);
      },
    });

    return {
      getGreeting: () => 'Hello from my plugin!',
    };
  }

  public start(core: CoreStart): MyPluginStart {
    return {
      renderApp: (element: HTMLElement) => {
        element.innerHTML = '<h1>My Plugin</h1>';
      },
    };
  }

  public stop() {}
}
```

### Basic Server Plugin
```typescript
// server/plugin.ts
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/server';

export class MyPlugin implements Plugin {
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup) {
    const router = core.http.createRouter();

    // Register route
    router.get(
      {
        path: '/api/my_plugin/example',
        validate: false,
      },
      async (context, request, response) => {
        return response.ok({
          body: { message: 'Hello from server!' },
        });
      }
    );

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
```

## Advanced Plugin Templates

### Data Plugin with Search Strategy
```typescript
// server/search_strategy.ts
import { ISearchStrategy } from '../../../src/plugins/data/server';

export const mySearchStrategy: ISearchStrategy = {
  search: (context, request, options) => {
    // Custom search implementation
    return of({
      id: request.id,
      rawResponse: {
        took: 100,
        hits: { total: 0, hits: [] },
      },
    });
  },
  cancel: async (context, id) => {
    // Cancel search implementation
  },
};

// Register in plugin setup
data.search.registerSearchStrategy('myStrategy', mySearchStrategy);
```

### Visualization Plugin Template
```typescript
// public/vis_definition.ts
import { VisTypeDefinition } from '../../../src/plugins/visualizations/public';

export const myVisDefinition: VisTypeDefinition = {
  name: 'my_vis',
  title: 'My Visualization',
  icon: 'visArea',
  description: 'Custom visualization type',
  visConfig: {
    defaults: {
      fontSize: 12,
    },
  },
  editorConfig: {
    optionsTemplate: '<my-vis-options></my-vis-options>',
    schemas: [
      {
        group: 'metrics',
        name: 'metric',
        title: 'Y-Axis',
        min: 1,
        max: 5,
        aggFilter: ['count', 'sum', 'avg'],
        defaults: [{ type: 'count', schema: 'metric' }],
      },
    ],
  },
  requestHandler: 'default',
  responseHandler: 'default',
  options: {
    showIndexSelection: true,
    showQueryBar: true,
    showFilterBar: true,
  },
};
```

### Embeddable Plugin Template
```typescript
// public/embeddable.ts
import {
  Embeddable,
  EmbeddableInput,
  IContainer,
} from '../../../src/plugins/embeddable/public';

export interface MyEmbeddableInput extends EmbeddableInput {
  text: string;
}

export class MyEmbeddable extends Embeddable<MyEmbeddableInput> {
  public readonly type = 'MY_EMBEDDABLE';

  constructor(initialInput: MyEmbeddableInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    node.innerHTML = `<div>${this.input.text}</div>`;
  }

  public reload() {
    // Reload implementation
  }
}

// Factory
export class MyEmbeddableFactory {
  public readonly type = 'MY_EMBEDDABLE';

  public async create(input: MyEmbeddableInput) {
    return new MyEmbeddable(input);
  }

  public getDisplayName() {
    return 'My Embeddable';
  }
}
```

### Management Section Plugin
```typescript
// public/management_section.ts
export function registerManagementSection(core: CoreSetup) {
  const management = core.management;

  const mySection = management.sections.section.opensearchDashboards.registerApp({
    id: 'my_management',
    title: 'My Management',
    order: 100,
    mount: async (params) => {
      const { renderApp } = await import('./management_app');
      return renderApp(params);
    },
  });
}
```

## Common Plugin Patterns

### Dependency Injection Pattern
```typescript
// services/my_service.ts
export interface MyServiceDeps {
  http: HttpSetup;
  notifications: NotificationsStart;
}

export class MyService {
  constructor(private deps: MyServiceDeps) {}

  async fetchData() {
    try {
      const response = await this.deps.http.get('/api/my_plugin/data');
      return response;
    } catch (error) {
      this.deps.notifications.toasts.addDanger('Failed to fetch data');
      throw error;
    }
  }
}

// plugin.ts
public start(core: CoreStart) {
  const myService = new MyService({
    http: core.http,
    notifications: core.notifications,
  });

  return { myService };
}
```

### React Context Pattern
```typescript
// contexts/plugin_context.tsx
import React, { createContext, useContext } from 'react';

interface PluginContextValue {
  core: CoreStart;
  services: MyPluginStart;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export const PluginProvider: React.FC<{
  value: PluginContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
);

export const usePlugin = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugin must be used within PluginProvider');
  }
  return context;
};
```

### State Management Pattern
```typescript
// store/plugin_store.ts
import { BehaviorSubject } from 'rxjs';

export interface PluginState {
  isLoading: boolean;
  data: any[];
  error?: Error;
}

export class PluginStore {
  private state$ = new BehaviorSubject<PluginState>({
    isLoading: false,
    data: [],
  });

  public getState$() {
    return this.state$.asObservable();
  }

  public setState(state: Partial<PluginState>) {
    this.state$.next({
      ...this.state$.value,
      ...state,
    });
  }
}
```

### Saved Object Type Registration
```typescript
// server/saved_objects/my_type.ts
import { SavedObjectsType } from '../../../src/core/server';

export const myType: SavedObjectsType = {
  name: 'my-type',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      description: { type: 'text' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
    },
  },
  migrations: {
    '1.0.0': (doc) => ({
      ...doc,
      attributes: {
        ...doc.attributes,
        updated_at: doc.attributes.created_at,
      },
    }),
  },
};

// Register in setup
core.savedObjects.registerType(myType);
```

## Plugin Types and Structures

### Application Plugin
```typescript
// Complete application plugin structure
export interface AppPluginSetup {
  registerApp: (app: AppConfig) => void;
}

export interface AppPluginStart {
  navigateToApp: (appId: string) => void;
}

export class AppPlugin implements Plugin<AppPluginSetup, AppPluginStart> {
  private apps: Map<string, AppConfig> = new Map();

  public setup(core: CoreSetup): AppPluginSetup {
    return {
      registerApp: (app: AppConfig) => {
        this.apps.set(app.id, app);
        core.application.register({
          id: app.id,
          title: app.title,
          mount: app.mount,
        });
      },
    };
  }

  public start(core: CoreStart): AppPluginStart {
    return {
      navigateToApp: (appId: string) => {
        core.application.navigateToApp(appId);
      },
    };
  }
}
```

### Service Plugin
```typescript
// Service-only plugin (no UI)
export class ServicePlugin implements Plugin {
  private readonly logger: Logger;

  constructor(context: PluginInitializerContext) {
    this.logger = context.logger.get();
  }

  public setup(core: CoreSetup) {
    // Register services
    const myService = new MyBackendService(this.logger);

    return {
      myService,
      registerExtension: (extension: Extension) => {
        myService.registerExtension(extension);
      },
    };
  }

  public start(core: CoreStart) {
    return {};
  }
}
```

### UI Enhancement Plugin
```typescript
// UI-only plugin that enhances existing apps
export class UIEnhancementPlugin implements Plugin {
  public setup(core: CoreSetup, deps: SetupDeps) {
    // Register UI enhancements
    deps.dashboard.registerDashboardEnhancement({
      id: 'myEnhancement',
      render: (element: HTMLElement) => {
        ReactDOM.render(<MyEnhancement />, element);
      },
    });

    // Add custom headers
    core.chrome.setHeaderExtension({
      id: 'myHeaderExtension',
      render: (element: HTMLElement) => {
        ReactDOM.render(<MyHeaderComponent />, element);
      },
    });
  }

  public start(core: CoreStart) {
    return {};
  }
}
```

## Configuration Examples

### Plugin Configuration Schema
```typescript
// server/config.ts
import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  maxRetries: schema.number({ defaultValue: 3 }),
  timeout: schema.duration({ defaultValue: '30s' }),
  apiUrl: schema.uri({ scheme: ['http', 'https'] }),
  features: schema.object({
    experimental: schema.boolean({ defaultValue: false }),
    beta: schema.boolean({ defaultValue: false }),
  }),
  customSettings: schema.recordOf(
    schema.string(),
    schema.any(),
    { defaultValue: {} }
  ),
});

export type PluginConfigType = TypeOf<typeof configSchema>;
```

### Reading Configuration
```typescript
// server/plugin.ts
export class MyPlugin implements Plugin {
  private readonly config: PluginConfigType;

  constructor(context: PluginInitializerContext) {
    this.config = context.config.get<PluginConfigType>();
  }

  public setup(core: CoreSetup) {
    if (this.config.features.experimental) {
      // Enable experimental features
    }

    return {};
  }
}
```

### Dynamic Configuration
```typescript
// public/plugin.ts
export class MyPlugin implements Plugin {
  public async setup(core: CoreSetup) {
    // Fetch configuration from server
    const config = await core.http.get('/api/my_plugin/config');

    // Register UI settings
    core.uiSettings.define({
      'myPlugin:theme': {
        name: 'Theme',
        value: 'light',
        description: 'Color theme for the plugin',
        options: ['light', 'dark'],
        category: ['My Plugin'],
        schema: schema.oneOf([
          schema.literal('light'),
          schema.literal('dark'),
        ]),
      },
    });

    return {};
  }
}
```

## Testing Templates

### Unit Test Template
```typescript
// my_service.test.ts
import { MyService } from './my_service';
import { coreMock } from '../../../src/core/public/mocks';

describe('MyService', () => {
  let service: MyService;
  let mockCore: ReturnType<typeof coreMock.createSetup>;

  beforeEach(() => {
    mockCore = coreMock.createSetup();
    service = new MyService(mockCore);
  });

  test('should fetch data successfully', async () => {
    const mockData = { items: [] };
    mockCore.http.get.mockResolvedValue(mockData);

    const result = await service.fetchData();

    expect(mockCore.http.get).toHaveBeenCalledWith('/api/my_plugin/data');
    expect(result).toEqual(mockData);
  });

  test('should handle errors', async () => {
    const error = new Error('Network error');
    mockCore.http.get.mockRejectedValue(error);

    await expect(service.fetchData()).rejects.toThrow('Network error');
  });
});
```

### Integration Test Template
```typescript
// integration/plugin.test.ts
import { PluginInitializerContext } from '../../../src/core/server';
import { MyPlugin } from '../server/plugin';

describe('MyPlugin Integration', () => {
  let plugin: MyPlugin;
  let context: PluginInitializerContext;

  beforeEach(() => {
    context = {
      logger: {
        get: () => ({
          info: jest.fn(),
          error: jest.fn(),
        }),
      },
      config: {
        get: () => ({
          enabled: true,
          maxRetries: 3,
        }),
      },
    } as any;

    plugin = new MyPlugin(context);
  });

  test('should register routes on setup', () => {
    const mockRouter = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const core = {
      http: {
        createRouter: () => mockRouter,
      },
    } as any;

    plugin.setup(core);

    expect(mockRouter.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/my_plugin/example',
      }),
      expect.any(Function)
    );
  });
});
```

### Functional Test Template
```typescript
// test/functional/my_plugin.ts
import expect from '@osd/expect';
import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', 'myPlugin']);

  describe('My Plugin', () => {
    before(async () => {
      await PageObjects.common.navigateToApp('myPlugin');
    });

    it('should load the app', async () => {
      const appTitle = await PageObjects.myPlugin.getAppTitle();
      expect(appTitle).to.be('My Plugin');
    });

    it('should display data', async () => {
      await PageObjects.myPlugin.clickLoadDataButton();
      const dataCount = await PageObjects.myPlugin.getDataCount();
      expect(dataCount).to.be.above(0);
    });
  });
}
```

## Build Configuration

### TypeScript Configuration
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./target/types",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node", "jest", "react"]
  },
  "include": [
    "common/**/*",
    "public/**/*",
    "server/**/*",
    "../../../typings/**/*"
  ],
  "exclude": ["target", "test"]
}
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    '@elastic/eslint-config-kibana',
    'plugin:@elastic/eui/recommended',
  ],
  rules: {
    '@osd/eslint/require-license-header': [
      'error',
      {
        license: 'OpenSearch Dashboards',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@osd/eslint/no-restricted-paths': 'off',
      },
    },
  ],
};
```

### Package.json Template
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "yarn plugin-helpers build",
    "test": "yarn test:jest && yarn test:functional",
    "test:jest": "../../node_modules/.bin/jest",
    "test:functional": "node ../../scripts/functional_tests",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^14.14.31",
    "@types/react": "^17.0.2",
    "typescript": "4.0.2"
  },
  "dependencies": {
    "react": "^17.0.2",
    "rxjs": "^6.5.5"
  }
}
```

### Internationalization Template
```json
{
  "paths": {
    "myPlugin": "translations/myPlugin.json"
  },
  "exclude": ["node_modules", "target"],
  "translations": ["translations/ja-JP.json"]
}
```

## Quick Start Examples

### Create a Simple Dashboard Panel
```typescript
// 1. Define the panel
export class MyPanel {
  constructor(private container: HTMLElement) {}

  render(data: any) {
    this.container.innerHTML = `
      <div class="myPanel">
        <h2>${data.title}</h2>
        <div class="content">${data.content}</div>
      </div>
    `;
  }
}

// 2. Register as embeddable
const factory = {
  type: 'MY_PANEL',
  create: async (input: any) => {
    const container = document.createElement('div');
    const panel = new MyPanel(container);
    panel.render(input);
    return {
      render: (node: HTMLElement) => {
        node.appendChild(container);
      },
    };
  },
};

// 3. Register in plugin
embeddable.registerEmbeddableFactory(factory.type, factory);
```

### Add a Custom API Endpoint
```typescript
// 1. Define route handler
const handleGetData = async (context: any, request: any, response: any) => {
  try {
    const client = context.core.opensearch.client.asCurrentUser;
    const result = await client.search({
      index: 'my-index',
      body: { query: { match_all: {} } },
    });

    return response.ok({ body: result.body });
  } catch (error) {
    return response.customError({
      statusCode: error.statusCode || 500,
      body: { message: error.message },
    });
  }
};

// 2. Register route
router.get(
  {
    path: '/api/my_plugin/data',
    validate: {
      query: schema.object({
        size: schema.number({ defaultValue: 10 }),
      }),
    },
  },
  handleGetData
);
```

### Create a Settings Page
```tsx
// 1. Define settings component
const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({});

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageContent>
          <EuiPageContentHeader>
            <EuiTitle>
              <h1>Plugin Settings</h1>
            </EuiTitle>
          </EuiPageContentHeader>
          <EuiPageContentBody>
            <EuiForm>
              {/* Settings form */}
            </EuiForm>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

// 2. Register in management
management.sections.section.opensearchDashboards.registerApp({
  id: 'my_plugin_settings',
  title: 'My Plugin Settings',
  mount: (params) => {
    ReactDOM.render(<SettingsPage />, params.element);
    return () => ReactDOM.unmountComponentAtNode(params.element);
  },
});
```

## Best Practices

### Plugin Development Checklist
- [ ] Use TypeScript for type safety
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Include unit and integration tests
- [ ] Document public APIs
- [ ] Follow accessibility guidelines
- [ ] Implement internationalization
- [ ] Add telemetry for usage tracking
- [ ] Optimize bundle size
- [ ] Handle plugin lifecycle properly
- [ ] Validate all user inputs
- [ ] Implement proper security measures
- [ ] Add configuration validation
- [ ] Include migration strategies
- [ ] Document breaking changes

### Performance Considerations
- Lazy load heavy components
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle splitting
- Cache API responses appropriately
- Use web workers for heavy computations
- Implement proper data pagination
- Minimize re-renders
- Use production builds for testing performance
- Profile and optimize critical paths

## Related Resources
- [Plugin System Documentation](onboarding/plugin_system.md)
- [API Reference](onboarding/reference/api-reference.md)
- [Configuration Reference](onboarding/reference/configuration-reference.md)
- [Testing Guide](onboarding/building_and_testing.md)
- [UI Framework](onboarding/ui_framework_and_components.md)