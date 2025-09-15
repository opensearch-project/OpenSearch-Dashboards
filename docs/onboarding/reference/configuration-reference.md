# Configuration Schema Reference

Comprehensive guide to OpenSearch Dashboards configuration options, including server settings, plugin configurations, environment variables, and advanced patterns.

## Table of Contents
- [Configuration Files](#configuration-files)
- [Server Configuration](#server-configuration)
- [OpenSearch Configuration](#opensearch-configuration)
- [Security Configuration](#security-configuration)
- [Plugin Configuration](#plugin-configuration)
- [Environment Variables](#environment-variables)
- [Advanced Configuration](#advanced-configuration)
- [Performance Tuning](#performance-tuning)
- [Development Configuration](#development-configuration)
- [Cluster and High Availability](#cluster-and-high-availability)
- [Localization and Regional Settings](#localization-and-regional-settings)
- [Configuration Templates](#configuration-templates)

## Configuration Files

### Primary Configuration File
**Location**: `config/opensearch_dashboards.yml`

```yaml
# Example configuration structure
server:
  host: "0.0.0.0"
  port: 5601

opensearch:
  hosts: ["https://localhost:9200"]

opensearchDashboards:
  index: ".opensearch_dashboards"
```

### Configuration Hierarchy
1. Default values (built-in)
2. Configuration file (`opensearch_dashboards.yml`)
3. Environment variables (override file settings)
4. Command-line arguments (highest priority)

## Server Configuration

### Basic Server Settings

```yaml
# Server host - IP address or hostname
# Default: "localhost" - only accepts local connections
# Use "0.0.0.0" to accept connections from any IP
server.host: "0.0.0.0"

# Server port
# Default: 5601
server.port: 5601

# Base path for OpenSearch Dashboards URL
# Use when running behind a proxy with a subpath
server.basePath: "/dashboards"

# Rewrite requests prefixed with server.basePath
# Required when using basePath
server.rewriteBasePath: true

# Maximum payload size for incoming requests
# Default: 1048576 (1MB)
server.maxPayloadBytes: 10485760  # 10MB

# Server name for display purposes
server.name: "production-dashboards"

# Public URL for server
# Used for generating absolute URLs
server.publicBaseUrl: "https://dashboards.example.com"
```

### SSL/TLS Configuration

```yaml
# Enable SSL
server.ssl.enabled: true

# SSL certificate and key
server.ssl.certificate: /path/to/server.crt
server.ssl.key: /path/to/server.key

# Certificate authority for SSL
server.ssl.certificateAuthorities: ["/path/to/ca.crt"]

# SSL key passphrase
server.ssl.keyPassphrase: "password"

# Supported protocols
server.ssl.supportedProtocols: ["TLSv1.2", "TLSv1.3"]

# Cipher suites (OpenSSL format)
server.ssl.cipherSuites:
  - "ECDHE-RSA-AES128-GCM-SHA256"
  - "ECDHE-RSA-AES256-GCM-SHA384"

# Client certificate authentication
server.ssl.clientAuthentication: "optional"  # none, optional, required
```

### Request Handling

```yaml
# Socket timeout in milliseconds
# Default: 120000 (2 minutes)
server.socketTimeout: 300000  # 5 minutes

# Request timeout for route handlers
server.requestTimeout: 30000  # 30 seconds

# Keep-alive timeout
server.keepAliveTimeout: 120000  # 2 minutes

# Custom response headers
server.customResponseHeaders:
  "X-Frame-Options": "DENY"
  "X-Content-Type-Options": "nosniff"
  "Referrer-Policy": "no-referrer-when-downgrade"

# CORS configuration
server.cors.enabled: true
server.cors.allowCredentials: true
server.cors.allowOrigin: ["https://example.com"]
```

## OpenSearch Configuration

### Connection Settings

```yaml
# OpenSearch hosts
# Supports multiple hosts for load balancing
opensearch.hosts:
  - "https://node1.example.com:9200"
  - "https://node2.example.com:9200"
  - "https://node3.example.com:9200"

# Authentication
opensearch.username: "dashboards_user"
opensearch.password: "secure_password"

# Service account token (alternative to username/password)
opensearch.serviceAccountToken: "AAEAAWVsYXN0aWM..."

# SSL configuration for OpenSearch connection
opensearch.ssl.verificationMode: "full"  # full, certificate, none
opensearch.ssl.certificate: /path/to/client.crt
opensearch.ssl.key: /path/to/client.key
opensearch.ssl.certificateAuthorities: ["/path/to/ca.crt"]

# Trust all certificates (development only!)
opensearch.ssl.rejectUnauthorized: false
```

### Request Configuration

```yaml
# Request timeout in milliseconds
# Default: 30000 (30 seconds)
opensearch.requestTimeout: 60000

# Shard timeout
opensearch.shardTimeout: 60000

# Ping timeout for health checks
opensearch.pingTimeout: 1500

# Request headers to send to OpenSearch
opensearch.requestHeadersWhitelist:
  - "authorization"
  - "x-custom-header"

# Custom headers for all OpenSearch requests
opensearch.customHeaders:
  "X-Custom-Header": "value"

# Compression for requests to OpenSearch
opensearch.compression: true

# Connection pool settings
opensearch.connectionPool.size: 10
opensearch.connectionPool.strategy: "round-robin"  # round-robin, random
```

### Index Management

```yaml
# OpenSearch Dashboards system index
opensearchDashboards.index: ".opensearch_dashboards"

# Configuration index for dynamic settings
opensearchDashboards.configIndex: ".opensearch_dashboards_config"

# Default app to load
opensearchDashboards.defaultAppId: "discover"

# Autocomplete settings
opensearchDashboards.autocompleteTimeout: 1000
opensearchDashboards.autocompleteTerminateAfter: 100000
```

## Security Configuration

### Authentication

```yaml
# Security plugin settings
opensearch_security.enabled: true

# Authentication types
opensearch_security.auth.type: "basicauth"  # basicauth, openid, saml, proxy

# Session configuration
opensearch_security.session.ttl: 3600000  # 1 hour in milliseconds
opensearch_security.session.keepalive: true

# Cookie settings
opensearch_security.cookie.secure: true
opensearch_security.cookie.name: "security_authentication"
opensearch_security.cookie.ttl: 86400000  # 24 hours
opensearch_security.cookie.domain: ".example.com"
opensearch_security.cookie.isSameSite: "Strict"  # Strict, Lax, None

# Multi-tenancy
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.enable_global: true
opensearch_security.multitenancy.tenants.enable_private: true
```

### OpenID Connect Configuration

```yaml
opensearch_security.auth.type: "openid"
opensearch_security.openid.connect_url: "https://idp.example.com/.well-known/openid-configuration"
opensearch_security.openid.client_id: "dashboards-client"
opensearch_security.openid.client_secret: "secret"
opensearch_security.openid.scope: "openid profile email"
opensearch_security.openid.base_redirect_url: "https://dashboards.example.com"
opensearch_security.openid.verify_hostnames: true
```

### SAML Configuration

```yaml
opensearch_security.auth.type: "saml"
opensearch_security.saml.idp.metadata_url: "https://idp.example.com/metadata"
opensearch_security.saml.idp.entity_id: "https://idp.example.com"
opensearch_security.saml.sp.entity_id: "https://dashboards.example.com"
opensearch_security.saml.kibana_url: "https://dashboards.example.com:5601"
opensearch_security.saml.exchange_key: "exchange_key_string"
```

### Audit Logging

```yaml
# Audit logging configuration
opensearchDashboards.auditLog.enabled: true
opensearchDashboards.auditLog.appender:
  kind: "file"
  path: "/var/log/opensearch-dashboards/audit.log"
  layout:
    kind: "json"

# Events to audit
opensearchDashboards.auditLog.events:
  - "saved_object_create"
  - "saved_object_update"
  - "saved_object_delete"
  - "user_login"
  - "user_logout"
```

## Plugin Configuration

### Data Plugin

```yaml
# Query settings
data.search.aggs.shardDelay.enabled: true
data.autocomplete.querySuggestions.enabled: true
data.autocomplete.valueSuggestions.enabled: true
data.autocomplete.valueSuggestions.terminateAfter: 100000
data.autocomplete.valueSuggestions.timeout: "1s"

# Search sessions
data.search.sessions.enabled: true
data.search.sessions.defaultExpiration: "7d"
data.search.sessions.maxIdleTime: "1h"
data.search.sessions.cleanupInterval: "1m"
```

### Visualization Plugin

```yaml
# Visualization settings
visualization.readOnly: false
visualization.showLabModeSwitch: true
visualization.enableLabs: true

# Time-based visualizations
timeline.enabled: true
timeline.graphiteUrl: "https://graphite.example.com:8080"
```

### Reporting Plugin

```yaml
# Reporting configuration
reporting.enabled: true
reporting.queue.timeout: 120000
reporting.capture.maxAttempts: 3
reporting.capture.browser.type: "chromium"
reporting.capture.browser.chromium.sandbox: false
reporting.capture.timeouts.openUrl: 60000
reporting.capture.timeouts.renderComplete: 120000
reporting.csv.maxSizeBytes: 10485760  # 10MB
reporting.csv.scroll.size: 500
reporting.csv.scroll.duration: "30s"
```

### Alerting Plugin

```yaml
# Alerting settings
alerting.enabled: true
alerting.refreshInterval: "1m"
alerting.maxMonitors: 1000
alerting.maxAlerts: 10000
alerting.requestTimeout: 30000
alerting.maxHttpRequestSize: 10485760  # 10MB
```

### Multi-DataSource Plugin

```yaml
# Multi-datasource configuration
data_source.enabled: true
data_source.max_concurrent_connections: 5
data_source.request_timeout: 30000
data_source.encryption.enabled: true
data_source.encryption.keyring_file: "/etc/opensearch-dashboards/keyring"
```

### Custom Plugin Configuration

```yaml
# Custom plugin settings
myPlugin.enabled: true
myPlugin.apiUrl: "https://api.example.com"
myPlugin.apiKey: "${MY_PLUGIN_API_KEY}"  # Environment variable reference
myPlugin.features:
  experimental: false
  advanced: true
myPlugin.cache:
  enabled: true
  ttl: 300000  # 5 minutes
  maxSize: 100
```

## Environment Variables

### System Environment Variables

```bash
# Server configuration
OSD_SERVER_HOST=0.0.0.0
OSD_SERVER_PORT=5601
OSD_SERVER_BASE_PATH=/dashboards

# OpenSearch connection
OPENSEARCH_HOSTS=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# Node.js settings
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"

# Logging
LOG_LEVEL=info
LOG_DEST=/var/log/opensearch-dashboards/dashboards.log
```

### Plugin-Specific Environment Variables

```bash
# Security plugin
OPENSEARCH_SECURITY_ENABLED=true
OPENSEARCH_SECURITY_AUTH_TYPE=basicauth

# Reporting plugin
XPACK_REPORTING_ENABLED=true
XPACK_REPORTING_CAPTURE_BROWSER_TYPE=chromium

# Custom plugin
MY_PLUGIN_API_KEY=secret_key_123
MY_PLUGIN_CACHE_TTL=300000
```

### Variable Substitution in Configuration

```yaml
# Reference environment variables in config
opensearch.password: "${OPENSEARCH_PASSWORD}"
server.ssl.keyPassphrase: "${SSL_KEY_PASSPHRASE}"

# With default values
server.port: "${OSD_PORT:5601}"
opensearch.requestTimeout: "${OPENSEARCH_TIMEOUT:30000}"
```

## Advanced Configuration

### Logging Configuration

```yaml
# Logging settings
logging:
  dest: /var/log/opensearch-dashboards/dashboards.log
  json: true
  quiet: false
  silent: false
  verbose: false

# Logger configuration
logging.loggers:
  - name: root
    level: info
    appenders: [default]
  - name: opensearch.query
    level: debug
    appenders: [console, file]
  - name: http.server.response
    level: warn
    appenders: [file]

# Appender configuration
logging.appenders:
  console:
    kind: console
    layout:
      kind: pattern
      pattern: "[%date] [%level] [%logger] %message"
  file:
    kind: file
    path: /var/log/opensearch-dashboards/app.log
    layout:
      kind: json
```

### Monitoring Configuration

```yaml
# Monitoring settings
monitoring.enabled: true
monitoring.collection.interval: 10000  # 10 seconds
monitoring.ui.enabled: true

# Metrics collection
ops.interval: 5000  # 5 seconds
ops.cGroupOverrides:
  cpuPath: /sys/fs/cgroup/cpu
  cpuAcctPath: /sys/fs/cgroup/cpuacct

# APM integration
apm.enabled: true
apm.serverUrl: "https://apm.example.com:8200"
apm.secretToken: "secret"
apm.environment: "production"
```

### Saved Objects Configuration

```yaml
# Saved objects settings
savedObjects.maxImportPayloadBytes: 26214400  # 25MB
savedObjects.maxImportExportSize: 10000

# Migration settings
migrations.batchSize: 1000
migrations.scrollDuration: "15m"
migrations.pollInterval: 1500
migrations.skip: false

# Task manager (for background tasks)
xpack.task_manager.max_workers: 10
xpack.task_manager.poll_interval: 3000
xpack.task_manager.max_attempts: 3
```

### Development Mode Settings

```yaml
# Development settings
dev.basePathProxyTarget: "http://localhost:5601"

# Optimizer settings
optimize.enabled: true
optimize.bundleFilter: "!tests"
optimize.bundleDir: "target/bundles"
optimize.viewCaching: true
optimize.watch: true
optimize.watchPort: 5602
optimize.watchHost: "localhost"
optimize.useBundleCache: true
optimize.sourceMaps: true

# Development tools
dev_tools.enabled: true
dev_tools.profiling.enabled: true
```

## Performance Tuning

### Memory Configuration

```yaml
# Node.js memory settings (via NODE_OPTIONS)
# Maximum heap size
NODE_OPTIONS="--max-old-space-size=4096"

# Heap profiling
NODE_OPTIONS="${NODE_OPTIONS} --heap-prof"

# Garbage collection tuning
NODE_OPTIONS="${NODE_OPTIONS} --max-semi-space-size=64"
```

### Connection Pool Optimization

```yaml
# OpenSearch connection pool
opensearch.connectionPool.size: 30
opensearch.connectionPool.compression: true

# HTTP agent settings
opensearch.maxSockets: 256
opensearch.maxFreeSockets: 256
opensearch.keepAlive: true
opensearch.keepAliveMsecs: 1000
```

### Caching Configuration

```yaml
# Browser caching
server.compression.enabled: true
server.compression.brotli.enabled: true

# Static asset caching
server.staticAssets.cachingHeaders:
  "Cache-Control": "public, max-age=31536000"

# API response caching
api.cache.duration: 60000  # 1 minute
api.cache.max: 100
```

### Search Optimization

```yaml
# Search performance
opensearch.shardTimeout: 60000
opensearch.requestTimeout: 300000

# Query cache
data.search.cache.enabled: true
data.search.cache.size: 500
data.search.cache.expire: 300000  # 5 minutes

# Aggregation settings
search.aggs.buckets.size: 65535
search.aggs.shard_delay.enabled: true
```

## Development Configuration

### Local Development Setup

```yaml
# Development server
server.host: "localhost"
server.port: 5601
server.basePath: ""

# OpenSearch connection (local)
opensearch.hosts: ["http://localhost:9200"]
opensearch.username: "admin"
opensearch.password: "admin"
opensearch.ssl.verificationMode: "none"

# Development features
dev_mode: true
optimize.watch: true
optimize.sourceMaps: true

# Verbose logging
logging.verbose: true
logging.dest: stdout
```

### Testing Configuration

```yaml
# Test environment
server.port: 5620
opensearch.hosts: ["http://localhost:9220"]
opensearchDashboards.index: ".kibana_test"

# Test-specific settings
test.opensearchDashboards.host: "localhost"
test.opensearchDashboards.port: 5620
test.opensearch.host: "localhost"
test.opensearch.port: 9220
```

### Docker Configuration

```yaml
# Docker-optimized settings
server.host: "0.0.0.0"
server.name: "docker-dashboards"

# Use environment variables for sensitive data
opensearch.hosts: ["${OPENSEARCH_HOSTS}"]
opensearch.username: "${OPENSEARCH_USERNAME}"
opensearch.password: "${OPENSEARCH_PASSWORD}"

# Disable SSL verification for development
opensearch.ssl.verificationMode: "none"
```

## Configuration Validation

### Schema Validation

```typescript
// Plugin config schema example
import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  apiUrl: schema.uri({ scheme: ['http', 'https'] }),
  timeout: schema.duration({ defaultValue: '30s' }),
  maxRetries: schema.number({ min: 0, max: 10, defaultValue: 3 }),
  features: schema.object({
    experimental: schema.boolean({ defaultValue: false }),
    beta: schema.boolean({ defaultValue: true }),
  }),
});

export type PluginConfig = TypeOf<typeof configSchema>;
```

### Configuration Testing

```bash
# Validate configuration file
bin/opensearch-dashboards --config config/opensearch_dashboards.yml --dry-run

# Test specific configuration
bin/opensearch-dashboards --server.port=5602 --logging.verbose=true

# Environment variable testing
OSD_SERVER_PORT=5602 bin/opensearch-dashboards
```

## Best Practices

### Security Best Practices

1. **Never commit sensitive data** to configuration files
2. **Use environment variables** for passwords and API keys
3. **Enable SSL/TLS** for production deployments
4. **Restrict server.host** to specific interfaces
5. **Set appropriate CORS policies**
6. **Enable audit logging** for compliance
7. **Use strong authentication** methods
8. **Rotate credentials** regularly

### Performance Best Practices

1. **Tune memory settings** based on workload
2. **Configure appropriate timeouts**
3. **Enable compression** for network traffic
4. **Optimize connection pools**
5. **Use caching** strategically
6. **Monitor resource usage**
7. **Scale horizontally** when needed

### Maintenance Best Practices

1. **Version control** configuration files
2. **Document custom settings**
3. **Use configuration management** tools
4. **Test configuration changes** in staging
5. **Monitor configuration drift**
6. **Backup configuration** regularly
7. **Automate deployment** processes

## Troubleshooting Configuration Issues

### Common Issues

```yaml
# Issue: Connection refused to OpenSearch
# Solution: Check hosts and ports
opensearch.hosts: ["http://localhost:9200"]  # Ensure correct protocol

# Issue: SSL certificate errors
# Solution: Configure certificates properly
opensearch.ssl.certificateAuthorities: ["/path/to/ca.crt"]
opensearch.ssl.verificationMode: "certificate"

# Issue: Memory errors
# Solution: Increase heap size
NODE_OPTIONS="--max-old-space-size=4096"

# Issue: Timeout errors
# Solution: Increase timeout values
opensearch.requestTimeout: 120000
opensearch.shardTimeout: 120000
```

### Debug Configuration

```yaml
# Enable debug logging
logging.verbose: true
logging.loggers:
  - name: root
    level: debug

# Enable development mode
dev_mode: true

# Disable optimizations for debugging
optimize.enabled: false
```

## Cluster and High Availability

### Load Balancing Configuration

```yaml
# Multiple OpenSearch nodes for load balancing
opensearch.hosts:
  - "https://es-node-1.example.com:9200"
  - "https://es-node-2.example.com:9200"
  - "https://es-node-3.example.com:9200"

# Load balancing strategy
opensearch.connectionPool.strategy: "round-robin"  # round-robin, random, sticky

# Health check settings
opensearch.healthCheck.delay: 3000
opensearch.healthCheck.interval: 1500

# Sniffing for node discovery
opensearch.sniffOnStart: true
opensearch.sniffInterval: 60000
opensearch.sniffOnConnectionFault: true
```

### Session Management in Cluster

```yaml
# Shared session storage
session.store.type: "opensearch"  # memory, opensearch, redis
session.store.opensearch.index: ".opensearch_dashboards_sessions"

# Session affinity
session.affinity.enabled: true
session.affinity.cookieName: "dashboards_server_id"

# Distributed cache
cache.provider: "redis"
cache.redis.host: "redis.example.com"
cache.redis.port: 6379
cache.redis.password: "${REDIS_PASSWORD}"
```

### Multi-Instance Configuration

```yaml
# Instance identification
server.uuid: "instance-1"  # Unique per instance
server.name: "dashboards-node-1"

# Shared configuration index
opensearchDashboards.configIndex: ".opensearch_dashboards_config"

# Coordination settings
coordination.election.enabled: true
coordination.election.timeout: 30000

# State synchronization
state.sync.enabled: true
state.sync.interval: 5000
```

## Localization and Regional Settings

### Internationalization (i18n)

```yaml
# Default locale
i18n.locale: "en"

# Available locales
i18n.availableLocales:
  - "en"
  - "zh-CN"
  - "ja-JP"
  - "de-DE"
  - "fr-FR"
  - "es-ES"

# Translation file locations
i18n.translationsPath: "translations"

# Fallback locale
i18n.fallbackLocale: "en"

# Date/time format localization
i18n.formats:
  number:
    currency:
      style: "currency"
  date:
    short:
      month: "numeric"
      day: "numeric"
      year: "2-digit"
```

### Regional Settings

```yaml
# Timezone
timezone: "America/New_York"  # Browser, UTC, or specific timezone

# Date format
dateFormat: "YYYY-MM-DD"
dateFormat:tz: "America/New_York"

# Week start day
dateFormat:dow: "Sunday"  # Sunday, Monday

# Number formatting
format:number:defaultPattern: "0,0.[000]"
format:percent:defaultPattern: "0,0.[000]%"
format:currency:defaultPattern: "$0,0.[00]"

# Default currency
defaultCurrency: "USD"
```

### Locale-Specific UI Settings

```yaml
# UI language preferences
ui:language: "en-US"
ui:rtl: false  # Right-to-left support

# Locale-specific defaults
locale:defaults:
  "en-US":
    dateFormat: "MM/DD/YYYY"
    firstDayOfWeek: 0
  "en-GB":
    dateFormat: "DD/MM/YYYY"
    firstDayOfWeek: 1
  "ja-JP":
    dateFormat: "YYYY年MM月DD日"
    firstDayOfWeek: 0
```

## Configuration Templates

### Production Template

```yaml
# production.yml - Production-ready configuration
server:
  host: "0.0.0.0"
  port: 5601
  publicBaseUrl: "https://dashboards.example.com"
  ssl:
    enabled: true
    certificate: "/etc/opensearch-dashboards/certs/server.crt"
    key: "/etc/opensearch-dashboards/certs/server.key"
  customResponseHeaders:
    "X-Frame-Options": "DENY"
    "X-Content-Type-Options": "nosniff"
    "X-XSS-Protection": "1; mode=block"
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"

opensearch:
  hosts:
    - "https://opensearch-1.example.com:9200"
    - "https://opensearch-2.example.com:9200"
    - "https://opensearch-3.example.com:9200"
  ssl:
    verificationMode: "full"
    certificateAuthorities: ["/etc/opensearch-dashboards/certs/ca.crt"]
  username: "${OPENSEARCH_USERNAME}"
  password: "${OPENSEARCH_PASSWORD}"
  requestTimeout: 60000
  shardTimeout: 60000

opensearch_security:
  enabled: true
  auth:
    type: ["basicauth", "openid"]
  cookie:
    secure: true
    isSameSite: "Strict"
  multitenancy:
    enabled: true

logging:
  dest: "/var/log/opensearch-dashboards/dashboards.log"
  json: true
  quiet: true

monitoring:
  enabled: true
  collection:
    interval: 10000
```

### Development Template

```yaml
# development.yml - Development configuration
server:
  host: "localhost"
  port: 5601
  cors:
    enabled: true
    allowOrigin: ["*"]

opensearch:
  hosts: ["http://localhost:9200"]
  username: "admin"
  password: "admin"
  ssl:
    verificationMode: "none"

opensearch_security:
  enabled: false

logging:
  verbose: true
  dest: stdout

optimize:
  watch: true
  sourceMaps: true

dev_tools:
  enabled: true
  profiling:
    enabled: true
```

### Docker Template

```yaml
# docker.yml - Docker container configuration
server:
  host: "0.0.0.0"
  port: 5601
  name: "${HOSTNAME}"

opensearch:
  hosts: ["${OPENSEARCH_HOSTS}"]
  username: "${OPENSEARCH_USERNAME}"
  password: "${OPENSEARCH_PASSWORD}"
  ssl:
    verificationMode: "${SSL_VERIFICATION_MODE:full}"

opensearchDashboards:
  index: ".opensearch_dashboards_${DEPLOYMENT_NAME:default}"

logging:
  dest: stdout
  json: true

pid:
  file: "/var/run/opensearch-dashboards/dashboards.pid"
```

### Kubernetes Template

```yaml
# kubernetes.yml - Kubernetes deployment configuration
server:
  host: "0.0.0.0"
  port: 5601
  publicBaseUrl: "https://${DASHBOARDS_PUBLIC_URL}"

opensearch:
  hosts:
    - "https://opensearch-cluster:9200"
  ssl:
    verificationMode: "certificate"
    certificateAuthorities:
      - "/usr/share/opensearch-dashboards/config/certs/ca.crt"
  username: "${OPENSEARCH_USERNAME}"
  password: "${OPENSEARCH_PASSWORD}"

# Health checks
server:
  health:
    enabled: true
    delay: 10000
    api:
      path: "/api/status"

# Resource limits awareness
node:
  options:
    - "--max-old-space-size=${MEMORY_LIMIT:2048}"
```

### Security-Hardened Template

```yaml
# security-hardened.yml - Maximum security configuration
server:
  host: "127.0.0.1"  # Only localhost
  port: 5601
  ssl:
    enabled: true
    certificate: "/etc/opensearch-dashboards/certs/server.crt"
    key: "/etc/opensearch-dashboards/certs/server.key"
    clientAuthentication: "required"
    supportedProtocols: ["TLSv1.3"]
  customResponseHeaders:
    "X-Frame-Options": "DENY"
    "X-Content-Type-Options": "nosniff"
    "X-XSS-Protection": "1; mode=block"
    "Content-Security-Policy": "default-src 'self'"
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"

opensearch:
  ssl:
    verificationMode: "full"
    certificate: "/etc/opensearch-dashboards/certs/client.crt"
    key: "/etc/opensearch-dashboards/certs/client.key"
    certificateAuthorities:
      - "/etc/opensearch-dashboards/certs/ca.crt"
  requestHeadersWhitelist: []  # No header forwarding

opensearch_security:
  auth:
    type: "openid"
  cookie:
    secure: true
    httpOnly: true
    isSameSite: "Strict"
  session:
    ttl: 900000  # 15 minutes
    keepalive: false
  audit:
    enabled: true
    ignore_users: []
    ignore_requests: []

# Minimal logging
logging:
  silent: true
  dest: "/var/log/secure/dashboards.log"
  filter:
    exclude:
      - "sensitive"
      - "password"
      - "token"
```

### Multi-Tenant Template

```yaml
# multi-tenant.yml - Multi-tenancy configuration
opensearch_security:
  multitenancy:
    enabled: true
    tenants:
      enable_global: true
      enable_private: true
      preferred_tenants:
        - "Global"
        - "Private"
        - "Custom"
    default_tenant: "Global"
    show_roles: true

# Tenant-specific index patterns
opensearchDashboards:
  index: ".opensearch_dashboards_${tenant}"

# Tenant isolation
tenant:
  isolation:
    enabled: true
    strategy: "index"  # index, namespace

# Per-tenant resource limits
tenant:
  limits:
    max_saved_objects: 1000
    max_index_patterns: 50
    max_visualizations: 500
```

## Configuration Management Tools

### Using Ansible

```yaml
# ansible-playbook.yml
- name: Configure OpenSearch Dashboards
  hosts: dashboards_servers
  vars:
    dashboards_config:
      server:
        host: "0.0.0.0"
        port: 5601
      opensearch:
        hosts: "{{ opensearch_hosts }}"
  tasks:
    - name: Deploy configuration
      template:
        src: opensearch_dashboards.yml.j2
        dest: /etc/opensearch-dashboards/opensearch_dashboards.yml
    - name: Restart service
      systemd:
        name: opensearch-dashboards
        state: restarted
```

### Using Terraform

```hcl
# terraform/dashboards.tf
resource "local_file" "dashboards_config" {
  content = templatefile("${path.module}/templates/opensearch_dashboards.yml.tpl", {
    server_host     = var.server_host
    server_port     = var.server_port
    opensearch_urls = var.opensearch_urls
  })
  filename = "/etc/opensearch-dashboards/opensearch_dashboards.yml"
}
```

### Using Kubernetes ConfigMap

```yaml
# k8s-configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dashboards-config
  namespace: opensearch
data:
  opensearch_dashboards.yml: |
    server.host: "0.0.0.0"
    server.port: 5601
    opensearch.hosts: ["https://opensearch:9200"]
    opensearch.ssl.verificationMode: "certificate"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensearch-dashboards
spec:
  template:
    spec:
      containers:
      - name: dashboards
        volumeMounts:
        - name: config
          mountPath: /usr/share/opensearch-dashboards/config
      volumes:
      - name: config
        configMap:
          name: dashboards-config
```

## Related Documentation

- [API Reference](./api-reference.md)
- [Plugin Development Templates](./plugin-templates.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)
- [Migration Guide](./migration-guide.md)
- [Glossary](./glossary.md)
- [OpenSearch Dashboards Documentation](https://opensearch.org/docs/latest/dashboards/)