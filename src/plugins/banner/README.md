# Banner Plugin

This plugin adds a global banner to OpenSearch Dashboards that can display important announcements or notifications to users.

## Features

- Displays a prominent banner at the top of the OpenSearch Dashboards interface
- Automatically adjusts the layout to prevent content from being hidden behind the banner
- Supports markdown formatting for rich text content
- Dismissible by users
- Smooth transitions when showing/hiding the banner
- Feature flag to enable/disable the banner

## Configuration

To enable or disable the banner plugin, add the following to your `opensearch_dashboards.yml` file:

```yaml
# Enable or disable the banner plugin (default: false)
banner.enabled: true
```

## Usage

The banner plugin is designed to be simple and unobtrusive. It provides a global banner that appears at the top of the OpenSearch Dashboards interface.

### Basic Banner

This implementation includes:
- A basic banner with a configurable message
- Proper positioning and layout adjustments
- Dismiss functionality
- Markdown support for rich text and links

## Documentation

For more detailed technical information about the implementation, please see the [technical details](./docs/technical_details.md) document.
