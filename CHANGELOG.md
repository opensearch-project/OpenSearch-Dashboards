# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- [CVE-2022-3517] Bumps minimatch from 3.0.4 to 3.0.5 and [IBM X-Force ID: 220063] unset-value from 1.0.1 to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
- [CVE-2022-0144] Bump shelljs from 0.8.4 to 0.8.5 ([#2511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2511))
- [Legacy Maps Plugin] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
- [CVE-2022-0155] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
- [CVE-2022-0536] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
- [CVE-2022-23647] Bump prismjs to 1.29.0 ([#2668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2668))
- [CVE-2021-24033] Remove storybook package to fix CVE-2021-42740 and CVE-2021-24033 ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
- [CVE-2021-42740] Remove storybook package to fix CVE-2021-42740 and CVE-2021-24033 ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
- [CVE-2022-37601] Bump loader-utils to 2.0.3 ([#2707](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2707))
- [CVE-2022-37599] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))
- [CVE-2022-37603] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))
- [CVE-2022-25901] Bump supertest ([#3222](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3322))
- [CVE-2022-46175] Bumps json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))
- [CVE-2022-25912] Bumps simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-25860] Bumps simple-git from 3.15.1 to 3.16.0 ([#3345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3345))
- [CVE-2022-2499] Resolve qs from 6.5.2 and 6.7.0 to 6.11.0 in 1.x ([#3451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3451))
- [CVE-2023-25653] Bump node-jose to 2.2.0 ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2021-23807] Bump jsonpointer from 4.1.0 to 5.0.1 ([#3535](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3535))

### 📈 Features/Enhancements

- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))
- [Windows] Add helper functions to work around the differences of platforms ([#2681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2681))
- [Windows] Add `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))
- [Optimizer] Increase timeout waiting for the exiting of an optimizer worker ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))


### 🐛 Bug Fixes

- [BUG] Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- Removed Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
- Bumped `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))

### 🚞 Infrastructure

- Run the unit tests of the CI workflow in band ([#1306](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1306))
- Capture and report code coverage metrics in workflows ([#1478](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1478))
- Add verification workflow for release builds ([#1502](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1502))
- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Update backport custom branch name to utilize head template ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))
- Add automatic selection of the appropriate version of chrome driver to run functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Add Windows CI workflows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- Record functional test artifacts in case of failure ([#3190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3190))
- Improve yarn's performance in workflows by caching yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))
- Lock workflow tests to Chrome and ChromeDriver 107 as the last combination that run on Node.js v10 ([#3299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3299))

### 📝 Documentation

- Corrected README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))

### 🛠 Maintenance

- Add `target` folders of `test_utils` and `core` to the `osd clean` patterns ([#1442](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1442))
- Remove storybook package and related code ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))

### 🪛 Refactoring

### 🔩 Tests

- Fix test failures due to them ending before their duration is captured ([#1338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1338))
- Add retrying flaky jest tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Prevent `AbortError` from breaking unit tests for ExecutionContract ([#3299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3299))

## [1.x]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

### 📈 Features/Enhancements

### 🐛 Bug Fixes

- Plugin helpers fix related to fs promises module ([#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

- [Version] Increment to 1.4 ([#1341](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1341))

### 🪛 Refactoring

### 🔩 Tests

[1.x]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/1.3.5...1.x
