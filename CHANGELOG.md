# CHANGELOG
Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

### 📈 Features/Enhancements

* [MD] Support legacy client for data source ([#2204](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2204))
* [Plugin Helpers] Facilitate version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398))

### 🐛 Bug Fixes
* [Vis Builder] Fixes auto bounds for timeseries bar chart visualization ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
* [Vis Builder] Fixes visualization shift when editing agg ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
* [Vis Builder] Renames "Histogram" to "Bar" in vis type picker ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
* [MD] Add data source param to low-level search call in Discover ([#2431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2431))

### 🚞 Infrastructure

* Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))

### 📝 Documentation

### 🛠 Maintenance

### 🪛 Refactoring

### 🔩 Tests

## [2.x]
### 💥 Breaking Changes

### Deprecations

### 🛡 Security

* Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
* Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
* [CVE-2022-33987] Upgrade geckodriver to 3.0.2 ([#2166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2166))
* Bumps percy-agent to use non-beta version ([#2415](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2415))
* Resolve sub-dependent d3-color version and potential security issue ([#2454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2454))

### 📈 Features/Enhancements

* Add updated_at column to objects' tables ([#1218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1218)) 
* [Viz Builder] State validation before dispatching and loading ([#2351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2351))

### 🐛 Bug Fixes

* [Viz Builder] Fixes time series for new chart types ([#2309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2309))
* [Viz Builder] Add index pattern info when loading embeddable ([#2363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2363))
* Fixes management app breadcrumb error ([#2344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2344))

### 🚞 Infrastructure

* Add path ignore for markdown files for CI ([#2312](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2312))
* Updating WS scans to ignore BWC artifacts in `cypress` ([#2408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2408))


### 📝 Documentation

* README.md for saving index pattern relationship ([#2276](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2276))
* Remove extra typo from README. ([#2403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2403))
* Add sample config for multi data source feature in yml template. ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
* README.md for dataSource and dataSourceManagement Plugin ([#2448](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2448))

### 🛠 Maintenance

* Increment from 2.3 to 2.4. ([#2295](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295))
* Adding @zengyan-amazon as maintainer ([#2419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2419))
* Updating @tmarkley to Emeritus status. ([#2423](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2423))
* Adding sample config for multi data source in yml config template. ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
* Adding @kristenTian as maintainer. ([#2450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2450))

### 🪛 Refactoring

### 🔩 Tests

* Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))

[Unreleased]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/2.3.0...HEAD
[2.x]: https://github.com/opensearch-project/OpenSearch-Dashboards/compare/2.3.0...2.x
