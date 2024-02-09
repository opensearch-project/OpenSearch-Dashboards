## Version 2.12.0 Release Notes

### 🛡 Security

- Add support for TLS v1.3 ([#5133](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5133))
- [CVE-2020-8203] Bump `cheerio` from `0.22.0` to `1.0.0-rc.1` to fix vulnerable `lodash` dependency ([#5797](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5797))
- [CVE-2023-52079] Bump `msgpackr` from `1.9.7` to `1.10.1` ([#5803](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5803))

### 📈 Features/Enhancements

- Add support for read-only mode through tenants ([#4498](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4498))
- [Decouple] Add new cross compatibility check core service which export functionality for plugins to verify if their OpenSearch plugin counterpart is installed on the cluster or has incompatible version to configure the plugin behavior([#4710](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4710))
- [Workspace] Add core workspace service module to enable the implementation of workspace features within OSD plugins ([#5092](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5092))
- [Custom Branding] Allow relative URL for logos ([#5572](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5572))
- [Discover] Display inner properties in the left navigation bar [#5429](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5429)
- Replace OuiSelect component with OuiSuperSelect in data-source plugin ([#5315](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5315))
- [Discover] Enhance the data source selector with added sorting functionality ([#5609](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5609))
- [Multiple Datasource] Add datasource picker component and use it in devtools and tutorial page when multiple datasource is enabled ([#5756](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5756))
- [Discover] Add customizable pagination options based on Discover UI settings [#5610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5610)
- [PM] Enhance single version requirements imposed during bootstrapping ([#5675](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5675))
- Change SavedObjects' Import API to allow selecting a data source when uploading files ([#5777](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5777))
- [Multiple Datasource] Add datasource picker to import saved object flyout when multiple data source is enabled ([#5781](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5781))
- [Discover] Revert to legacy discover table and add toggle to new discover table ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [Discover] Add collapsible and resizeable sidebar ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [Discover] Update fonts of the datagrid ([#5841](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5841))

### 🐛 Bug Fixes

- [BUG][data] Support custom filters with heterogeneous data fields ([5577](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5577))
- [BUG] Fix filtering issue in data source selector ([5484](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5484))
- Modify data source text for dev tool （[#5475](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5475))
- Fix missing border for header navigation control on right ([#5450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5450))
- [Fix] Fix duplicate icon rendering in Markdown Visualization Editor ([#5511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5511))
- [Discover] Fix inactive state on 'Discover' tab in side navigation menu ([#5432](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5432))
- [BUG][data] Fix empty suggestion history when querying in search bar [#5349](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5349)
- [Console] Fix dev tool console autocomplete not loading issue for aliases ([#5568](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5568))
- [BUG][discover] Fix displayed text in `selected fields` when removing columns from canvas [#5537](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5537)
- [BUG] Remove duplicate sample data as id 90943e30-9a47-11e8-b64d-95841ca0b247 ([5668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5668))
- [BUG][multiple datasource] Fix datasource testing connection unexpectedly passed with wrong endpoint [#5663](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5663)
- [BUG][discover] Show 0 filters when there are no active filters ([#5508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5508))
- [BUG][discover] Fix advanced setting `discover:modifyColumnsOnSwitch` ([#5508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5508))
- [Discover] Fix missing index pattern field from breaking Discover [#5626](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5626)
- [Table Visualization] Fix filter action buttons for split table aggregations ([#5619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5619))
- [BUG][discover] Fix Discover table panel not adjusting its size automatically when the time range changes ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix incorrect number of rows when changing from a search with few results to more results ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix copying data from columns in Discover including extra data ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix no line wrapping when displaying fields in Discover datagrid ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix 'truncate:maxHeight' not working in Discover since 2.10.0 ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix UI glitch when mouseover Discover datagrid element ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- Fix a broken link by updating a typo ([#5517](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5517))

### 🚞 Infrastructure

- [Chore] Add `--security` for `opensearch snapshot` and `opensearch_dashboards` to configure local setup with the security plugin ([#5451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5451))
- [Chore] Update default dev environment security credentials ([#5736](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5736))

### 🛠 Maintenance

- Add @SuZhou-Joe as a maintainer. ([#5594](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5594))
- [Data Explorer] Add Readme for Data Explorer ([#5273](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5273))
- Replace `node-sass` with `sass-embedded` ([#5338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5338))
- Add documentation on files in util in addition to a README.md with an overview of each file and its exported functions ([#5540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5540))
- Bump `OUI` to `1.4.0` ([#5637](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5637))
- Remove `ui-select` dev dependency ([#5660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5660))
- Move @seanneumann to emeritus maintainer ([#5634](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5634))
- Rename `withLongNumerals` to `withLongNumeralsSupport` in `HttpFetchOptions` [#5592](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5592)

### 🔩 Tests

- [Home] Add more unit tests for other complications of overview ([#5418](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5418))

### 🪛 Refactoring

- [UiSharedDeps] Standardize theme JSON imports to be light/dark-mode aware ([#5662](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5662))
