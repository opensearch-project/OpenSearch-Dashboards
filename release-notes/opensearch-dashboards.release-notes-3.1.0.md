# VERSION 3.1.0 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

 - [CVE-2024-47764] Remove `cookie@0.4.1` as a nested dependency ([#9838](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9838))

### 📈 Features/Enhancements

 - Add a new Data Importer Plugin to OSD Core ([#9602](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9602))
 - Ui action supports `isDisabled` and `getTooltip` ([#9696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9696))
 - Adding back storybook ([#9697](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9697))
 - Update default index pattern logic ([#9703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9703))
 - Support new OpenSearch type match_only_text ([#9707](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9707))
 - Add new Explore plugin ([#9724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9724))
 - Support multiple-scopes ui settings ([#9726](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9726))
 - Add resource API pattern in query_enhancements ([#9770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9770))
 - Support explore only in the observability workspace type ([#9773](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9773))
 - Remove theme update modal ([#9776](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9776))
 - Add new state management base implementations and hooks ([#9777](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9777))
 - Add permission control for admin UI settings ([#9795](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9795))
 - Duplicate discover and data-explorer into explore plugin ([#9798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9798))
 - Saved explore type in explore plugin ([#9809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9809))
 - [Feature][Integration] Vended Dashboards Synchronization #9816 ([#9816](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9816))
 - Deprecate showInAllNavGroup property ([#9818](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9818))
 - Register search overview page to all use case by using addNavLinksToGroup ([#9818](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9818))
 - Add a permission controlled admin UI setting for enable/disable AI features in OSD ([#9824](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9824))
 - Auto visualization for explore ([#9834](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9834))
 - Add new experience banners for explore for both new and classic ([#9842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9842))
 - Update data plugin's __enhance type to include promises ([#9842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9842))
 - Add tabs in explore, introduce logs tab ([#9849](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9849))
 - Make default index pattern method more robust ([#9867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9867))

### 🐛 Bug Fixes

 - Remove * when calling find in data source association modal and in workspace list page ([#9409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9409))
 - Should clear previous query if input invalid questions ([#9605](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9605))
 - Initial result summary generated with the wrong data ([#9611](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9611))
 - Fix a issue that can cause incorrect query to fire when switch plugin ([#9625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9625))
 - Data source opensearch client honors the timeout settings in yaml file ([#9651](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9651))
 - Support left navigation search for OSD with workspace plugin disabled ([#9662](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9662))
 - Fix Branding test urls ([#9694](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9694))
 - Fix user appearance not working ([#9700](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9700))
 - Cancel existing query when new natural language prompt is being generated-new ([#9701](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9701))
 - Fix SigV4 signing mismatch issue with ?v query parameter ([#9730](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9730))
 - Fix collaborators displays under custom tab on navigation when saved object permission is disabled ([#9734](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9734))
 - Chatbot flyout cannot be resized beyond the window size ([#9735](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9735))
 - Performance script ([#9738](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9738))
 - Path alias not properly resolved if the source code was copied and built from another directory ([#9784](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9784))
 - [Explore] rename Explore nav item to Discover ([#9813](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9813))
 - Content and Card are mistakenly placed under the create visualization dropdown menu ([#9815](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9815))
 - UI setting will give error if a specific setting is not defined. ([#9820](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9820))
 - Revert workspaces=* and add warning log ([#9848](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9848))
 - Adds the displaying of unknown fields back to Discover ([#9856](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9856))
 - Update @testing-library/user-event version ([#9857](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9857))
 - Fix update button issue in DateTimeRange picker ([#9875](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9875))

### 🚞 Infrastructure

### 📝 Documentation

 - Update maintainer merging responsibilities ([#9863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9863))

### 🛠 Maintenance

 - Bump version to 3.1.0 ([#9789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9789))
 - Add package resolutions to fix braces CVE-2024-4068 ([#9846](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9846))
 - Fix CVE 2025-5889 braces-expansion ([#9903](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9903))

### 🪛 Refactoring

 - Extract path alias babel config to a reusable function ([#9831](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9831))

### 🔩 Tests