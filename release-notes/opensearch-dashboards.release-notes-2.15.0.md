## What's Changed
### 📈 Features/Enhancements
*  [MQL] support enhancing language selector (#6613) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6760
*  [MDS] Modify toast + popover warning to include incompatible datasources in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6746
*  [MDS] Support for Timeline in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6493
*  Make Field Name Search Filter Case Insensitive in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6761
*  Add Server Side batching for UI Metric Collectors in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6819
*  [Workspace] Dashboard admin(groups/users) implementation in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6829
*  [Multiple Datasource] Add data source selection service to support storing and getting selected data source updates in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6875
*  [Multiple datasource] Adjust the padding size for aggregated view in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6896
*  [OSCI][FEAT] Changelog Project - PoC Changelog and release notes automation tool in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6918
*  [MD]Remove endpoint validation for create data source saved object API in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6927
*  [MD]Use placeholder for data source credentials fields when export saved object in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6931
*  Modify the adding sample data part for timeline in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6934
* [Multiple DataSource] Do not support import data source object to Local cluster when not enable data source in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6913
*  [MDS] Fix sample data to use datasources for TSVB visualizations in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6943
* [MDS] Use DataSourceError to replace Error in getDataSourceById call in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6952
*  Fix web log sample visualization & vis-builder not rendering with data source issue in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6958
*  [Data Explorer] Allow render from View directly, not from Data Explorer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6959
*  [Workspace]Change workspace description field to textarea in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6960
*  [Workspace]Feat add use cases to workspace form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6967
*  Use JSON11 for handling long numerals (#6915) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6970
*  [VisBuilder] Change VisBuilder from experimental to production in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6971
*  Modify the import for timeline visualization to includes data source name in MDS scenario in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6975
* [Manual Backport 2.x] Add missing aria-label for discover page in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6987

### 🐛 Bug Fixes
*  add http://www.site.com to lycheeignore in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6781
*  [Workspace] Fix: Show a error toast when workspace read only user delete saved objects in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6783
*  [Workspace] Fix workspace name duplication check in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6813
*  fix vega visualization error message not been formatted in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6840
*  [MD] Fix server sider endpoint validation by passing in request when creating datasource client in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6824
*  Fix index pattern data source reference not updated in sample data in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6853
* [Bug] Remove unused import and property (#6879) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6884
*  fix for quickrange to use datemath to parse datetime strings in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6834
*  [BUG] fix default data source bug in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6912
*  Bug Fixes for Vis Builder in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6891
*  [Discover][Bug] Migrate global state from legacy URL in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6909
* Revert 815d2bd7c612450e2a15a6543c7e74558adf4a81 "[Manual Backport 2.x] Feat (core): Make theme settings user-specific and user-configurable (#5652) (#6681)" in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6978

### 🛡 Security
*  Bump tar from 6.1.13 to 6.2.1 in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6914
* [CVE-2024-33883] Bump ejs from `3.1.7` to `3.1.10` in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6924
* [GHSA-x565-32qp-m3vf] Bump `jimp` to remove phin dependency (#6977) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6985

### 🚞 Infrastructure
*  [Release] Add release.yml for release notes automation in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7005

### 📝 Documentation
*  Add OpenAPI specification for get and create saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6801
*  Updating security reachout email in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6787
*  Add openAPI doc for saved_object find api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6858
*  Add OpenAPI specification for bulk create and bulk update saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6863
*  Add OpenAPI specification for update, delete and migrate saved object API in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6866
*  Add OpenAPI specification for bulk_get saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6865
* Add example in create API for create index pattern, vega visualizatinn, dashboards for docs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6867
*  Add OpenAPI specification for import and export saved object api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6883
*  Add OpenAPI specifications for resolve import errors api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6886
*  docs: remove `attributes.` in SavedObjectsFindOptions.fields example in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6917
*  Update sidecar z-index style in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6968
*  Add changelog for #6898 in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6993
*  Add missing change log for PR 6872, 6903 in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6995

### 🛠 Maintenance
*  add @zhyuanqi as a maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6789
*  Move @BSFishy to emeritus maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6793
*  add @mengweieric as maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6800
*  Update json5 dependency in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6946
*  Add Suchit to be a maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6997

### 🪛 Refactoring
*  [Multi Datasource] Unify getDefaultDataSourceId and export in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6882

### 🔩 Tests
*  [Multiple Datasource Test]add more test for icon and aggregated view in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6740
*  [Multiple Datasource Test] Add test for edit data source form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6758
*  [Multiple Datasource Test] Add test for error_menu, item, data_source_multi_selectable in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6768
*  [Multiple Datasource Test]Add test for toast button and validation form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6804
