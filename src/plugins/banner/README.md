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

# Configure the banner content and appearance
banner.content: "Important announcement or notification"
banner.color: "primary" # Options: primary, success, warning
banner.iconType: "iInCircle" # Any valid EUI icon type
banner.isVisible: true # Whether the banner is initially visible
banner.useMarkdown: true # Whether to render content as markdown
banner.size: "m" # Options: s (small), m (medium)

# External configuration
# Set the external link to fetch banner configuration from
# If provided, the banner will try to fetch configuration from this URL
# If the fetch fails, it will fall back to the settings above
# banner.externalLink: "https://example.com/banner-config.json"
```

### External Configuration

You can configure the banner to fetch its configuration from an external JSON endpoint. This is useful for centrally managing banner content across multiple OpenSearch Dashboards instances.

The external JSON file should have the following structure:

```json
{
  "content": "Important announcement or notification",
  "color": "primary",
  "iconType": "iInCircle",
  "isVisible": true,
  "useMarkdown": true,
  "size": "m"
}
```

All fields are optional. Any fields not provided will fall back to the local configuration in `opensearch_dashboards.yml`.

Field descriptions:
- `content`: The text content of the banner (supports markdown if useMarkdown is true)
- `color`: The color theme of the banner (options: "primary", "success", "warning")
- `iconType`: Any valid OUI icon type
- `isVisible`: Boolean indicating whether the banner should be displayed
- `useMarkdown`: Boolean indicating whether to render content as markdown
- `size`: The size of the banner (options: "s" for small, "m" for medium)

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
