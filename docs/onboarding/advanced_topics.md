# OpenSearch Dashboards Advanced Topics Guide

This guide covers advanced topics for OpenSearch Dashboards development, including multi-tenancy, security integration, internationalization, performance optimization, monitoring, and custom visualization development.

## Table of Contents

1. [Multi-tenancy and Workspaces](#multi-tenancy-and-workspaces)
2. [Security and Authentication Integration](#security-and-authentication-integration)
3. [Internationalization (i18n) Support](#internationalization-i18n-support)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Custom Visualization Development](#custom-visualization-development)

## Multi-tenancy and Workspaces

### Workspace Architecture

OpenSearch Dashboards implements multi-tenancy through the Workspace feature, allowing users to create isolated environments for different teams, projects, or use cases.

#### Core Concepts

**Workspace Data Model:**
```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
  features?: string[];  // Application IDs from registered plugins
  permissions?: Permissions;
}
```

**Saved Object Association:**
```typescript
// Saved objects can be associated with multiple workspaces
{
  type: "dashboard",
  id: "da123f20-6680-11ee-93fa-df944ec23359",
  workspaces: ["workspace-1", "workspace-2"]  // Multi-workspace support
}
```

### Multi-tenant Plugin Development

When developing plugins for multi-tenant environments, consider:

#### 1. Workspace Context Awareness

```typescript
// Access current workspace in your plugin
export class MyPlugin implements Plugin {
  setup(core: CoreSetup) {
    core.application.register({
      id: 'my-app',
      mount: async (params) => {
        const { workspaces } = params;
        const currentWorkspace = workspaces?.currentWorkspace;

        // Render app with workspace context
        return renderApp(params, currentWorkspace);
      }
    });
  }
}
```

#### 2. Data Isolation Patterns

```typescript
// Implement workspace-scoped saved object client
class WorkspaceScopedClient {
  constructor(
    private client: SavedObjectsClientContract,
    private workspaceId: string
  ) {}

  async find(options: SavedObjectsFindOptions) {
    return this.client.find({
      ...options,
      workspaces: [this.workspaceId],
    });
  }

  async create(type: string, attributes: any) {
    return this.client.create(type, attributes, {
      workspaces: [this.workspaceId],
    });
  }
}
```

#### 3. Workspace Permissions

```typescript
// Check workspace permissions before operations
async function checkWorkspaceAccess(
  workspace: Workspace,
  principals: Principals
): Promise<boolean> {
  const acl = new ACL(workspace.permissions);
  return acl.hasPermission(['read'], principals);
}
```

### Workspace API Integration

```typescript
// List workspaces
const response = await fetch('/api/workspaces/_list', {
  method: 'POST',
  body: JSON.stringify({
    perPage: 20,
    page: 1,
    permissionModes: ['read', 'write']
  })
});

// Duplicate objects across workspaces
const duplicateResponse = await fetch('/api/workspaces/_duplicate_saved_objects', {
  method: 'POST',
  body: JSON.stringify({
    objects: [{ type: 'dashboard', id: 'dashboard-1' }],
    targetWorkspace: 'workspace-2',
    includeReferencesDeep: true
  })
});
```

## Security and Authentication Integration

### Access Control Lists (ACL)

OpenSearch Dashboards implements fine-grained access control through ACLs:

```typescript
import { ACL, Principals, PrincipalType } from 'core/server/saved_objects/permission_control';

// Create and manage permissions
const acl = new ACL();

// Add permissions for users and groups
acl.addPermission(['read', 'write'], {
  users: ['user1', 'user2'],
  groups: ['admin-group']
});

// Check permissions
const hasAccess = acl.hasPermission(['read'], {
  users: ['user1']
}); // Returns true

// Generate query for permitted objects
const query = ACL.generateGetPermittedSavedObjectsQueryDSL(
  ['read'],
  { users: ['user1'], groups: ['group1'] },
  'dashboard'
);
```

### Authentication Flows

#### 1. Request Authentication

```typescript
// Server-side authentication handler
export function setupAuthentication(core: CoreSetup) {
  core.http.registerAuth(async (request, response, toolkit) => {
    const session = await getSession(request);

    if (!session.isValid()) {
      return response.unauthorized();
    }

    // Attach user principals to request
    return toolkit.authenticated({
      state: {
        user: session.user,
        principals: {
          users: [session.user.id],
          groups: session.user.groups
        }
      }
    });
  });
}
```

#### 2. Authorization Patterns

```typescript
// Route-level authorization
router.get({
  path: '/api/protected-resource',
  validate: {
    query: schema.object({...})
  },
  options: {
    authRequired: true,
    tags: ['access:admin']  // Role-based access
  }
}, async (context, request, response) => {
  // Check additional permissions
  const { principals } = request.auth.state;

  if (!checkResourceAccess(resourceId, principals)) {
    return response.forbidden();
  }

  // Process authorized request
});
```

### RBAC Implementation

```typescript
// Define roles and permissions
interface Role {
  id: string;
  name: string;
  permissions: string[];
  features: string[];  // Allowed features/applications
}

class RBACService {
  async getUserRoles(userId: string): Promise<Role[]> {
    // Fetch user roles from security backend
  }

  async checkPermission(
    userId: string,
    permission: string,
    resource?: any
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    const permissions = roles.flatMap(r => r.permissions);

    return permissions.includes(permission) ||
           permissions.includes('*');
  }
}
```

## Internationalization (i18n) Support

### i18n Framework Usage

OpenSearch Dashboards uses a comprehensive i18n system based on `react-intl`:

#### 1. Basic Translation

```typescript
import { i18n } from '@osd/i18n';

// Simple message
const GREETING = i18n.translate('myPlugin.greeting', {
  defaultMessage: 'Welcome to OpenSearch Dashboards!',
});

// Message with parameters
function getUserMessage(userName: string) {
  return i18n.translate('myPlugin.userWelcome', {
    defaultMessage: 'Hello {name}!',
    values: { name: userName },
    description: 'Welcome message shown to users'
  });
}
```

#### 2. React Component i18n

```tsx
import React from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';

// Wrap your app with I18nProvider
export function MyApp() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

// Use FormattedMessage in components
function AppContent() {
  return (
    <div>
      <FormattedMessage
        id="myPlugin.dashboard.title"
        defaultMessage="Dashboard: {dashboardName}"
        values={{ dashboardName: 'Analytics' }}
      />

      <FormattedMessage
        id="myPlugin.items.count"
        defaultMessage="{count, plural, =0 {No items} one {# item} other {# items}}"
        values={{ count: itemCount }}
      />
    </div>
  );
}
```

### Adding Translations

Create translation files in your plugin:

```json
// plugins/my_plugin/translations/es.json
{
  "myPlugin.greeting": "¡Bienvenido a OpenSearch Dashboards!",
  "myPlugin.userWelcome": "¡Hola {name}!",
  "myPlugin.dashboard.title": "Panel: {dashboardName}"
}
```

### Locale-specific Formatting

```tsx
import { FormattedDate, FormattedNumber, FormattedRelative } from '@osd/i18n/react';

function LocalizedContent() {
  return (
    <>
      <FormattedDate
        value={new Date()}
        year="numeric"
        month="long"
        day="2-digit"
      />

      <FormattedNumber
        value={1234567.89}
        style="currency"
        currency="USD"
      />

      <FormattedRelative
        value={Date.now() - 60000}
        format="seconds"
      />
    </>
  );
}
```

### RTL Support

```typescript
// Detect and handle RTL languages
import { i18n } from '@osd/i18n';

function getTextDirection(): 'ltr' | 'rtl' {
  const locale = i18n.getLocale();
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];

  return rtlLocales.some(rtl => locale.startsWith(rtl)) ? 'rtl' : 'ltr';
}

// Apply RTL styles conditionally
const styles = {
  textAlign: getTextDirection() === 'rtl' ? 'right' : 'left',
  direction: getTextDirection()
};
```

## Performance Optimization

### Bundle Splitting and Lazy Loading

#### 1. Code Splitting with Dynamic Imports

```typescript
// Lazy load heavy components
import React, { lazy, Suspense } from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';

const HeavyVisualization = lazy(() =>
  import(/* webpackChunkName: "heavy-viz" */ './components/heavy_visualization')
);

export function VisualizationWrapper(props: any) {
  return (
    <Suspense fallback={<EuiLoadingSpinner size="xl" />}>
      <HeavyVisualization {...props} />
    </Suspense>
  );
}
```

#### 2. Route-based Code Splitting

```typescript
// Split code by routes
export function registerRoutes(core: CoreSetup) {
  core.application.register({
    id: 'my-app',
    mount: async (params) => {
      // Load only necessary code for this app
      const { renderApp } = await import('./application');
      return renderApp(params);
    }
  });
}
```

### Memory Management Best Practices

#### 1. Component Cleanup

```typescript
import { useEffect, useRef } from 'react';

function useCleanup() {
  const subscriptions = useRef<Array<() => void>>([]);

  useEffect(() => {
    return () => {
      // Clean up all subscriptions
      subscriptions.current.forEach(cleanup => cleanup());
    };
  }, []);

  const addCleanup = (cleanup: () => void) => {
    subscriptions.current.push(cleanup);
  };

  return { addCleanup };
}
```

#### 2. Memoization Strategies

```typescript
import { useMemo, useCallback, memo } from 'react';

// Memoize expensive computations
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);

  const handleClick = useCallback((item) => {
    // Handle click without recreating function
  }, []);

  return <DataGrid data={processedData} onClick={handleClick} />;
});
```

### Search Performance Optimization

```typescript
// Implement search debouncing
import { debounce } from 'lodash';

class SearchService {
  private searchDebounced = debounce(this.performSearch, 300);

  async search(query: string) {
    // Cancel previous search
    this.abortController?.abort();
    this.abortController = new AbortController();

    return this.searchDebounced(query, this.abortController.signal);
  }

  private async performSearch(query: string, signal: AbortSignal) {
    const response = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
      signal
    });

    return response.json();
  }
}
```

### UI Performance Patterns

#### 1. Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

function LargeList({ items }: { items: any[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### 2. Optimistic Updates

```typescript
function useOptimisticUpdate() {
  const [data, setData] = useState(initialData);

  const updateOptimistically = async (newValue: any) => {
    // Update UI immediately
    setData(prev => ({ ...prev, ...newValue }));

    try {
      // Perform actual update
      const result = await api.update(newValue);
      setData(result);
    } catch (error) {
      // Revert on error
      setData(initialData);
      throw error;
    }
  };

  return { data, updateOptimistically };
}
```

## Monitoring and Logging

### Application Monitoring Setup

#### 1. Performance Metrics Collection

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, value: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(value);

    // Send to monitoring service
    this.sendToMonitoring(operation, value);
  }

  getStats(operation: string) {
    const values = this.metrics.get(operation) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
```

#### 2. User Analytics

```typescript
class AnalyticsService {
  trackEvent(category: string, action: string, label?: string, value?: number) {
    const event = {
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };

    // Send to analytics backend
    this.send('/api/analytics/event', event);
  }

  trackPageView(path: string) {
    this.trackEvent('navigation', 'pageview', path);
  }

  trackError(error: Error, context?: any) {
    this.trackEvent('error', error.name, error.message);

    // Log full error details
    logger.error('Application error', {
      error: {
        message: error.message,
        stack: error.stack
      },
      context
    });
  }
}
```

### Custom Logging Patterns

#### 1. Structured Logging

```typescript
import { LoggerFactory } from '@osd/logging';

class MyService {
  private logger = LoggerFactory.get('myPlugin.MyService');

  async processData(data: any) {
    const correlation = {
      correlationId: generateId(),
      userId: this.userId
    };

    this.logger.info('Processing started', {
      ...correlation,
      dataSize: data.length
    });

    try {
      const result = await this.process(data);

      this.logger.info('Processing completed', {
        ...correlation,
        duration: performance.now() - start,
        resultSize: result.length
      });

      return result;
    } catch (error) {
      this.logger.error('Processing failed', {
        ...correlation,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

#### 2. Log Aggregation

```typescript
// Configure centralized logging
const loggingConfig = {
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '[%date][%level][%logger] %message'
      }
    },
    file: {
      type: 'file',
      fileName: './logs/dashboards.log',
      layout: {
        type: 'json'
      }
    },
    remote: {
      type: 'http',
      url: 'https://logging-service/collect',
      method: 'POST',
      layout: {
        type: 'json'
      }
    }
  },
  loggers: {
    root: {
      level: 'info',
      appenders: ['console', 'file', 'remote']
    },
    'myPlugin': {
      level: 'debug',
      appenders: ['console', 'remote']
    }
  }
};
```

### Performance Profiling

```typescript
class Profiler {
  private profiles: Map<string, Profile> = new Map();

  startProfile(name: string) {
    this.profiles.set(name, {
      name,
      startTime: performance.now(),
      marks: []
    });
  }

  mark(profileName: string, markName: string) {
    const profile = this.profiles.get(profileName);
    if (profile) {
      profile.marks.push({
        name: markName,
        time: performance.now() - profile.startTime
      });
    }
  }

  endProfile(name: string): ProfileResult {
    const profile = this.profiles.get(name);
    if (!profile) throw new Error(`Profile ${name} not found`);

    const duration = performance.now() - profile.startTime;
    this.profiles.delete(name);

    return {
      ...profile,
      duration,
      report: this.generateReport(profile, duration)
    };
  }
}
```

### Error Tracking and Debugging

```typescript
// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });

  // Send to error tracking service
  errorTracker.captureException(event.reason);
});

// React error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React component error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });

    errorTracker.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack }
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Custom Visualization Development

### Visualization Plugin Architecture

#### 1. Define Visualization Type

```typescript
import { BaseVisTypeOptions } from 'src/plugins/visualizations/public';

export const customVisDefinition: BaseVisTypeOptions = {
  name: 'custom_viz',
  title: 'Custom Visualization',
  icon: 'visArea',
  description: 'A custom visualization type',
  visConfig: {
    defaults: {
      // Default configuration
      showLegend: true,
      legendPosition: 'right',
      addTooltip: true
    }
  },
  editorConfig: {
    optionTabs: [
      {
        name: 'data',
        title: 'Data',
        editor: DataEditor
      },
      {
        name: 'options',
        title: 'Options',
        editor: OptionsEditor
      }
    ],
    schemas: [
      {
        group: 'metrics',
        name: 'metric',
        title: 'Y-axis',
        min: 1,
        aggFilter: ['count', 'sum', 'avg', 'min', 'max'],
        defaults: [{ type: 'count', schema: 'metric' }]
      },
      {
        group: 'buckets',
        name: 'segment',
        title: 'X-axis',
        min: 0,
        max: 1,
        aggFilter: ['terms', 'date_histogram']
      }
    ]
  },
  requestHandler: 'default',
  responseHandler: 'default',
  hierarchicalData: false
};
```

#### 2. Implement Visualization Component

```typescript
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CustomVizProps {
  visData: any;
  visConfig: any;
  renderComplete: () => void;
}

export function CustomVisualization({
  visData,
  visConfig,
  renderComplete
}: CustomVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !visData) return;

    // Clear previous render
    d3.select(containerRef.current).selectAll('*').remove();

    // Render visualization
    renderD3Visualization(containerRef.current, visData, visConfig);

    // Signal render complete
    renderComplete();
  }, [visData, visConfig, renderComplete]);

  return <div ref={containerRef} className="custom-viz-container" />;
}

function renderD3Visualization(
  container: HTMLElement,
  data: any,
  config: any
) {
  const svg = d3.select(container)
    .append('svg')
    .attr('width', container.clientWidth)
    .attr('height', container.clientHeight);

  // Implement D3 visualization logic
  // ...
}
```

### Custom Aggregation Development

```typescript
// Define custom aggregation
export const customAggregation = {
  name: 'custom_percentile',
  type: 'metrics',
  title: 'Custom Percentile',
  makeLabel: (agg: any) => `Custom Percentile of ${agg.field}`,
  params: [
    {
      name: 'field',
      type: 'field',
      filterFieldTypes: ['number']
    },
    {
      name: 'percentile',
      type: 'number',
      default: 95
    }
  ],
  getValue: (agg: any, bucket: any) => {
    // Custom logic to extract value
    return bucket[agg.id]?.value;
  },
  getResponseAggs: (agg: any) => {
    return {
      [agg.id]: {
        percentiles: {
          field: agg.params.field,
          percents: [agg.params.percentile]
        }
      }
    };
  }
};
```

### Performance Considerations for Visualizations

#### 1. Data Processing Optimization

```typescript
class VisualizationDataProcessor {
  private cache = new Map<string, any>();

  processData(rawData: any, config: any): ProcessedData {
    const cacheKey = this.getCacheKey(rawData, config);

    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Process data in chunks for large datasets
    const processed = this.processInChunks(rawData, config);

    // Cache result
    this.cache.set(cacheKey, processed);

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return processed;
  }

  private processInChunks(data: any[], config: any) {
    const chunkSize = 1000;
    const results = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      results.push(...this.processChunk(chunk, config));
    }

    return results;
  }
}
```

#### 2. Rendering Optimization

```typescript
// Use requestAnimationFrame for smooth animations
class AnimatedVisualization {
  private animationId?: number;

  animate(from: any, to: any, duration: number) {
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Interpolate values
      const current = this.interpolate(from, to, progress);
      this.render(current);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(frame);
      }
    };

    this.animationId = requestAnimationFrame(frame);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
```

#### 3. WebGL for Large Datasets

```typescript
// Use WebGL for rendering large datasets
import { WebGLRenderer } from './webgl-renderer';

class HighPerformanceVisualization {
  private renderer: WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer(canvas);
  }

  render(data: Float32Array) {
    // Prepare data for GPU
    const buffer = this.renderer.createBuffer(data);

    // Set up shaders
    this.renderer.useProgram('points');

    // Render using WebGL
    this.renderer.draw(buffer, data.length / 2);
  }

  destroy() {
    this.renderer.dispose();
  }
}
```

## Best Practices Summary

### Multi-tenancy
- Always scope data operations to workspaces
- Implement proper permission checks
- Handle cross-workspace object duplication carefully

### Security
- Use ACLs for fine-grained access control
- Implement proper authentication flows
- Follow the principle of least privilege

### Internationalization
- Extract all user-facing strings
- Use proper pluralization rules
- Test with RTL languages

### Performance
- Implement code splitting strategically
- Use memoization for expensive operations
- Monitor and profile critical paths

### Monitoring
- Implement structured logging
- Track key performance metrics
- Set up proper error boundaries

### Visualizations
- Cache processed data
- Use virtual scrolling for large lists
- Consider WebGL for large datasets

## Additional Resources

- [OpenSearch Dashboards Developer Guide](../DEVELOPER_GUIDE.md)
- [Plugin Development Guide](onboarding/plugin_system.md)
- [Testing Guide](onboarding/building_and_testing.md)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)