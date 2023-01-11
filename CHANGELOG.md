# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [2.5]

### 🛡 Security

- Add Security-CVEs fixes guidelines ([#2674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2674))
- Bump decode-uri-component from 0.2.0 to 0.2.2 ([3009](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3009))
- [CVE-2022-25912] Bumps simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-35256] Bumps node version from 14.20.0 to 14.20.1 [#3166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3166))
- [CVE-2022-46175] Bumps json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))

### 📈 Features/Enhancements

- [CLI] Add yarn opensearch arg to setup plugin dependencies ([#2734](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2734))
- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))
- [Multi DataSource] Test the connection to an external data source when creating or updating ([#2973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2973))
- [Multi DataSource] Improve test connection ([#3110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3110))
- [Vis Builder] Add global data persistence for vis builder #2896 ([#2896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2896))
- [Vis Builder] Add redux store persistence ([#3088](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3088))
- [Vis Builder] Add app filter and query persistence without using state container ([#3100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3100))
- [Data] Update `createAggConfig` so that newly created configs can be added to beginning of `aggConfig` array ([#3160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3160))
- [Optimizer] Increase timeout waiting for the exiting of an optimizer worker ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))


### 🐛 Bug Fixes

- Bumped `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- [Table Visualization] Fix Url content display issue in table ([#2918](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2918))
- Fixes misleading embaddable plugin error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- Adds config override to fix obsolete theme:version config value of v8 (beta) rendering issue ([#3045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3045))
- [Multi Datasource] Update dummy url in tests to follow lychee url allowlist ([#3099](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3099))
- [CI] Update test workflow to increase network-timeout for yarn for installing dependencies ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- [VisBuilder] Fixes filters for table visualisation ([#3210](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3210))
- [VisBuilder] Fixes pipeline aggs ([#3137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3137))
- [Region Maps] Fixes bug that prevents selected join field to be used ([#3213](Fix bug that prevents selected join field to be used))

### 🚞 Infrastructure

- Bump version on 2.x branch to 2.5.0 ([#2884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2884))
- Add Windows CI workflows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- Add automatic selection of the appropriate version of chrome driver to run functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Add release notes for 1.3.7 ([#3066](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3066))
- Improve yarn's performance in workflows by caching yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))

### 📝 Documentation

- Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- Add `current-usage.md` and more details to `README.md` of `charts` plugin ([#2695](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2695))
- [Doc] Corrected README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- [Doc] Add readme for global query persistence ([#3001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3001))
- [Doc] Add current plugin persistence implementation readme ([#3081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3081))

### 🪛 Refactoring

- [Vis Builder] Removed hard coded strings and used i18n to translate([#2867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2867))
- [Console] Replace jQuery.ajax with core.http when calling OSD APIs in console ([#3080]https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3080))
- [Table Visualization] Refactor table visualization using React and DataGrid component ([#2863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2863))


### 🛠 Maintenance

- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- Add aliased vega-lite v5 dependency and bundle from source ([#3151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3151))

### 🔩 Tests

- Add retrial of flaky tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Make tests covering plugin installation on cluster snapshots work across platforms ([#2994](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2994))
- [Tests] Bumps `chromedriver` to v107 ([#3017](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3017))
- [Tests] Skip tests inside the docs folder ([#3197](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3197))
- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))
- [Vis Builder] Adds field unit tests ([#3211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3211))

## [2.4.1]

### 🐛 Bug Fixes

- Update `leaflet-vega` and fix its usage ([#3005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3005))

### 🔩 Tests

- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))

## [2.4.0]

### 🛡 Security

- Bump percy-agent to use non-beta version ([#2415](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2415))
- Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
- [CVE-2022-33987] Bump makelogs to remove dependency on got ([#2801](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2801))
- [CVE-2022-33987] Upgrade geckodriver to 3.0.2 ([#2166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2166))
- [CVE-2022-3517] Bump minimatch to 3.0.5 and [IBM X-Force ID: 220063] unset-value to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
- [CVE-2022-37601] Bump loader-utils to 2.0.3 ([#2706](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2706))
- [GMS-2022-4708] Resolve sub-dependent d3-color version and potential security issue ([#2454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2454))
- [Legacy Maps] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
- [WS-2022-0284] [WS-2022-0280] Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
- [Multi DataSource] Prevent spell-checking the password fields ([#2818](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2818))

### 📈 Features/Enhancements

- Add extension point in saved object management to register namespaces and show filter ([#2656](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2656))
- Add updated_at column to Saved Objects' tables ([#1218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1218))
- Change the links in the visualize plugin to use `href` rather than `onClick` ([#2395](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2395))
- Improve Discover field summaries ([#2391](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2391))
- Remove Add Integration button ([#2723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2723))
- [Multi DataSource] Add data source column into index pattern table ([#2542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2542))
- [Multi DataSource] Add data source config to opensearch-dashboards-docker ([#2557](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2557))
- [Multi DataSource] Add data source signing support ([#2510](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2510))
- [Multi DataSource] Add experimental callout for index pattern section ([#2523](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2523))
- [Multi DataSource] Address UX comments on Data source list and create page ([#2625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2625))
- [Multi DataSource] Apply get indices error handling in step index pattern ([#2652](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2652))
- [Multi DataSource] Display error toast for create index pattern with data source ([#2506](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2506))
- [Multi DataSource] Make text content dynamically translated & update unit tests ([#2570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2570))
- [Multi DataSource] Support legacy client for data source ([#2204](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2204))
- [Multi DataSource] UX enhancement on Data source management creation page ([#2051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2501))
- [Multi DataSource] UX enhancement on Data source management stack ([#2521](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2521))
- [Multi DataSource] UX enhancement on Index Pattern management stack ([#2505](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2505))
- [Multi DataSource] UX enhancement on Index Pattern management stack ([#2505](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2505))([#2527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2527))
- [Multi DataSource] UX enhancement on Update stored password modal for Data source management stack ([#2532](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2532))
- [Plugin Helpers] Facilitate version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398))
- [Vis Builder] Add an experimental table visualization in vis builder ([#2705](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2705))
- [Vis Builder] Add field summary popovers ([#2682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2682))
- [Vis Builder] Add index pattern info when loading embeddable ([#2363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2363))
- [Vis Builder] Add state validation before dispatching and loading ([#2351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2351))
- [Vis Builder] Change VisBuilder flag for docker config ([#2804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2804))
- [Vis Builder] Change classname prefix wiz to vb ([#2581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2581/files))
- [Vis Builder] Change save object type, wizard id and name to visBuilder ([#2673](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2673))
- [Vis Builder] Change wizard to vis_builder in file names and paths ([#2587](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2587))
- [Vis Builder] Create a new wizard directly on a dashboard ([#2384](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2384))
- [Vis Builder] Edit wizard directly on dashboard ([#2508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2508))
- [Vis Builder] Enable VisBuilder by default ([#2725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2725))
- [Vis Builder] Rename wizard on save modal and visualization table ([#2645](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2645))
- [Vis Builder] Rename wizard to visBuilder in class name, type name and function name ([#2639](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2639))
- [Vis Builder] Rename wizard to visBuilder in i18n id and formatted message id ([#2635](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2635))
- [Windows] Add cross-platform helpers ([#2681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2681))
- [Windows] Consume `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))
- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))

### 🐛 Bug Fixes

- Fix management app breadcrumb error ([#2344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2344))
- Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- Remove Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
- [Multi DataSource] Add data source param to low-level search call in Discover ([#2431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2431))
- [Multi DataSource] Address UX comments on Edit Data source page ([#2629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2629))
- [Multi DataSource] Address UX comments on index pattern management stack ([#2611](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2611))
- [Multi DataSource] Enhance data source error handling ([#2661](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2661))
- [Multi DataSource] Skip data source view in index pattern step when default is chosen ([#2574](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2574))
- [Multi DataSource] Update default audit log path ([#2793](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2793))
- [Save Object Aggregation View] Fix for export all after scroll count response changed ([#2696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2696))
- [Vis Builder] Add additional aggregation parameters to Vislib charts (Bar, Line and Area) ([2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [Vis Builder] Add missing test subject property of `DisabledVisualization` ([2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [Vis Builder] Fix Date Histogram auto bounds showing per 0 millisecond ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [Vis Builder] Fix Histogram updating bounds when date range updates ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [Vis Builder] Fix auto bounds for time-series bar chart visualization ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Vis Builder] Fix broken UX after switching index pattern while editing an aggregation ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [Vis Builder] Fix rendering issues wuth time series for new chart types ([#2309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2309))
- [Vis Builder] Fix the missing `Last Updated` timestamp in visualization list ([#2628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2628))
- [Vis Builder] Fix visualization shift when editing an aggregation ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Vis Builder] Rename "Histogram" to "Bar" in visualization type picker ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Table Visualization] Fix an issue preventing sorting the first column ([#2828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2828))
- Temporary workaround for task-kill exceptions on Windows when it is passed a pid for a process that is already dead ([#2842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2842))

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Update WhiteSource scans to ignore Backward Compatibility artifacts in `cypress` ([#2408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2408))
- [CI] Add Backward Compatibility tests for 2.4.0 ([#2393](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2393))
- [CI] Add path ignore for markdown files ([#2312](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2312))
- [CI] Prevent backport workflow from running on unmerged PRs ([#2746](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2746))
- [CI] Run functional test repo as workflow ([#2503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2503))
- [CI] Update backport custom branch name ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))
- [CI] Update backport workflow to ignore changelog conflicts ([#2729](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2729))


### 📝 Documentation

- Add CHANGELOG.md and Release Notes for 2.4.0 ([#2809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2809))
- Add README.md for `dataSource` and `dataSourceManagement` plugins ([#2448](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2448))
- Add README.md for saving index pattern relationship ([#2276](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2276))
- Remove a repeated "to" from the README.md file ([#2403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2403))
- Update functional testing information in TESTING.md ([#2492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2492))
- [Multi DataSource] Add design documents of multiple data source feature [#2538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2538)
- [Multi DataSource] Add sample configuration for multi data source to the yml template ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
- [Multi DataSource] Tweak multiple data source design doc ([#2724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2724))
- [Multi DataSource] Update MD data source documentation link ([#2693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2693))

### 🔩 Tests

- Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))
- [Multi DataSource] Add unit test coverage for Update Data source management stack ([#2567](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2567))
- [Vis Builder] Enable VisBuilder cypress tests ([#2728](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2728))

### 🛠 Maintenance

- Add @zengyan-amazon as a maintainer ([#2419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2419))
- Increment from 2.3 to 2.4. ([#2295](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295))
- Add CHANGELOG.md for 2.4.0 ([#2809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2809))