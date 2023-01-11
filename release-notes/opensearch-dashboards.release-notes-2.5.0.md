## Version 2.5.0 Release Notes

### 🛡 Security

- Add Security-CVEs fixes guidelines ([#2674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2674))
- Bump decode-uri-component from 0.2.0 to 0.2.2 ([3009](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3009))
- [CVE-2022-25912] Bump simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-35256] Bump node version from 14.20.0 to 14.20.1 [#3166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3166))
- [CVE-2022-46175] Bump json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))

### 📈 Features/Enhancements

- [CLI] Add yarn opensearch arg to setup plugin dependencies ([#2734](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2734))
- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))
- [Multi DataSource] Test the connection to an external data source when creating or updating ([#2973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2973))
- [Multi DataSource] Improve test connection ([#3110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3110))
- [VisBuilder] Add global data persistence for vis builder #2896 ([#2896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2896))
- [VisBuilder] Add redux store persistence ([#3088](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3088))
- [VisBuilder] Add app filter and query persistence without using state container ([#3100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3100))
- [Data] Update `createAggConfig` so that newly created configs can be added to beginning of `aggConfig` array ([#3160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3160))
- [Optimizer] Increase timeout waiting for the exiting of an optimizer worker ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))

### 🚞 Infrastructure

- Bump version on 2.x branch to 2.5.0 ([#2884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2884))
- Add Windows CI workflows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- Add automatic selection of the appropriate version of chrome driver to run functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Add release notes for 1.3.7 ([#3066](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3066))
- Improve yarn's performance in workflows by caching yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))

### 📝 Documentation

- Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- Add `current-usage.md` and more details to `README.md` of `charts` plugin ([#2695](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2695))
- [Doc] Correct README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- [Doc] Add readme for global query persistence ([#3001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3001))
- [Doc] Add current plugin persistence implementation readme ([#3081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3081))

### 🪛 Refactoring

- [VisBuilder] Remove hard coded strings and used i18n to translate([#2867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2867))
- [Console] Replace jQuery.ajax with core.http when calling OSD APIs in console ([#3080]https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3080))
- [Table Visualization] Refactor table visualization using React and DataGrid component ([#2863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2863))

### 🐛 Bug Fixes

- Bump `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- [Table Visualization] Fix Url content display issue in table ([#2918](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2918))
- Fix misleading embaddable plugin error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- Add config override to fix obsolete theme:version config value of v8 (beta) rendering issue ([#3045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3045))
- [Multi Datasource] Update dummy url in tests to follow lychee url allowlist ([#3099](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3099))
- [CI] Update test workflow to increase network-timeout for yarn for installing dependencies ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- [VisBuilder] Fix filters for table visualisation ([#3210](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3210))
- [VisBuilder] Fix pipeline aggs ([#3137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3137))
- [Region Maps] Fix bug that prevents selected join field to be used ([#3213](Fix bug that prevents selected join field to be used))

### 🔩 Tests

- Add retrial of flaky tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Make tests covering plugin installation on cluster snapshots work across platforms ([#2994](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2994))
- [Tests] Bump `chromedriver` to v107 ([#3017](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3017))
- [Tests] Skip tests inside the docs folder ([#3197](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3197))
- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))
- [VisBuilder] Add field unit tests ([#3211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3211))

### 🛠 Maintenance

- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- Add aliased vega-lite v5 dependency and bundle from source ([#3151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3151))

