# `/api/stats`

This API returns the metrics for the OpenSearch Dashboards server and usage stats. It allows the [Metricbeat OpenSearch Dashboards module](https://opensearch.org/docs/latest/clients/agents-and-ingestion-tools/index/) to collect the stats metricset.

By default, it returns the simplest level of stats; consisting of the OpenSearch Dashboards server's ops metrics, version, status, and basic config like the server name, host, port, and locale.

However, the information detailed above can be extended, with the combination of the following 3 query parameters:

| Query Parameter | Default value | Description                                                                                                                                                                                                                                                        |
| :-------------- | :-----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extended`      |    `false`    | When `true`, it adds `clusterUuid` and `usage`. The latter contains the information reported by all the Usage Collectors registered in the OpenSearch Dashboards server. It may throw `503 Stats not ready` if any of the collectors is not fully initialized yet. |
| `legacy`        |    `false`    | By default, when `extended=true`, the key names of the data in `usage` are transformed into API-friendlier `snake_case` format (i.e.: `clusterUuid` is transformed to `cluster_uuid`). When this parameter is `true`, the data is returned as-is.                  |
| `exclude_usage` |    `false`    | When `true`, and `extended=true`, it will report `clusterUuid` but no `usage`.                                                                                                                                                                                     |

## Known use cases

Metricbeat OpenSearch Dashboards's stats metricset uses this API to collect the metrics (every 10s) and usage (only once every 24h), and then reports them to the Monitoring cluster. They call this API in 2 ways:

1. Metrics-only collection (every 10 seconds): `GET /api/stats?extended=true&legacy=true&exclude_usage=true`
2. Metrics+usage (every 24 hours): `GET /api/stats?extended=true&legacy=true&exclude_usage=false`
