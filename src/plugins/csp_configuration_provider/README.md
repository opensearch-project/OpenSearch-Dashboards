# CspConfigurationProvider

A OpenSearch Dashboards plugin

This plugin introduces the support of self service dynamic configuration of Content Security Policy (CSP) rules without requiring a server restart. It registers a pre-response handler to `HttpServiceSetup` which can get CSP rules from a new index `.opensearch_dashboards_config` and then rewrite to CSP header. OSD users could update the content of the index with new CSP rules and the change will take effect immediately.

It also provides an interface `CspClient` for future extensions of external CSP providers. By default, an implementation based on OpenSearch as database is used.

---

## Configuration

By default, the new index does not exist. For OSD users who do not need customized CSP rules, there is no need to create this index. The system will then use whatever CSP rules aggregated by the values of `csp.rules` from `opensearch_dashboards.yml` and default values.

Below is the current default value.

```
"script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self'"
```
(Note that `frame-ancestors 'self'` is used to only allow self embedding and prevent clickjacking by default.)

For OSD users who want to make changes, e.g allow this site `https://example-site.org` to embed OSD pages, they can update the index from DevTools Console.

```
PUT .opensearch_dashboards_config/_doc/csp.rules
{
  "value": "script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self' https://example-site.org"
}

```

## External CSP Clients
While a default OpenSearch based client is implemented, OSD users can use external CSP clients through an OSD plugin (outside OSD).

Let's call this plugin `MyCspClientPlugin`.

First, this plugin will need to implement a class `MyCspClient` based on interface `CspClient` defined in the `types.ts` under directory `src/plugins/csp_configuration_provider/server/types.ts`.

Second, this plugin needs to declare `cspConfigurationProvider` as its dependency by adding it to `requiredPlugins` in its own `opensearch_dashboards.json`.

Third, the plugin will import the type `CspConfigurationProviderPluginSetup` from the corresponding `types.ts` and add to its own setup input. Below is the skeleton of the class `MyCspClientPlugin`.

```
// MyCspClientPlugin
  public setup(core: CoreSetup, { cspConfigurationProviderPluginSetup }: CspConfigurationProviderPluginSetup) {

    ...
    // The function createClient provides an instance of MyCspClient which
    // could have a underlying DynamoDB or Postgres implementation.
    const myCspClient: CspClient = this.createClient();

    cspConfigurationProviderPluginSetup.setCspClient(myCspClient);
     ...
    return {};
  }

```

---
## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
