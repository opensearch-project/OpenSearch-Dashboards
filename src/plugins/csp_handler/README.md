# CspHandler

A OpenSearch Dashboards plugin

This plugin is to support updating the `frame-ancestors` directive in Content Security Policy (CSP) rules dynamically without requiring a server restart. It registers a pre-response handler to `HttpServiceSetup` which can get the `frame-ancestors` directive from a dependent plugin `applicationConfig` and then rewrite to CSP header. It will not change other directives. Users are able to call the API endpoint exposed by the `applicationConfig` plugin directly, e.g through CURL. The configuration key is `csp.rules.frame-ancestors`. Currently there is no new OSD page for ease of user interactions with the APIs. Updates to the `frame-ancestors` directive will take effect immediately. As a comparison, modifying CSP rules through the key `csp.rules` in OSD YAML file would require a server restart.

By default, this plugin is disabled. Once enabled, the plugin will first use what users have configured through `applicationConfig`. If not configured, it will check whatever CSP rules aggregated by the values of `csp.rules` from OSD YAML file and default values. If the aggregated CSP rules don't contain the CSP directive `frame-ancestors` which specifies valid parents that may embed OSD page, then the plugin will append `frame-ancestors 'self'` to prevent Clickjacking.

---

## Configuration

The plugin can be enabled by adding this line in OSD YML.

```
csp_handler.enabled: true

```

Since it has a required dependency `applicationConfig`, make sure that the dependency is also enabled.

```
application_config.enabled: true
```

For OSD users who want to make changes to allow a new site to embed OSD pages, they can update the `frame-ancestors` directive through CURL. (See the README of `applicationConfig` for more details about the APIs.) **Please note that use backslash as string wrapper for single quotes inside the `data-raw` parameter. E.g use `'\''` to represent `'`**

```
curl '{osd endpoint}/api/appconfig/csp.rules.frame-ancestors' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty' --data-raw '{"newValue":"{new value}"}'

```

Below is the CURL command to delete the `frame-ancestors` directive.

```
curl '{osd endpoint}/api/appconfig/csp.rules.frame-ancestors' -X DELETE -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty'
```

Below is the CURL command to get the `frame-ancestors` directive.

```
curl '{osd endpoint}/api/appconfig/csp.rules.frame-ancestors'

```

---
## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
