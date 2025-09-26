# Deployment and Production Guide

This comprehensive guide covers best practices and operational considerations for deploying OpenSearch Dashboards in production environments. Whether you're running a single instance or orchestrating a large-scale deployment, this guide provides the essential knowledge for production-ready deployments.

## Table of Contents

1. [Building Production Artifacts](#building-production-artifacts)
2. [Docker and Container Deployment](#docker-and-container-deployment)
3. [Configuration Management](#configuration-management)
4. [Monitoring and Observability](#monitoring-and-observability)
5. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Building Production Artifacts

### Production Build Process

OpenSearch Dashboards provides a comprehensive build system for creating production-ready distributions. The build process optimizes assets, manages dependencies, and creates platform-specific packages.

#### Build Command Options

```bash
# Basic production build
node scripts/build

# Build with specific options
node scripts/build --release                # Production-ready build
node scripts/build --all-platforms         # Build for all platforms
node scripts/build --linux                 # Linux x64 only
node scripts/build --linux-arm            # Linux ARM64 only
node scripts/build --darwin               # macOS x64 only
node scripts/build --darwin-arm           # macOS ARM64 only
node scripts/build --windows              # Windows x64 only
```

#### Build Options Reference

| Option | Description |
|--------|-------------|
| `--skip-archives` | Skip tar/zip archive creation |
| `--skip-os-packages` | Skip rpm/deb/docker package creation |
| `--rpm` | Build only RPM package |
| `--deb` | Build only DEB package |
| `--docker` | Build only Docker image |
| `--skip-docker-ubi` | Skip Docker UBI image creation |
| `--release` | Create release-ready distributable |
| `--version-qualifier` | Add version qualifier suffix |
| `--skip-node-download` | Reuse existing Node.js downloads |
| `--with-translations` | Include available translations |

### Build Pipeline Architecture

The build system (`src/dev/build/build_distributables.ts`) executes tasks in a specific order:

1. **Environment Preparation**
   - Verify build environment
   - Clean previous builds
   - Download/verify Node.js builds
   - Extract Node.js distributions

2. **Source Code Processing**
   - Copy source files
   - Copy translations (if enabled)
   - Copy binary scripts
   - Create required directories

3. **Package Building**
   - Build packages and dependencies
   - Build platform plugins
   - Transpile TypeScript/Babel code
   - Clean unnecessary files

4. **Distribution Creation**
   - Create platform-specific archives
   - Generate OS packages (RPM, DEB)
   - Build Docker images
   - Create checksums and signatures

### Artifact Optimization

#### Bundle Optimization

The `@osd/optimizer` package handles JavaScript bundle optimization:

```javascript
// Optimizer configuration example
const config = {
  repoRoot: REPO_ROOT,
  watch: false,           // Disable watch mode for production
  includeCoreBundle: true,
  cache: false,          // Disable cache for clean builds
  dist: true,            // Enable distribution mode
  profileWebpack: false,
  inspectWorkers: false
};
```

#### Asset Compression

Production builds automatically:
- Minify JavaScript and CSS
- Compress images and fonts
- Generate source maps (configurable)
- Tree-shake unused code
- Split code into optimized chunks

### Build Validation

#### Pre-build Checks
- Node.js version compatibility
- Required build tools availability
- Disk space verification
- Dependency resolution

#### Post-build Validation
```bash
# Verify build artifacts
./build/opensearch-dashboards/bin/opensearch-dashboards --version

# Check package integrity
sha256sum build/*.tar.gz
sha256sum build/*.zip
```

## Docker and Container Deployment

### Dockerfile Best Practices

OpenSearch Dashboards provides an optimized Dockerfile for production deployments:

```dockerfile
# Multi-stage build example
ARG NODE_VERSION=20.18.3
FROM node:${NODE_VERSION} AS base

# Security: Run as non-root user
RUN groupadd -r opensearch-dashboards && \
    useradd -r -g opensearch-dashboards opensearch-dashboards

# Install system dependencies
RUN apt-get update && \
    apt-get -y install \
      ca-certificates \
      fonts-liberation \
      libnss3 \
      lsb-release && \
    rm -rf /var/lib/apt/lists/*

USER opensearch-dashboards
```

### Multi-Stage Builds

Optimize Docker images using multi-stage builds:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine
RUN apk add --no-cache dumb-init
USER node
WORKDIR /usr/src/app
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/cli/dist"]
```

### Container Orchestration with Kubernetes

#### Basic Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensearch-dashboards
spec:
  replicas: 3
  selector:
    matchLabels:
      app: opensearch-dashboards
  template:
    metadata:
      labels:
        app: opensearch-dashboards
    spec:
      containers:
      - name: opensearch-dashboards
        image: opensearchproject/opensearch-dashboards:latest
        ports:
        - containerPort: 5601
        env:
        - name: OPENSEARCH_HOSTS
          value: "https://opensearch-cluster:9200"
        - name: SERVER_HOST
          value: "0.0.0.0"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/status
            port: 5601
          initialDelaySeconds: 120
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/status
            port: 5601
          initialDelaySeconds: 30
          periodSeconds: 10
```

#### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: opensearch-dashboards-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: opensearch-dashboards
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Environment Configuration in Containers

```yaml
# ConfigMap for environment-specific settings
apiVersion: v1
kind: ConfigMap
metadata:
  name: opensearch-dashboards-config
data:
  opensearch_dashboards.yml: |
    server.host: "0.0.0.0"
    server.port: 5601
    opensearch.hosts: ["https://opensearch:9200"]
    opensearch.ssl.verificationMode: full
    logging.dest: stdout
    logging.verbose: false
    ops.interval: 5000
```

## Configuration Management

### Production Configuration Patterns

OpenSearch Dashboards configuration (`config/opensearch_dashboards.yml`) supports extensive customization for production environments.

#### Core Server Settings

```yaml
# Server configuration
server.port: 5601
server.host: "0.0.0.0"  # Bind to all interfaces
server.basePath: "/dashboards"  # Reverse proxy path
server.rewriteBasePath: true
server.maxPayloadBytes: 1048576
server.name: "production-dashboards"

# Request handling
server.requestTimeout: 120000
server.socketTimeout: 120000
```

#### OpenSearch Connection

```yaml
# OpenSearch cluster configuration
opensearch.hosts:
  - "https://node1.opensearch.local:9200"
  - "https://node2.opensearch.local:9200"
  - "https://node3.opensearch.local:9200"

# Connection pooling
opensearch.requestTimeout: 30000
opensearch.pingTimeout: 3000
opensearch.startupTimeout: 5000

# Memory circuit breaker
opensearch.memoryCircuitBreaker.enabled: true
opensearch.memoryCircuitBreaker.maxPercentage: 0.95
```

### Security Configuration

#### SSL/TLS Configuration

```yaml
# Server SSL (browser to Dashboards)
server.ssl.enabled: true
server.ssl.certificate: /path/to/server.crt
server.ssl.key: /path/to/server.key
server.ssl.cipherSuites:
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256
  - ECDHE-ECDSA-AES256-GCM-SHA384

# OpenSearch SSL (Dashboards to OpenSearch)
opensearch.ssl.certificate: /path/to/client.crt
opensearch.ssl.key: /path/to/client.key
opensearch.ssl.certificateAuthorities: ["/path/to/ca.pem"]
opensearch.ssl.verificationMode: full
```

#### Authentication Settings

```yaml
# Basic authentication
opensearch.username: "opensearch_dashboards_system"
opensearch.password: "${OPENSEARCH_PASSWORD}"  # Use environment variable

# Request headers
opensearch.requestHeadersAllowlist:
  - authorization
  - x-forwarded-for
  - x-real-ip

# Custom headers
opensearch.customHeaders:
  X-Custom-Header: "production"
```

### Performance Tuning Parameters

```yaml
# Process management
pid.file: /var/run/opensearch-dashboards.pid

# Memory management
NODE_OPTIONS: "--max-old-space-size=4096"

# Worker threads
OPENSEARCH_DASHBOARDS_WORKER_THREADS: 4

# Optimize caching
data.search.aggs.shardDelay.enabled: true
data.autocomplete.valueSuggestions.terminateAfter: 100000

# Index patterns
opensearchDashboards.index: ".opensearch_dashboards"
opensearchDashboards.configIndex: ".opensearch_dashboards_config"
```

### Environment-Specific Settings

Use environment variables for flexible configuration:

```bash
# Production environment variables
export SERVER_HOST=0.0.0.0
export SERVER_PORT=5601
export OPENSEARCH_HOSTS=https://opensearch:9200
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export LOG_LEVEL=info
```

## Monitoring and Observability

### Application Monitoring Setup

OpenSearch Dashboards provides built-in metrics collection through the Metrics Service:

#### Metrics Collection

The metrics service (`src/core/server/metrics/metrics_service.ts`) collects:
- Process metrics (CPU, memory usage)
- Response times
- Request rates
- Error rates
- Connection pool statistics

```typescript
// Metrics service configuration
const metricsConfig = {
  interval: 30000,  // Collection interval in ms
  cGroupOverrides: {
    cpuPath: '/sys/fs/cgroup/cpu',
    cpuAcctPath: '/sys/fs/cgroup/cpuacct'
  }
};
```

### Health Checks and Status Monitoring

#### Status API Endpoints

```bash
# Overall status
GET /api/status

# Detailed status response
{
  "name": "opensearch-dashboards",
  "uuid": "5b2de169-2785-441b-ae8c-186a1936b17d",
  "version": {
    "number": "2.0.0",
    "build_hash": "unknown",
    "build_number": 1,
    "build_snapshot": false
  },
  "status": {
    "overall": {
      "state": "green",
      "title": "Green",
      "nickname": "Looking good",
      "icon": "success"
    },
    "statuses": [...]
  }
}
```

#### Implementing Health Checks

```yaml
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /api/status
    port: 5601
  initialDelaySeconds: 120
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

# Readiness probe
readinessProbe:
  httpGet:
    path: /api/status
    port: 5601
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
```

### Log Aggregation and Analysis

#### Logging Configuration

```yaml
# Logging settings
logging.dest: stdout  # Or file path
logging.silent: false
logging.quiet: false
logging.verbose: false  # Set to true for debugging
logging.json: true  # JSON format for log aggregators
logging.ignoreEnospcError: true  # Handle disk space errors

# Log rotation (when using file output)
logging.rotate:
  enabled: true
  everyBytes: 10485760  # 10MB
  keepFiles: 10
```

#### Structured Logging

```javascript
// Custom logger configuration
const loggerConfig = {
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%d{ISO8601} [%p] [%c] %m'
      }
    },
    file: {
      type: 'file',
      filename: '/var/log/opensearch-dashboards/app.log',
      layout: {
        type: 'json'
      }
    }
  },
  loggers: [
    {
      context: 'root',
      appenders: ['console', 'file'],
      level: 'info'
    },
    {
      context: 'opensearch.query',
      level: 'debug'  // Detailed query logging
    }
  ]
};
```

### Performance Monitoring

#### Metrics Collection Integration

```yaml
# Prometheus metrics endpoint
opensearchDashboards.metrics.enabled: true
opensearchDashboards.metrics.port: 5602

# StatsD integration
monitoring.ui.stats.enabled: true
monitoring.ui.stats.host: "statsd.monitoring.local"
monitoring.ui.stats.port: 8125
```

#### Application Performance Monitoring (APM)

```javascript
// APM agent configuration
const apm = require('elastic-apm-node').start({
  serviceName: 'opensearch-dashboards',
  secretToken: process.env.APM_TOKEN,
  serverUrl: process.env.APM_SERVER_URL,
  environment: 'production',
  captureBody: 'all',
  captureHeaders: true,
  transactionSampleRate: 0.1
});
```

## Troubleshooting Common Issues

### Common Deployment Problems and Solutions

#### Issue: High Memory Usage

**Symptoms:**
- Out of memory errors
- Slow response times
- Process crashes

**Solutions:**
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable memory circuit breaker
opensearch.memoryCircuitBreaker.enabled: true
opensearch.memoryCircuitBreaker.maxPercentage: 0.85

# Monitor memory usage
ps aux | grep opensearch-dashboards
cat /proc/$(pgrep -f opensearch-dashboards)/status | grep VmRSS
```

#### Issue: Connection Timeouts to OpenSearch

**Symptoms:**
- "OpenSearch is not reachable" errors
- Intermittent connection failures

**Solutions:**
```yaml
# Adjust timeout settings
opensearch.requestTimeout: 60000
opensearch.pingTimeout: 3000
opensearch.shardTimeout: 60000

# Configure retry logic
opensearch.sniffOnStart: false
opensearch.sniffInterval: false
opensearch.sniffOnConnectionFault: false

# Use optimized health check
opensearch.optimizedHealthcheck.enabled: true
opensearch.optimizedHealthcheck.id: "cluster_id"
```

### Performance Debugging in Production

#### Slow Query Analysis

```yaml
# Enable query logging
opensearch.logQueries: true
logging.verbose: true

# Query performance settings
opensearch.requestTimeout: 120000
data.search.timeout: 600000
```

#### Bundle Size Analysis

```bash
# Analyze bundle sizes
npm run analyze

# Check individual bundle sizes
ls -lah optimize/bundles/

# Monitor optimizer performance
OPTIMIZER_BUNDLE_STATS=true npm run build
```

### Memory and Resource Management

#### Memory Leak Detection

```javascript
// Memory profiling setup
const v8 = require('v8');
const fs = require('fs');

// Take heap snapshot
const heapSnapshot = v8.writeHeapSnapshot();
fs.writeFileSync('heap-' + Date.now() + '.heapsnapshot', heapSnapshot);

// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB'
  });
}, 30000);
```

#### Resource Limits Configuration

```yaml
# Docker resource limits
docker run -d \
  --memory="2g" \
  --memory-swap="2g" \
  --cpus="1.5" \
  opensearchproject/opensearch-dashboards

