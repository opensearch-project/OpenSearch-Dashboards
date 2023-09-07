## Version 2.10.0 Release Notes

### 🛡 Security

- [CVE-2022-37599] Bump loader-utils from `2.0.3` to `2.0.4` ([#3031](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3031)). Backwards-compatible fixes included in v2.6.0 and v1.3.7 releases.
- [CVE-2022-37603] Bump loader-utils from `2.0.3` to `2.0.4` ([#3031](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3031)). Backwards-compatible fixes included in v2.6.0 and v1.3.7 releases.
- [WS-2021-0638] Bump mocha from `7.2.0` to `10.1.0` ([#2711](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2711))
- [CVE-2023-26115] Bump `word-wrap` from `1.2.3` to `1.2.4` ([#4589](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4589))
- Bump `node-sass` to a version that uses a newer `libsass` ([#4649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4649))
- [CVE-2019-11358] Bump version of tinygradient from 0.4.3 to 1.1.5 ([#4742](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4742))
- [CVE-2021-3520] Bump `lmdb` from `2.8.0` to `2.8.5` ([#4804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4804))
- Remove examples and other unwanted artifacts from installed dependencies ([#4896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4896))

### 📈 Features/Enhancements

- Enable theme-switching via Advanced Settings to preview the Next theme ([#4475](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4475))
- Optimize `augment-vis` saved obj searching by adding arg to saved obj client ([#4595](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4595))
- Add resource ID filtering in fetch `augment-vis` obj queries ([#4608](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4608))
- Reduce the amount of comments in compiled CSS ([#4648](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4648))
- [Saved Object Service] Customize saved objects service status ([#4696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4696))
- Remove minimum constraint on opensearch hosts to allow empty host ([#4701](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4701))
- [Discover] Update styles to compatible with OUI `next` theme ([#4644](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4644))
- [Home] Add modal to introduce the `next` theme ([#4715](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4715))
- [Home] Add new theme sample dashboard screenshots ([#4906](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4906))
- Remove visualization editor sidebar background ([#4719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4719))
- [Vis Colors] Remove customized colors from sample visualizations and dashboards ([#4741](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4741))
- [Vis Colors] Update color mapper to prioritize unique colors per visualization rather than across entire dashboard ([#4890](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4890))
- [Decouple] Allow plugin manifest config to define semver compatible OpenSearch plugin and verify if it is installed on the cluster([#4612](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4612))
- [Advanced Settings] Consolidate settings into new "Appearance" category and add category IDs ([#4845](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4845))
- Adds Data explorer framework and implements Discover using it ([#4806](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4806))
- [Theme] Use themes' definitions to render the initial view ([#4936](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4936/))
- [Theme] Make `next` theme the default ([#4854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4854/))

### 🐛 Bug Fixes

- [Chore] Update deprecated url methods (url.parse(), url.format()) ([#2910](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2910))
- Cleanup unused url ([#3847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3847))
- Fix Node.js download link ([#4556](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4556))
- [TSVB, Dashboards] Fix inconsistent dark mode code editor themes ([#4609](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4609))
- [Legacy Maps] Fix dark mode style overrides ([#4658](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4658))
- [BUG] Fix management overview page duplicate rendering ([#4636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4636))
- Fix broken app when management is turned off ([#4891](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4891))
- Correct the generated path for downloading plugins by their names on Windows ([#4953](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4953))

### 🚞 Infrastructure

- Re-enable CI workflows for feature branches ([#2908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2908))
- Upgrade yarn version to be compatible with @opensearch-project/opensearch ([#3443](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3443))
- Add an achievement badger to the PR ([#3721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3721))

### 📝 Documentation

- [Doc] Add COMMUNICATIONS.md with info about Slack, forum, office hours ([#3837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3837))
- Add plugin development section in DEVELOPER_GUIDE.md ([#3989](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3989))
- [Vis Augmenter] Add documentation to `vis_augmenter` plugin ([#4527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4527))

### 🛠 Maintenance

- Remove angular html extractor ([#4680](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4680))
- Removes `minimatch` manual resolution ([#3019](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3019))
- Upgrade `vega-lite` dependency from `4.17.0` to `^5.6.0` ([#3076](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3076)). Backwards-compatible version included in v2.5.0 release.
- Bump `js-yaml` from `3.14.0` to `4.1.0` ([#3770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3770))
- [@osd/pm] Automate multi-target bootstrap and build ([#4650](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4650))
- Update webpack environment targets ([#4649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4649))
- Add @curq as maintainer ([#4760](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4760))
- Bump `oui` to `1.3.0` ([#4941](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4941))

### 🪛 Refactoring

- [Console] Remove unused ul element and its custom styling ([#3993](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3993))
- Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))
- Remove unused Sass in `tile_map` plugin ([#4110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4110))
- [Maps Legacy] Removed KUI usage in `maps_legacy` plugin([#3998](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3998))
- [Markdown] Replace custom CSS styles and HTML markup with OUI components ([#4390](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4390))
- [Vis Colors] [VisLib] Update legend colors to use OUI color palette ([#4365](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4365))
- [Vis colors] Update legacy mapped colors in charts plugin to use `ouiPaletteColorBlind()`, Update default color in legacy visualizations to use `ouiPaletteColorBlind()[0]` ([#4398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4398))
- [Saved Objects Management] Add new or remove extra tags and styles ([#4069](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4069))
- [Console] Migrate `/lib/autocomplete/` module to TypeScript ([#4148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4148))
- [Console] Migrate `/lib/!autocomplete/` module to TypeScript ([#4150](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4150))
- [Dashboard] Restructure the `Dashboard` plugin folder to be more cohesive with the project ([#4575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4575))
- Refactor logo usage to centralize and optimize assets and improve tests ([#4702](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4702))

### 🔩 Tests

- [Tests] Add BWC tests for 2.9 and 2.10 ([#4762](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4762))
