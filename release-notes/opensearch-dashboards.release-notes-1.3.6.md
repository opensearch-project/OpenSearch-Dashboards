## Version 1.3.6 Release Notes

### 📈 Features/Enhancements

* Custom healthcheck with filters ([#2232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2232), [#2277](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2277)). To configure see example in [config/opensearch_dashboards.yml](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/6e2ec97459ae179c86201c611ce744c2c24ce150/config/opensearch_dashboards.yml#L44-L46)
### 🛡 Security

* [CVE-2021-3807] Resolves ansi-regex to v5.0.1 ([#2425](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2425))
* [CVE-2022-23713] Handle invalid query, index and date in vega charts filter handlers ([#1932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1932))
* Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
* Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
* [CVE-2022-0144] Bump shelljs from 0.8.4 to 0.8.5 ([#2511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2511))

### 🚞 Infrastructure

* Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
* Extends plugin-helpers to be used for automating version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398),[#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🛠 Maintenance

* Version Increment to 1.3.6 ([#2420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2420))

### 🔩 Tests

* Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))