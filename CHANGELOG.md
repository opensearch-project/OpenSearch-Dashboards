# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased](https://github.com/opensearch-project/OpenSearch-Dashboards/compare/1.3.8...1.x)

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- [CVE-2021-23490] Bump parse-link-header from `1.0.1` to `2.0.0` ([#3738](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3738))
- [CVE-2022-25758] Bump scss-tokenizer from `0.3.0` to `0.4.3` ([#3727](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3727))
- [CVE-2021-3765] Update `@microsoft/api-documenter` and `@microsoft/api-extractor` versions to bump validator from `8.2.0` to `13.9.0` ([#3725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3725))
- [CVE-2022-1537] Bump grunt from `1.4.1` to `1.5.3` ([#3723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3723))
- [CVE-2022-0436] Bump grunt from `1.4.1` to `1.5.3` ([#3723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3723))
- [CVE-2021-23382] Bump postcss from `8.2.10` to `8.2.13` ([#3739](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3739))
- [CVE-2021-3803] Bump nth-check from `1.0.2` to `2.0.1` ([#3729](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3729))
- [CVE-2022-25858] Bump terser from `4.8.0` to `4.8.1` ([#3726](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3726))
- [CVE-2022-25851] Bump jpeg-js from `0.4.1` to `0.4.4` ([#3741](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3741))

### 📈 Features/Enhancements

- [Optimizer] Increase timeout waiting for the exiting of an optimizer worker ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))

### 🐛 Bug Fixes

- Fix a problem that prevented plugin-helpers from building plugins ([#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🚞 Infrastructure

- Run the unit tests of the CI workflow in band ([#1306](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1306))
- Capture and report code coverage metrics in workflows ([#1478](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1478))
- Add verification workflow for release builds ([#1502](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1502))
- Record functional test artifacts in case of failure ([#3190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3190))
- Improve yarn's performance in workflows by caching yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))

### 📝 Documentation

### 🛠 Maintenance

- [Version] Increment to 1.4 ([#1341](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1341))
- Add `target` folders of `test_utils` and `core` to the `osd clean` patterns ([#1442](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1442))

### 🪛 Refactoring

### 🔩 Tests

- Fix test failures due to them ending before their duration is captured ([#1338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1338))
- Add retrying flaky jest tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))

## [1.3.9]

### 🛡 Security

- [CVE-2022-2499] Resolve qs from 6.5.2 and 6.7.0 to 6.11.0 in 1.x ([#3451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3451))
- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from 4.1.1 to 5.0.2 ([#3539](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3539)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).
- [CVE-2023-25653] Bump node-jose to 2.2.0 ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2021-23807] Bump jsonpointer from 4.1.0 to 5.0.1 ([#3535](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3535))
- [CVE-2021-23424] Bump ansi-html from 0.0.7 to 0.0.8 ([#3536](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3536))
- [CVE-2022-24999] Bump express from 4.17.1 to 4.18.2 ([#3542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3542))

### 📈 Features/Enhancements

- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))

### 🐛 Bug Fixes

- [TSVB] Fix the link to "serial differencing aggregation" documentation ([#3503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3503))

### 📝 Documentation

- [TSVB] Fix a spelling error in the README file ([#3518](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3518))
- Simplify the in-code instructions for upgrading `re2` ([#3328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3328))
- [Doc] Improve DEVELOPER_GUIDE to make first time setup quicker and easier ([#3421](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3421))

### 🛠 Maintenance

- Update MAINTAINERS.md formatting and maintainer list ([#3338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3338))
- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- [Version] Increment to 1.3.9 ([#3375](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3375))
- Remove the unused `renovate.json5` file ([3489](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3489))

## [1.3.8 - 2022-02-15](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.8)

### 🛡 Security

- [CVE-2022-25901] Bump supertest from 2.0.5 to 2.0.12 ([#3326](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3326))
- [CVE-2022-25860] Bump simple-git from 3.15.1 to 3.16.0 ([#3345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3345))
- [CVE-2022-46175] Bump json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))
- [CVE-2022-25912] Bump simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- Bump decode-uri-component from 0.2.0 to 0.2.2 ([#3009](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3009))

### 🐛 Bug Fixes

- [BUG] Fixes misleading embeddable plugin error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- [BUG] Trim trailing slashes before checking no-restricted-path rule ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))

### 🚞 Infrastructure

- Lock workflow tests to Chrome and ChromeDriver 107 as the last combination that run on Node.js v10 ([#3299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3299))
- Update yarn timeout for GitHub workflow on Windows ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- Add Windows CI to the GitHub workflow ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))

### 📝 Documentation

- Fix documentation link for date math ([#3207](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3207))

### 🔩 Tests

- [BWC] Updates to BWC tests ([#1190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1190))
- Automates chromedriver version selection for tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))

## [1.3.7 - 2022-12-14](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.7)

### 🛡 Security

- [CVE-2022-0144] Bump shelljs from 0.8.4 to 0.8.5 ([#2511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2511))
- [Legacy Maps Plugin] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
- [CVE-2022-3517] Bump minimatch from 3.0.4 to 3.0.5 and [IBM X-Force ID: 220063] unset-value from 1.0.1 to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
- [CVE-2022-0155] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
- [CVE-2022-0536] Bump follow-redirects to 1.15.2 ([#2653](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2653))
- [CVE-2021-24033] Remove storybook package ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
- [CVE-2021-42740] Remove storybook package ([#2660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2660))
- [CVE-2022-23647] Bump prismjs to 1.29.0 ([#2668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2668))
- [CVE-2022-37599] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))
- [CVE-2022-37603] Bump loader-utils to 2.0.4 ([#2995](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2995))

### 📈 Features/Enhancements

- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))
- [Windows] Add helper functions to work around the differences of platforms ([#2681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2681))
- [Windows] Add `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))

### 🐛 Bug Fixes

- [Chore] Visualize link fix [#2395](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2395)
- [BUG] Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- Remove Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
- Bump `del` version to fix MacOS race condition ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- Temporary workaround for task-kill exceptions on Windows when it is passed a pid for a process that is already dead ([#2842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2842))
- [Build] Fixed "Last Access Time" not being set by `scanCopy` on Windows ([#2964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2964))
- Update `leaflet-vega` and fix its usage ([#3005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3005))
- Add clarifying tooltips to header navigation ([#3573](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3573))

### 🚞 Infrastructure

- Update backport custom branch name to utilize head template ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))

### 📝 Documentation

- Add the release runbook to RELEASING.md ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- Security-CVEs fixes guidelines [#2674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2674)
- Correct README and help command of osd-plugin-helpers ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))

### 🛠 Maintenance

- Increment version to 1.3.7 [#2528](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2528)

### 🔩 Tests

- Bump `chromedriver` to 106 to fix function test fail issue [#2514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2514)
- Fix incorrect validation of time values in JUnit Reporter ([#2965](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2965))

## [1.3.6 - 2022-10-06](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.6)

### 🛡 Security

- [CVE-2021-3807] Resolves ansi-regex to v5.0.1 ([#2425](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2425))
- [CVE-2022-23713] Handle invalid query, index and date in vega charts filter handlers ([#1932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1932))
- Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
- Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
- [CVE-2022-0144] Bump shelljs from 0.8.4 to 0.8.5 ([#2511](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2511))

### 📈 Features/Enhancements

- Custom healthcheck with filters ([#2232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2232), [#2277](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2277)). To configure see example in [config/opensearch_dashboards.yml](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/6e2ec97459ae179c86201c611ce744c2c24ce150/config/opensearch_dashboards.yml#L44-L46)

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Extends plugin-helpers to be used for automating version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398),[#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🛠 Maintenance

- Version Increment to 1.3.6 ([#2420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2420))

### 🔩 Tests

- Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))
