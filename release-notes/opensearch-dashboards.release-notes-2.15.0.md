## What's Changed
### 📈 Features/Enhancements
* [MQL] support enhancing language selector (#6613) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6760
* [MDS] Modify toast + popover warning to include incompatible datasources in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6746
* [MDS] Support for Timeline in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6493
* Make field name search filter case insensitive in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6761
* Add server side batching for UI Metric Collectors in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6819
* [Workspace] Add Dashboard admin (groups/users) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6829
* [Multiple Datasource] Add data source selection service to support storing and getting selected data source updates in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6875
* [Multiple datasource] Adjust the padding size for aggregated view in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6896
* [OSCI] Changelog Project - PoC Changelog and release notes automation tool in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6918
* [MD] Remove endpoint validation for create data source saved object API in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6927
* [MD] Use placeholder for data source credentials fields when export saved object in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6931
* Modify the adding sample data part for timeline in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6934
* [Multiple DataSource] Do not support import data source object to Local cluster when not enable data source in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6913
* [MDS] Fix sample data to use datasources for TSVB visualizations in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6943
* [MDS] Use DataSourceError to replace Error in getDataSourceById call in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6952
* Fix web log sample visualization & vis-builder not rendering with data source issue in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6958
* [Data Explorer] Allow render from View directly, not from Data Explorer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6959
* [Workspace] Change workspace description field to textarea in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6960
* [Workspace] Feat add use cases to workspace form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6967
* Use JSON11 for handling long numerals (#6915) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6970
* [VisBuilder] Change VisBuilder from experimental to production in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6971
* Modify the import for timeline visualization to includes data source name in MDS scenario in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6975
* Add missing aria-label for discover page in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6987

### 🐛 Bug Fixes
* Prevent link checker errors for http://www.site.com in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6781
* [Workspace] Fix: Show a error toast when workspace read only user delete saved objects in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6783
* [Workspace] Fix workspace name duplication check in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6813
* Format vega visualization error messages in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6840
* [MD] Fix server side endpoint validation by passing in request when creating datasource client in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6824
* Update index pattern data source references of sample data in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6853
* [Bug] Remove unused import and property (#6879) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6884
* Make `quickrange` use `datemath` to parse datetime strings in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6834
* [BUG] fix default data source bug in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6912
* [VisBuilder] Make toggle legend affordance work after initial toggle in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6891
* [VisBuilder] Prevent configuration pane from getting cut off when dragging fields in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6891
* [Discover] Migrate global state from legacy URL in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6909
* [NewHomePage] Temp Solution to avoid crash for anonymous user with no write permission in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7054
* [Discover] Allow the last column of a table wider than the window to show up properly in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7058

### 🛡 Security
* Bump `tar` from `6.1.13` to `6.2.1` in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6914
* [CVE-2024-33883] Bump `ejs` from `3.1.7` to `3.1.10` in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6924
* [GHSA-x565-32qp-m3vf] Bump `jimp` to remove `phin` dependency (#6977) in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6985

### 🚞 Infrastructure
* [Release] Add release.yml for release notes automation in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7005

### 📝 Documentation
* Add OpenAPI specification for get and create saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6801
* Updating security reachout email in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6787
* Add OpenAPI doc for saved_object find api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6858
* Add OpenAPI specification for bulk create and bulk update saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6863
* Add OpenAPI specification for update, delete and migrate saved object API in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6866
* Add OpenAPI specification for bulk_get saved object APIs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6865
* Add example in create API for create index pattern, vega visualizatinn, dashboards for docs in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6867
* Add OpenAPI specification for import and export saved object api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6883
* Add OpenAPI specifications for resolve import errors api in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6886
* Remove `attributes.` in SavedObjectsFindOptions.fields example in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6917
* Update sidecar `z-index` style in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6968

### 🛠 Maintenance
* Add @zhyuanqi as a maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6789
* Move @BSFishy to emeritus maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6793
* Add @mengweieric as a maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6800
* Update JSON5 dependency in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6946
* Add Suchit as a maintainer in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6997

### 🪛 Refactoring
* [Multi Datasource] Unify getDefaultDataSourceId and export in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6882

### 🔩 Tests
* [MDS] Add more test for icon and aggregated view in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6740
* [MDS] Add test for edit data source form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6758
* [MDS] Add test for error_menu, item, data_source_multi_selectable in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6768
* [MDS] Add test for toast button and validation form in https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6804
