# VERSION 2.19.0 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

 - [CVE-2024-21538] Bump `cross-spawn` from 6.0.5 and 7.0.3 to 7.0.5 ([#8882](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8882))

### 📈 Features/Enhancements

 - Making local cluster state calls during health checks to avoid stressing cluster manager node ([#8187](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8187))
 - Add data test subject for discover cypress test ([#8682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8682))
 - Adds data2summary agent check in data summary panel in discover. ([#8716](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8716))
 - Add setting to turn extending numeric precision on or off ([#8837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8837))
 - Add framework to show banner at the top in discover results canvas ([#8851](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8851))
 - Show indexed views in dataset selector ([#8851](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8851))
 - [Workspace] support dismiss get started for search overview page ([#8874](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8874))
 - Added framework to get default query string using dataset and language combination ([#8896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8896))
 - Optimize recent items and filter out items whose workspace is deleted ([#8900](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8900))
 - Refactor the bulk_get handler in permission wrapper when item has permission error ([#8906](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8906))
 - Add privacy levels to the workspace ([#8907](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8907))
 - [workspace]support search dev tools by its category name ([#8920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8920))
 - Support custom logic to insert time filter based on dataset type ([#8932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8932))
 - Add two-steps loading for associating data sources ([#8999](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8999))
 - Disable buttons in sample data cards for read-only users ([#9042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9042))
 - Migrate query enhancement cypress tests to OSD repo ([#9048](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9048))
 - Add a "Learn More" flyout providing additional information to the collaborators page. ([#9145](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9145))
 - Support to dissociate data connection object since DSM list has supported to display ([#9164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9164))
 - [Workspace]Update workspace privacy setting link ([#9222](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9222))
 - Add navControlsPrimaryHeaderRight slot to header ([#9223](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9223))
 - Enable maximum workspaces ([#9226](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9226))
 - Add Tests for Simple Dataset Selector ([#9255](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9255))
 - Add Tests for Relative and Quick Select Time Range Selection ([#9265](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9265))

### 🐛 Bug Fixes

 - [Workspace] Unable to copy assets to a workspace without assigning related data source ([#7690](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7690))
 - Fix the display and jump logic for recent assets ([#8136](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8136))
 - Fix the UI of recent assets in the header ([#8156](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8156))
 - Fix/the UI of workspace list table ([#8219](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8219))
 - Fix the UI of delete modal in the save objects(assets) page ([#8237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8237))
 - Address UI issues of index patterns ([#8287](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8287))
 - Adds badge when there are more than one workspaces and updates the icon ([#8519](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8519))
 - Fix data source info is missing in default query when click Discover from other pages ([#8583](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8583))
 - Bump url to 0.11.4 ([#8611](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8611))
 - Fix UI issues in workspace detail and create page ([#8737](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8737))
 - [Workspace]Fix error message missed in workspace creator name input ([#8738](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8738))
 - [Workspace] [Bug] Check if workspaces exists when creating saved objects. ([#8739](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8739))
 - Update async search response type ([#8781](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8781))
 - Staled closure inside chrome_service ([#8783](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8783))
 - [Workspace]Fix flights sample data copy in workspace assets page ([#8786](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8786))
 - [Discover] Makes cachign dataset options optional and configurable by the dataset type ([#8799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8799))
 - Query Editor state sync issues in Discover ([#8803](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8803))
 - Decouple data$ updates to prevent rows clearing on hook re-render ([#8806](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8806))
 - Adds test id for workspace multi-deletion button ([#8833](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8833))
 - Fix a typo while inspecting values for large numerals in OSD and the JS client ([#8837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8837))
 - [MDS] Fix showing DQS sources list in workspaces ([#8838](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8838))
 - Fix a typo while inspecting values for large numerals in OSD and the JS client ([#8839](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8839))
 - [Workspace]Fix error toasts in sample data page ([#8842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8842))
 - Fix template queries loading and update getSampleQuery interface ([#8848](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8848))
 - Upgrade actions/upload-artifact to v4 ([#8855](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8855))
 - [Workspace][Bug] Fix inspect page url error. ([#8857](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8857))
 - Keep previous query result if current query result in error ([#8863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8863))
 - Hide Date Picker for Unsupported Types ([#8866](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8866))
 - Add max height and scroll to error message body ([#8867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8867))
 - Search on page load out of sync state when clicking submit. ([#8871](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8871))
 - Remove filter out serverless cluster and add support to extract index name ([#8872](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8872))
 - Retain currently selected dataset when opening saved query without dataset info ([#8883](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8883))
 - Only support copy action for query templates ([#8899](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8899))
 - Removed extra parameter ([#8902](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8902))
 - Fix toggle column action in the discover page ([#8905](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8905))
 - Ensure query editor cursor is aligned with text ([#8912](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8912))
 - Change some of the http link in settings page to https link ([#8919](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8919))
 - Update saved search initialization logic to use current query instead of default query ([#8930](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8930))
 - DQL autocomplete better parsing and fixes ([#8931](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8931))
 - Use roundUp when converting timestamp for PPL ([#8935](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8935))
 - SQL syntax highlighting double quotes ([#8951](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8951))
 - Support imports without extensions in cypress webpack build ([#8993](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8993))
 - Fix workspace page hanging with none collaborators for non dashboard admin ([#9004](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9004))
 - Prevent user from visiting dashboards / visualizations when out of a workspace ([#9024](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9024))
 - Inactive manage link in the data source selector when opening DevTools ([#9059](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9059))
 - Preserve location state at dashboard app startup to fix adding a new visualization ([#9072](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9072))
 - Hide collaborators page on nav when newHomePage is disabled ([#9116](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9116))
 - 0 rendered in discover when there are no results ([#9153](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9153))
 - Fix Unhandled Error Response of dev tool with MDS ([#9159](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9159))
 - Cleanup OsdUrlStateStorage subscription in TopNav ([#9167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9167))
 - Fix set as default error in data source and index pattern ([#9187](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9187))
 - Update workspace not found message to generic message ([#9189](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9189))
 - Fix cypress version error on ciGroup11 ([#9209](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9209))
 - Solve console error on the page when the data source has an empty description ([#9236](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9236))
 - Bug that mistakenly classify data connection ([#9237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9237))
 - Fix Discover query editor enter shortcuts reverting date range ([#9248](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9248))
 - DQC can not be assigned to a workspace due to validation ([#9259](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9259))
 - Update sidecar style to align with new page header ([#9269](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9269))
 - Recent item links are not correctly constructed ([#9275](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9275))

### 🚞 Infrastructure

### 📝 Documentation

 - Update dev guide to connect to external cluster ([#9080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9080))

### 🛠 Maintenance

 - Revert back to using the official release of `vega-interpreter` ([#8744](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8744))
 - Remove data enhancement options from yaml config now it is controlled by Advanced Settings ([#8828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8828))
 - Bump `@opensearch-project/opensearch` from 2.9.0 to 2.13.0 ([#8886](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8886))
 - Update cypress to v12 ([#8926](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8926))
 - Update oui to 1.18 ([#9058](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9058))
 - Use relative paths in cypress utilities ([#9079](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9079))
 - Create cypress command namespacing util ([#9150](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9150))
 - Update oui to 1.19 ([#9172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9172))
 - Updates the cross-spawn dependency in the yarn.lock ([#9302](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9302))

### 🪛 Refactoring

 - [Workspace] Integrate dashboard admin with dynamic config ([#8137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8137))
 - [Workspace] Add unit tests for inspect page url ([#8834](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8834))
 - [Workspace] Isolate objects based on workspace when calling get/bulkGet ([#8888](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8888))
 - Remove permission validation in workspace form ([#9065](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9065))
 - [Workspace] add missing method for workspace client interface ([#9070](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9070))
 - Move query assistant summary toggle to AI assistant dropdown list ([#9228](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9228))

### 🔩 Tests

 - Remove head 10 for PPL default query to unblock cypress test failures ([#8827](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8827))
 - Query-enhancements testing utility updates and additions ([#9074](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9074))
 - Re-enable dataset_selector.spec.js under workspace in ciGroup10 ([#9082](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9082))
 - Add tests for saving search and loading it ([#9112](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9112))
 - Adding Cypress Tests for S3 Datasets ([#9113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9113))
 - Add cypress integration test for the new Data Explorer UI's Filtering. ([#9119](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9119))
 - Make createWorkspaceIndexPatterns to handle no default cluster and clean up ([#9129](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9129))
 - Add tests for updating a saved search ([#9151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9151))
 - Add cypress integration test for the old and new UI view saved queries. ([#9166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9166))
 - Add tests for language-specific display ([#9215](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9215))
 - Add cypress integration test for the old and new UI view saved queries. ([#9229](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9229))