## Version 2.2.0 Release Notes

#### Notable changes
* Bump node version to 14.20.0 ([#2101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2101))
* OpenSearch Dashboards uses [OUI](https://github.com/opensearch-project/oui) and its alias onto EUI ([#2080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2080))
* New experimental feature: adds the Drag and Drop editor to Visualize. Note this is disabled by default. Please enable by setting `wizard.enabled: true` in `opensearch_dashboards.yml` ([#1966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1966))

#### Deprecations
* Deprecate the Blacklist / Whitelist nomenclature ([#1808](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1808))

### 📈 Features/Enhancements
* Add DocView links pluggable injection capability ([#1200](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1200))
* Enable users to select custom vector map for visualization ([#1718](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1718))
* [UX] Restyle global breadcrumbs ([#1954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1954))
* [Feature] Adds the Drag and Drop editor to Visualize ([#1966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1966))
* Alias OUI onto EUI ([#2080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2080))

### 🛡 Security
* Bump terser from 4.8.0 to 4.8.1 ([#1930](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1930))
* Bump moment from 2.29.2 to 2.29.4 ([#1931](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1931))
* [CVE] Handle invalid query, index and date in vega charts filter handlers ([#1946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1946))
* Bump node version to 14.20.0 ([#2101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2101))

### 📝 Documentation
* [Docs] Add developer documentation for using/modifying the chrome service ([#1875](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1875))
* [Docs] Updates Code of Conduct ([#1964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1964))

### 🐛 Bug Fixes
* [Bug] Fix new issue link ([#1837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1837))
* Remove banner when editing maps visualization ([#1848](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1848))
* Fixes issue on saving custom vector map options as part of visualization ([#1896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1896))
* [BUG] Fixing some of the broken links in core plugin API documentations ([#1946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1946))
* [BUG] show region blocked warning config not respected ([#2042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2042))
* [BUG] Telemetry plugin cluster info rename error ([#2043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2043))
* [Bug] fix TSVB y-axis ([#2079](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2079))
* [Bug] Fix Global Breadcrumb Styling in dark mode ([#2085](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2085))

### 🚞 Refactor
* changes js code to ts in region_map ([#2084](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2084))

### 🛠 Maintenance
* [Version] Increment to 2.2 ([#1860](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1860))

### 🔩 Tests
* [CI][Tests] add BWC tests for 2.2.0 ([#1861](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1861))
* [CI] Clean up for BWC tests & run only on PRs for backports ([#1948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1948))