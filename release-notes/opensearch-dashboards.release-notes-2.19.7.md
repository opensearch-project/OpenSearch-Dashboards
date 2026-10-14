## Version 2.19.7 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 2.19.7

### Enhancements

* Backport Windows long path fix for build failures during empty folder cleanup ([#12962](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12962))

### Bug Fixes

* Fix CI/CD failure caused by missing `@osd/optimizer/target/cli` module and Windows worker timeout ([#12957](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12957))
* Increase timeout waiting for optimizer worker exit to prevent spurious build failures ([#12956](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12956))
* Fix lint, snapshot, and unit test failures on the 2.19 branch ([#12926](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12926))
* Bound input size and linearize loops in `/api/core/capabilities` to prevent performance degradation ([#12563](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12563))
* Add missing endpoint validation to the data source test-connection route to restore SSRF protection ([#12391](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12391))
* Add AST-based validation for Vega expressions to prevent DOM-traversal XSS attacks ([#12622](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12622))
* Normalize copied Yarn lockfile paths to fix Windows distribution builds ([#12943](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12943))
* Remove `extract-zip` shim from the distributable by dropping its `file:` resolution from the build `package.json` ([#12965](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12965))
* Backport MDS endpoint validation refactor, replace `dns-sync` with Node built-in `dns.promises`, and replace `ip-cidr` with internal CIDR utility ([#12944](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12944))

### Documentation

* Add Joey Liu (`@Maosaic`) as a maintainer ([#12949](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12949))
* Add Justin (`@angle943`) as a maintainer ([#12948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12948))
* Add Daniel as a maintainer ([#12951](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12951))
* Add Shenoy Pratik (`@ps48`) and other missing maintainers ([#12954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12954))
* Add raintygao as a maintainer ([#12952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12952))
* Add wanglam as a maintainer ([#12950](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12950))

### Maintenance

* Bump Node.js from 18.19.0 to 18.20.8 to fix CVE-2023-46809, CVE-2024-21890, CVE-2024-21891, CVE-2024-21892, CVE-2024-21896, CVE-2024-22017, and CVE-2024-22019 ([#12401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12401))
* Bump vulnerable transitive dependencies including `brace-expansion`, `form-data`, `js-yaml`, `handlebars`, `tmp`, `tar`, `simple-git`, `dompurify`, `ws`, and others ([#12920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12920))
* Bump `postcss` to ^8.5.23 to fix CVE-2026-69153, CVE-2026-73646, CVE-2026-45623, CVE-2026-41305, and CVE-2023-44270 ([#12929](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12929))
* Bump `proxy-addr` from 2.0.7 to 2.0.8 to fix CVE-2026-90711 ([#12910](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12910))
* Bump `qs` to 6.16.0 and `colord` to 2.10.0 to fix CVE-2026-82417, CVE-2026-82562, and CVE-2026-85062 ([#12724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12724))
* Remove unused `@percy/cli` dependency to drop `image-size@1.0.1` ([#12925](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12925))
