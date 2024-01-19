# ConfigurationProvider

A OpenSearch Dashboards plugin

This plugin introduces the support of a dynamic configuration as opposed to the existing static configuration in OSD YAML file. It stores the configuration in an index whose default name is `.opensearch_dashboards_config` and could be customized through the key `opensearchDashboards.dynamic_config_index` in OSD YAML file `opensearch_dashboards.yml`. It also provides an interface `ConfigurationClient` for future extensions of external configuration providers. By default, an implementation based on OpenSearch as database is used.

The first use case onboarding to this new index is to support updating Content Security Policy (CSP) rules dynamically without requiring a server restart. It registers a pre-response handler to `HttpServiceSetup` which can get CSP rules from the new index and then rewrite to CSP header. The plugin exposes query and update APIs for OSD users to use against CSP rules. Currently there is no new OSD page for ease of user interactions with the APIs. Users are able to call the API endpoint directly, e.g through CURL. Updates to the CSP rules will take effect immediately. As a comparison, modifying CSP rules through the key `csp.rules` in OSD YAML file would require a server restart.

---

## Configuration

By default, the new index does not exist. For OSD users who do not need customized CSP rules, there is no need to create this index. The system will then use whatever CSP rules aggregated by the values of `csp.rules` from OSD YAML file and default values.

Below is the current default value.

```
"script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self'"
```
(Note that `frame-ancestors 'self'` is used to only allow self embedding and prevent clickjacking by default.)

For OSD users who want to make changes to allow a new site to embed OSD pages, they can update CSP rules through CURL.
(Note that the commands following could be first obtained from a copy as curl option from the network tab of a browser development tool and then replaced with the API names)

```
curl '{osd endpoint}/api/configuration/updateCspRules' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty' --data-raw '{"value":"script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self' {new site}"}'

```

Below is the CURL command to delete CSP rules.

```
curl '{osd endpoint}/api/configuration/deleteCspRules' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty'

```

Below is the CURL command to check if CSP rules exist in the new index.

```
curl '{osd endpoint}/api/configuration/existsCspRules'
```

Below is the CURL command to get the CSP rules from the new index.

```
curl '{osd endpoint}/api/configuration/getCspRules'

```

## External Configuration Providers
While a default OpenSearch based client is implemented, OSD users can use external configuration clients through an OSD plugin (outside OSD).

Let's call this plugin `MyConfigurationClientPlugin`.

First, this plugin will need to implement a class `MyConfigurationClient` based on interface `ConfigurationClient` defined in the `types.ts` under directory `src/plugins/configuration_provider/server/types.ts`.

Second, this plugin needs to declare `configurationProvider` as its dependency by adding it to `requiredPlugins` in its own `opensearch_dashboards.json`.

Third, the plugin will import the type `ConfigurationProviderPluginSetup` from the corresponding `types.ts` and add to its own setup input. Below is the skeleton of the class `MyConfigurationClientPlugin`.

```
// MyConfigurationClientPlugin
  public setup(core: CoreSetup, { configurationProviderPluginSetup }: ConfigurationProviderPluginSetup) {

    ...
    // The function createClient provides an instance of ConfigurationClient which
    // could have a underlying DynamoDB or Postgres implementation.
    const myConfigurationClient: ConfigurationClient = this.createClient();

    configurationProviderPluginSetup.setConfigurationClient(myConfigurationClient);
     ...
    return {};
  }

```

---
## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
