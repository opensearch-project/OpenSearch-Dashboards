## Version 2.10.0 Release Notes

### 🛡 Security

- [CVE-2022-25869] Remove AngularJS `1.8` ([#5086](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5086))

### 📈 Features/Enhancements

- [Console] Add support for JSON with long numerals ([#4562](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4562))
- [Data] Add `DataSource` service and `DataSourceSelector` for multiple datasource support ([#5167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5167))

### 🐛 Bug Fixes

- Bump `agentkeepalive` to `4.5.0` to solve a problem preventing the use `https://ip` in `opensearch.hosts` ([#4949](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4949))
- [Data Explorer][Discover] Add `onQuerySubmit` to top nav and allow force update to embeddable ([#5160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5160))
- [Data Explorer][Discover] Automatically load default index pattern ([#5171](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5171))
- [Data Explorer][Discover] Fix total hits issue for no time based data ([#5087](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5087))
- [Data Explorer][Discover] Allow data grid to auto adjust size based on fetched data count ([#5191](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5191))
- [Data Explorer][Discover] Allow filter and query persist when refresh page or paste url to a new tab ([#5206](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5206))
- [Data Explorer][Discover] Fix misc navigation issues ([#5168](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5168))
- [Data Explorer][Discover] Fix mobile view ([#5168](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5168))
- [Table Visualization] Fix width of multiple tables when rendered in column view ([#4638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4638))
- [Table Visualization] Fix filter actions on data table vis cells ([#4837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4837))
- [Vis Augmenter] Fix errors in conditions for activating `vizAugmenter` ([#5213](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5213))
- [Vis Augmenter] Fix `visAugmenter` forming empty key-value pairs in its calls to the `SavedObject` API ([#5190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5190))

### 🚞 Infrastructure

- [CI] Add `NODE_OPTIONS` and disable disk allocation threshold ([#5172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5172))

### 🛠 Maintenance

- [Version] Version increment from 2.10 to 2.11 ([#4975](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4975))

### 🔩 Tests

- [Functional][Doc Views] Remove angular code from `plugin_functional` and update tests ([#5221](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5221))
- [Unit][Data Explorer][Discover] Fix wrong test due to time conversion ([#5174](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5174))
- [Unit][Data Explorer][Discover]Fix `buildPointSeriesData` unit test fails due to local timezone ([#4992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4992))
