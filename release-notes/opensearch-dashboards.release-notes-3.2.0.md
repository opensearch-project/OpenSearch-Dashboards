# VERSION 3.2.0 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

 - [CVE-2025-48387] Bump tar-fs from 2.1.2 to 2.1.3 and from 3.0.8 to 3.1.0 ([#10225](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10225))

### 📈 Features/Enhancements

 - Add inspection button to action bar in tabs ([#10001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10001))
 - Support PPL filters in Explore ([#10045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10045))
 - Update fields selector grouping ([#10048](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10048))
 - Update explore chart UI ([#10092](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10092))
 - Add Documentations for PPL Commands ([#10095](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10095))
 - Make log table columns to be controlled by query result ([#10109](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10109))
 - Add columns filter UI and update fields selector panel style ([#10136](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10136))
 - Change fields selector default setting to show missing fields ([#10140](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10140))
 - Add Bar Size Control Switch for auto/manual bar sizing in bar charts ([#10152](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10152))
 - Query Editor for explore layout refactor ([#10249](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10249))
 - Trace Details page ([#10253](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10253))
 - Add global banner support via UI settings with live updates ([#10264](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10264))
 - [Explore] Move datepicker and run button to global header ([#10265](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10265))
 - Segregate Keywords into subCategory and Show docs panel by default ([#10274](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10274))
 - Improve query editor performance. ([#10285](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10285))
 - [Explore] Implement bidirectional URL-Redux synchronization ([#10313](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10313))
 - [Explore] Implement bidirectional URL-Redux synchronization ([#10321](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10321))
 - Change query panel ui around the editor language ([#10334](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10334))
 - Add tooltip for language reference in explore ([#10347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10347))
 - Support scope in data source selector ([#9832](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9832))
 - Keep backward compatibility for UI setting client ([#9854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9854))
 - Implement polling for index state in Vended Dashboard progress ([#9862](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9862))
 - Add pie, scatter, heatmap, single metric auto visualization ([#9874](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9874))
 - Onboard explore vis to new state management ([#9880](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9880))
 - New query editor in storybook ([#9886](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9886))
 - Consume tab registry service and related state in explore tabs ([#9901](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9901))
 - Support logs, traces, metrics flavor for explore plugin ([#9902](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9902))
 - Add explore embeddable ([#9908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9908))
 - Add bar chart with style panel ([#9920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9920))
 - Created patterns tab with patterns table UI ([#9933](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9933))
 - Support filters for Explore PPL visualizations ([#9953](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9953))
 - Add chart type switcher for explore vis ([#9961](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9961))
 - Update mapping and support saving style options ([#9964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9964))
 - Add area chart as available chart types ([#9973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9973))
 - Support loading state from object ([#9978](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9978))
 - Update table action bar and field selector in Explore ([#9985](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9985))
 - Add static banner plugin and feature flag ([#9989](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9989))

### 🐛 Bug Fixes

 - Increase timeout waiting for the exiting of an optimizer worker ([#10020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10020))
 - Update heatmap style panel UI ([#10051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10051))
 - Change name of add to dashboard modal ([#10055](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10055))
 - Add to dashboard should create a new save explore ([#10061](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10061))
 - Fix chart expand reset after query run ([#10072](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10072))
 - Turn on grid in scatter ([#10085](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10085))
 - Fix Extra Spaces being inserted with Aggregate Function In Autocomplete ([#10093](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10093))
 - Update Viz tab scroll and resize behavior ([#10096](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10096))
 - Fix axes-related UI ([#10101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10101))
 - Fixed a issue that cause chart time range update unexpectedly ([#10113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10113))
 - Fix Antlr to Moncao Token Mappings ([#10127](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10127))
 - Fix a issue causing unnecessary saved object fetch and top nav loading icon flicker flicker ([#10158](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10158))
 - Ts error in data/public/antlr ([#10173](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10173))
 - Add explicit tooltip configurations with user-modified display names for multiple charts ([#10208](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10208))
 - Fix a issue that cause PPL histogram display incorrectly ([#10248](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10248))
 - Fix font size and center alignment for banner text. ([#10251](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10251))
 - Update lighthouse baseline limit for dashboard and discover ([#10254](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10254))
 - Update styles for axes and heatmap ([#10255](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10255))
 - Replace absolute SCSS import with relative path to restore build compatibility ([#10258](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10258))
 - Do not append `source = *` when query starts with `show *` ([#10260](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10260))
 - Update field selector collapse UI ([#10261](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10261))
 - Move dataset select to query panel widgets ([#10269](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10269))
 - Apply global banner offset to new UI layout and flyouts ([#10270](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10270))
 - Url state lost when changing time filter on new discover ([#10281](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10281))
 - Console warning of no title on ButtonIcon component ([#10281](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10281))
 - Make documentation link tests more robust ([#10282](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10282))
 - Add one default range for metric + fix threshold in line-bar chart ([#10306](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10306))
 - ValidationError in ui setting ([#10309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10309))
 - Disable "Show legend" when color unset ([#10311](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10311))
 - Add cypress test for add to dashboard and style options update ([#10318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10318))
 - Fix cigroup 12 and 15 ([#10322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10322))
 - Correctly update time filter when loading save query ([#10323](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10323))
 - Fix cypress test for add log table to dashboard ([#10330](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10330))
 - [Explore] Fix New button URL state management issue ([#10332](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10332))
 - Fix PPL query millisecond precision in date filtering ([#10333](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10333))
 - [Explore] Fix query execution button issue when use using date picker quick selections ([#10336](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10336))
 - Fix: Discover plugin shows empty page instead of no-index-patterns UI when no index patterns ([#10345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10345))
 - [Explore] Fix QueryExecutionButton color inconsistency ([#10348](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10348))
 - Disable legend for line chart when it is 1 metric and 1 date ([#9911](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9911))
 - Make UI setting client more robust when the setting key not exists ([#9927](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9927))
 - Fix histogram UI in Explore ([#9932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9932))
 - Preserve selected tab when query run, correctly update cacheKeys when query run ([#9946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9946))
 - Fix autocomplete for ne query panel ([#9960](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9960))
 - Adjust panels layout on Explore page ([#9972](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9972))
 - Popover not close if double click ([#9993](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9993))

### 🚞 Infrastructure

### 📝 Documentation

 - Add guidelines on testing and development ([#9922](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9922))
 - Add Shenoy Pratik (`@ps48`) as a maintainer ([#9976](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9976))

### 🛠 Maintenance

 - Split page components into smaller container components ([#10124](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10124))
 - Update oui to 1.20 ([#10153](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10153))
 - Update oui to 1.21 ([#10284](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10284))
 - Ui update for dataset select ([#10344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10344))
 - Use `// @ts-expect-error` instead of ts_error_baseline ([#9931](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9931))

### 🪛 Refactoring

 - Change query editor ui ([#10259](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10259))
 - Change generated query UI ([#10337](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10337))
 - Refactor TS types of explore visualization related interfaces ([#9912](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9912))

### 🔩 Tests

 - Add cypress test for default vis on rule matching ([#10263](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10263))
 - Add integ tests for New Autocomplete experience in Explore ([#10288](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10288))
 - Re-enable recent query cypress test for explore ([#10290](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10290))
 - Cypress tests for AI mode for explore ([#10299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10299))
 - Add Tests for Filter In/ Filter Out Actions in Explore ([#10302](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10302))
 - Unskip saved queries test for explore ([#10307](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10307))
 - Add Test to validate PPL query not starting with source ([#10310](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10310))
 - Add cypress tests for discover visualization ([#10315](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10315))
 - Fixed linting error of new discover state of tab slice ([#10328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10328))
 - Update caniuse version ([#10328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10328))