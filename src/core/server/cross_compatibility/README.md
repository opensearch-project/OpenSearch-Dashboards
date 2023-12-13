## Cross Compatibility Service

The cross compatibility service provides a way for OpenSearch Dashboards plugins to check if they are compatible with the installed OpenSearch plugins. This allows plugins to gracefully degrade their functionality or disable themselves if they are not compatible with the current OpenSearch plugin version.

### Overview

OpenSearch Dashboards plugins depend on specific versions of OpenSearch plugins. When a plugin is installed, OpenSearch Dashboards checks to make sure that the required OpenSearch plugins are installed and compatible. If a required plugin is not installed or is not compatible, OpenSearch Dashboards will log a warning but will still allow the plugin to start.

The cross compatibility service provides a way for plugins to check for compatibility with their OpenSearch counterparts. This allows plugins to make informed decisions about how to behave when they are not compatible. For example, a plugin could disable itself, limit its functionality, or notify the user that they are using an incompatible plugin.

### Usage

To use the Cross Compatibility service, plugins can call the `verifyOpenSearchPluginsState()` API. This API checks the compatibility of the plugin with the installed OpenSearch plugins. The API returns a list of `CrossCompatibilityResult` objects, which contain information about the compatibility of each plugin.

The `CrossCompatibilityResult` object has the following properties:

`pluginName`: The OpenSearch Plugin name.
`isCompatible`: A boolean indicating whether the plugin is compatible.
`incompatibilityReason`: The reason the OpenSearch Plugin version is not compatible with the plugin.
`installedVersions`: The version of the plugin that is installed.

Plugins can use the information in the `CrossCompatibilityResult` object to decide how to behave. For example, a plugin could disable itself if the `isCompatible` property is false.

The `verifyOpenSearchPluginsState()` API should be called from the `start()` lifecycle method. This allows plugins to check for compatibility before they start.

### Example usage inside DashboardsSample Plugin

```
export class DashboardsSamplePlugin implements Plugin<DashboardsSamplePluginSetup, DashboardsSamplePluginStart> {

    public setup(core: CoreSetup) {
        this.logger.debug('Dashboard sample plugin setup');
        this.capabilitiesService = core.capabilities;
        return {};
    }
    public start(core: CoreStart) {
        this.logger.debug('Dashboard sample plugin: Started');
        exampleCompatibilityCheck(core);
        return {};
    }
    ......

    // Example capability provider
    export const capabilitiesProvider = () => ({
        exampleDashboardsPlugin: {
            show: true,
            createShortUrl: true,
        },
    });

    function exampleCompatibilityCheck(core: CoreStart) {
        const pluginName = 'exampleDashboardsPlugin';
        const result = await core.versionCompatibility.verifyOpenSearchPluginsState(pluginName);
        result.forEach((mustHavePlugin) => {
            if (!mustHavePlugin.isCompatible) {
                // use capabilities provider API to register plugin's capability to enable/disbale plugin
                this.capabilitiesService.registerProvider(capabilitiesProvider);
              }
            else { // feature to enable when plugin has compatible version installed }
        });
        ......
    }
    .....
}

```
The `exampleCompatibilityCheck()` function uses the `verifyOpenSearchPluginsState()` API to check for compatibility with the `DashboardsSample` plugin. If the plugin is compatible, the function enables the plugin's features. If the plugin is not compatible, the function gracefully degrades the plugin's functionality.

### Use cases:

The cross compatibility service can be used by plugins to:

* Disable themselves if they are not compatible with the installed OpenSearch plugins.
* Limit their functionality if they are not fully compatible with the installed OpenSearch plugins.
* Notify users if they are using incompatible plugins.
* Provide information to users about how to upgrade their plugins.

The cross compatibility service is a valuable tool for developers who are building plugins for OpenSearch Dashboards. It allows plugins to be more resilient to changes in the OpenSearch ecosystem.