# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- [Legacy Maps Plugin] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
- Eliminate dependency on `got` versions older than 11.8.5 ([#2801](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2801))
- [Multi DataSource] Add explicit no spellcheck on password fields ([#2818](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2818))
- [CVE-2022-25912] Bumps simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-35256] Bumps node version from 14.20.0 to 14.20.1 ([#3166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3166))
- [CVE-2022-46175] Bumps json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))
- [CVE-2022-25860] Bumps simple-git from 3.15.1 to 3.16.0 ([#3345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3345))
- [Security] Bumps hapi/statehood to 7.0.4 ([#3411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3411))
- [CVE-2023-25166] Bump formula to 3.0.1 ([#3416](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3416))
- [CVE-2023-25653] Bump node-jose to 2.2.0 ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2023-26486][cve-2023-26487] Bump vega from 5.22.1 to 5.23.0 ([#3533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3533))
- [CVE-2023-0842] Bump xml2js from 0.4.23 to 0.5.0 ([#3842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3842))
- [Multi DataSource] Add private IP blocking validation on server side ([#3912](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3912))
- Bump `joi` to v14 to avoid the possibility of prototype poisoning in a nested dependency ([#3952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3952))
- [CVE-2023-2251] Bump yaml to 2.2.2 ([#3947](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3947))

### 📈 Features/Enhancements

- [MD] Support legacy client for data source ([#2204](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2204))
- [MD] Add data source signing support ([#2510](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2510))
- [Plugin Helpers] Facilitate version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398))
- [MD] Display error toast for create index pattern with data source ([#2506](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2506))
- [Multi DataSource] UX enhancement on index pattern management stack ([#2505](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2505))
- [Multi DataSource] UX enhancement on Data source management stack ([#2521](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2521))
- [Multi DataSource] UX enhancement on Index Pattern management stack ([#2527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2527))
- [Multi DataSource] Add data source column into index pattern table ([#2542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2542))
- [Multi DataSource] UX enhancement for Data source management creation page ([#2051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2501))
- [Multi DataSource] Add experimental callout for index pattern section ([#2523](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2523))
- [Multi DataSource] Add data source config to opensearch-dashboards-docker ([#2557](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2557))
- [Multi DataSource] Make text content dynamically translated & update unit tests ([#2570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2570))
- [Vis Builder] Change classname prefix wiz to vb ([#2581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2581/files))
- [Vis Builder] Change wizard to vis_builder in file names and paths ([#2587](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2587))
- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))
- [Windows] Add `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))
- [Multi DataSource] Address UX comments on Data source list and create page ([#2625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2625))
- [Vis Builder] Rename wizard to visBuilder in i18n id and formatted message id ([#2635](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2635))
- [Vis Builder] Rename wizard to visBuilder in class name, type name and function name ([#2639](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2639))
- [Vis Builder] Rename wizard on save modal and visualization table ([#2645](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2645))
- [Vis Builder] Adds functional tests to CI ([#2728](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2728))
- [Vis Builder] Enable VisBuilder by default ([#2725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2725))
- Change save object type, wizard id and name to visBuilder #2673 ([#2673](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2673))
- [Multi DataSource] Update MD data source documentation link ([#2693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2693))
- [Save Object Aggregation View] Add extension point in saved object management to register namespaces and show filter ([#2656](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2656))
- [Save Object Aggregation View] Fix for export all after scroll count response changed in PR#2656 ([#2696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2696))
- [Vis Builder] Add an experimental table visualization in vis builder ([#2705](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2705))
- [Vis Builder] Add field summary popovers ([#2682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2682))
- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))
- Add yarn opensearch arg to setup plugin dependencies ([#2544](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2544))
- [Multi DataSource] Test the connection to an external data source when creating or updating ([#2973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2973))
- Add Dashboards-list integrations for Plugins ([#3090](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3090) )
- [Table Visualization] Refactor table visualization using React and DataGrid component ([#2863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2863))
- [Vis Builder] Add redux store persistence ([#3088](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3088))
- [Multi DataSource] Improve test connection ([#3110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3110))
- [Vis Builder] Add app filter and query persistence without using state container ([#3100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3100))
- [Optimizer] Increase timeout waiting for the exiting of an optimizer worker ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))
- [Data] Update `createAggConfig` so that newly created configs can be added to beginning of `aggConfig` array ([#3160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3160))
- Add disablePrototypePoisoningProtection configuration to prevent JS client from erroring when cluster utilizes JS reserved words ([#2992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2992))
- [Multiple DataSource] Add support for SigV4 authentication ([#3058](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3058))
- Make build scripts find and use the latest version of Node.js that satisfies `engines.node` ([#3467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3467))
- [Multiple DataSource] Refactor test connection to support SigV4 auth type ([#3456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3456))
- [Darwin] Add support for Darwin for running OpenSearch snapshots with `yarn opensearch snapshot` ([#3537](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3537))
- [Vis Builder] Add metric to metric, bucket to bucket aggregation persistence ([#3495](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3495))
- Use mirrors to download Node.js binaries to escape sporadic 404 errors ([#3619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3619))
- [Multiple DataSource] Refactor dev tool console to use opensearch-js client to send requests ([#3544](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3544))
- Add `osd-xsrf` header to all requests that incorrectly used `node-version` to satisfy XSRF protection ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Data] Add geo shape filter field ([#3605](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3605))
- [Notifications] Adds id to toast api for deduplication ([#3752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3752))
- [VisBuilder] Add UI actions handler ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [Dashboard] Indicate that IE is no longer supported ([#3641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3641))
- [UI] Add support for comma delimiters in the global filter bar ([#3686](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3686))
- [Multiple DataSource] Allow create and distinguish index pattern with same name but from different datasources ([#3571](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3571))
- [Multiple DataSource] Integrate multiple datasource with dev tool console ([#3754](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3754))
- Add satisfaction survey link to help menu ([#3676] (https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3676))
- [Vis Builder] Add persistence to visualizations inner state ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))
- [Table Visualization] Move format table, consolidate types and add unit tests ([#3397](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3397))
- [Multiple Datasource] Support Amazon OpenSearch Serverless ([#3957](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3957))
- Add support for Node.js >=14.20.1 <19 ([#4071](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4071))
- Bundle Node.js 14 as a fallback for operating systems that cannot run Node.js 18 ([#4151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4151))

### 🐛 Bug Fixes

- [Vis Builder] Fixes auto bounds for timeseries bar chart visualization ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Vis Builder] Fixes visualization shift when editing agg ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Vis Builder] Renames "Histogram" to "Bar" in vis type picker ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Vis Builder] Update vislib params and misc fixes ([2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [Vis Builder] Bug fixes for datasource picker and auto time interval ([2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [MD] Add data source param to low-level search call in Discover ([#2431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2431))
- [Multi DataSource] Skip data source view in index pattern step when pick default ([#2574](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2574))
- [Multi DataSource] Address UX comments on Edit Data source page ([#2629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2629))
- [BUG] Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- [Multi DataSource] Address UX comments on index pattern management stack ([#2611](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2611))
- [Multi DataSource] Apply get indices error handling in step index pattern ([#2652](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2652))
- [Vis Builder] Last Updated Timestamp for visbuilder savedobject is getting Generated ([#2628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2628))
- [Vis Builder] fixes filters for table visualisation ([#3210](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3210))
- Removed Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
- Removes Add Integration button ([#2723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2723))
- Change geckodriver version to make consistency ([#2772](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2772))
- [Multi DataSource] Update default audit log path ([#2793](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2793))
- [Table Visualization] Fix first column sort issue ([#2828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2828))
- Temporary workaround for task-kill exceptions on Windows when it is passed a pid for a process that is already dead ([#2842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2842))
- [Vis Builder] Fix empty workspace animation does not work in firefox ([#2853](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2853))
- Bumped `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- [Chore] Update deprecated url methods (url.parse(), url.format()) ([#1561](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1561))
- [Build] Fixed "Last Access Time" not being set by `scanCopy` on Windows ([#2964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2964))
- [Vis Builder] Add global data persistence for vis builder #2896 ([#2896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2896))
- Update `leaflet-vega` and fix its usage ([#3005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3005))
- [Table Visualization][bug] Fix Url content display issue in table ([#2918](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2918))
- Fixes misleading embaddable plugin error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- [MD] Update dummy url in tests to follow lychee url allowlist ([#3099](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3099))
- Adds config override to fix obsolete theme:version config value of v8 (beta) rendering issue ([#3045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3045))
- [CI] Update test workflow to increase network-timeout for yarn for installing dependencies ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- [VisBuilder] Fixes pipeline aggs ([#3137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3137))
- [Region Maps] Fixes bug that prevents selected join field to be used ([#3213](Fix bug that prevents selected join field to be used))
- [Multi DataSource]Update test connection button text([#3247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3247))
- [Region Maps] Add ui setting to configure custom vector map's size parameter([#3399](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3399))
- [Search Telemetry] Fixes search telemetry's observable object that won't be GC-ed([#3390](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3390))
- Clean up and rebuild `@osd/pm` ([#3570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3570))
- Omit adding the `osd-version` header when the Fetch request is to an external origin ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Vega] Add Filter custom label for opensearchDashboardsAddFilter ([#3640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3640))
- [Timeline] Fix y-axis label color in dark mode ([#3698](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3698))
- [VisBuilder] Fix multiple warnings thrown on page load ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix Firefox legend selection issue ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix type errors ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix indexpattern selection in filter bar ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))
- [Table Visualization] Fix table rendering empty unused space ([#3797](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3797))
- [Table Visualization] Fix data table not adjusting height on the initial load ([#3816](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3816))
- Cleanup unused url ([#3847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3847))
- [BUG] Docked navigation impacts visibility of bottom bar component ([#3978](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3978))

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Update backport custom branch name to utilize head template ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))
- Re-enable CI workflows for feature branckes ([#2908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2908))
- Add Windows CI workflows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- Add automatic selection of the appropriate version of chrome driver to run functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Add recording of functional test artifacts if they fail ([#3190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3190))
- Improve yarn's performance in workflows by caching yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))
- Fix detection of Chrome's version on Darwin during CI ([#3296](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3296))
- Upgrade yarn version to be compatible with @openearch-project/opensearch ([#3443](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3443))
- [CI] Reduce redundancy by using matrix strategy on Windows and Linux workflows ([#3514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3514))
- Add an achievement badger to the PR ([#3721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3721))
- Install chrome driver for functional tests from path set by environment variable `TEST_BROWSER_BINARY_PATH`([#3997](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3997))
- Adds threshold to code coverage config to prevent workflow failures ([#4040](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4040))

### 📝 Documentation

- Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- [MD] Add design documents of multiple data source feature [#2538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2538)
- [MD] Tweak multiple data source design doc [#2724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2724)
- Corrected README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- Add `current-usage.md` and more details to `README.md` of `charts` plugin ([#2695](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2695))
- [Doc] Add readme for global query persistence ([#3001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3001))
- Updates NOTICE file, adds validation to GitHub CI ([#3051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3051))
- [Doc] Add current plugin persistence implementation readme ([#3081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3081))
- [Doc] Improve DEVELOPER_GUIDE to make first time setup quicker and easier ([#3421](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3421))
- Correct copyright date range of NOTICE file and notice generator ([#3308](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3308))
- Simplify the in-code instructions for upgrading `re2` ([#3328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3328))
- [Doc] Add docker dev set up instruction ([#3444](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3444))
- [Doc] UI actions explorer ([#3614](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3614))
- [Doc] Update SECURITY.md with instructions for nested dependencies and backporting ([#3497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3497))
- [Doc] [Console] Fix/update documentation links in Dev Tools console ([#3724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3724))
- [Doc] Update DEVELOPER_GUIDE.md with added manual bootstrap timeout solution and max virtual memory error solution with docker ([#3764](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3764))
- [Doc] Add COMMUNICATIONS.md with info about Slack, forum, office hours ([#3837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3837))
- [Doc] Add docker files and instructions for debugging Selenium functional tests ([#3747](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3747))
- [Saved Object Service] Adds design doc for new Saved Object Service Interface for Custom Repository [#3954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3954)

### 🛠 Maintenance

- Adding @zhongnansu as maintainer. ([#2590](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2590))
- [Timeline] Update default expressions from `.es(*)` to `.opensearch(*)`. ([2720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2720))
- Removes `minimatch` manual resolution ([#3019](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3019))
- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- Upgrade `vega-lite` dependency to ^5.6.0 ([#3076](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3076))
- Bumps `re2` and `supertest` ([3018](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3018))
- Bump `vega-tooltip` version from ^0.24.2 to ^0.30.0 ([#3358](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3358))
- Allow relaxing the Node.js runtime version requirement ([3402](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3402))
- Relax the Node.js requirement to `^14.20.1` ([3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Bump the version of Node.js installed by `nvm` to `14.21.3` ([3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Remove the unused `renovate.json5` file ([3489](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3489))
- Allow selecting the Node.js binary using `NODE_HOME` and `OSD_NODE_HOME` ([3508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3508))
- Bump `styled-components` from 5.3.5 to 5.3.9 ([#3678](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3678))
- Bump `js-yaml` from 3.14.0 to 4.1.0 ([#3770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3770))
- Bump `oui` from `1.0.0` to `1.1.1` ([#3884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3884))
- Use `exec` in the CLI shell scripts to prevent new process creation ([#3955](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3955))
- Adding @ZilongX and @Flyingliuhub as maintainers. ([#4137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4137))
- Remove timeline application ([#3971](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3971))

### 🪛 Refactoring

- [MD] Refactor data source error handling ([#2661](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2661))
- Refactor and improve Discover field summaries ([#2391](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2391))
- [Vis Builder] Removed Hard Coded Strings and Used i18n to transalte([#2867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2867))
- [Console] Replace jQuery.ajax with core.http when calling OSD APIs in console ([#3080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3080))
- [I18n] Fix Listr type errors and error handlers ([#3629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3629))
- [Multiple DataSource] Present the authentication type choices in a drop-down ([#3693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3693))
- [Console] Remove unused ul element and its custom styling ([#3993](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3993))
- Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))
- Remove unused Sass in `tile_map` plugin ([#4110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4110))

### 🔩 Tests

- [Multi DataSource] Add unit test coverage for Update Data source management stack ([#2567](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2567))
- [BWC Tests] Add BWC tests for 2.5.0 ([#2890](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2890))
- Add retrial of flaky tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Fix incorrect validation of time values in JUnit Reporter ([#2965](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2965))
- Make tests covering plugin installation on cluster snapshots work across platforms ([#2994](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2994))
- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))
- [Tests] Bumps `chromedriver` to v107 ([#3017](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3017))
- [Vis Builder] Adds field unit tests ([#3211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3211))
- [BWC Tests] Add BWC tests for 2.6.0 ([#3356](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3356))
- Prevent primitive linting limitations from being applied to unit tests found under `src/setup_node_env` ([#3403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3403))
- [Tests] Fix unit tests for `get_keystore` ([#3854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3854))
- [Tests] Use `scripts/use_node` instead of `node` in functional test plugins ([#3783](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3783))

## [2.x]

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
- Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
- [CVE-2022-33987] Upgrade geckodriver to 3.0.2 ([#2166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2166))
- Bumps percy-agent to use non-beta version ([#2415](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2415))
- Resolve sub-dependent d3-color version and potential security issue ([#2454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2454))
- [CVE-2022-3517] Bumps minimatch from 3.0.4 to 3.0.5 and [IBM X-Force ID: 220063] unset-value from 1.0.1 to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
- [CVE-2022-37601] Bump loader-utils to 2.0.3 ([#2689](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2689))
- [CVE-2022-37599] Bump loader-utils to 2.0.4 ([#3031](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3031))
- [CVE-2022-37603] Bump loader-utils to 2.0.4 ([#3031](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3031))
- [WS-2021-0638][security] bump mocha to 10.1.0 ([#2711](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2711))
- [CVE-2022-25881] Resolve http-cache-semantics to 4.1.1 ([#3409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3409))

### 📈 Features/Enhancements

- Add updated_at column to objects' tables ([#1218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1218))
- [Viz Builder] State validation before dispatching and loading ([#2351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2351))
- [Viz Builder] Create a new wizard directly on a dashboard ([#2384](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2384))
- [Viz Builder] Edit wizard directly on dashboard ([#2508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2508))
- [Multi DataSource] UX enhacement on index pattern management stack ([#2505](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2505))
- [Multi DataSource] UX enhancement on Data source management stack ([#2521](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2521))
- [Multi DataSource] UX enhancement on Update stored password modal for Data source management stack ([#2532](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2532))
- [Monaco editor] Add json worker support ([#3424](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3424))
- Enhance grouping for context menus ([#3169](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3169))
- Replace re2 with RegExp in timeline and add unit tests ([#3908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3908))

### 🐛 Bug Fixes

- [Viz Builder] Fixes time series for new chart types ([#2309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2309))
- [Viz Builder] Add index pattern info when loading embeddable ([#2363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2363))
- Fixes management app breadcrumb error ([#2344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2344))
- [BUG] Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- [TSVB] Fixes undefined serial diff aggregation documentation link ([#3503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3503))
- [Console] Fix dev tool console autocomplete not loading issue ([#3775](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3775))
- [Console] Fix dev tool console run command with query parameter error ([#3813](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3813))
- Add clarifying tooltips to header navigation ([#3573](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3573))
- [Dashboards Listing] Fix listing limit to utilize `savedObjects:listingLimit` instead of `savedObjects:perPage` ([#4021](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4021))

### 🚞 Infrastructure

- Add path ignore for markdown files for CI ([#2312](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2312))
- Updating WS scans to ignore BWC artifacts in `cypress` ([#2408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2408))
- [CI] Run functional test repo as workflow ([#2503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2503))
- Add downgrade logic for branch in DocLinkService([#3483](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3483))

### 📝 Documentation

- README.md for saving index pattern relationship ([#2276](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2276))
- Remove extra typo from README. ([#2403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2403))
- Add sample config for multi data source feature in yml template. ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
- README.md for dataSource and dataSourceManagement Plugin ([#2448](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2448))
- Updates functionl testing information in Testing.md ([#2492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2492))
- Fixes typo in TSVB README ([#3518](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3518))

### 🛠 Maintenance

- Increment from 2.3 to 2.4. ([#2295](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295))
- Adding @zengyan-amazon as maintainer ([#2419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2419))
- Updating @tmarkley to Emeritus status. ([#2423](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2423))
- Adding sample config for multi data source in yml config template. ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
- Adding @kristenTian as maintainer. ([#2450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2450))

### 🪛 Refactoring

- [Tech Debt] Clean up docs_link_service organization so that strings are in the right categories. ([#3685](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3685))

### 🔩 Tests

- Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))
- Update caniuse to 1.0.30001460 to fix failed integration tests ([#3538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3538))

[unreleased]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/2.3.0...HEAD
[2.x]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/2.3.0...2.x
