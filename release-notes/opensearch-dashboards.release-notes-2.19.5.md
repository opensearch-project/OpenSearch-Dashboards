# VERSION 2.19.5 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- Do not expose `VEGA_DEBUG` object to `window` by default ([#10511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10511))
- Add sanitization for axis label and name ([#10499](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10499))
- Use dompurify to sanitize URL and imageLabel ([#11252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11252))
- Add stricter sanitization on axis label and name in visualizations ([#11251](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11251))
- Add dompurify import ([#10691](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10691))
- Bump less to 4.1.3 to use disablePluginRule when in Markdown panel ([#11389](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11389))

### 📈 Features/Enhancements

### 🐛 Bug Fixes

- Prevent query re-execution on table column resize ([#11455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11455))
- Update checkForFunctionProperty to handle arrays ([#11404](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11404))
- Skip loading filter if navigating to a saved search without params ([#10913](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10913))
- Revert vega-lite to 4.16.8 ([#10853](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10853))

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

- Fix CVEs ([#11442](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11442))
- Update rimraf version to match node 18 ([#11431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11431))
- CVE vega changes ([#11436](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11436))

### 🪛 Refactoring

### 🔩 Tests
