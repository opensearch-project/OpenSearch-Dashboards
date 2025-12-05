# VERSION 3.0.0-beta1 Release Note

### 💥 Breaking Changes

 - Bump `monaco-editor` from 0.17.0 to 0.30.1 ([#9497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9497))
 - Remove the deprecated "newExperience" table option in discover ([#9531](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9531))
 - Bump monaco-editor from 0.30.1 to 0.52.0 ([#9618](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9618))

### Deprecations

### 🛡 Security

 - Bump vega from 5.23.0 to 5.32.0 ([#9623](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9623))
 - Resolve CVE-2024-53392 by bumping prismjs to 1.30.0 ([#9634](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9634))
 - Bump @babel/runtime to 7.26.10 and tar-fs to 1.2.2 for CVE-2025-27789 and CVE-2024-12905 ([#9649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9649))

### 📈 Features/Enhancements

 - Lighthouse Page Performance Metrics CI workflow ([#9304](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9304))
 - Support streaming when content type is event stream ([#9647](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9647))
 - Enable experimental data plugin's __enhance ([#9655](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9655))
 - Add resultsActionBar into data plugin's __enhance ([#9655](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9655))

### 🐛 Bug Fixes

 - Fixing when find saved objects within a workspace returns saved objects in all the workspaces ([#9420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9420))
 - Prevent user from visiting discover when out of a workspace ([#9465](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9465))
 - Fix potential memory leak in getDirectQueryConnections ([#9575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9575))
 - Permissions for github workflow in bundler performance testing ci ([#9581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9581))
 - Query assistant doesn't refresh generated ppl ([#9601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9601))
 - Trim the url for creating data source ([#9637](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9637))

### 🚞 Infrastructure

### 📝 Documentation

 - Add Joey Liu (`@Maosaic`) as maintainer ([#9467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9467))
 - Getting started with Discover 2.0 ([#9525](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9525))

### 🛠 Maintenance

### 🪛 Refactoring

### 🔩 Tests

 - Reenable saved search cypress tests ([#9628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9628))