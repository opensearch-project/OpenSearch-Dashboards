## Version 2.10.0 Release Notes

### 🛡 Security

- Bump word-wrap from 1.2.3 to 1.2.4 ([#4589](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4589))
- Bump version of tinygradient from 0.4.3 to 1.1.5 ([#4742](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4742))
- Bump lmdb from 2.8.0 to 2.8.5 ([#4804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4804))
- Alias and bump mocha ([#4874](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4874))
- Remove examples and other unwanted artifacts from installed dependencies ([#4896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4896))

### 📈 Features/Enhancements

- [Vis colors] Update legacy mapped colors in charts plugin to use ouiPaletteColorBlind() ([#4398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4398))
- [Saved Objects Management] Add new or remove extra tags and styles ([#4069](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4069))
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
- [Home] Add modal to introduce the `next` theme ([#4715](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4715))
- [Home] Add new theme sample dashboard screenshots ([#4906](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4906))
- Change color fn used to calculate icon colors for search typeahead suggestions ([#4884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4884))
- [Next Theme] Make next theme the default ([#4854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4854))
- [Vis Colors] Update color mapper to prioritize unique colors per vis ([#4890](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4890))
- [Advanced Settings] Consolidate settings into new "Appearance" category and add category IDs ([#4845](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4845))
- Adds Data explorer framework and implements Discover using it ([#4806](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4806))
- Use themes' definitions to render the initial view. This impacts the loading screen font and colors ([#4936](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4936))

### 🐛 Bug Fixes

- [VisLib] Replace legend color palette with OUI color palette ([#4365](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4365))
- Fix (styles): Make ace code editor themes consistent ([#4609](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4609))
- [i18n] fix generation scripts ([#4252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4252))
- Fix (Legacy Maps): Add necessary specificity for dark mode style overrides ([#4658](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4658))
- Fix --font-text CSS var usage and add more leaflet font overrides ([#4674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4674))
- Fix snapshots that didn't get updated between PRs ([#4863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4863))
- [BUG] Fix management overview page duplicate rendering ([#4636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4636))
- Fixes broken app when management is turned off ([#4891](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4891))
- [CCI] Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))
- Correct the generated path for downloading plugins by their names on Windows ([#4953](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4953))

### 📝 Documentation

- Add missing 1.3.x patch release notes to 2.x branch ([#4771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4771))
- [Vis Augmenter] Add documentation to `vis_augmenter` plugin ([#4527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4527))

### 🛠 Maintenance

- Version increment from 2.9 to 2.10 ([#4545](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4545))
- Bump OpenSearch-Dashboards 2.10.0 to use nodejs 18.16.0 version ([#4948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4948))
- Bump `oui` to `1.3.0` ([#4941](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4941))

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

### 🔩 Tests

- [CI] Fix BWC related CI failures by swapping dist url with snapshot url ([#4828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4828))
- [Dashboard De-Angular] Add unit tests for `dashboard_listing` and `dashboard_top_nav` ([#4640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4640))
- [Tests] Add BWC tests for 2.9 and 2.10 versions ([#4762](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4762))
- [Stylelint] Add `no_restricted_values` linter rule ([#4413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4413))
- Units test for utils folder ([#4641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4641))
- Test (linkchecker): Exclude checking dead link ([#4720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4720))
- Update baseline images for functional tests ([#4879](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4879))