# Kubernetes resource management
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

### Network and Connectivity Issues

#### Reverse Proxy Configuration

```nginx
# Nginx configuration
server {
    listen 443 ssl;
    server_name dashboards.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /dashboards {
        proxy_pass http://localhost:5601;
        proxy_redirect off;
        proxy_buffering off;

        proxy_http_version 1.1;
        proxy_set_header Connection "Keep-Alive";
        proxy_set_header Proxy-Connection "Keep-Alive";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Load Balancer Health Checks

```yaml
# AWS ALB health check configuration
healthCheck:
  path: /api/status
  intervalSeconds: 30
  timeoutSeconds: 5
  healthyThresholdCount: 2
  unhealthyThresholdCount: 3
  matcher:
    httpCode: "200"
```

## Best Practices Summary

### Production Checklist

- [ ] Enable SSL/TLS for all connections
- [ ] Configure appropriate resource limits
- [ ] Set up monitoring and alerting
- [ ] Implement log aggregation
- [ ] Configure backup strategies
- [ ] Test disaster recovery procedures
- [ ] Document deployment procedures
- [ ] Establish rollback mechanisms
- [ ] Implement security scanning
- [ ] Configure auto-scaling policies

### Security Recommendations

1. **Network Security**
   - Use private networks for OpenSearch communication
   - Implement firewall rules
   - Enable SSL/TLS everywhere

2. **Access Control**
   - Implement authentication/authorization
   - Use service accounts with minimal permissions
   - Rotate credentials regularly

3. **Data Protection**
   - Encrypt data at rest
   - Secure backup storage
   - Implement audit logging

### Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancers
   - Implement session affinity if needed
   - Consider stateless deployments

2. **Vertical Scaling**
   - Monitor resource usage patterns
   - Right-size instances
   - Plan for peak loads

3. **Caching Strategies**
   - Implement browser caching
   - Use CDN for static assets
   - Configure query result caching

## Additional Resources

- [OpenSearch Dashboards Configuration Reference](https://opensearch.org/docs/latest/dashboards/install/configure/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [OpenSearch Security Plugin](https://opensearch.org/docs/latest/security-plugin/index/)

## Conclusion

Deploying OpenSearch Dashboards in production requires careful consideration of build processes, container orchestration, configuration management, monitoring, and troubleshooting strategies. This guide provides a foundation for production-ready deployments, but always adapt these practices to your specific requirements and constraints.

Remember to:
- Test thoroughly in staging environments
- Monitor continuously in production
- Keep documentation updated
- Plan for capacity and growth
- Implement proper backup and recovery procedures

For specific deployment scenarios or advanced configurations, consult the official OpenSearch documentation and community resources.