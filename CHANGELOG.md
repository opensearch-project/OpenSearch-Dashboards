# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased] (https://github.com/opensearch-project/OpenSearch-Dashboards/compare/2.9.0...HEAD)

### Deprecations

### 🛡 Security
- Bump word-wrap from 1.2.3 to 1.2.4 ([#4589](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4589))
- Bump version of tinygradient from 0.4.3 to 1.1.5 ([#4742](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4742))
- Bump lmdb from 2.8.0 to 2.8.5 ([#4804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4804))
- Alias and bump mocha ([#4874](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4874))

### 📈 Features/Enhancements
- [Vis colors] Update legacy mapped colors in charts plugin to use ouiPaletteColorBlind() ([#4398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4398))
- Chore (home): Update visual consistency dashboard TSVB colors ([#4501](http://github.com/opensearch-project/OpenSearch-Dashboards/pull/4501))
- Feature (home): Update visual consistency sample dashboard with more vis ([#4581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4581))
- Add resource ID filtering in fetch augment-vis obj queries ([#4608](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4608))
- Enable theme-switching via Advanced Settings to preview the Next theme ([#4475](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4475))
- Feat (home): Add remaining vis type examples ([#4619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4619))
- Feat (Discover): Update styles to be compatible with next theme ([#4644](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4644))
- Update webpack environment targets ([#4649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4649))
- [Table Visualization] Replace div containers with OuiFlex components ([#4272](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4272))
- Reduce the amount of comments in compiled CSS ([#4648](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4648))
- Feat (home): Remove color customizations from sample dashboards ([#4741](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4741))
- Remove visualization editor background ([#4719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4719))
- Add saved objects service status api ([#4696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4696))
- Allow plugin manifest config to define semver compatible OpenSearch plugin and verify if it is installed on the cluster ([#4612](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4612))
- Eliminate duplicate dashboard breadcrumb text ID ([#4805](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4805))
- [@osd/pm] Automate multi-target bootstrap and build ([#4650](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4650))
- [Data Explorer] Merge to main ([#4806](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4806))
- [Data Explorer][Discover 2.0] Restore single and surroundings doc view ([#4816](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4816))
- [Data Explorer][Discover 2.0] Add missing change interval on TimeChart and improve fetch ([#4850](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4850))
- [Data Explorer][Discover 2.0] Replace hide column and add move left/right ([#4838](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4838))
- [Data Explorer][Discover 2.0] Append popout icon to oui link for doc viewer links ([#4855](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4855))
- [Data Explorer][Discover 2.0] Allow Top Nav to update based on index pattern change ([#4889](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4889))
- [Data Explorer] Add dismissible callout for discover ([#4857](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4857))
- [Next theme] Add modal to notify users of theme updates ([#4715](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4715))
- Change color fn used to calculate icon colors for search typeahead suggestions ([#4884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4884))
- [Next Theme] Make next theme the default ([#4854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4854))
- [Vis Colors] Update color mapper to prioritize unique colors per vis ([#4890](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4890))
- [Console] Add support for JSON with long numerals ([#4562](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4562))
- Feat (Advanced Settings): Make new "Appearance" category ([#4845](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4845))
- Feat (home): Add new theme dashboard screenshots ([#4906](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4906))
- Modify call out text for discover ([#4932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4932))
- Use themes' definitions to render the initial view. This impacts the loading screen font and colors ([#4936](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4936))

### 🐛 Bug Fixes
- [VisLib] Replace legend color palette with OUI color palette ([#4365](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4365))
- Fix (styles): Make ace code editor themes consistent ([#4609](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4609))
- [i18n] fix generation scripts ([#4252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4252))
- Fix (Legacy Maps): Add necessary specificity for dark mode style overrides ([#4658](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4658))
- Fix --font-text CSS var usage and add more leaflet font overrides ([#4674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4674))
- Fix snapshots that didn't get updated between PRs ([#4863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4863))
- [Data Explorer] Fix breadcrumb for data explorer ([#4856](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4856))
- [Data Explorer] Fix darkmode for histogram ([#4858](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4858))
- [Data Explorer] Fixes save search glitch + misc ([#4870](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4870))
- [BUG] Fix management overview page duplicate rendering ([#4636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4636))
- [Data Explorer][Discover 2.0] Fix issues when change index pattern ([#4875](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4875))
- [Data Explorer] Fix display for index pattern without a default time field ([#4821](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4821))
- Fixes broken app when management is turned off ([#4891](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4891))
- [CCI] Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))
- Bump `agentkeepalive` to v4.5.0 to solve a problem preventing the use `https://ip` in `opensearch.hosts` ([#4949](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4949))

### 🚞 Infrastructure

### 📝 Documentation
- Add missing 1.3.x patch release notes to 2.x branch ([#4771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4771))

### 🛠 Maintenance
- Version increment from 2.9 to 2.10 ([#4545](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4545))
- Bump OpenSearch-Dashboards 2.10.0 to use nodejs 18.16.0 version ([#4948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4948))
- [Version] Version increment from 2.10 to 2.11 ([#4975](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4975))

### 🪛 Refactoring
- [Markdown] Replace custom css styles and native html with OUI ([#4390](http://github.com/opensearch-project/OpenSearch-Dashboards/pull/4390))
- Removed KUI usage in `maps_legacy` plugin ([#3998](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3998))
- [Console] Converted all `/lib/autocomplete/**/*.js` files to typescript ([#4148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4148))
- [Console] Convert all non-autocomplete lib files to typescript ([#4150](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4150))
- Refactor/remove breadcrumb styling main ([#4621](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4621))
- Bump `node-sass` to a version that uses a newer `libsass` ([#4651](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4651))
- [Dashboards] restructure folder to be more cohesive with the project ([#4575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4575))
- Remove minimum constraint on opensearch hosts ([#4701](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4701))
- [CCI] Remove unused tags in the navigation plugin ([#3964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3964))
- Refactor logo usage ([#4702](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4702))
- Remove examples and other unwanted artifacts from installed dependencies ([#4896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4896))

### 🔩 Tests
- [CI] Fix BWC related CI failures by swapping dist url with snapshot url ([#4828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4828))
- [Dashboard De-Angular] Add unit tests for `dashboard_listing` and `dashboard_top_nav` ([#4640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4640))
- [Tests] Add BWC tests for 2.9 and 2.10 versions ([#4762](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4762))
- [Stylelint] Add `no_restricted_values` linter rule ([#4413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4413))
- Units test for utils folder ([#4641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4641))
- Test (linkchecker): Exclude checking dead link ([#4720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4720))
- Update baseline images for functional tests ([#4879](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4879))


## [2.9.0 - 2023-07-24]

### 🛡 Security

- Bump `joi` to v14 to avoid the possibility of prototype poisoning in a nested dependency ([#3952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3952))
- [CVE-2022-25883] Resolve `semver` to `7.5.3` and remove unused package ([#4411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4411))
- Bump tough-cookie from 4.0.0 to 4.1.3 ([#4531](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4531))

### 📈 Features/Enhancements

- Add plugin manifest config to define OpenSearch plugin dependency and verify if it is installed on the cluster ([#3116](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3116))
- Replace re2 with RegExp in timeline and add unit tests ([#3908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3908))
- Hide any output from use_node checking for Node compatibility ([#4237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4237))
- Add category option within groups for context menus ([#4144](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4144))
- [Saved Object Service] Add Repository Factory Provider ([#4149](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4149))
- [Sample Data] Add visual consistency dashboard to sample logs data ([#4339](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4339))
- [@osd/pm] Fix `file:`-linked dependencies' resolution to improve ability to test with local packages ([#4342](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4342))
- [Multiple DataSource] Backend support for adding sample data ([#4268](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4268))
- Add configurable defaults and overrides to uiSettings ([#4344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4344))
- Update header logo selection logic to match the header's theme ([#4383](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4383))
- Introduce new fonts for the Next theme ([#4381](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4381))
- Bump OUI to `1.1.2` to make `anomalyDetection` icon available ([#4408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4408))
- Add `color-scheme` to the root styling ([#4477](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4477))
- [Multiple DataSource] Frontend support for adding sample data ([#4412](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4412))
- Enable plugins to augment visualizations with additional data and context ([#4361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4361))
- Dashboard De-Angularization ([#4502](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4502))
- New management overview page and rename stack management to dashboard management ([#4287](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4287))
- [Console] Add support for JSON with long numerals ([#4562](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4562))
- [Vis Augmenter] Update base vis height in view events flyout ([#4535](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4535))

### 🐛 Bug Fixes

- [Saved Objects Management] Fix relationships header overflow ([#4070](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4070))
- Update main menu to display 'Dashboards' for consistency ([#4453](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4453))
- [Multiple DataSource] Retain the original sample data API ([#4526](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4526))
- Remove `lmdb-store` to fix backport issue ([#4266](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4266))

### 🚞 Infrastructure

- Upgrade the backport workflow ([#4343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4343))
- [Lint] Add custom stylelint rules and config to prevent unintended style overrides ([#4290](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4290))
- [Lint] Add stylelint rule to define properties that are restricted from being used ([#4374](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4374))
- [Lint] Add typing to Stylelint rules ([#4392](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4392))
- [CI] Split build and verify into parallel jobs ([#4467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4467))

### 📝 Documentation

- [Saved Object Service] Adds design doc for new Saved Object Service Interface for Custom Repository [#3954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3954)

### 🛠 Maintenance

- Adding @ZilongX and @Flyingliuhub as maintainers. ([#4137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4137))
- Add new MAINTAINERS to CODEOWNERS file. ([#4199](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4199))
- Bump `oui` to `1.3.0` ([#4941](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4941))
- Adding @BSFishy as maintainer. ([#4469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4469))

### 🪛 Refactoring

- [Table Visualization] Remove custom styling for text-align:center in favor of OUI utility class. ([#4164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4164))
- Migrate from legacy elasticsearch client to opensearch-js client in `osd-opensearch-archiver` package([#4142](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4142))
- Replace the use of `bluebird` in `saved_objects` plugin ([#4026](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4026))
- Relocate tutorials imagery into `src/plugins/home/public/assets/tutorials/logos` ([#4382](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4382))
- [VisBuilder] Use OUI icon ([#4446](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4446))
- [Vis Colors] [Region Maps] Replace hardcode color to OUI color in `region_map` plugin ([#4299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4299))
- [Vis Colors] Replace color maps with OUI color palettes ([#4293](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4293))
- [Vis Colors] [Maps] Replace hardcoded color to OUI color in `maps_legacy` plugin ([#4294](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4294))
- [Vis Colors] [TSVB] Update default color in `vis_type_timeseries` to use `ouiPaletteColorBlind()[0]`([#4363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4363))
- [Vis Colors] [Timeline] Replace `vis_type_timeline` colors with `ouiPaletteColorBlind()` ([#4366](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4366))
- [Vis Colors] Update legacy seed colors to use `ouiPaletteColorBlind()` ([#4348](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4348))
- [Console] Migrate `/lib/mappings/` module to TypeScript ([#4008](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4008))

### 🔩 Tests

- [Vis Augmenter Add UT for few fns ([#4516](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4516))
- [BWC Tests] Add BWC tests for 2.7.0 and 2.8.0 ([#4023](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4023))


## [2.8.0 - 2023-06-06]

### Deprecations

- Remove timeline application ([#3971](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3971))

### 🛡 Security

- [CVE-2023-2251] Bump yaml to `2.2.2` ([#3947](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3947))

### 📈 Features/Enhancements

- [Multiple Datasource] Support Amazon OpenSearch Serverless ([#3957](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3957))
- Add support for Node.js >=14.20.1 <19 ([#4071](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4071))
- Bundle Node.js 14 as a fallback for operating systems that cannot run Node.js 18 ([#4151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4151))
- Enhance grouping for context menus ([#3924](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3924))

### 🐛 Bug Fixes

- [BUG] Fix bottom bar visibility using createPortal ([#3978](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3978))

### 🚞 Infrastructure

- Add threshold to code coverage config to prevent workflow failures ([#4040](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4040))
- [CI] Skip checksum verification on OpenSearch snapshot for cypress tests ([#4188](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4188))

### 🛠 Maintenance

- Use `exec` in the CLI shell scripts to prevent new process creation ([#3955](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3955))

## [2.7.0]

### Deprecations

### 🛡 Security

- [CVE-2023-26486] Bump vega from `5.22.1` to `5.23.0` ([#3533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3533))
- [CVE-2023-26487] Bump vega from `5.22.1` to `5.23.0` ([#3533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3533))
- [CVE-2023-0842] Bump xml2js from `0.4.23` to `0.5.0` ([#3842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3842))
- Bump `joi` to v14 to avoid the possibility of prototype poisoning in a nested dependency ([#3952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3952))

### 📈 Features/Enhancements

- Add satisfaction survey link to help menu ([#3676](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3676))
- Add `osd-xsrf` header to all requests that incorrectly used `node-version` to satisfy XSRF protection ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Dashboard] Add Dashboards-list integrations for Plugins ([#3090](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3090) )
- [Data] Add geo shape filter field ([#3605](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3605))
- [Doc Links] Add downgrade logic for branch in DocLinkService ([#3483](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3483))
- [Monaco editor] Add json worker support ([#3424](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3424))
- [Multiple DataSource] Allow create and distinguish index pattern with same name but from different datasources ([#3604](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3604))
- [Multiple DataSource] Integrate multiple datasource with dev tool console ([#3754](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3754))
- [Notifications] Add id to toast api for deduplication ([#3752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3752))
- [UI] Add support for comma delimiters in the global filter bar ([#3686](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3686))
- [UI] Indicate that IE is no longer supported ([#3641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3641))
- [Vega] Add Filter custom label for opensearchDashboardsAddFilter ([#3640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3640))
- [VisBuilder] Add metric to metric, bucket to bucket aggregation persistence ([#3495](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3495))
- [VisBuilder] Add UI actions handler ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Add persistence to visualizations inner state ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))

### 🐛 Bug Fixes

- Clean up and rebuild `@osd/pm` ([#3570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3570))
- Omit adding the `osd-version` header when the Fetch request is to an external origin ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Console] Fix/update documentation links in Dev Tools console ([#3724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3724))
- [Console] Fix dev tool console autocomplete not loading issue ([#3775](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3775))
- [Console] Fix dev tool console run command with query parameter error ([#3813](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3813))
- [Table Visualization] Fix table rendering empty unused space ([#3797](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3797))
- [Table Visualization] Fix data table not adjusting height on the initial load ([#3816](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3816))
- [Timeline] Fix y-axis label color in dark mode ([#3698](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3698))
- [TSVB] Fix undefined serial diff aggregation documentation link ([#3503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3503))
- [UI] Add clarifying tooltips to header navigation icons ([#3626](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3626))
- [VisBuilder] Fix multiple warnings thrown on page load ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix Firefox legend selection issue ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix type errors ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix indexpattern selection in filter bar ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))

### 🚞 Infrastructure

- Use mirrors to download Node.js binaries to escape sporadic 404 errors ([#3619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3619))
- [CI] Update NOTICE file, add validation to GitHub CI ([#3051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3051))
- [CI] Reduce redundancy by using matrix strategy on Windows and Linux workflows ([#3514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3514))
- [Darwin] Add support for Darwin for running OpenSearch snapshots with `yarn opensearch snapshot` ([#3537](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3537))

### 📝 Documentation

- Correct copyright date range of NOTICE file and notice generator ([#3308](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3308))
- Simplify the in-code instructions for upgrading `re2` ([#3328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3328))
- [Doc] Improve DEVELOPER_GUIDE to make first time setup quicker and easier ([#3421](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3421))
- [Doc] Update DEVELOPER_GUIDE with added manual bootstrap timeout solution and max virtual memory error solution with docker ([#3764](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3764))
- [Doc] Add second command to install yarn step in DEVELOPER_GUIDE ([#3633](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3633))
- [Doc] Add docker dev set up instruction ([#3444](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3444))
- [Doc] Add docker files and instructions for debugging Selenium functional tests ([#3747](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3747))
- [Doc] Update SECURITY with instructions for nested dependencies and backporting ([#3497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3497))
- [TSVB] Fix typo in TSVB README ([#3518](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3518))
- [UI Actions] Improve UI actions explorer ([#3614](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3614))

### 🛠 Maintenance

- Relax the Node.js requirement to `^14.20.1` ([#3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Bump the version of Node.js installed by `nvm` to `14.21.3` ([#3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Allow selecting the Node.js binary using `NODE_HOME` and `OSD_NODE_HOME` ([#3508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3508))
- Remove the unused `renovate.json5` file ([#3489](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3489))
- Bump `styled-components` from `5.3.5` to `5.3.9` ([#3678](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3678))
- Bump `oui` from `1.0.0` to `1.1.1` ([3884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3884))
- [Timeline] Update default expressions from `.es(*)` to `.opensearch(*)`. ([#2720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2720))

### 🪛 Refactoring

- Remove automatic addition of `osd-version` header to requests outside of OpenSearch Dashboards ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Doc Links] Clean up docs_link_service organization so that strings are in the right categories. ([#3685](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3685))
- [I18n] Fix Listr type errors and error handlers ([#3629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3629))
- [Multiple DataSource] Refactor dev tool console to use opensearch-js client to send requests ([#3544](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3544))
- [Multiple DataSource] Present the authentication type choices in a drop-down ([#3693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3693))
- [Table Visualization] Move format table, consolidate types and add unit tests ([#3397](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3397))
- Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))

### 🔩 Tests

- Update caniuse to `1.0.30001460` to fix failed integration tests ([#3538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3538))
- [Tests] Fix unit tests for `get_keystore` ([#3854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3854))
- [Tests] Use `scripts/use_node` instead of `node` in functional test plugins ([#3783](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3783))

## [2.6.0]

### Deprecations

- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from `4.1.1` to `5.0.2` ([#3419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3419)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).

### 🛡 Security

- [CVE-2022-37599] Bump loader-utils from `2.0.3` to `2.0.4` ([#3318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3318))
- [CVE-2022-37603] Bump loader-utils from `2.0.3` to `2.0.4` ([#3318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3318))
- [CVE-2022-25860] Bump simple-git from `3.15.1` to `3.16.0` ([#3345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3345))
- [CVE-2022-25881] Resolve http-cache-semantics from `4.1.0` to `4.1.1` ([#3409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3409))
- [Security] Bump hapi/statehood from `7.0.3` to `7.0.4` ([#3411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3411))
- [CVE-2023-25166] Bump formula from `3.0.0` to `3.0.1` ([#3416](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3416))
- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from `4.1.1` to `5.0.2` ([#3419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3419)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).
- [CVE-2023-25653] Bump node-jose from `2.1.1` to `2.2.0` ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2022-24999] Resolve qs from `6.5.3` to `6.11.0` ([#3450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3450))
- [CVE-2022-25758] Bump node-sass from `6.0.1` to `7.0.3` and sass-loader from `10.2.1` to `10.4.1` to bump scss-tokenizer from `0.2.3` to `0.4.3` ([#3455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3455))
- [CVE-2020-24025] Bump node-sass from `6.0.1` to `7.0.3` ([#3455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3455))

### 📈 Features/Enhancements

- Add disablePrototypePoisoningProtection configuration to prevent JS client from erroring when cluster utilizes JS reserved words ([#2992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2992))
- [Multiple DataSource] Add support for SigV4 authentication ([#3058](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3058))
- [Multiple DataSource] Refactor test connection to support SigV4 auth type ([#3456](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3456))
- Replace re2 with RegExp in timeline and add unit tests ([#3908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3908))

### 🐛 Bug Fixes

- [Search Telemetry] Fix search telemetry's observable object that won't be GC-ed([#3390](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3390))
- [Region Maps] Add ui setting to configure custom vector map's size parameter([#3399](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3399))

### 🚞 Infrastructure

- Fix detection of Chrome's version on Darwin during CI ([#3296](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3296))

### 📝 Documentation

- [Docs] Fix documentation link for date math ([#3207](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3207))

### 🛠 Maintenance

- Bump `re2` and `supertest` ([#3018](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3018))
- Upgrade vega-tooltip to `0.30.0` to support custom tooltips ([#3359](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3359))
- Allow relaxing the Node.js runtime version requirement ([#3402](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3402))
- Make build scripts find and use the latest version of Node.js that satisfies `engines.node` ([#3467](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3467))
- Add `@opensearch-project/opensearch@^2.x` as dependency aliased as `@opensearch-project/opensearch-next` ([#3469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3469))

### 🪛 Refactoring

### 🔩 Tests

- [BWC Tests] Add BWC tests for `2.6.0` ([#3356](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3356))
- Prevent primitive linting limitations from being applied to unit tests found under `src/setup_node_env` ([#3403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3403))

## [2.5.0]

### 🛡 Security

- Introduce guidelines for reporting vulnerable dependencies ([#2674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2674))
- Bump decode-uri-component from 0.2.0 to 0.2.2 ([3009](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3009))
- [CVE-2022-25912] Bump simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-35256] Bump node version from 14.20.0 to 14.20.1 [#3166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3166))
- [CVE-2022-46175] Bump json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))

### 📈 Features/Enhancements

- [CLI] Enhance `yarn opensearch snapshot` to facilitate installing plugins on an OpenSearch cluster ([#2734](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2734))
- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))
- [Multi DataSource] Introduce validation of new or modified connections to external data sources ([#2973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2973), [#3110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3110))
- [VisBuilder] Create global data persistence for VisBuilder ([#2896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2896))
- [VisBuilder] Introduce Redux store persistence ([#3088](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3088))
- [VisBuilder] Enable persistence for app filter and query without using state containers ([#3100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3100))
- [Data] Make the newly created configurations get added to beginning of the `aggConfig` array when using `createAggConfig` ([#3160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3160))
- [Optimizer] Increase the amount of time an optimizer worker is provided to exit before throwing an error ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))

### 🐛 Bug Fixes

- Upgrade the `del` library to fix a race condition on macOS ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- [Table Visualization] Fix a problem with table visualizations that prevented URLs from being rendered correctly ([#2918](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2918))
- [Embeddable] Fix a misleading error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- Fix rendering issues when the obsolete `v8 (beta)` theme was carried over by an upgrade ([#3045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3045))
- [Multi Datasource] Replace the mock URL in tests ([#3099](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3099))
- [CI] Increase Yarn's timeout for installing dependencies in workflows ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- [VisBuilder] Fix an issue that caused a crash when certain filters were added to a table visualization ([#3210](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3210))
- [VisBuilder] Fix errors throws when pipeline aggregations, like cumulative sum, were used in VisBuilder ([#3137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3137))
- [Region Maps] Fix the problem of join fields being unusable ([#3213](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3213))
- [Multi DataSource] Update test connection button text ([#3247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3247))

### 🚞 Infrastructure

- Bump the version of the `2.x` branch to 2.5.0 ([#2884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2884))
- [CI] Create workflows that test and build on Windows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- [CI] Automate ChromeDriver installation for running functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Create the Release Notes for the 1.3.7 release ([#3066](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3066))
- [CI] Improve workflows by retaining Yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))

### 📝 Documentation

- Publish the release runbook ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- Document the capabilities of the Charts plugin and its current usage ([#2695](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2695))
- Document the correct version selection switch in `@osd/plugin-helpers` ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- Document the global query persistence ([#3001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3001))
- Document data persistence for plugins ([#3081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3081))

### 🪛 Refactoring

- [VisBuilder] Extend the use of i18n ([#2867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2867))
- [Console] Switch to using `core.http` when calling OSD APIs in console ([#3080]https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3080))
- [Table Visualization] Refactor table visualization using React and DataGrid component ([#2863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2863))

### 🛠 Maintenance

- Remove an unused dependency on `github-checks-reporter` ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- Introduce `vega-lite@5`, aliased as `vega-lite-next` ([#3151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3151))

### 🔩 Tests

- Enable retrying of flaky tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Enhance cross-platform testing of plugin installation on cluster snapshots ([#2994](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2994))
- [Tests] Bump `chromedriver` to v107 ([#3017](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3017))
- [CI] Disable the execution of the Build and Test workflow when the changes are limited to the docs folder ([#3197](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3197))
- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))
- [VisBuilder] Create unit tests for field utilities ([#3211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3211))

## [2.4.1]

### 🐛 Bug Fixes

- Update `leaflet-vega` and fixed its usage ([#3005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3005))

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
- [VisBuilder] Add an experimental table visualization in vis builder ([#2705](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2705))
- [VisBuilder] Add field summary popovers ([#2682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2682))
- [VisBuilder] Add index pattern info when loading embeddable ([#2363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2363))
- [VisBuilder] Add state validation before dispatching and loading ([#2351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2351))
- [VisBuilder] Change VisBuilder flag for docker config ([#2804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2804))
- [VisBuilder] Change classname prefix wiz to vb ([#2581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2581/files))
- [VisBuilder] Change save object type, wizard id and name to visBuilder ([#2673](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2673))
- [VisBuilder] Change wizard to vis_builder in file names and paths ([#2587](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2587))
- [VisBuilder] Create a new wizard directly on a dashboard ([#2384](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2384))
- [VisBuilder] Edit wizard directly on dashboard ([#2508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2508))
- [VisBuilder] Enable VisBuilder by default ([#2725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2725))
- [VisBuilder] Rename wizard on save modal and visualization table ([#2645](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2645))
- [VisBuilder] Rename wizard to visBuilder in class name, type name and function name ([#2639](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2639))
- [VisBuilder] Rename wizard to visBuilder in i18n id and formatted message id ([#2635](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2635))
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
- [VisBuilder] Add additional aggregation parameters to Vislib charts (Bar, Line and Area) ([#2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [VisBuilder] Add missing test subject property of `DisabledVisualization` ([#2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [VisBuilder] Fix Date Histogram auto bounds showing per 0 millisecond ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix Histogram updating bounds when date range updates ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix auto bounds for time-series bar chart visualization ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [VisBuilder] Fix broken UX after switching index pattern while editing an aggregation ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix rendering issues with time series for new chart types ([#2309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2309))
- [VisBuilder] Fix the missing `Last Updated` timestamp in visualization list ([#2628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2628))
- [VisBuilder] Fix visualization shift when editing an aggregation ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [VisBuilder] Rename "Histogram" to "Bar" in visualization type picker ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
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
- [VisBuilder] Enable VisBuilder cypress tests ([#2728](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2728))

### 🛠 Maintenance

- Add @zengyan-amazon as a maintainer ([#2419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2419))
- Increment from 2.3 to 2.4. ([#2295](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295))
- Add CHANGELOG.md for 2.4.0 ([#2809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2809))
