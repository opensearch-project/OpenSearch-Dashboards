## Version 2.9.0 Release Notes

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
