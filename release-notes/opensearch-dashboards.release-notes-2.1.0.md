## Version 2.1.0 Release Notes

#### Deprecations
* Changes config name in yml file to new non-deprecated name ([#1485](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1485))
* Deprecate isDevClusterMaster in favor of isDevClusterManager ([#1719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1719))
* Deprecate setupMaster in favor of setupClusterManager ([#1752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1752))
* Deprecate master nodes and replace with cluster_manager nodes ([#1761](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1761))
* Replace master in comments ([#1778](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1778))
* Replace references to master branch with main ([#1780](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1780))
* Deprecate master_timeout in favor of cluster_manager_timeout ([#1788](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1788))
* Deprecate the apiVersion: master value and replace with main ([#1799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1799))
* Deprecate cat master API in favor of cat cluster_manager ([#1800](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1800))

### 🛡 Security
* Adding noreferrer on doc links ([#1709](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1709))
* [CVE-2022-25851] Resolve jpeg-js to 0.4.4 ([#1753](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1753))
* [CVE-2022-33987] Bump tsd from 0.16.0 to 0.21.0 ([#1770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1770))

### 📈 Enhancements
* Logic to enable extensibility for the maps plugin ([#1632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1632))
* [Consolidated global header] Use `opensearchDashboards.branding.useExpandedHeader: false` to use the consolidated menu and global header bar. ([#1586](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1586)) ([#1802](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1802))

### 🚞 Infrastructure
* Allow Node patch versions to be higher on runtime if bundled Node is not available ([#1189](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1189))

### 📝 Documentation
* [Admin] Adds Josh Romero as co-maintainer ([#1682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1682))
* Fixes formatting and typos in documentation ([#1697](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1697))

### 🛠 Maintenance
* [Version] Increment to 2.1 ([#1503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1503))

### 🔩 Tests
* Migrate mocha tests to jest ([#1553](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1553))
* Add backwards compatibility tests to github actions ([#1624](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1624))
* Date range for tests incorrect params related to backwards compatibility tests ([#1772](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1772))
* Update tests to reflect max zoom level for maps ([#1823](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1823))
  * Maps zoom levels updated from current zoom level 10 to zoom level 14 on coordinate and region maps. This feature helps you visualize more granular geo data
