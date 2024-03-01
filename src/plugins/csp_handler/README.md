# CspHandler

A OpenSearch Dashboards plugin

This plugin is to support updating Content Security Policy (CSP) rules dynamically without requiring a server restart. It registers a pre-response handler to `HttpServiceSetup` which can get CSP rules from a dependent plugin `applicationConfig` and then rewrite to CSP header. Users are able to call the API endpoint exposed by the `applicationConfig` plugin directly, e.g through CURL. Currently there is no new OSD page for ease of user interactions with the APIs. Updates to the CSP rules will take effect immediately. As a comparison, modifying CSP rules through the key `csp.rules` in OSD YAML file would require a server restart.

By default, this plugin is disabled. Once enabled, the plugin will first use what users have configured through `applicationConfig`. If not configured, it will check whatever CSP rules aggregated by the values of `csp.rules` from OSD YAML file and default values. If the aggregated CSP rules don't contain the CSP directive `frame-ancestors` which specifies valid parents that may embed OSD page, then the plugin will append `frame-ancestors 'self'` to prevent Clickjacking.

---

## Configuration

For OSD users who want to make changes to allow a new site to embed OSD pages, they can update CSP rules through CURL.
(Note that the commands following could be first obtained from a copy as curl option from the network tab of a browser development tool and then replaced with the API names)

```
curl '{osd endpoint}/api/config/csp/update' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty' --data-raw '{"value":"script-src 'unsafe-eval' 'self'; worker-src blob: 'self'; style-src 'unsafe-inline' 'self'; frame-ancestors 'self' {new site}"}'

```

Below is the CURL command to delete CSP rules.

```
curl '{osd endpoint}/api/config/csp/delete' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty'

```

Below is the CURL command to check if CSP rules exist in the new index.

```
curl '{osd endpoint}/api/config/csp/exists'
```

Below is the CURL command to get the CSP rules from the new index.

```
curl '{osd endpoint}/api/config/csp/get'

```

---
## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
