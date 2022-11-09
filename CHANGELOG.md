# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [2.4.0]

### 💥 Breaking Changes

None


### 🗑 Deprecations

None


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



## [2.3.0]

### 📈 Features/Enhancements

- [D&D] Add new states in metadata slice ([#2193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2193))
- [D&D] Add visualization type switcher for Wizard ([#2217](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2217))
- [D&D] Save index pattern using proper saved object structure ([#2218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2218))
- [D&D] Persist index field on agg type change if possible ([#2227](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2227))
- [D&D] Add count field to field picker ([#2231](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2231))
- [D&D] Add Bar line and Area charts to Wizard ([#2266](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2266))


### 🐛 Bug Fixes

- Fix maps wms zoom limitation ([#1915](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1915))
- [Visualizations] Add visConfig.title and uiState to build pipeline function (([#2192](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2192))
- Custom healthcheck with filters ([#2232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2232))
- [BUG] Fix healthcheck logic to expect object and return ids ([#2277](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2277))


### 🚞 Refactor

- [DeAngular][visualization][vislib] Remove angular from vislib ([#2138](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2138))
- Change timeline icon ([#2162](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2162))


### 🛠 Maintenance

- Increment from 2.2 to 2.3. ([#2096](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2096))


### 🔩 Tests

- [CI] Add backwards compatibility (BWC) tests for 2.3.0 ([#2281](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2281))
- Fix 2.x backwards compatibility (BWC) tests by restoring 1.3.2 ([#2284](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2284))



## [2.2.1]

### 🛠 Maintenance

- Bump 2.2 branch version to be 2.2.1 ([#2129](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2129))



## [2.2.0]

#### Notable changes

- Bump node version to 14.20.0 ([#2101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2101))
- OpenSearch Dashboards uses [OUI](https://github.com/opensearch-project/oui) and its alias onto EUI ([#2080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2080))
- New experimental feature: adds the Drag and Drop editor to Visualize. Note this is disabled by default. Please enable by setting `wizard.enabled: true` in `opensearch_dashboards.yml` ([#1966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1966))


### 🗑 Deprecations

- Deprecate the Blacklist / Whitelist nomenclature ([#1808](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1808))


### 📈 Features/Enhancements

- Add DocView links pluggable injection capability ([#1200](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1200))
- Enable users to select custom vector map for visualization ([#1718](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1718))
- [UX] Restyle global breadcrumbs ([#1954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1954))
- [Feature] Adds the Drag and Drop editor to Visualize ([#1966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1966))
- Alias OUI onto EUI ([#2080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2080))


### 🛡 Security

- Bump terser from 4.8.0 to 4.8.1 ([#1930](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1930))
- Bump moment from 2.29.2 to 2.29.4 ([#1931](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1931))
- [CVE] Handle invalid query, index and date in vega charts filter handlers ([#1946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1946))
- Bump node version to 14.20.0 ([#2101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2101))


### 📝 Documentation

- [Docs] Add developer documentation for using/modifying the chrome service ([#1875](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1875))
- [Docs] Updates Code of Conduct ([#1964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1964))


### 🐛 Bug Fixes

- [Bug] Fix new issue link ([#1837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1837))
- Remove banner when editing maps visualization ([#1848](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1848))
- Fixes issue on saving custom vector map options as part of visualization ([#1896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1896))
- [BUG] Fixing some of the broken links in core plugin API documentations ([#1946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1946))
- [BUG] Show region blocked warning config not respected ([#2042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2042))
- [BUG] Telemetry plugin cluster info rename error ([#2043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2043))
- [Bug] Fix TSVB y-axis ([#2079](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2079))
- [Bug] Fix Global Breadcrumb Styling in dark mode ([#2085](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2085))


### 🚞 Refactor

- Changes JS code to ts in region_map ([#2084](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2084))


### 🛠 Maintenance

- [Version] Increment to 2.2 ([#1860](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1860))


### 🔩 Tests

- [CI] Add BWC tests for 2.2.0 ([#1861](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1861))
- [CI] Clean up for BWC tests & run only on PRs for backports ([#1948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1948))



## [2.1.0]


### 🗑 Deprecations

- Changes config name in yml file to new non-deprecated name ([#1485](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1485))
- Deprecate isDevClusterMaster in favor of isDevClusterManager ([#1719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1719))
- Deprecate setupMaster in favor of setupClusterManager ([#1752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1752))
- Deprecate master nodes and replace with cluster_manager nodes ([#1761](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1761))
- Replace master in comments ([#1778](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1778))
- Replace references to master branch with main ([#1780](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1780))
- Deprecate master_timeout in favor of cluster_manager_timeout ([#1788](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1788))
- Deprecate the apiVersion: master value and replace with main ([#1799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1799))
- Deprecate cat master API in favor of cat cluster_manager ([#1800](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1800))


### 🛡 Security

- Adding noreferrer on doc links ([#1709](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1709))
- [CVE-2022-25851] Resolve jpeg-js to 0.4.4 ([#1753](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1753))
- [CVE-2022-33987] Bump tsd from 0.16.0 to 0.21.0 ([#1770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1770))


### 📈 Enhancements

- Logic to enable extensibility for the maps plugin ([#1632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1632))
- [Consolidated global header] Use `opensearchDashboards.branding.useExpandedHeader: false` to use the consolidated menu and global header bar. ([#1586](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1586)) ([#1802](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1802))


### 🚞 Infrastructure

- Allow Node patch versions to be higher on runtime if bundled Node is not available ([#1189](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1189))


### 📝 Documentation

- [Admin] Adds Josh Romero as co-maintainer ([#1682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1682))
- Fixes formatting and typos in documentation ([#1697](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1697))


### 🛠 Maintenance

- [Version] Increment to 2.1 ([#1503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1503))


### 🔩 Tests

- Migrate mocha tests to jest ([#1553](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1553))
- Add backwards compatibility tests to github actions ([#1624](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1624))
- Date range for tests incorrect params related to backwards compatibility tests ([#1772](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1772))
- Update tests to reflect max zoom level for maps ([#1823](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1823))
- Maps zoom levels updated from current zoom level 10 to zoom level 14 on coordinate and region maps. This feature helps you visualize more granular geo data



## [2.0.1]


### 🐛 Bug Fixes

- [Bug] Fixes WMS can't load error when unable access maps services ([#1550](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1550))
- [Bug] Fixes the header loading spinner position in Firefox ([#1570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1570))
- [Bug] Fixes metric vizualization cut off text ([#1650](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1650))


### 🛠 Maintenance

- Removes duplicate var in opensearch-dashboards-docker ([#1649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1649))



## [2.0.0]

### 💥 Breaking Changes in 2.0

#### Bump to node version 14.19.1

- Bumps Node.js from v14.18.2 to v14.19.1 ([#1487](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1487))
- [Node 14] Upgrades Node version to 14.18.2 ([#1028](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1028))

#### Use opensearch-project/opensearch as nodejs client

- [nodejs client] Hookup JS client with dashboards ([#1342](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1342))
- [nodejs client] modify tsconfig to route types to new.d.ts ([#1225](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1255))

#### Disable telemetry by default

- Fixes search usage telemetry ([#1427](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1427))

#### Deprecations

- Deprecates non-inclusive config names ([#1467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1467))
- Removes UI Framework KUI doc site ([#1379](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1379))
- [Purify] Hide option for theme version in settings ([#1598](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1598))


### 🛡 Security

- [CVE-2022-1537] Resolves grunt to 1.5.3 ([#1580](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1580))
- [CVE-2022-1214] Bumps chromedriver to v100 and axios to v0.27.2 ([#1552](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1552))
- [CVE-2022-29078] Bumps ejs from 3.1.6 to 3.1.7 ([#1512](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1512))
- [CVE-2021-44531] [CVE-2022-21824] [CVE-2022-0778] [CVE-2021-44532] [CVE-2021-44533] Bumps Node.js from v14.18.2 to v14.19.1 ([#1487](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1487))
- [CVE-2022-0436] Bumps grunt from v1.4.1 to v1.5.2 ([#1451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1451))
- [CVE-2021-43138] Resolves async to v3.2.3 ([#1449](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1449))
- [CVE-2022-24785] Bump moment from 2.29.1 to 2.29.2 ([#1456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1456))
- [CVE-2021-3803] Bumps the nested dependency of nth-check to v2.0.1 ([#1422](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1422))
- [CVE-2022-0144] [WS-2018-0347] [CVE-2021-23807] [CVE-2020-15366] Chore: Replaces sass-lint with stylelint ([#1413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1413))
- [CVE-2021-3918] Bumps json-schema from 0.2.3 to 0.4.0 ([#1385](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1385))
- [WS-2020-0208] Removes UI Framework KUI doc site ([#1379](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1379))
- [CVE-2022-0686] [CVE-2022-0691] Bumps @elastic/eui to v34.6.0 and @elastic/charts to v31.1.0 ([#1370](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1370))
- [CVE-2022-24433] Bumps simple-git from 1.116.0 to 3.4.0 ([#1359](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1359))
- [CVE-2021-44907] Resolves all qs dependencies to v6.10.3 ([#1380](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1380))
- [CVE-2021-44906] Bump minimist from 1.2.5 to 1.2.6 ([#1377](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1377))
- [CVE-2022-24773] [CVE-2022-24772] [CVE-2022-24771] Bumps node-forge from v1.2.1 to v1.3.0 ([#1369](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1369))
- [CVE-2020-8203] [CVE-2021-23337] [CVE-2020-28500] Bump lodash-es from 4.17.15 to 4.17.21 ([#1343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1343))
- [CVE-2021-3807] Resolves ansi-regex to v5.0.1 ([#1320](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1320))
- [CVE-2022-0686] [CVE-2022-0639] [CVE-2022-0686] Bump url-parse from 1.5.3 to 1.5.7 ([#1257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1257))
- [CVE-2022-0536] Bump follow-redirects from 1.14.7 to 1.14.8 ([#1247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1247))
- [CVE-2022-0122] [WS-2022-0008] Upgrades node-forge from v0.10.0 to v1.2.1 ([#1239](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1239))
- [CVE-2021-23424] Upgrades webpack-dev-server and webpack-cli ([#1229](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1229))
- [WS-2020-0033] [WS-2020-0035] [WS-2019-0271] [WS-2020-0032] [WS-2020-0026] Upgrades hapi from v17 to v20 ([#1146](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1146))
- [CVE-2022-21670] Bump markdown-it from 10.0.0 to 12.3.2 ([#1140](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1140))
- [CVE-2022-0155] Removes deprecated request and @percy/agent ([#1113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1113))
- [CVE-2021-23490] Bump parse-link-header from 1.0.1 to 2.0.0 ([#1108](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1108))
- [CVE-2021-3765] Bumps @microsoft/api-documenter and @microsoft/api-extractor ([#1106](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1106))
- [CVE-2021-3795] [WS-2019-0307] Removes KUI Generator and related dependencies ([#1105](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1105))
- [CVE-2021-24033] [CVE-2021-23382] [CVE-2021-23364] Upgrades babel, storybook, and postcss ([#1104](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1104))
- [CVE-2021-22939] [CVE-2021-3672] [CVE-2021-22931] [CVE-2021-22921] [CVE-2021-22940] [CVE-2021-22918] [CVE-2020-24025] [CVE-2018-11698] [CVE-2020-7608] [CVE-2018-19827] [CVE-2018-20190] [CVE-2019-6283] [CVE-2019-18797] [CVE-2018-20821] [CVE-2019-6286] [CVE-2019-6284] [CVE-2018-11694] [CVE-2018-19837] [CVE-2018-11696] [CVE-2018-11499] [CVE-2018-11697] [CVE-2018-19797] [CVE-2020-24025] [CVE-2020-24025] [CVE-2018-11698] [CVE-2018-11698] [CVE-2018-19839] [CVE-2018-19838] Upgrades Node version to 14.18.2 ([#1028](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1028))
- [CVE-2021-3757] [CVE-2021-23436] Upgrade immer from 8.0.1 to 9.0.6 ([#780](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/780))


### 📈 Enhancements

- [Circuit-Breaker] Add memory circuit breaker configuration ([#1347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1347))


### 🐛 Bug Fixes

- Removes irrelevant upsell in the timeout message ([#1599](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1599))
- [Bug] Fix missing discover context icon ([#1545](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1545))
- Fix  Re-rendering visualization when expression changes and improves typing ([#1491](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1491))
- Add better type checks for icons ([#1496](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1496))
- [Bug] Fix copy as curl ([#1472](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1472))
- Update re2 build for arm under node 14 ([#1454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1454))
- Update re2 for linux, darwin, and windows ([#1453](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1453))
- Fixes tooltip when split series charts are used ([#1324](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1324))
- Fixes the header's nav trigger button not closing the nav ([#1394](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1394))
- Fixes the linting rules to accept only the approved copyright headers ([#1373](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1373))


### 🚞 Infrastructure

- [Plugins] Fix default path to plugins ([#1468](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1468))
- Reverts re2 back to 1.15.4 from 1.17.4 to fix build issues ([1419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1419))


### 📝 Documentation

- [Admin] Add current maintainers as of 04/2022 ([#1426](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1426))
- Exposes testing readme at the root level ([#1420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1420))


### 🛠 Maintenance

- Runs functional test jobs in parallel w/ build job ([#1336](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1356))
- Removes unnecessary manual resolutions ([#1300](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1300))
- Removes backport and release-notes scripts ([#1234](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1234))
- Removes storybook package and related code ([#1172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1172))
- [Version] Increment to 2.0 ([#973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/973/files))


### 🪛 Refactoring

- Fixes interfaced errors across Dashboards ([#1409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1409))


### 🔩 Tests

- [BWC][CI] Update performance analzyer location ([#1474](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1474))
- [BWC][CI] Use ODFE 1.0.2 ([#1470](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1470))
- [BWC][CI] Handle distributions with qualifiers ([#1469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1469))
- BWC test improvements ([#1447](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1447))
- [CI] bumps chromedriver to v100 ([#1410](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1410))
- Fixes inconsistent plugin installation tests ([#1346](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1346))
- Fix JUnit Reporter test ([#1338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1338))
- Remove include_type_name from OpenSearch Archiver ([#1334](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1334))
- Runs GitHub workflow unit tests in band ([#1306](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1306))
- Upgrades jest to v27 ([#1301](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1301))
- Fix mocha tests related to type ([#1299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1299))
- Remove _type from OpenSearch Archiver ([#1289](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1289))

