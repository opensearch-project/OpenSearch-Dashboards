# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

* [CVE-2022-3517] Bumps minimatch from 3.0.4 to 3.0.5 and [IBM X-Force ID: 220063] unset-value from 1.0.1 to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
* [CVE-2022-0144] Bump shelljs from 0.8.4 to 0.8.5 ([#2511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2511))
* [Legacy Maps Plugin] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
* [CVE-2022-0155] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
* [CVE-2022-0536] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
* [CVE-2022-23647] Bump prismjs to 1.29.0 ([#2668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2668))
* [CVE-2021-24033] Remove storybook package to fix CVE-2021-42740 and CVE-2021-24033 ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
* [CVE-2021-42740] Remove storybook package to fix CVE-2021-42740 and CVE-2021-24033 ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
* [CVE-2022-37601] Bump loader-utils to 2.0.3 ([#2707](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2707))
* [CVE-2022-37599] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))
* [CVE-2022-37603] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))

### 📈 Features/Enhancements

- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))
- [Windows] Add helper functions to work around the differences of platforms ([#2681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2681))
- [Windows] Add `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))

### 🐛 Bug Fixes

* [BUG] Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
* Removed Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
* Bumped `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Update backport custom branch name to utilize head template ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))
- Add automatic selection of the appropriate version of chrome driver to run functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Add Windows CI workflows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))

### 📝 Documentation

* Corrected README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
* Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))

### 🛠 Maintenance
* Remove storybook package and related code ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))

### 🪛 Refactoring

### 🔩 Tests

* bump chromedriver to 106 to fix function test fail issue ([#2514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2514))

## [1.x]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

### 📈 Features/Enhancements

### 🐛 Bug Fixes

* Plugin helpers fix related to fs promises module ([#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

* [Version] Increment to 1.4 ([#1341](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1341))

### 🪛 Refactoring

### 🔩 Tests

[1.x]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/1.3.5...1.x
