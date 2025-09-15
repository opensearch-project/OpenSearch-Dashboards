# Migration and Breaking Changes Guide

Comprehensive guide for migrating between OpenSearch Dashboards versions, handling breaking changes, and maintaining compatibility.

## Table of Contents
- [Version Migration Paths](#version-migration-paths)
- [Breaking Changes by Version](#breaking-changes-by-version)
- [Migration Strategies](#migration-strategies)
- [Plugin Migration Guide](#plugin-migration-guide)
- [Data Migration](#data-migration)
- [Configuration Migration](#configuration-migration)
- [API Changes](#api-changes)
- [Compatibility Matrices](#compatibility-matrices)
- [Rollback Procedures](#rollback-procedures)

## Version Migration Paths

### Supported Migration Paths
```
1.x → 2.x → 3.x (Recommended sequential upgrade)
1.3.x → 2.0.x → 2.x.x → 3.0.x

Direct migrations:
1.3.x → 2.x (Supported with caveats)
2.x → 3.x (Fully supported)
```

### Pre-Migration Checklist
- [ ] Backup all data and configuration
- [ ] Review breaking changes for target version
- [ ] Test migration in non-production environment
- [ ] Update custom plugins for compatibility
- [ ] Plan for downtime or rolling upgrade
- [ ] Verify OpenSearch version compatibility
- [ ] Document current configuration
- [ ] Prepare rollback plan

## Breaking Changes by Version

### Version 3.0.0
**Major Changes**:
```typescript
// Node.js requirement change
- Node.js 14.x → 18.x minimum

// TypeScript upgrade
- TypeScript 4.0.2 → 4.6.4

// React upgrade
- React 17.0.2 → 18.2.0

// Core API changes
// Old (2.x)
core.application.register({
  id: 'myApp',
  title: 'My App',
  mount: (context, params) => {}
});

// New (3.x)
core.application.register({
  id: 'myApp',
  title: 'My App',
  mount: async (params) => {
    // Context now passed differently
    const { renderApp } = await import('./app');
    return renderApp(params);
  }
});
```

**Removed APIs**:
- `LegacyPlatform` - Completely removed
- `legacy.server` - No longer available
- `ui/public` imports - Use core services instead

**Configuration Changes**:
```yaml
# Deprecated in 3.0
elasticsearch.* → opensearch.*
kibana.* → opensearchDashboards.*

# New required settings
opensearchDashboards.serverBasePath: ""
server.uuid: "auto-generated"
```

### Version 2.0.0
**Breaking Changes from 1.x**:
```typescript
// Saved Objects API changes
// Old (1.x)
savedObjectsClient.create(type, attributes, { id, overwrite });

// New (2.x)
savedObjectsClient.create(type, attributes, {
  id,
  overwrite,
  initialNamespaces: ['default']
});

// Query DSL changes
// Old (1.x)
{
  query: {
    bool: {
      must: { match: { field: "value" } }
    }
  }
}

// New (2.x) - Stricter type checking
{
  query: {
    bool: {
      must: [{ match: { field: "value" } }] // Array required
    }
  }
}
```

**Plugin System Changes**:
```typescript
// Old plugin structure (1.x)
export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    init(server) {}
  });
}

// New plugin structure (2.x)
export class MyPlugin implements Plugin {
  setup(core: CoreSetup) {}
  start(core: CoreStart) {}
  stop() {}
}
```

### Version 1.3.0 → 2.0.0
**Critical Migration Points**:
1. Index naming convention change
2. Security plugin restructuring
3. Multi-tenancy changes
4. API endpoint modifications

## Migration Strategies

### Blue-Green Deployment
```bash
# 1. Set up new environment
docker run -d --name osd-new \
  -p 5602:5601 \
  opensearchproject/opensearch-dashboards:3.0.0

# 2. Migrate configuration
cp config/opensearch_dashboards.yml config/opensearch_dashboards_new.yml
# Update configuration for new version

# 3. Test new environment
curl http://localhost:5602/api/status

# 4. Switch traffic
# Update load balancer or DNS

# 5. Keep old version running for rollback
```

### Rolling Upgrade
```yaml
# For cluster deployments
# 1. Update one node at a time
# 2. Verify health after each node

# docker-compose.yml
version: '3'
services:
  osd-node-1:
    image: opensearchproject/opensearch-dashboards:${VERSION}
    environment:
      - SERVER_NAME=osd-node-1
      - OPENSEARCH_HOSTS=["https://opensearch:9200"]
    deploy:
      update_config:
        parallelism: 1
        delay: 30s
        order: stop-first
```

### In-Place Upgrade
```bash
# 1. Stop OpenSearch Dashboards
systemctl stop opensearch-dashboards

# 2. Backup current installation
cp -r /usr/share/opensearch-dashboards /usr/share/opensearch-dashboards.backup

# 3. Install new version
dpkg -i opensearch-dashboards-3.0.0-amd64.deb

# 4. Update configuration
vi /etc/opensearch-dashboards/opensearch_dashboards.yml

# 5. Start new version
systemctl start opensearch-dashboards

# 6. Verify
curl http://localhost:5601/api/status
```

## Plugin Migration Guide

### Plugin Compatibility Check
```typescript
// Check plugin compatibility
// opensearch_dashboards.json
{
  "id": "myPlugin",
  "version": "3.0.0",
  "opensearchDashboardsVersion": "3.x", // Update version
  "server": true,
  "ui": true,
  "requiredPlugins": ["data", "navigation"],
  "optionalPlugins": ["security"]
}
```

### Common Plugin Migration Issues

#### Import Path Changes
```typescript
// Old (2.x)
import { CoreSetup } from '../../../src/core/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';

// New (3.x)
import { CoreSetup } from '@osd/core/public';
import { DataPublicPluginStart } from '@osd/data-plugin/public';
```

#### Service API Changes
```typescript
// Old (2.x)
class MyPlugin {
  setup(core: CoreSetup, deps: {}) {
    core.application.register({
      id: 'myApp',
      mount: (context, params) => {
        // Direct context usage
      }
    });
  }
}

// New (3.x)
class MyPlugin {
  setup(core: CoreSetup, deps: {}) {
    core.application.register({
      id: 'myApp',
      mount: async (params) => {
        // Context accessed differently
        const { services } = params;
      }
    });
  }
}
```

#### React Component Updates
```typescript
// Old (2.x) - Class components
class MyComponent extends React.Component {
  componentDidMount() {}
  render() {}
}

// New (3.x) - Prefer function components
const MyComponent: React.FC = () => {
  useEffect(() => {
    // ComponentDidMount equivalent
  }, []);

  return <div />;
};
```

### Plugin Testing Migration
```typescript
// Old test setup (2.x)
import { coreMock } from '../../../src/core/public/mocks';

// New test setup (3.x)
import { coreMock } from '@osd/core/public/mocks';
import { renderHook } from '@testing-library/react-hooks';
import { render } from '@testing-library/react';
```

## Data Migration

### Saved Objects Migration
```bash
# Export saved objects from old version
curl -XPOST "http://localhost:5601/api/saved_objects/_export" \
  -H 'osd-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": ["dashboard", "visualization", "search"],
    "includeReferencesDeep": true
  }' > saved_objects.ndjson

# Import to new version
curl -XPOST "http://localhost:5602/api/saved_objects/_import" \
  -H 'osd-xsrf: true' \
  --form file=@saved_objects.ndjson
```

### Index Pattern Migration
```typescript
// Programmatic migration
async function migrateIndexPatterns(client: SavedObjectsClient) {
  const { saved_objects } = await client.find({
    type: 'index-pattern',
    perPage: 1000,
  });

  for (const pattern of saved_objects) {
    // Update pattern for new version
    const migrated = {
      ...pattern.attributes,
      // Add new required fields
      runtimeFieldMap: {},
      allowNoIndex: false,
    };

    await client.update('index-pattern', pattern.id, migrated);
  }
}
```

### Dashboard Migration
```typescript
// Handle dashboard structure changes
function migrateDashboard(dashboard: any) {
  // Version 2.x → 3.x migration
  if (dashboard.version?.startsWith('2.')) {
    return {
      ...dashboard,
      attributes: {
        ...dashboard.attributes,
        // New dashboard structure
        controlGroupInput: {
          panels: {},
          controlStyle: 'oneLine',
          chainingSystem: 'HIERARCHICAL',
        },
        // Migrate panel structure
        panels: dashboard.attributes.panelsJSON
          ? JSON.parse(dashboard.attributes.panelsJSON)
          : [],
      },
    };
  }
  return dashboard;
}
```

## Configuration Migration

### Configuration File Changes
```yaml
# Migration from 2.x to 3.x
# OLD (2.x)
server.port: 5601
server.host: "0.0.0.0"
opensearch.hosts: ["http://localhost:9200"]
opensearch.username: "kibanaserver"
opensearch.password: "kibanaserver"

# NEW (3.x)
server.port: 5601
server.host: "0.0.0.0"
opensearch.hosts: ["https://localhost:9200"]  # HTTPS by default
opensearch.username: "dashboards_server"      # Default user changed
opensearch.password: "dashboards_server"
opensearch.ssl.verificationMode: full         # Stricter SSL

# New required settings
server.publicBaseUrl: "https://dashboards.example.com"
opensearchDashboards.configIndex: ".opensearch_dashboards"
```

### Environment Variable Mapping
```bash
# Version 2.x
export OPENSEARCH_HOSTS="http://localhost:9200"
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="5601"

# Version 3.x (additional variables)
export OPENSEARCH_DASHBOARDS_SERVER_PUBLICBASEURL="https://dashboards.example.com"
export OPENSEARCH_SSL_VERIFICATIONMODE="full"
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Security Configuration Migration
```yaml
# 2.x Security Configuration
opensearch_security.auth.type: "basicauth"
opensearch_security.multitenancy.enabled: true
opensearch_security.readonly_mode.roles: ["kibana_read_only"]

# 3.x Security Configuration
opensearch_security.auth.type: ["basicauth", "openid"]  # Multiple auth types
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.enable_global: true
opensearch_security.multitenancy.tenants.enable_private: true
opensearch_security.readonly_mode.roles: ["dashboards_read_only"]  # Role name change
```

## API Changes

### REST API Endpoint Changes
```typescript
// Version 2.x endpoints
GET /api/saved_objects/_find
POST /api/saved_objects/index-pattern
DELETE /api/saved_objects/dashboard/id

// Version 3.x endpoints (with changes)
GET /api/saved_objects/_find?namespaces=default  // Namespace required
POST /api/saved_objects/index-pattern?overwrite=true
DELETE /api/saved_objects/dashboard/id?force=false  // New parameter

// Deprecated endpoints
GET /api/index_patterns  // Use /api/data_views
POST /api/timelion/run   // Timelion removed
```

### Client API Changes
```typescript
// Search API changes
// 2.x
const response = await data.search.search(request).toPromise();

// 3.x
const response = await data.search.search(request, {
  strategy: 'es',
  abortSignal: new AbortController().signal,
}).toPromise();

// Saved Objects Client changes
// 2.x
const object = await savedObjectsClient.get(type, id);

// 3.x
const object = await savedObjectsClient.get(type, id, {
  namespace: 'default',
});
```

### Plugin API Contract Changes
```typescript
// Setup contract changes
// 2.x
interface MyPluginSetup {
  registerFeature: (feature: Feature) => void;
}

// 3.x
interface MyPluginSetup {
  registerFeature: (feature: Feature) => Promise<void>;  // Now async
  getFeatures: () => Feature[];  // New method
}

// Start contract changes
// 2.x
interface MyPluginStart {
  isFeatureEnabled: (id: string) => boolean;
}

// 3.x
interface MyPluginStart {
  isFeatureEnabled: (id: string) => Promise<boolean>;  // Now async
  getEnabledFeatures: () => Promise<Feature[]>;  // New method
}
```

## Compatibility Matrices

### OpenSearch Compatibility
| OpenSearch Dashboards | OpenSearch | Notes |
|----------------------|------------|-------|
| 1.0.x - 1.3.x | 1.0.x - 1.3.x | Full compatibility |
| 2.0.x - 2.11.x | 2.0.x - 2.11.x | Full compatibility |
| 3.0.x | 2.9.x - 3.0.x | Backward compatible |

### Plugin Compatibility
| Plugin | 1.x | 2.x | 3.x | Migration Required |
|--------|-----|-----|-----|-------------------|
| Security | ✓ | ✓ | ✓ | Config changes in 3.x |
| Alerting | ✓ | ✓ | ✓ | API changes in 2.x |
| Reports | ✓ | ✓ | ✓ | Minor updates |
| ML Commons | ✗ | ✓ | ✓ | New in 2.x |
| Observability | ✗ | ✓ | ✓ | New in 2.x |

### Browser Compatibility
| Browser | 1.x | 2.x | 3.x |
|---------|-----|-----|-----|
| Chrome 90+ | ✓ | ✓ | ✓ |
| Firefox 88+ | ✓ | ✓ | ✓ |
| Safari 14+ | ✓ | ✓ | ✓ |
| Edge 90+ | ✓ | ✓ | ✓ |
| IE 11 | ✓ | ✗ | ✗ |

## Rollback Procedures

### Immediate Rollback
```bash
# 1. Stop new version
systemctl stop opensearch-dashboards

# 2. Restore backup
rm -rf /usr/share/opensearch-dashboards
mv /usr/share/opensearch-dashboards.backup /usr/share/opensearch-dashboards

# 3. Restore configuration
cp /etc/opensearch-dashboards/opensearch_dashboards.yml.backup \
   /etc/opensearch-dashboards/opensearch_dashboards.yml

# 4. Start old version
systemctl start opensearch-dashboards

# 5. Verify
curl http://localhost:5601/api/status
```

### Data Rollback
```bash
# Export data from new version (if needed)
curl -XPOST "http://localhost:5601/api/saved_objects/_export" \
  -H 'osd-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{"type": ["dashboard", "visualization"]}' > new_data.ndjson

# Restore snapshot
curl -XPOST "https://localhost:9200/_snapshot/backup/snapshot_1/_restore" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": ".opensearch_dashboards*",
    "include_global_state": false
  }' -u admin:admin -k
```

### Docker Rollback
```bash
# Quick rollback with Docker
docker stop osd-new
docker start osd-old

# Or using docker-compose
docker-compose down
export VERSION=2.11.0  # Previous version
docker-compose up -d
```

## Migration Best Practices

### Pre-Migration Testing
```bash
# 1. Set up test environment
docker-compose -f docker-compose.test.yml up -d

# 2. Run migration tests
npm run test:migration

# 3. Validate functionality
curl -XGET http://localhost:5601/api/status

# 4. Test critical workflows
# - Dashboard loading
# - Visualization rendering
# - Search functionality
# - User authentication
```

### Gradual Migration Strategy
```yaml
# Phase 1: Update non-critical plugins
plugins:
  - id: "reports"
    version: "3.0.0"

# Phase 2: Update core functionality
core:
  version: "3.0.0"

# Phase 3: Update security and critical plugins
security:
  version: "3.0.0"
```

### Monitoring During Migration
```typescript
// Add migration metrics
class MigrationMonitor {
  private metrics = {
    startTime: Date.now(),
    errors: [],
    migrated: 0,
    failed: 0,
  };

  logProgress(item: string, success: boolean) {
    if (success) {
      this.metrics.migrated++;
    } else {
      this.metrics.failed++;
    }

    console.log(`Migration progress: ${this.metrics.migrated}/${this.metrics.migrated + this.metrics.failed}`);
  }

  getReport() {
    return {
      ...this.metrics,
      duration: Date.now() - this.metrics.startTime,
    };
  }
}
```

## Common Migration Errors

### Error: Version Mismatch
```
Error: Plugin "myPlugin" is incompatible with OpenSearch Dashboards version "3.0.0"
```
**Solution**: Update plugin's opensearchDashboardsVersion in manifest

### Error: Missing Configuration
```
FATAL Error: Configuration property "server.publicBaseUrl" is required
```
**Solution**: Add required configuration properties for new version

### Error: Saved Object Migration Failed
```
Error: Unable to migrate saved object: Document contains invalid fields
```
**Solution**: Run migration script or manually update saved objects

### Error: API Deprecation
```
Warning: API endpoint /api/timelion/run is deprecated and will be removed
```
**Solution**: Update to use new API endpoints

## Migration Scripts

### Automated Migration Script
```bash
#!/bin/bash
# migration.sh - Automated migration script

VERSION_FROM=$1
VERSION_TO=$2

echo "Migrating from $VERSION_FROM to $VERSION_TO"

# Backup current installation
./backup.sh

# Check compatibility
if ! ./check_compatibility.sh $VERSION_FROM $VERSION_TO; then
  echo "Incompatible versions"
  exit 1
fi

# Run pre-migration tasks
./pre_migration.sh $VERSION_FROM $VERSION_TO

# Perform migration
./migrate_config.sh
./migrate_data.sh
./migrate_plugins.sh

# Validate migration
if ./validate_migration.sh; then
  echo "Migration successful"
else
  echo "Migration failed, rolling back"
  ./rollback.sh
  exit 1
fi
```

### Configuration Migration Script
```typescript
// migrate_config.ts
import fs from 'fs';
import yaml from 'js-yaml';

function migrateConfig(oldConfig: any, fromVersion: string, toVersion: string) {
  let newConfig = { ...oldConfig };

  // Version-specific migrations
  if (fromVersion.startsWith('2.') && toVersion.startsWith('3.')) {
    // Rename properties
    if (oldConfig.elasticsearch) {
      newConfig.opensearch = oldConfig.elasticsearch;
      delete newConfig.elasticsearch;
    }

    // Add new required properties
    newConfig.server = {
      ...newConfig.server,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5601',
    };

    // Update security settings
    if (newConfig.opensearch_security) {
      newConfig.opensearch_security = {
        ...newConfig.opensearch_security,
        auth: {
          ...newConfig.opensearch_security.auth,
          multiple_auth_enabled: true,
        },
      };
    }
  }

  return newConfig;
}

// Usage
const oldConfig = yaml.load(fs.readFileSync('opensearch_dashboards.yml', 'utf8'));
const newConfig = migrateConfig(oldConfig, '2.11.0', '3.0.0');
fs.writeFileSync('opensearch_dashboards.new.yml', yaml.dump(newConfig));
```

## Related Resources
- [Configuration Reference](./configuration-reference.md)
- [API Reference](./api-reference.md)
- [Plugin Development](./plugin-templates.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)
- [OpenSearch Dashboards Releases](https://github.com/opensearch-project/OpenSearch-Dashboards/releases)
- [Upgrade Assistant](https://opensearch.org/docs/latest/upgrade-assistant/)