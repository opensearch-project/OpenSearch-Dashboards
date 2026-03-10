# VERSION 2.19.5 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

### 📈 Features/Enhancements

### 🐛 Bug Fixes

 - Fix vega data url with signal not working ([#10339](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10339))
 - Add sanitization for axis label and name ([#10499](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10499))
 - Do not expose `VEGA_DEBUG` object to `window` by default ([#10511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10511))
 - Add dompurify import ([#10691](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10691))
 - Revert vega-lite to 4.16.8 ([#10853](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10853))
 - Skip loading filter if navigating to a saved search without params ([#10913](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10913))
 - Add stricter sanitization on axis label and name in visualizations ([#11251](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11251))
 - Use dompurify to sanitize URL and imageLabel ([#11252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11252))
 - Bump less to 4.1.3 to use disablePluginRule when in Markdown panel ([#11389](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11389))
 - Update checkForFunctionProperty to handle arrays ([#11404](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11404))
 - Prevent query re-execution on table column resize ([#11455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11455))

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

 - CVE Fixed for 2.19, Update Webpack to support jspdf upgrade ([#10828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10828))
 - Release notes for 2.19.4 ([#10838](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10838))
 - CVE Medium fixes ([#10839](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10839))
 - Update rimraf version to match node 18 ([#11431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11431))
 - Fix CVEs ([#11442](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11442))

### 🪛 Refactoring

### 🔩 Tests