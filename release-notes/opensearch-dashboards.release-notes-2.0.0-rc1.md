## Version 2.0.0-rc1 Release Notes

### 💥 Breaking Changes in 2.0

#### Bump to node version 14.19.1
* Bumps Node.js from v14.18.2 to v14.19.1 ([#1487](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1487))
* [Node 14] Upgrades Node version to 14.18.2 ([#1028](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1028))

#### Use opensearch-project/opensearch as nodejs client
* [nodejs client] hookup js client with dashboards ([#1342](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1342))
* [nodejs client] modify tsconfig to route types to new.d.ts ([#1225](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1255))

#### Disable telemetry by default
* Fixes search usage telemetry ([#1427](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1427))

#### Deprecations
* Deprecates non-inclusive config names ([#1467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1467))
* Removes UI Framework KUI doc site ([#1379](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1379))

### 🛡 Security
* [CVE-2021-44531] [CVE-2022-21824] [CVE-2022-0778] [CVE-2021-44532] [CVE-2021-44533] Bumps Node.js from v14.18.2 to v14.19.1 ([#1487](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1487))
* [CVE-2022-0436] Bumps grunt from v1.4.1 to v1.5.2 ([#1451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1451))
* [CVE-2021-43138] Resolves async to v3.2.3 ([#1449](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1449))
* [CVE-2022-24785] Bump moment from 2.29.1 to 2.29.2 ([#1456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1456))
* [CVE-2021-3803] Bumps the nested dependency of nth-check to v2.0.1 ([#1422](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1422))
* [CVE-2022-0144] [WS-2018-0347] [CVE-2021-23807] [CVE-2020-15366] Chore: Replaces sass-lint with stylelint ([#1413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1413))
* [CVE-2021-3918] Bumps json-schema from 0.2.3 to 0.4.0 ([#1385](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1385))
* [WS-2020-0208] Removes UI Framework KUI doc site ([#1379](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1379))
* [CVE-2022-0686] [CVE-2022-0691] Bumps @elastic/eui to v34.6.0 and @elastic/charts to v31.1.0 ([#1370](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1370))
* [CVE-2022-24433] Bumps simple-git from 1.116.0 to 3.4.0 ([#1359](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1359))
* [CVE-2021-44907] Resolves all qs dependencies to v6.10.3 ([#1380](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1380))
* [CVE-2021-44906] Bump minimist from 1.2.5 to 1.2.6 ([#1377](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1377))
* [CVE-2022-24773] [CVE-2022-24772] [CVE-2022-24771] Bumps node-forge from v1.2.1 to v1.3.0 ([#1369](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1369))
* [CVE-2020-8203] [CVE-2021-23337] [CVE-2020-28500] Bump lodash-es from 4.17.15 to 4.17.21 ([#1343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1343))
* [CVE-2021-3807] Resolves ansi-regex to v5.0.1 ([#1320](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1320))
* [CVE-2022-0686] [CVE-2022-0639] [CVE-2022-0686] Bump url-parse from 1.5.3 to 1.5.7 ([#1257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1257))
* [CVE-2022-0536] Bump follow-redirects from 1.14.7 to 1.14.8 ([#1247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1247))
* [CVE-2022-0122] [WS-2022-0008] Upgrades node-forge from v0.10.0 to v1.2.1 ([#1239](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1239))
* [CVE-2021-23424] Upgrades webpack-dev-server and webpack-cli ([#1229](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1229))
* [WS-2020-0033] [WS-2020-0035] [WS-2019-0271] [WS-2020-0032] [WS-2020-0026] Upgrades hapi from v17 to v20 ([#1146](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1146))
* [CVE-2022-21670] Bump markdown-it from 10.0.0 to 12.3.2 ([#1140](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1140))
* [CVE-2022-0155] Removes deprecated request and @percy/agent ([#1113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1113))
* [CVE-2021-23490] Bump parse-link-header from 1.0.1 to 2.0.0 ([#1108](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1108))
* [CVE-2021-3765] Bumps @microsoft/api-documenter and @microsoft/api-extractor ([#1106](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1106))
* [CVE-2021-3795] [WS-2019-0307] Removes KUI Generator and related dependencies ([#1105](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1105))
* [CVE-2021-24033] [CVE-2021-23382] [CVE-2021-23364] Upgrades babel, storybook, and postcss ([#1104](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1104))
* [CVE-2021-22939] [CVE-2021-3672] [CVE-2021-22931] [CVE-2021-22921] [CVE-2021-22940] [CVE-2021-22918] [CVE-2020-24025] [CVE-2018-11698] [CVE-2020-7608] [CVE-2018-19827] [CVE-2018-20190] [CVE-2019-6283] [CVE-2019-18797] [CVE-2018-20821] [CVE-2019-6286] [CVE-2019-6284] [CVE-2018-11694] [CVE-2018-19837] [CVE-2018-11696] [CVE-2018-11499] [CVE-2018-11697] [CVE-2018-19797] [CVE-2020-24025] [CVE-2020-24025] [CVE-2018-11698] [CVE-2018-11698] [CVE-2018-19839] [CVE-2018-19838] Upgrades Node version to 14.18.2 ([#1028](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1028))
* [CVE-2021-3757] [CVE-2021-23436] Upgrade immer from 8.0.1 to 9.0.6 ([#780](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/780))

### 📈 Enhancements
* [Circuit-Breaker] Add memory circuit breaker configuration ([#1347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1347))

### 🐛 Bug Fixes
* Fix: Re-rendering visualization when expression changes and improves typing ([#1491](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1491))
* fix(actions): Better type checks for icons ([#1496](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1496))
* [Bug] fix copy as curl ([#1472](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1472))
* update re2 build for arm under node 14 ([#1454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1454))
* update re2 for linux, darwin, and windows ([#1453](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1453))
* fix(Tooltip): Fixes tooltip when split series charts are used ([#1324](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1324))
* bumps chromedriver to v100 ([#1410](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1410))
* Fixes the header's nav trigger button not closing the nav ([#1394](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1394))
* Fixes the linting rules to accept only the approved copyright headers ([#1373](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1373))

### 🚞 Infrastructure
* [Plugins] fix default path to plugins ([#1468](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1468))
* Reverts re2 back to 1.15.4 from 1.17.4 to fix build issues ([1419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1419))

### 📝 Documentation
* [Admin] add current maintainers as of 04/2022 ([#1426](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1426))
* Chore: Exposes testing readme at the root level ([#1420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1420))

### 🛠 Maintenance
* Runs functional test jobs in parallel w/ build job ([#1336](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1356))
* Removes unnecessary manual resolutions ([#1300](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1300))
* Removes backport and release-notes scripts ([#1234](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1234))
* Removes storybook package and related code ([#1172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1172))
* [Version] Increment to 2.0 ([#973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/973/files))

### 🪛 Refactoring
* Cleans up changes from memory circuit breaker PR ([#1463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1463))
* Fixes interfaced errors across Dashboards ([#1409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1409))

### 🔩 Tests
* [Tests][BWC][CI] update performance analzyer location ([#1474](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1474))
* [Tests][BWC][CI] use ODFE 1.0.2 ([#1470](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1470))
* [Tests][BWC][CI] handle distributions with qualifiers ([#1469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1469))
* [Tests] BWC test improvements ([#1447](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1447))
* Fixes inconsistent plugin installation tests ([#1346](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1346))
* [Tests] fix JUnit Reporter test ([#1338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1338))
* [Tests] remove include_type_name from OpenSearch Archiver ([#1334](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1334))
* Runs GitHub workflow unit tests in band ([#1306](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1306))
* Upgrades jest to v27 ([#1301](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1301))
* [Tests] fix mocha tests related to type ([#1299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1299))
* [Tests] remove _type from OpenSearch Archiver ([#1289](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1289))