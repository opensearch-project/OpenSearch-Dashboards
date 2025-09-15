# Troubleshooting Guide

Comprehensive guide for diagnosing and resolving common issues in OpenSearch Dashboards development, deployment, and operation.

## Table of Contents
- [Common Development Issues](#common-development-issues)
- [Build and Compilation Errors](#build-and-compilation-errors)
- [Runtime Errors](#runtime-errors)
- [Plugin Development Issues](#plugin-development-issues)
- [Performance Problems](#performance-problems)
- [Debugging Techniques](#debugging-techniques)
- [Error Reference](#error-reference)
- [Deployment Issues](#deployment-issues)
- [Data and Query Issues](#data-and-query-issues)

## Common Development Issues

### Node Version Mismatch
**Problem**: Build fails with node version errors
```
error: The engine "node" is incompatible with this module
```

**Solution**:
```bash
# Check required version in .node-version
cat .node-version

# Use nvm to switch versions
nvm use

# Or install required version
nvm install 14.21.3
nvm use 14.21.3
```

### Yarn Installation Issues
**Problem**: Dependencies fail to install
```
error An unexpected error occurred: "EINTEGRITY: Integrity check failed"
```

**Solution**:
```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and lock file
rm -rf node_modules yarn.lock

# Reinstall with network timeout
yarn install --network-timeout 100000

# If persists, use offline mirror
yarn install --offline
```

### Port Already in Use
**Problem**: Cannot start dev server
```
Error: listen EADDRINUSE: address already in use :::5601
```

**Solution**:
```bash
# Find process using port
lsof -i :5601

# Kill the process
kill -9 <PID>

# Or use different port
yarn start --port 5602
```

### OpenSearch Connection Failed
**Problem**: Cannot connect to OpenSearch
```
Error: connect ECONNREFUSED 127.0.0.1:9200
```

**Solution**:
```bash
# Check if OpenSearch is running
curl -XGET https://localhost:9200 -u admin:admin -k

# Start OpenSearch if needed
cd ../opensearch
./opensearch

# Or update config
# config/opensearch_dashboards.yml
opensearch.hosts: ["https://your-opensearch-host:9200"]
opensearch.username: "admin"
opensearch.password: "admin"
```

## Build and Compilation Errors

### TypeScript Compilation Errors
**Problem**: Type errors during build
```
TS2322: Type 'string' is not assignable to type 'number'
```

**Solution**:
```bash
# Check types without building
yarn typecheck

# Fix specific file
yarn tsc --noEmit path/to/file.ts

# Update type definitions
yarn add @types/package-name -D

# Ignore specific error (use sparingly)
// @ts-ignore
```

### Webpack Build Failures
**Problem**: Webpack compilation errors
```
ERROR in ./public/application.tsx
Module build failed: SyntaxError: Unexpected token
```

**Solution**:
```bash
# Clear webpack cache
rm -rf .cache

# Check webpack config
cat webpack.config.js

# Run with verbose output
yarn build --verbose

# Analyze bundle
yarn build --profile --json > stats.json
# Use webpack-bundle-analyzer
```

### Memory Heap Errors
**Problem**: JavaScript heap out of memory
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution**:
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json script
"scripts": {
  "build": "node --max-old-space-size=4096 scripts/build"
}

# For specific commands
node --max-old-space-size=4096 scripts/build_opensearch_dashboards_platform_plugins
```

### Babel Configuration Issues
**Problem**: Babel transform errors
```
Error: Cannot find module '@babel/preset-env'
```

**Solution**:
```bash
# Reinstall babel dependencies
yarn add @babel/core @babel/preset-env @babel/preset-react -D

# Check babel config
cat .babelrc

# Clear babel cache
rm -rf node_modules/.cache/babel-loader
```

## Runtime Errors

### Plugin Load Failures
**Problem**: Plugin fails to load
```
Error: Plugin "myPlugin" is not registered
```

**Solution**:
```typescript
// Check plugin manifest
// opensearch_dashboards.json
{
  "id": "myPlugin",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "2.x",
  "server": true,
  "ui": true
}

// Verify plugin is built
ls optimizer/bundles/myPlugin.plugin.js

// Check browser console for errors
// Developer Tools > Console

// Verify plugin registration
// src/plugins/my_plugin/public/index.ts
export function plugin() {
  return new MyPlugin();
}
```

### Dependency Injection Errors
**Problem**: Cannot read property of undefined
```
TypeError: Cannot read property 'http' of undefined
```

**Solution**:
```typescript
// Ensure proper dependency injection
class MyService {
  constructor(private deps: { http: HttpSetup }) {
    // Check deps exists
    if (!deps || !deps.http) {
      throw new Error('Required dependencies not provided');
    }
  }
}

// Proper initialization
const service = new MyService({ http: core.http });
```

### React Hook Errors
**Problem**: Invalid hook call
```
Error: Hooks can only be called inside function components
```

**Solution**:
```typescript
// Wrong
class MyComponent extends React.Component {
  render() {
    const [state] = useState(); // Error!
  }
}

// Correct
const MyComponent: React.FC = () => {
  const [state, setState] = useState();
  return <div>{state}</div>;
};

// Check React versions match
yarn list react react-dom
```

### Async/Await Issues
**Problem**: Unhandled promise rejection
```
UnhandledPromiseRejectionWarning: Error: Request failed
```

**Solution**:
```typescript
// Always handle async errors
async function fetchData() {
  try {
    const response = await http.get('/api/data');
    return response;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Handle error appropriately
    notifications.toasts.addDanger({
      title: 'Error fetching data',
      text: error.message,
    });
    throw error; // Re-throw if needed
  }
}

// Or use .catch()
fetchData()
  .then(handleSuccess)
  .catch(handleError);
```

## Plugin Development Issues

### Plugin Not Appearing
**Problem**: Plugin doesn't show in UI
```
Plugin registered but not visible in application list
```

**Solution**:
```typescript
// Check application registration
core.application.register({
  id: 'myPlugin',
  title: 'My Plugin',
  mount: async (params) => {
    // Ensure mount returns unmount function
    const { renderApp } = await import('./application');
    return renderApp(params);
  },
});

// Verify capabilities
core.application.register({
  id: 'myPlugin',
  title: 'My Plugin',
  // Add capability requirements
  capabilities: {
    myPlugin: {
      show: true,
    },
  },
  mount: async (params) => { /* ... */ },
});
```

### Route Handler Not Working
**Problem**: API endpoint returns 404
```
GET /api/my_plugin/data 404 Not Found
```

**Solution**:
```typescript
// Server-side route registration
const router = core.http.createRouter();

router.get(
  {
    path: '/api/my_plugin/data',
    validate: false,
    options: {
      authRequired: true, // Check auth settings
    },
  },
  async (context, request, response) => {
    return response.ok({ body: { data: [] } });
  }
);

// Client-side API call
const response = await http.get('/api/my_plugin/data');
```

### Saved Object Type Not Registered
**Problem**: Cannot create saved objects
```
Error: Unsupported saved object type: 'my-type'
```

**Solution**:
```typescript
// Register saved object type in setup
core.savedObjects.registerType({
  name: 'my-type',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: { type: 'text' },
    },
  },
});

// After registration, restart OpenSearch Dashboards
// Types are registered during startup
```

## Performance Problems

### Slow Page Load
**Problem**: Application takes too long to load
```
Initial page load > 10 seconds
```

**Solution**:
```typescript
// 1. Implement code splitting
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// 2. Optimize bundle size
// Check bundle analyzer
yarn build --profile

// 3. Remove unused dependencies
npm-check-unused

// 4. Use production builds
NODE_ENV=production yarn build

// 5. Enable compression
// opensearch_dashboards.yml
server.compression.enabled: true
```

### Memory Leaks
**Problem**: Memory usage increases over time
```
Memory leak detected in component
```

**Solution**:
```typescript
// 1. Clean up subscriptions
useEffect(() => {
  const subscription = observable$.subscribe();

  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);

// 2. Clear timers
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);

  return () => {
    clearTimeout(timer); // Cleanup
  };
}, []);

// 3. Remove event listeners
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);
```

### Inefficient Queries
**Problem**: Slow OpenSearch queries
```
Query took 5000ms to complete
```

**Solution**:
```typescript
// 1. Add query optimization
const optimizedQuery = {
  size: 10, // Limit results
  _source: ['field1', 'field2'], // Only needed fields
  query: {
    bool: {
      filter: [ // Use filter for non-scoring
        { term: { status: 'active' } },
      ],
    },
  },
};

// 2. Implement caching
const cache = new Map();

async function fetchWithCache(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await fetchData(key);
  cache.set(key, result);
  return result;
}

// 3. Use pagination
const response = await client.search({
  index: 'my-index',
  size: 20,
  from: page * 20,
});
```

## Debugging Techniques

### Browser Developer Tools
```javascript
// Console debugging
console.log('Debug data:', data);
console.table(arrayData);
console.time('operation');
// ... code ...
console.timeEnd('operation');

// Conditional breakpoints
if (condition) {
  debugger; // Pause execution
}

// Network inspection
// DevTools > Network > Filter XHR
// Check request/response details
```

### Server-Side Debugging
```typescript
// Logger usage
class MyPlugin {
  private logger: Logger;

  constructor(context: PluginInitializerContext) {
    this.logger = context.logger.get();
  }

  setup() {
    this.logger.debug('Plugin setup started');
    this.logger.info('Configuration:', this.config);
    this.logger.warn('Deprecated feature used');
    this.logger.error('Failed to initialize', error);
  }
}

// Enable debug logging
// opensearch_dashboards.yml
logging:
  verbose: true
  dest: stdout
  level: debug
```

### React DevTools
```typescript
// Component profiling
import { Profiler } from 'react';

<Profiler
  id="MyComponent"
  onRender={(id, phase, duration) => {
    console.log(`${id} (${phase}) took ${duration}ms`);
  }}
>
  <MyComponent />
</Profiler>

// State inspection
// React DevTools > Components > Select component
// View props and state
```

### Memory Profiling
```javascript
// Chrome DevTools
// 1. Performance tab > Record
// 2. Perform actions
// 3. Stop recording
// 4. Analyze memory timeline

// Heap snapshot
// 1. Memory tab > Take snapshot
// 2. Perform actions
// 3. Take another snapshot
// 4. Compare snapshots

// Programmatic memory check
console.log('Memory usage:', performance.memory);
```

## Error Reference

### Common Error Codes

#### HTTP Status Codes
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate)
- **500 Internal Server Error**: Server-side error
- **502 Bad Gateway**: OpenSearch unavailable
- **503 Service Unavailable**: Server overloaded

#### OpenSearch Error Types
```typescript
// Connection errors
{
  name: 'ConnectionError',
  message: 'No living connections'
}

// Request timeout
{
  name: 'RequestTimeout',
  message: 'Request timed out after 30000ms'
}

// Index not found
{
  type: 'index_not_found_exception',
  reason: 'no such index [my-index]'
}

// Parse exception
{
  type: 'parsing_exception',
  reason: 'Unknown query field [invalid]'
}
```

#### Plugin Error Patterns
```typescript
// Lifecycle errors
class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// Common plugin errors
throw new PluginError('Plugin not initialized', 'PLUGIN_NOT_INITIALIZED');
throw new PluginError('Invalid configuration', 'INVALID_CONFIG', 400);
throw new PluginError('Dependency missing', 'MISSING_DEPENDENCY');
```

## Deployment Issues

### Docker Container Issues
**Problem**: Container fails to start
```
docker: Error response from daemon: OCI runtime create failed
```

**Solution**:
```bash
# Check logs
docker logs opensearch-dashboards

# Verify environment variables
docker run -e "OPENSEARCH_HOSTS=https://opensearch:9200" \
  -e "SERVER_HOST=0.0.0.0" \
  opensearchproject/opensearch-dashboards:latest

# Check file permissions
docker exec -it opensearch-dashboards ls -la /usr/share/opensearch-dashboards

# Use docker-compose for complex setups
# docker-compose.yml
version: '3'
services:
  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:latest
    environment:
      OPENSEARCH_HOSTS: '["https://opensearch:9200"]'
    ports:
      - 5601:5601
```

### SSL/TLS Certificate Issues
**Problem**: Certificate verification failed
```
Error: unable to verify the first certificate
```

**Solution**:
```yaml
# opensearch_dashboards.yml
# For development only - not for production!
opensearch.ssl.verificationMode: none

# For production - use proper certificates
opensearch.ssl.certificateAuthorities: ["/path/to/CA.pem"]
opensearch.ssl.certificate: "/path/to/cert.pem"
opensearch.ssl.key: "/path/to/key.pem"

# Generate self-signed cert for testing
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Reverse Proxy Configuration
**Problem**: Assets not loading behind proxy
```
GET /bundles/plugin.js 404
```

**Solution**:
```yaml
# opensearch_dashboards.yml
server.basePath: "/dashboards"
server.rewriteBasePath: true

# Nginx configuration
location /dashboards {
  proxy_pass http://localhost:5601;
  proxy_set_header Host $.host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Data and Query Issues

### Index Pattern Problems
**Problem**: Cannot create index pattern
```
Error: No matching indices found
```

**Solution**:
```bash
# Check indices exist
curl -XGET "https://localhost:9200/_cat/indices" -u admin:admin -k

# Create sample index
curl -XPUT "https://localhost:9200/my-index" -u admin:admin -k

# Add document
curl -XPOST "https://localhost:9200/my-index/_doc" \
  -H 'Content-Type: application/json' \
  -d '{"timestamp": "2024-01-01T00:00:00Z", "message": "test"}' \
  -u admin:admin -k

# Refresh index
curl -XPOST "https://localhost:9200/my-index/_refresh" -u admin:admin -k
```

### Query Syntax Errors
**Problem**: Query parsing failed
```
Error: [parsing_exception] Unknown query [match_allll]
```

**Solution**:
```typescript
// Validate query syntax
const validQuery = {
  query: {
    match_all: {} // Correct syntax
  }
};

// Use query builder
import { buildOpenSearchQuery } from '@osd/es-query';

const query = buildOpenSearchQuery(
  indexPattern,
  queries,
  filters,
  config
);

// Debug query
console.log('Generated query:', JSON.stringify(query, null, 2));
```

### Aggregation Errors
**Problem**: Aggregation returns unexpected results
```
Aggregation bucket count is 0
```

**Solution**:
```typescript
// Check field mapping
const mapping = await client.indices.getMapping({
  index: 'my-index',
});

// Ensure field is aggregatable
const correctAgg = {
  aggs: {
    my_terms: {
      terms: {
        field: 'category.keyword', // Use keyword field
        size: 10,
      },
    },
  },
};

// Handle missing values
const aggWithMissing = {
  aggs: {
    my_terms: {
      terms: {
        field: 'category.keyword',
        missing: 'N/A', // Default for missing
      },
    },
  },
};
```

## Quick Diagnostic Commands

### System Health Checks
```bash
# Check OpenSearch Dashboards status
curl -XGET http://localhost:5601/api/status

# Check OpenSearch cluster health
curl -XGET https://localhost:9200/_cluster/health -u admin:admin -k

# Check running processes
ps aux | grep opensearch

# Check port availability
netstat -an | grep 5601

# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top -n 1
```

### Log Analysis
```bash
# Tail OpenSearch Dashboards logs
tail -f /var/log/opensearch-dashboards/opensearch-dashboards.log

# Search for errors
grep ERROR /var/log/opensearch-dashboards/opensearch-dashboards.log

# Count error occurrences
grep -c "ERROR" logs/*.log

# Find specific error pattern
grep -B 5 -A 5 "OutOfMemoryError" logs/*.log
```

## Prevention Strategies

### Development Best Practices
1. **Use TypeScript** - Catch errors at compile time
2. **Write tests** - Unit, integration, and functional tests
3. **Enable linting** - ESLint with strict rules
4. **Code reviews** - Peer review all changes
5. **Error boundaries** - Catch React component errors
6. **Logging** - Comprehensive logging at all levels
7. **Monitoring** - Set up performance monitoring
8. **Documentation** - Document known issues and solutions

### Error Handling Patterns
```typescript
// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to error tracking service
});

// React error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Async error wrapper
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Operation failed:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
```

## Getting Help

### Resources
- **GitHub Issues**: https://github.com/opensearch-project/OpenSearch-Dashboards/issues
- **Community Forum**: https://forum.opensearch.org/
- **Slack Channel**: https://opensearch.org/slack.html
- **Stack Overflow**: Tag with `opensearch-dashboards`

### Information to Provide
When seeking help, include:
1. OpenSearch Dashboards version
2. OpenSearch version
3. Operating system
4. Browser version (for UI issues)
5. Error messages and stack traces
6. Steps to reproduce
7. Configuration files (sanitized)
8. Relevant log excerpts

## Related Documentation
- [Building and Testing](../building_and_testing.md)
- [Plugin Development](./plugin-templates.md)
- [Configuration Reference](./configuration-reference.md)
- [API Reference](./api-reference.md)
- [Deployment Guide](../deployment_and_production.md)