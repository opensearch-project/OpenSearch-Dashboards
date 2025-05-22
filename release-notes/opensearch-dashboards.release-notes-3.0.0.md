# VERSION 3.0.0 Release Note

### 💥 Breaking Changes

 - Remove `CssDistFilename` ([#9446](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9446))
 - Remove `withLongNumerals` in `HttpFetchOptions`. ([#9448](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9448))
 - Remove `@elastic/filesaver` ([#9484](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9484))
 - Bump `monaco-editor` from 0.17.0 to 0.30.1 ([#9497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9497))
 - Remove the deprecated "newExperience" table option in discover ([#9531](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9531))
 - Bump monaco-editor from 0.30.1 to 0.52.0 ([#9618](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9618))

### Deprecations

### 🛡 Security

 - Bump markdown-it from 12.3.2 to 13.0.2 ([#9412](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9412))
 - Bump dompurify from 3.1.6 to 3.2.4 ([#9447](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9447))
 - [CVE-2023-28155][CVE-2023-44270][CVE-2024-55565] Resolve the CVE ([#9503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9503))
 - Resolve CVE-2025-27152 by bumping axios to 1.8.2 ([#9507](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9507))
 - Fix GHSA-vjh7-7g9h-fjfh by bumping elliptic to 6.6.1 ([#9546](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9546))
 - Bump vega from 5.23.0 to 5.32.0 ([#9623](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9623))
 - Resolve CVE-2024-53392 by bumping prismjs to 1.30.0 ([#9634](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9634))
 - Bump @babel/runtime to 7.26.10 and tar-fs to 1.2.2 for CVE-2025-27789 and CVE-2024-12905 ([#9649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9649))
 - [CVE-2025-27789] Bump @babel/runtime,@babel/helpers and @babel/runtime-corejs3 ([#9681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9681))

### 📈 Features/Enhancements

 - Autocomplete Value Suggestion ([#8275](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8275))
 - Improve validation of the licensing imposed by dependencies. ([#9064](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9064))
 - Vega visualization with ppl now supports reading time field ([#9152](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9152))
 - Improve scrolling experience on Discover page. ([#9298](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9298))
 - Webpack bundle analyser limit check ([#9320](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9320))
 - Deletes S3 Jobs in Backend when Original Query is Canceled ([#9355](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9355))
 - Add MDS to msearch ([#9361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9361))
 - Update formatHit.formatField() to accept `type` as an argument ([#9469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9469))
 - Allow to customize discover summary panel title ([#9481](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9481))
 - Update position of summary ([#9494](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9494))
 - Move HITs counter to be closer to table & show results count ([#9498](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9498))
 - Add the ability to export to CSV from the discover page ([#9530](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9530))
 - Append prompt for query assistant in request payload ([#9532](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9532))
 - Lighthouse Page Performance Metrics CI workflow ([#9304](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9304))
 - Support streaming when content type is event stream ([#9647](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9647))
 - Enable experimental data plugin's __enhance ([#9655](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9655))
 - Add resultsActionBar into data plugin's __enhance ([#9655](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9655))
 - Display query assistant when dataset is not supported ([#9232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9232))

### 🐛 Bug Fixes

 - Encode searchId as it tends to be decoded after adds into url. ([#8530](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8530))
 - Preserve location state at dashboard app startup to fix adding a new visualization ([#9072](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9072))
 - PPL Grammar Parsing related issues ([#9120](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9120))
 - Hide the assistant entry when there isn't data2summary agent ([#9277](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9277))
 - Clean up sync URL subscription in Discover plugin topNav ([#9316](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9316))
 - Change from cluster to data sources for dataset selector column ([#9343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9343))
 - Flatten hit modify original array ([#9347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9347))
 - Update actions/cache from v1 to v4 to address deprecation warning ([#9366](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9366))
 - Make PPL time column respect time zone and date format ([#9379](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9379))
 - Add mappings for tinyint, smallint, and bigint in S3 dataset type ([#9430](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9430))
 - Make PPL handle miliseconds in date fields ([#9436](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9436))
 - Organizing generated summary by using markdown format ([#9464](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9464))
 - Should not show summary if there is no response ([#9480](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9480))
 - Text size in generated summary should be s ([#9492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9492))
 - Make nav icon style compatible with sidecar ([#9514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9514))
 - Fix data frame null or undefined object conversion error ([#9516](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9516))
 - Discover summary regression when result is empty ([#9519](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9519))
 - Correctly show selected cols from saved search ([#9523](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9523))
 - Correctly load saved search from snapshot URL ([#9529](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9529))
 - Pr permission write access ([#9534](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9534))
 - Correctly load saved search query in query editor ([#9541](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9541))
 - Clear discover summary if t2ppl failed ([#9552](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9552))
 - Query-assist removed the placeholder of last ask question ([#9552](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9552))
 - Use markdown in discover summary ([#9553](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9553))
 - Retry on file/folder deletion with Windows longpath support ([#9561](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9561))
 - Fixing when find saved objects within a workspace returns saved objects in all the workspaces ([#9420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9420))
 - Prevent user from visiting discover when out of a workspace ([#9465](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9465))
 - Fix potential memory leak in getDirectQueryConnections ([#9575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9575))
 - Permissions for github workflow in bundler performance testing ci ([#9581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9581))
 - Query assistant doesn't refresh generated ppl ([#9601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9601))
 - Trim the url for creating data source ([#9637](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9637))
 - [workspace] filter out recent items which have errors ([#9346](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9346))
 - Add error handling page for workspace stale state to prevent getting stuck in loading ([#9478](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9478))
 - Fix minor UX style issues on discover summary section ([#9509](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9509))
 - Correctly show error message in DQL and PPL query editor ([#9586](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9586))
 - Skip appending time range to ppl when not querying with source ([#9603](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9603))
 - Menu stay in settings and setup when opening a visualization from assets relationship ([#9665](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9665))
 - Add sample data under Custom category ([#9665](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9665))
 - Close suggestions after query submission ([#9666](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9666))
 - [Discover]Fix dataset selector flashing ([#9668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9668))
 - Copy essential property to generated request ([#9674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9674))
 - Fix issue with adding sample data to data source ([#9676](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9676))
 - Fix connect queryparams resulting in signer error ([#9678](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9678))

### 🚞 Infrastructure

 - Add checks for out of sync lockfile and dev docc to the CI ([#9064](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9064))
 - Validate the licensing imposed by dependencies during CI ([#9064](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9064))

### 📝 Documentation

 - Fix OpenAPI documentation ([#8885](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8885))
 - Add triaging process documentation ([#9291](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9291))
 - Add 2.19 Release Notes ([#9325](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9325))
 - Add alternative Docker development environment documentation specific to Cypress. ([#9362](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9362))
 - Add documentation and configuration for server debugging ([#9435](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9435))
 - Initial version of Understanding Discover 2.0 ([#9463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9463))
 - Add Joey Liu (`@Maosaic`) as maintainer ([#9467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9467))
 - Getting started with Discover 2.0 ([#9525](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9525))

### 🛠 Maintenance

 - Adds a git pre commit hook to ensure that developer docs are always updated ([#6585](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6585))
 - Bump actions used by build and test workflows ([#9064](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9064))
 - Disable sorting on Discover table columns header for PPL and SQL ([#9263](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9263))
 - Update query editor loading UI ([#9344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9344))
 - Fix view single document page content padding ([#9382](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9382))
 - Make colour of discover histogram match theme ([#9405](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9405))
 - Replace `@elastic/filesaver` in favor of `file-saver`. ([#9484](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9484))
 - Replace `formatNumWithCommas` with `toLocaleString` ([#9488](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9488))

### 🪛 Refactoring

 - Update data source details tabs to use small buttons ([#9057](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9057))

### 🔩 Tests

 - [Cypress Test] Add and Refactor TESTID-140 sidebar spec and clean up ([#9154](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9154))
 - [Cypress][TESTID-147] Add tests for table canvas in discover ([#9285](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9285))
 - Add tests for saved searches in dashboards ([#9288](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9288))
 - Add histogram interaction tests ([#9290](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9290))
 - Add cypress integration test for the inspect functionality in the Discover and Dashboards pages. ([#9292](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9292))
 - Add all recent queries tests ([#9307](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9307))
 - Test sort in language_specific_display ([#9314](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9314))
 - Update cypress data to have random id, missing value fields and unique field ([#9321](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9321))
 - [TESTID-64] Add cypress test for auto query updates when switch dataset ([#9322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9322))
 - Add cypress integration test for the inspect functionality in the Discover and Dashboards pages. ([#9331](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9331))
 - Add retry mechanism for flaky share menu test ([#9352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9352))
 - Add Top Values and Filter Sidebar Fields by Type testing for the Discover Page. ([#9386](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9386))
 - Remove unnecessary reload in saved_search test. ([#9396](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9396))
 - [TESTID-234] Add tests for query editor display ([#9398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9398))
 - Fix flakieness in cypress tests ([#9433](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9433))
 - Use before/after to speed up test ([#9439](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9439))
 - Clear session storage in S3 integ test and update workflow ([#9490](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9490))
 - Reenable saved search cypress tests ([#9628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9628))