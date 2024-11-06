# XCompat-plugin-example1

## Description
Example Plugin XCompat-plugin-example1 is a demonstration plugin for OpenSearch that showcases how to perform cross-compatibility checks and integrate with the OpenSearch Dashboards UI.

## Features
* Registers an application into the side navigation menu of OpenSearch Dashboards.
* Performs a cross-compatibility check to ensure required engine plugins are installed on the cluster.
* Provides a greeting message.

## Usage
Once the plugin is installed and OpenSearch Dashboards is running, you can access the application by navigating to the appropriate location in the side navigation menu.

## Configuration
No additional configuration is required for this plugin.

## Cross-Compatibility Check
The plugin performs a cross-compatibility check by making a fetch request to its API endpoint (/api/example_plugin_1/verify_crosscompatability). It ensures that the required engine plugins are installed on the cluster. If the check fails, the plugin's navigation link is disabled.

## Greeting Message
The plugin provides a greeting message that can be accessed via the getGreeting() method. This message demonstrates internationalization capabilities using i18n.

## Contributing
Contributions to this plugin are welcome. Please follow the standard procedures for contributing to OpenSearch plugins.

## License
This plugin is licensed under the Apache License 2.0. See the LICENSE file for more details.

## Support
For any issues or questions, please raise an issue on the GitHub repository of this plugin.

## Disclaimer
This plugin is provided as an example and may not be suitable for production use without modifications. Use it at your own risk.

---

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.

    ## Scripts
    <dl>
      <dt><code>yarn osd bootstrap</code></dt>
      <dd>Execute this to install node_modules and setup the dependencies in your plugin and in OpenSearch Dashboards
      </dd>

      <dt><code>yarn plugin-helpers build</code></dt>
      <dd>Execute this to create a distributable version of this plugin that can be installed in OpenSearch Dashboards
      </dd>
    </dl>
