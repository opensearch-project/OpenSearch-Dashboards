## Version 2.13.0 Release Notes

### 🛡 Security

- Support dynamic CSP rules to mitigate Clickjacking https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5641
- [CVE-2020-36604] Employ a patched version of hoek `6.1.3` ([#6148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6148))
- [CVE-2024-27088] Bump es5-ext from `0.10.59` to `0.10.64` ([#6021](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6021))
- [CVE-2024-28849] Bump follow-redirect from `1.15.4` to `1.15.6` ([#6199](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6201))

### 📈 Features/Enhancements

- [MD]Change cluster selector component name to data source selector ([#6042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6042))
- [Multiple Datasource] Add interfaces to register add-on authentication method from plug-in module ([#5851](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5851))
- [Multiple Datasource] Able to Hide "Local Cluster" option from datasource DropDown ([#5827](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5827))
- [Multiple Datasource] Add api registry and allow it to be added into client config in data source plugin ([#5895](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5895))
- [Multiple Datasource] Concatenate data source name with index pattern name and change delimiter to double colon ([#5907](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5907))
- [Multiple Datasource] Refactor client and legacy client to use authentication registry ([#5881](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5881))
- [Multiple Datasource] Improved error handling for the search API when a null value is passed for the dataSourceId ([#5882](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5882))
- [Multiple Datasource] Hide/Show authentication method in multi data source plugin based on configuration ([#5916](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5916))
- [Dynamic Configurations] Add support for dynamic application configurations ([#5855](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5855))
- [Multiple Datasource] Refactoring create and edit form to use authentication registry ([#6002](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6002))
- [Multiple Datasource] Handles auth methods from auth registry in DataSource SavedObjects Client Wrapper ([#6062](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6062))
- [Multiple Datasource] Expose a few properties for customize the appearance of the data source selector component ([#6057](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6057))
- [Multiple Datasource] Handle form values(request payload) if the selected type is available in the authentication registry ([#6049](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6049))
- [Multiple Datasource] Adds a session token to AWS credentials ([#6103](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6103))
- [Multiple Datasource] Test connection schema validation for registered auth types ([#6109](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6109))
- [Multiple DataSource] DataSource creation and edition page improvement to better support registered auth types ([#6122](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6122))
- [Multiple Datasource] Export DataSourcePluginRequestContext at top level for plugins to use ([#6108](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6108))
- [Multiple Datasource] Improves connection pooling support for AWSSigV4 clients in data sources ([#6135](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6135))
- [Multiple Datasource] Add datasource version number to newly created data source object([#6178](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6178))
- [Multiple Datasource] Add default functionality for customer to choose default datasource ([#6186](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6186))
- Implement new home page ([#6065](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6065))
- Add sidecar service ([#5920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5920))
- [Dynamic Configurations] Pass request headers when making application config calls ([#6164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6164))
- [Discover] Options button to configure legacy mode and remove the top navigation option ([#6170](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6170))

### 🐛 Bug Fixes

- [BUG][Discover] Allow saved sort from search embeddable to load in Dashboard ([#5934](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5934))
- [BUG][Discover] Add key to index pattern options for support deplicate index pattern names([#5946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5946))
- [Discover] Fix table cell content overflowing in Safari ([#5948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5948))
- [BUG][MD]Fix schema for test connection to separate validation based on auth type ([#5997](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5997))
- [Discover] Enable 'Back to Top' Feature in Discover for scrolling to top ([#6008](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6008))
- [BUG][Discover] Allow saved sort from search embeddable to load in Dashboard ([#5934](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5934))
- [osd/std] Add additional recovery from false-positives in handling of long numerals ([#5956](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5956))
- [BUG][Multiple Datasource] Fix missing customApiRegistryPromise param for test connection ([#5944](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5944))
- [BUG][Multiple Datasource] Add a migration function for datasource to add migrationVersion field ([#6025](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6025))
- [BUG][MD]Expose picker using function in data source management plugin setup([#6030](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6030))
- [BUG][Multiple Datasource] Fix data source filter bug and add tests ([#6152](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6152))

### 📝 Documentation

- Fix link to documentation for geoHash precision ([#5967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5967))

### 🛠 Maintenance

- Bump `chromedriver` dependency to `121.0.1"` ([#5926](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5926))
- Add @ruanyl as a maintainer ([#5982](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5982))
- Add @BionIT as a maintainer ([#5988](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5988))
