# OpenSearch Dashboards Reference Materials

This comprehensive reference guide provides quick access to essential information for OpenSearch Dashboards developers. Use this resource to find API documentation, configuration schemas, troubleshooting guides, and development patterns.

## Quick Navigation

### 1. [API Reference](./api-reference.md)
Complete API documentation for core services, plugin development, REST endpoints, and client-side APIs.

### 2. [Configuration Schema Reference](./configuration-reference.md)
Detailed configuration options for server settings, plugin configurations, environment variables, and advanced patterns.

### 3. [Plugin Development Templates](./plugin-templates.md)
Ready-to-use templates, patterns, and examples for building OpenSearch Dashboards plugins.

### 4. [Troubleshooting Guide](./troubleshooting-guide.md)
Solutions for common issues, debugging techniques, performance optimization, and error interpretation.

### 5. [Migration and Breaking Changes](./migration-guide.md)
Version upgrade guides, breaking changes documentation, and migration strategies.

### 6. [Glossary and Key Concepts](./glossary.md)
Essential terminology, architecture concepts, and common abbreviations.

## Quick Start Guides

### For Plugin Developers
1. Start with [Plugin Development Templates](./plugin-templates.md) for scaffolding
2. Reference the [API Reference](./api-reference.md) for available services
3. Check [Configuration Schema](./configuration-reference.md) for setup options
4. Use [Troubleshooting Guide](./troubleshooting-guide.md) when issues arise

### For Core Contributors
1. Review [API Reference](./api-reference.md) for core service interfaces
2. Understand [Migration Guide](./migration-guide.md) for compatibility
3. Reference [Glossary](./glossary.md) for terminology consistency
4. Follow patterns in [Plugin Templates](./plugin-templates.md) for examples

### For DevOps Engineers
1. Focus on [Configuration Schema Reference](./configuration-reference.md)
2. Use [Troubleshooting Guide](./troubleshooting-guide.md) for deployment issues
3. Check [Migration Guide](./migration-guide.md) for upgrade planning
4. Reference environment variables in [Configuration Schema](./configuration-reference.md)

## Search Tips

### Finding Specific Information
- **API Methods**: Search in [API Reference](./api-reference.md) using method names
- **Config Options**: Use Ctrl+F in [Configuration Reference](./configuration-reference.md)
- **Error Messages**: Check [Troubleshooting Guide](./troubleshooting-guide.md) error section
- **Terms/Concepts**: Look up in [Glossary](./glossary.md)
- **Version Changes**: Search version numbers in [Migration Guide](./migration-guide.md)

### Common Search Patterns
```
# Find HTTP API endpoints
Search: "POST /api" or "GET /api"

# Find configuration options
Search: "opensearchDashboards." or "server."

# Find service APIs
Search: "core." or "plugin."

# Find error codes
Search: "ERROR:" or "FATAL:"
```

## Contributing to Reference Materials

### Adding New Content
1. Follow the established structure in each reference document
2. Include code examples and practical use cases
3. Cross-reference related documentation
4. Keep entries concise and searchable
5. Update the table of contents when adding sections

### Maintaining Accuracy
- Verify API signatures against source code
- Test configuration examples
- Update version-specific information
- Remove deprecated content
- Add migration notes for breaking changes

## Related Documentation

### Core Documentation
- [Core Framework Architecture](../core_framework_architecture.md)
- [Plugin System](../plugin_system.md)
- [UI Framework and Components](../ui_framework_and_components.md)
- [Data Services and API Patterns](../data_services_api_patterns.md)

### External Resources
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenSearch Dashboards GitHub](https://github.com/opensearch-project/OpenSearch-Dashboards)
- [Community Forums](https://forum.opensearch.org/)
- [Contributing Guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md)

## Version Information

This reference documentation is maintained for:
- **Current Version**: OpenSearch Dashboards 2.x
- **Minimum Version**: 2.0.0
- **API Stability**: Core APIs are stable, plugin APIs may change
- **Last Updated**: Check individual reference documents for update dates

## Quick Reference Card

### Essential Commands
```bash
# Generate new plugin
yarn osd generate plugin_name

# Start development server
yarn start

# Run tests
yarn test:jest
yarn test:functional

# Build for production
yarn build --skip-os-packages

# Check types
yarn typecheck

# Lint code
yarn lint
```

### Key File Locations
```
config/opensearch_dashboards.yml  # Main configuration
src/core/                         # Core services
src/plugins/                      # Built-in plugins
plugins/                          # Custom plugins
packages/                         # Shared packages
docs/                            # Documentation
```

### Development Ports
- **5601**: OpenSearch Dashboards (default)
- **9200**: OpenSearch (default)
- **9220**: Test OpenSearch instance
- **5620**: Functional test server

## Need Help?

- **Quick answers**: Search this reference guide
- **Detailed explanations**: Check linked documentation
- **Community support**: Visit forums or GitHub discussions
- **Bug reports**: File issues on GitHub
- **Feature requests**: Propose in GitHub discussions