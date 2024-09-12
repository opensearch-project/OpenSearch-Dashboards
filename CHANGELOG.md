# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

## [2.17.0-2024-09-06](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.17.0)

### 💥 Breaking Changes

### Deprecations

 - Deprecating `CssDistFilename` exports in favor of `themeCssDistFilenames` in `@osd/ui-shared-deps` ([#7625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7625))

### 🛡 Security

### 📈 Features/Enhancements

 - DQL Autocomplete ([#7391](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7391))
 - Provide new embeddable option to hide embeddable panel action button ([#7503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7503))
 - [Workspace]Optimize workspace permission validation for bulk operations ([#7516](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7516))
 - [VisBuilder-Next] Migration of legacy visualizations to VisBuilder by constructing the URL. ([#7529](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7529))
 - [Workspace] Refactor workspace detail page ([#7598](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7598))
 - Add a util function to generate the relative redirectUrl. ([#7600](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7600))
 - Only allow essential use case when creating workspace if all data sources are serverless ([#7612](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7612))
 - Use essentials as the nav group name ([#7618](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7618))
 - Make parent item unclickable and fix duplicate items in landing page. ([#7619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7619))
 - [Workspace] Set default color for workspace create form ([#7627](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7627))
 - Register section and content with the same id will not throw error but overrides the exist one ([#7633](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7633))
 - Introduce the redesign page and applications headers behind a switch ([#7637](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7637))
 - [Workspace] Update workspace list page table ([#7640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7640))
 - [contentManagement] allow to update section input after page rendered ([#7651](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7651))
 - Update permission settings appearance ([#7652](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7652))
 - [navigation] Left navigation collective ([#7655](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7655))
 - [Workspace]Add name and description characters limitation ([#7656](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7656))
 - [Workspace]Essential/Analytics(All) use case overview page ([#7673](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7673))
 - Change the locale dynamically by adding &i18n-locale to URL ([#7686](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7686))
 - Allow customizing `restrictWidth` and `paddingSize` of `TableListView` ([#7691](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7691))
 - Integrate new page header for workspace pages ([#7697](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7697))
 - Add a unit test case to indicate React is anti-xss ([#7699](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7699))
 - Refractor the homepage assets list section ([#7702](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7702))
 - [Workspaces]Add features in use case card and preselect first use case ([#7703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7703))
 - Support workspace initial page ([#7708](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7708))
 - Add New Page Header to Visualize ([#7712](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7712))
 - Display workspace picker content when outside workspace ([#7716](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7716))
 - Allow `screenTitle` to be present when SearchBar is not in Application header ([#7721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7721))
 - Simplify `TopNavControlDescriptionData` to to be followed by links ([#7723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7723))
 - [Workspace]Fix click on workspace name not navigates to use case overview page ([#7748](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7748))
 - [Workspace]Add right sidebar to workspace create form ([#7750](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7750))
 - Add v9 theme (preview) ([#7757](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7757))
 - Minor interface change and move suggestion provider registration location ([#7758](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7758))
 - [Workspace] Add workspace navigation for default route ([#7785](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7785))
 - Adjust the appearance of collaborator panel ([#7795](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7795))
 - Add external icon to `TopNavControlButtonData` and `TopNavControlLinkData` with `target: '_blank'` ([#7799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7799))
 - Add `iconGap` to `TopNavControlButtonData` and `TopNavControlLinkData` ([#7799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7799))
 - Bump OUI to 1.11.0 ([#7799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7799))
 - Add `flush` to `TopNavControlLinkData` ([#7801](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7801))
 - Add home icon in left bottom ([#7802](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7802))
 - Refractor the style of recent items card ([#7805](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7805))
 - Add OpenSearch PPL autocomplete to discover 2.0 with query enhancements ([#7810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7810))
 - Add workspace icon to left nav / workspace picker menu / home page. ([#7823](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7823))
 - [Workspace]Remove default appended features ([#7841](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7841))
 - Query editor UI changes ([#7866](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7866))
 - Support injecting `DataStructureMeta` from `QueryEditorExtensions` for Query Assist ([#7871](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7871))
 - Align essentials use case id ([#7873](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7873))
 - [Workspace] Add search use case overview page ([#7877](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7877))
 - Update the collaborator input from a combobox to a text field ([#7879](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7879))
 - Refactor content menu picker in side bar and enable searching ([#7881](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7881))
 - [Workspace]Validate features parameter in workspace create and update API ([#7884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7884))
 - Add S3 data exploration for connections, databases, and tables ([#7917](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7917))
 - Introduce a data-connection saved-object type for external data connections ([#7925](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7925))
 - [Workspace]Redirect to use case landing page after workspace create ([#7933](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7933))
 - Async query search and caching, also adding tests to related components ([#7943](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7943))
 - Add query result and time to the query editor footer ([#7951](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7951))
 - [Data source] Add data source permission wrapper and dataSourceAdmin role ([#7959](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7959))
 - Support DQCs in create page ([#7961](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7961))
 - [Workspace] Hide home breadcrumbs when in a workspace ([#7992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7992))
 - [Workspace]Deny get or bulkGet for global data source ([#8043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8043))

### 🐛 Bug Fixes

 - [Workspace]add workspace name blank/empty check ([#7512](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7512))
 - Not highlighting Droppable Areas while dragging a field ([#7527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7527))
 - [Workspace] updating workspace-list-card and home-list-card ([#7547](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7547))
 - Resolve some browser warnings ([#7550](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7550))
 - Do not show surround doc links for PPL ([#7585](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7585))
 - Update DQL Autocomplete in code and functionality ([#7593](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7593))
 - Add validation for data source in get and bulk_get methods ([#7596](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7596))
 - [navigation] add sample data to left navigation ([#7613](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7613))
 - [contentManagement] display cards by specifying a column size or display all cards in one row ([#7624](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7624))
 - [Workspace] Move set default source order to avoid dev server crash ([#7636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7636))
 - [Workspace]Fix page crash caused by invalid workspace color ([#7671](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7671))
 - Breadcrumb is not correct when clicking inspect / edit in Assets page ([#7749](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7749))
 - Fix the parameter misalignment in the workspace_detail_page ([#7768](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7768))
 - Fix new header allowing their single-child's overflowing ([#7796](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7796))
 - Fix query assistant fetching agent bug ([#7804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7804))
 - Correct size of dashboard panel options icon button ([#7812](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7812))
 - [Workspace] maximum call stack error in use case service ([#7817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7817))
 - Enable direct query connections to support in workspace ([#7839](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7839))
 - [Workspace] Revert new home page ui setting for workspace default route ([#7858](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7858))
 - Clean up language search interceptors and fix aggs for PPL ([#7870](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7870))
 - Query editor UI clean up ([#7896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7896))
 - Fix bootstrap errors in 2.x ([#7901](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7901))
 - Refactor the style for the work list table ([#7913](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7913))
 - Show alias fields in Discover tab ([#7930](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7930))
 - [Workspace]dynamicConfigServiceMock not found in workspace routes UT ([#7954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7954))
 - Fix workspace detail classname definition ([#7986](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7986))
 - Hide delete button for non OSD admin ([#7987](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7987))

### 🚞 Infrastructure

### 📝 Documentation

 - Add documentation for dynamic page creation ([#7575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7575))
 - Add Huy as maintainer ([#8025](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8025))

### 🛠 Maintenance

 - Update oui to 1.12 ([#7865](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7865))

### 🪛 Refactoring

 - [Workspace] Support getting workspaces client from coreStart ([#7501](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7501))
 - [Look&Feel] Update paragraph text sizes across remaining OSD ([#7603](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7603))
 - [Look&Feel] Use semantic headers for page, modal, & flyouts across the board ([#7616](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7616))
 - Simplify theme configuration and defaulting ([#7625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7625))
 - Refactor search bar & filters to conditionally render new look with application header ([#7687](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7687))
 - MDS and MQL features to use generic structured types, abstract data querying, and language service ([#7731](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7731))
 - Update page header for settings, objects and index pattern page ([#7744](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7744))
 - [Workspace] Refactor: workspace detail page header ([#7771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7771))
 - [Look & Feel] Appearance Popover Button Change ([#7777](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7777))
 - [Workspace] Use small button, small padding and compressed. ([#7842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7842))
 - [Workspace] workspace initial page ([#7857](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7857))
 - Add workspace info in index pattern and asset header and update workspace header ([#7859](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7859))
 - Update page header for edit object page ([#7910](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7910))
 - Update header for data source management when in workspace ([#7916](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7916))
 - [Workspace] Refactor get start card at new home page ([#7920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7920))
 - Hide saved object import button when user is outside workspace ([#7989](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7989))

### 🔩 Tests

## [2.16.0-2024-07-30](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.16.0)

### 💥 Breaking Changes

### Deprecations

 - Remove data enhancements config and readonly flag. Removes dead url link, ([#7291](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7291))

### 🛡 Security

 - [CVE-2024-28863] Bump tar from 6.1.11 to 6.2.1 ([#6492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6492))
 - [CVE-2024-33883] Bump ejs from `3.1.7` to `3.1.10` ([#6770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6770))
 - [CVE-2024-4067][CVE-2024-4068] Bump packages dependent on `braces` versions lower than 3.0.3 ([#6911](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6911))
 - [GHSA-x565-32qp-m3vf] Bump `jimp` to remove phin dependency ([#6977](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6977))
 - [SNYK-JS-AXIOS-6144788] Bump axios to `1.7.2` ([#7149](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7149))
 - [CVE-2024-37890] Bump ws from `8.5.0` to `8.17.1` and from `7.5.7` to `7.5.10` ([#7153](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7153))

### 📈 Features/Enhancements

 - Make theme and dark mode settings user/device specific (in local storage), with opt-out ([#5652](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5652))
 - [Workspace]Import sample data to current workspace ([#6105](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6105))
 - [Data Explorer] Allow render from View directly, not from Data Explorer ([#6167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6167))
 - [MDS] Allow querying from data sources in Timeline visualizations ([#6385](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6385))
 - [MDS] Prevent importing of data source object when MDS is not enabled ([#6395](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6395))
 - [VisBuilder] Change VisBuilder from experimental to production ([#6436](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6436))
 - Adds `migrations.delete` to delete saved objects by type during a migration ([#6443](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6443))
 - [Workspace] Duplicate selected/all saved objects ([#6478](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6478))
 - [Workspace] Dashboard admin(groups/users) implementation. ([#6554](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6554))
 - Support language selector from the data plugin ([#6613](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6613))
 - Add Server Side Batching for UI Metric Colector ([#6721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6721))
 - Make Field Name Search Filter Case Insensitive ([#6759](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6759))
 - Add data source selection service to support storing and getting selected data source updates ([#6827](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6827))
 - [Workspace] Only OSD admin can create workspace ([#6831](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6831))
 - [Workspace]Add use cases to workspace form ([#6887](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6887))
 - Add missing aria-label for discover page ([#6898](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6898))
 - Remove endpoint validation for create data source saved object API ([#6899](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6899))
 - [Workspace] Change description field to textarea ([#6907](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6907))
 - Use JSON11 for handling long numerals ([#6915](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6915))
 - [MDS] Allow adding sample data for Timeline visualizations ([#6919](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6919))
 - [Multi DataSource] Add removedComponentIds for data source selection service ([#6920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6920))
 - [MD]Use placeholder for data source credentials fields when export saved object ([#6928](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6928))
 - Query editor and UI settings toggle ([#7001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7001))
 - Add search bar extensions ([#7034](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7034))
 - [Workspace] Refactor the UI of workspace picker ([#7045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7045))
 - Render the datasource selector component conditionally ([#7059](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7059))
 - Introduce new interface for group ([#7060](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7060))
 - Support data source assignment in workspace. ([#7101](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7101))
 - [Workspace] Capabilities service add dashboard admin flag ([#7103](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7103))
 - Onboard dataframes support to MDS and create dataframe before request ([#7106](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7106))
 - Enhance Drag & Drop functionality in Vis Builder ([#7107](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7107))
 - Comply `recent items` with workspace ([#7115](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7115))
 - [Navigation-next] Add register nav group updater in chrome service ([#7117](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7117))
 - [Workspace] Refactor workspace form UI ([#7133](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7133))
 - [MDS] Observability Datasource Plugin migration with MDS support ([#7143](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7143))
 - Add description field in App. ([#7152](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7152))
 - Query editor and dataframes datasources container ([#7157](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7157))
 - [Workspace] Delete the virtual global workspace ([#7165](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7165))
 - 1. Add current nav group into chrome service 2. Prepend current nav group into breadcrumb ([#7166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7166))
 - [QueryEditorExtensions] change `isEnabled` to an observable ([#7183](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7183))
 - Support workspace level default data source ([#7188](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7188))
 - Introduced an new plugin contentManagement for dynamic content rendering ([#7201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7201))
 - Address styling of non-primary buttons by making secondary/empty ([#7211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7211))
 - Add query enhancements plugin as a core plugin ([#7212](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7212))
 - Hide select data source panel for non dashboard admin in workspace create/edit page ([#7213](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7213))
 - [DataSource] Restrict to edit data source on the DSM UI. ([#7214](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7214))
 - Use registered nav group as workspace use case ([#7221](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7221))
 - [navigation-next] Add new left navigation ([#7230](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7230))
 - Add all use case ([#7235](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7235))
 - [navigation-next] add recent works in new homepage ([#7237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7237))
 - [Workspace] Support workspace detail page ([#7241](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7241))
 - [Workspace] Register workspace settings under setup and settings ([#7242](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7242))
 - Register workspace list card into home page ([#7247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7247))
 - Add recent items popup in top navigation ([#7257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7257))
 - [navigation-next] Add new category ([#7275](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7275))
 - Enable landing page for settings and data administration ([#7282](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7282))
 - Support PPL in vega visualization ([#7285](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7285))
 - [VisBuilder] Add Capability to generate dynamic vega ([#7288](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7288))
 - Recover data source management in workspace ([#7296](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7296))
 - Disable certain routes when data_source.manageableBy is none ([#7298](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7298))
 - [navigation-next] fix: redirect to standard index pattern applications while nav group is enabled ([#7305](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7305))
 - Disable inputs in edit data source screen when data_source.manageableBy is none ([#7307](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7307))
 - Update query enhancement UI ([#7309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7309))
 - [Workspace]Add "All use case" option to workspace form ([#7318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7318))
 - [MDS] Data Connection details page with MDS support ([#7323](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7323))
 - Use compressed DataSourceSelector ([#7329](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7329))
 - [Workspace] Register four get started cards in home page ([#7333](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7333))
 - [Auto Suggest] OpenSearch SQL autosuggest with ANTLR ([#7336](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7336))
 - [navigation-next] update category ([#7339](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7339))
 - Add home page static list card ([#7351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7351))
 - [Workspace]Hide create workspace button for non dashboard admin ([#7357](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7357))
 - Enrich breadcrumbs by workspace and use case ([#7360](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7360))
 - Bump OUI to 1.8.0 ([#7363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7363))
 - [MDS] Observability Datasource Plugin migration with MDS support for Data Connection Table ([#7371](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7371))
 - Add MDS support along with a few cleanup and tests update ([#7463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7463))
 - Add back data set navigator to control state issues ([#7492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7492))
 - Fix discover options' location ([#7581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7581))

### 🐛 Bug Fixes

 - [VisBuilder][BUG] Flat render structure in Metric and Table Vis ([#6674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6674))
 - [MDS] Add a new message to data source components when there are no compatible datasources ([#6678](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6678))
 - Adjust the padding size for aggregated view ([#6715](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6715))
 - Add more test for icon and aggregated view ([#6729](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6729))
 - [OSD Availability] Prevent OSD process crashes when disk is full ([#6733](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6733))
 - Add test for edit data source form ([#6742](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6742))
 - Add test for data_source_error_menu, data_source_item, data_source_multi_selectable ([#6752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6752))
 - Add test for toast button and validation form ([#6755](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6755))
 - Show error toast when fail to delete saved objects ([#6756](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6756))
 - Lint checker failure fix ([#6771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6771))
 - Fix workspace name duplication check ([#6776](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6776))
 - Error message is not formatted in vis_type_vega url parser. ([#6777](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6777))
 - [Discover][Bug] Migrate global state from legacy URL ([#6780](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6780))
 - Quickrange selection fix ([#6782](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6782))
 - Bug Fixes for Vis Builder ([#6811](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6811))
 - Fix endpoint validation by passing in request when creating datasource client ([#6822](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6822))
 - Update index pattern references with data source when import sample data ([#6851](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6851))
 - Remove unused import and property which broke compilation ([#6879](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6879))
 - Fix not setting the default data source when creating data source bug ([#6908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6908))
 - Close any open system flyout when changing view mode of the dashboard ([#6923](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6923))
 - Add TSVB Support for adding sample data ([#6940](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6940))
 - Fix web log sample visualization & vis-builder not rendering with data source issue ([#6948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6948))
 - [MDS] Include data source name when importing a timeline visualization ([#6954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6954))
 - Update z-index of sidecar container to make it more than mask, from 1000 to 1001. ([#6964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6964))
 - [Discover] Check if the timestamp is already included to remove duplicate col ([#6983](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6983))
 - Highlight the anchor row in surrounding doc view ([#7025](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7025))
 - [MDS] Add data source engine type to data source saved object ([#7026](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7026))
 - Fix colors of the visualizations with more than 10 items ([#7051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7051))
 - [BUG][NewHomePage] Temp Solution to avoid crash for anonymous user with no write permission ([#7054](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7054))
 - [Discover] Allow the last column of a table wider than the window to show up properly ([#7058](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7058))
 - Update error message in timeline visualization when MDS disabled ([#7069](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7069))
 - Fix object empty check and minor perf issue in query editor extensions ([#7077](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7077))
 - Remove angular related comment and code ([#7087](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7087))
 - [MDS][Version Decoupling] Add support of Version Decoupling in Index Patterns Dashboards Plugin ([#7100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7100))
 - [Workspace]Restrict saved objects finding when workspace enabled ([#7125](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7125))
 - [MDS][Version Decoupling] Add support of required backend plugins check on data sources ([#7146](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7146))
 - [MDS] Fix the dsm plugin setup when mds feature flag is disabled ([#7163](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7163))
 - [MDS][Version Decoupling] Add dataSourceVersion' and  'installedPlugins in viewer returns ([#7172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7172))
 - Break new lines in table cell in legacy discover ([#7207](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7207))
 - [Sample Data] Updates sample dashboard title in sample web logs data ([#7233](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7233))
 - Discover page status stuck in loading State ([#7252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7252))
 - Unassign data source before deleteByWorkspace ([#7279](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7279))
 - Unused config setting and remove data sources as a required plugin. ([#7314](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7314))
 - Fix wrapping of labels in filter by type popover ([#7327](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7327))
 - [Navigation] Update dev tools tab css for new left navigation ([#7328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7328))
 - Data source selector in dev tools tab moved to left ([#7347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7347))
 - [navigation-next] Fix issues. ([#7356](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7356))
 - [DataSource] No restriction on setting default data source ([#7396](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7396))
 - Make breadcrumb of 4 new added applications comply with BrowserRouter. ([#7401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7401))
 - [Bug][Workspace] Navigate to detail page when clicking all use case workspace ([#7405](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7405))
 - [Version Decoupling] Add data source version and installed plugins in data source viewer returns ([#7420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7420))
 - [Bug][Workspace] Add permission validation at workspace detail page ([#7435](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7435))
 - [Bug][Data Source] Move data source manageable feature flag to DSM plugin ([#7440](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7440))
 - Update recent items icon from SVG to react component ([#7478](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7478))
 - [MDS] Fix the hide local cluster config ([#7497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7497))
 - Update icon of recent items from OUI library to enable dark mode ([#7508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7508))
 - Fix data source picker trigger local cluster call by default ([#7528](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7528))
 - Fix babel error ([#7541](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7541))
 - Fix tables not displaying in navigator and add local cluster to datasources ([#7542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7542))
 - Fixes Discover next styling ([#7546](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7546))
 - [navigation]feat: redirect user to home in global when workspace is enabled ([#7551](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7551))
 - [Workspace]Add workspaces and permissions fields into saved objects _bulk_get response ([#7565](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7565))
 - Fixes databases not being displayed upon success ([#7567](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7567))

### 🚞 Infrastructure

### 📝 Documentation

 - Add zhyuanqi as maintainer ([#6788](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6788))
 - Move @BSFishy to emeritus maintainer ([#6790](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6790))
 - Add mengweieric as maintainer ([#6798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6798))
 - Add OpenAPI specification for GET and CREATE saved object API ([#6799](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6799))
 - Add example for saved object creation part for openapi doc. ([#6855](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6855))
 - Add openAPI doc for saved_object find api ([#6856](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6856))
 - Add OpenAPI specification for bulk create and bulk update saved object APIs ([#6859](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6859))
 - Add OpenAPI specification for bulk_get saved object APIs ([#6860](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6860))
 - Add OpenAPI specification for update, delete and migrate saved object API ([#6864](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6864))
 - Add OpenAPI specification for import and export saved object api ([#6872](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6872))
 - Add OpenAPI specifications for resolve import errors api ([#6885](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6885))
 - Add Suchit as maintainer ([#6980](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6980))
 - Add Viraj as maintainer ([#7196](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7196))
 - Add OpenAPI specification for API for retrieving fields of index patterns ([#7270](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7270))
 - Add Sean as maintainer ([#7458](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7458))
 - Add Joshua as maintainer ([#7553](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7553))

### 🛠 Maintenance

 - Skip running tests for updates in CODEOWNERS ([#7197](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7197))

### 🪛 Refactoring

 - Unify getDefaultDataSourceId and export ([#6843](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6843))
 - [MDS] Refactor error handling in data source management plugin to use DataSourceError ([#6903](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6903))
 - [Look&Feel]  Refactor to use semantic headers for page, modal & flyout ([#7192](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7192))
 - [Look&Feel] Consistency of Plus Icons ([#7195](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7195))
 - [Look&Feel] Update Popover Padding Size ([#7200](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7200))
 - [Look&Feel] Replace browser tooltip usage with OUI tooltip ([#7231](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7231))
 - [Look&Feel] Use small EuiTabs and EuiTabbedContent across the board ([#7232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7232))
 - Density and consistency changes for discover and query bar ([#7299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7299))
 - [Look&Feel] Apply guidance for visBuilder ([#7341](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7341))
 - [Look&Feel] Apply small popover padding and add Oui tooltips ([#7523](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7523))
 - [Look&Feel] Discover and Query Management fix ([#7530](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/7530))

### 🔩 Tests

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

- [CVE-2023-45857] Bump `axios` from `0.27.2` to `1.6.1` ([#5470](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5470))
- [WS-2021-0638] Bump mocha from `7.2.0` to `10.1.0` ([#2711](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2711))

### 📈 Features/Enhancements

- [Multiple Datasource] Add multi data source support to Timeline ([#6385](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6385))
- [Multiple Datasource] Do not support import data source object to Local cluster when not enable data source ([#6395](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6395))

### 🐛 Bug Fixes

- [Chore] Update deprecated url methods (url.parse(), url.format()) ([#2910](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2910))
- Cleanup unused url ([#3847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3847))

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

### 🪛 Refactoring

- Remove unused Sass in `tile_map` plugin ([#4110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4110))
- Remove KUI usage in `disabled_lab_visualization` ([#5462](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5462))

### 🔩 Tests

## [2.14.0-2024-05-02](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.14.0)

### 📈 Features/Enhancements

 - Add `opensearchDashboards.futureNavigation` config to control dev tool top right nav button. ([#6712](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6712))
 - Adds `migrations.delete` to delete saved objects by type during a migration ([#6443](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6443))
 - Parse query string filters to determine if fields match an index when `ignoreFilterIfFieldNotInIndex` is enabled ([#6126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6126))
 - [Workspace] Setup workspace skeleton and implement basic CRUD API ([#5075](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5075))
 - [Workspace] Add ACL related functions ([#5084](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5084/))
 - [Workspace] Optional workspaces params in repository ([#5949](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5949))
 - [Workspace] Add delete saved objects by workspace functionality([#6013](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6013))
 - [Workspace] Consume workspace id in saved object client ([#6014](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6014))
 - [Workspace] Add permission control logic ([#6052](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6052))
 - [Workspace] Add workspace id in basePath ([#6060](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6060))
 - [Chrome] Introduce registerCollapsibleNavHeader to allow plugins to customize the rendering of nav menu header ([#5244](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5244))
 - [Workspace] Allow making apps available in workspaces using `workspaceAvailability` ([#6427](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6427))
 - [Workspace] Handle data sources and advanced settings as global object. ([#6524](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6524))
 - [Workspace] Make dashboards management available ([#6575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6575))
 - [Workspace] Add workspace overview page ([#6584](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6584))
 - Improve the perceived performance of Discover when using the default tabular renderer ([#6599](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6599))
 - [Workspace] Hide dashboard overview ([#6625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6625))
 - Optimize scrolling behavior of Discover table ([#6683](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6683))
 - [Discover] Add extension group title to non-index data source groups to indicate log explorer redirection in discover data source selector. ([#5815](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5815))
 - [Multiple Datasource] Create data source menu component able to be mount to nav bar ([#6082](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6082))
 - [Multiple Datasource] Expose filterfn in datasource menu component to allow filter data sources before rendering in navigation bar ([#6113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6113))
 - [Multiple Datasource] Add component to show single selected data source in read only mode ([#6113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6125))
 - [Multiple Datasource] Add data source aggregated view to show all compatible data sources or only show used data sources ([#6129](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6129))
 - [Workspace] Register a workspace dropdown menu at the top of left nav bar ([#6150](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6150))
 - [Workspace] Validate if workspace exists when setup inside a workspace ([#6154](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6154))
 - [Multiple Datasource] Add TLS configuration for multiple data sources ([#6171](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6171))
 - [Multiple Datasource] Use data source filter function before rendering ([#6175](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6175))
 - [Workspace] Add create workspace page ([#6179](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6179))
 - [Workspace] Add workspace list page ([#6182](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6182))
 - Enable UI Metric Collector to collect UI Metrics and Application Usage ([#6203](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6203))
 - [Multiple Datasource] Add multi selectable data source component ([#6211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6211))
 - [Multiple Datasource] Add multi data source support to sample vega visualizations ([#6218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6218))
 - [Workspace] Add workspaces column to saved objects page ([#6225](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6225))
 - [Multiple Datasource] Add icon in datasource table page to show the default datasource ([#6231](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6231))
 - [Workspace] Filter left nav menu items according to the current workspace ([#6234](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6234))
 - [Multiple Datasource] Make sure customer always have a default datasource ([#6237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6237))
 - [Multiple DataSource] Codebase maintenance involves updating typos and removing unused imported packages ([#6238](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6238))
 - [Multiple Datasource] Refactor data source menu and interface to allow cleaner selection of component and related configurations ([#6256](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6256))
 - [Multiple Datasource] Remove arrow down icon from data source selectable component ([#6257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6257))
 - [Multiple Datasource] Allow top nav menu to mount data source menu for use case when both menus are mounted ([#6268](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6268))
 - [Workspace] Add update workspace page ([#6270](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6270))
 - [Workspace] Add API to duplicate saved objects among workspaces ([#6288](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6288))
 - [Multiple Datasource] Enhanced data source selector with default datasource shows as first choice ([#6293](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6293))
 - [Mulitple Datasource] Add multi data source support to TSVB ([#6298](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6298))
 - [Workspace] Add APIs to support plugin state in request ([#6303](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6303))
 - [Multiple Datasource] Fetch data source title for DataSourceView when only id is provided ([#6315](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6315))
 - [Multiple Datasource] Add default icon for selectable component and make sure the default datasource shows automatically ([#6327](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6327))
 - [Multiple Datasource] Pass selected data sources to plugin consumers when the multi-select component initially loads ([#6333](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6333))
 - Allow the use of `ignoreVersionMismatch` in non-dev configuration ([#6347](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6347))
 - [Multiple Datasource] Add installedPlugins list to data source saved object ([#6348](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6348))
 - [Multiple Datasource] Add default icon in multi-selectable picker ([#6357](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6357))
 - [Multiple Datasource] Get data source label when only id is provided in DataSourceSelectable ([#6358](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6358))
 simplifying client fetch ([#6364](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6364))
 - [Dynamic Configurations] Improve dynamic configurations by adding cache and simplifying client fetch ([#6364](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6364))
 - [Workspace] Support workspace in saved objects client in server side. ([#6365](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6365))
 - [Multiple Datasource] Refactor data source selector component to include placeholder and add tests ([#6372](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6372))
 - [Workspace] Add permission tab to workspace create update page ([#6378](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6378))
 - [CSP Handler] Update CSP handler to only query and modify frame ancestors instead of all CSP directives ([#6398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6398))
 - Replace control characters before logging ([#6402](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6402))
 - [MD] Add dropdown header to data source single selector ([#6431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6431))
 - [Multiple Datasource] Add error state to all data source menu components to show error component and consolidate all fetch errors ([#6440](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6440))
 - [Workspace] Hide datasource and advanced settings menu in dashboard management when in workspace. ([#6455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6455))
 - [Workspace] Add workspaces filter to saved objects page. ([#6458](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6458))
 - [Multiple Datasource] UI change for datasource view picker to enable selectable([#6497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6497))
 - [Multiple Datasource] Add popover for empty state and redirect to data source management page([#6514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6514))
 - [Multiple Datasource] Modify selectable picker to remove group label and close popover after selection ([#6515](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6515))
 - [Multiple Datasource] Update empty state font size and footer button size to small ([6549](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6549))
 - Add `rightNavigationButton` component in chrome service for applications to register and add dev tool to top right navigation. ([#6553](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6553))
 - [Multiple Datasource] Extract the button component for datasource picker to avoid duplicate code ([#6559](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6559))
 - [Workspace] Add a workspace client in workspace plugin ([#6094](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6094))
 - [Multiple Datasource] Support multi data source in Region map ([#6654](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6654))
 - [Multiple Datasource] Add empty state component for no connected data source ([#6499](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6499))
 - [MD] Add OpenSearch cluster group label to top of single selectable dropdown  ([#6400](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6400))

### 🐛 Bug Fixes

 - [Dev Tool] Add additional themed styles to ace overrides ([#5327](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5327))
 - [Workspace] Permission check failed with empty workspace for find method ([#6527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6527))
 - Allow Save in Top Nav Menu to capture filter and query ([#6636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6636))
 - Fix datasource  test connect error ([#6648](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6648))
 - [Workspace] Keep disallowed types when importing with overwrite ([#6668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6668))
 - [Workspace] Optimization on handling invalid workspace id in workspace_ui_settings wrapper ([#6669](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6669))
 - [Discover] Fix lazy loading of the legacy table from getting stuck ([#6041](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6041))
 - [BUG][Multiple Datasource] Fix obsolete snapshots for test within data source management plugin ([#6185](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6185))
 - [Workspace] Add base path when parse url in http service ([#6233](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6233))
 - [BUG] Fix for checkForFunctionProperty so that order does not matter ([#6248](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6248))
 - [Multiple Datasource] Fix sslConfig for multiple datasource to handle when certificateAuthorities is unset ([#6282](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6282))
 - [BUG][Multiple Datasource]Fix bug in data source aggregated view to change it to depend on displayAllCompatibleDataSources property to show the badge value ([#6291](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6291))
 - [BUG][Multiple Datasource]Read hideLocalCluster setting from yml and set in data source selector and data source menu ([#6361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6361))
 - [BUG][Multiple Datasource] Refactor read-only component to cover more edge cases ([#6416](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6416))
 - [BUG][Multiple Datasource] Fix style of data source option inside popover for data source selector, selectable, multi select components ([#6438](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6438))
 - [BUG][Multiple Datasource] Add validation for title length to be no longer than 32 characters [#6452](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6452)
 - [VisBuilder] Allow saving and loading filter and query in a saved VisBuilder  ([#6460](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6460))
 - [BUG][Multiple Datasource] Modify the button of selectable component to fix the title overflow issue ([#6465](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6465))
 - [Dynamic Configurations] Fix dynamic config API calls to pass correct input ([#6474](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6474))
 - [BUG][Multiple Datasource] Fix on data source selectable and readonly component are not consistent ([#6545]https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6545)
 
### 🚞 Infrastructure

 - Update link-checker and clean up ignore-list ([#6425](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6425))

### 🪛 Refactoring

 - Refactor dev tool to use dataSourceManagement.ui API to get DataSourceSelector ([#6477](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6477))
 - Refactor saved object management plugin to use datasourceManagement ui API to get DataSourceSelector ([#6544](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6544))
 - discover data selector enhancement and refactoring ([#6571](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6571))
 - [Multiple Datasource] Move data source selectable to its own folder, fix test and a few type errors for data source selectable component ([#6287](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6287))
 - [Multiple Datasource] Remove duplicate data source attribute interface from `data_source_management` ([#6437](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6437))

### 🔩 Tests

 - Add functional test cypress workflow improvements and enable the workflow for in-house Dashboards tests ([#6061](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6061))

## [2.13.0-2024-03-02](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.13.0)

### 🛡 Security

- [CVE-2020-36604] Employ a patched version of hoek `6.1.3` ([#6148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6148))
- Support dynamic CSP rules to mitigate Clickjacking https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5641
- [CVE-2024-27088] Bump es5-ext from `0.10.59` to `0.10.64` ([#6021](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6021))
- [CVE-2024-28849] Bump follow-redirect from `1.15.4` to `1.15.6` ([#6199](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/6199))

### 📈 Features/Enhancements

- [MD]Change cluster selector component name to data source selector ([#6042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6042))
- [Multiple Datasource] Add interfaces to register add-on authentication method from plug-in module ([#5851](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5851))
- [Multiple Datasource] Able to Hide "Local Cluster" option from datasource DropDown ([#5827](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5827))
- [Multiple Datasource] Add api registry and allow it to be added into client config in data source plugin ([#5895](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5895))
- [Multiple Datasource] Concatenate data source name with index pattern name and change delimiter to double colon ([#5907](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5907))
- [Multiple Datasource] Refactor client and legacy client to use authentication registry ([#5881](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5881))
- [Multiple Datasource] Improved error handling for the search API when a null value is passed for the dataSourceId ([#5882](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5882))
- [Multiple Datasource] Hide/Show authentication method in multi data source plugin based on configuration ([#5916](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5916))
- [Dynamic Configurations] Add support for dynamic application configurations ([#5855](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5855))
- [Multiple Datasource] Refactoring create and edit form to use authentication registry ([#6002](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6002))
- [Multiple Datasource] Handles auth methods from auth registry in DataSource SavedObjects Client Wrapper ([#6062](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6062))
- [Multiple Datasource] Expose a few properties for customize the appearance of the data source selector component ([#6057](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6057))
- [Multiple Datasource] Handle form values(request payload) if the selected type is available in the authentication registry ([#6049](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6049))
- [Multiple Datasource] Adds a session token to AWS credentials ([#6103](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6103))
- [Multiple Datasource] Add Vega support to MDS by specifying a data source name in the Vega spec ([#5975](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5975))
- [Multiple Datasource] Test connection schema validation for registered auth types ([#6109](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6109))
- [Multiple DataSource] DataSource creation and edition page improvement to better support registered auth types ([#6122](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6122))
- [Multiple Datasource] Export DataSourcePluginRequestContext at top level for plugins to use ([#6108](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6108))
- [Multiple Datasource] Improves connection pooling support for AWSSigV4 clients in data sources ([#6135](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6135))
- [Multiple Datasource] Add datasource version number to newly created data source object([#6178](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6178))
- Implement new home page ([#6065](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6065))
- Add sidecar service ([#5920](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5920))
- [Dynamic Configurations] Pass request headers when making application config calls ([#6164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6164))
- [Discover] Options button to configure legacy mode and remove the top navigation option ([#6170](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6170))
- [Multiple Datasource] Add default functionality for customer to choose default datasource ([#6058](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/6058))
- [Multiple Datasource] Add import support for Vega when specifying a datasource ([#6123](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6123))

### 🐛 Bug Fixes

- [BUG][Discover] Add key to index pattern options for support deplicate index pattern names([#5946](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5946))
- [Discover] Fix table cell content overflowing in Safari ([#5948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5948))
- [BUG][MD]Fix schema for test connection to separate validation based on auth type ([#5997](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5997))
- [Discover] Enable 'Back to Top' Feature in Discover for scrolling to top ([#6008](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6008))
- [BUG][Discover] Allow saved sort from search embeddable to load in Dashboard ([#5934](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5934))
- [osd/std] Add additional recovery from false-positives in handling of long numerals ([#5956](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5956), [#6245](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6245))
- [osd/std] Add fallback mechanism when recovery from false-positives in handling of long numerals fails ([#6253](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6253))
- [BUG][Multiple Datasource] Fix missing customApiRegistryPromise param for test connection ([#5944](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5944))
- [BUG][Multiple Datasource] Add a migration function for datasource to add migrationVersion field ([#6025](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6025))
- [BUG][MD]Expose picker using function in data source management plugin setup([#6030](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6030))
- [BUG][Multiple Datasource] Fix data source filter bug and add tests ([#6152](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6152))
- [BUG][Multiple Datasource] Validation succeed as long as status code in response is 200 ([#6399](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6399))

### 🚞 Infrastructure

- Add an achievement badger to the PR ([#3721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3721))
- Re-enable CI workflows for feature branches ([#2908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2908))
- [Tests] Add Github workflow for Test Orchestrator in FT Repo to run cypress tests within Dashboards repo ([#5725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5725))
- Upgrade yarn version to be compatible with @opensearch-project/opensearch ([#3443](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3443))

### 📝 Documentation

- Fix link to documentation for geoHash precision ([#5967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5967))
- [Doc] Add COMMUNICATIONS.md with info about Slack, forum, office hours ([#3837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3837))
- Add plugin development section in DEVELOPER_GUIDE.md ([#3989](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3989))

### 🛠 Maintenance

- Removes `minimatch` manual resolution ([#3019](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3019))
- Upgrade `vega-lite` dependency from `4.17.0` to `^5.6.0` ([#3076](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3076)). Backwards-compatible version included in v2.5.0 release.
- Bump `js-yaml` from `3.14.0` to `4.1.0` ([#3770](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3770))
- Bump `chromedriver` from `107.0.3` to `119.0.1` ([#5465](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5465))
- Bump `typescript` resolution from `4.0.2` to `4.6.4` ([#5470](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5470))
- Bump `chromedriver` dependency to `121.0.1"` ([#5926](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5926))
- [Console] Remove unused ul element and its custom styling ([#3993](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3993))
- Add @ruanyl as a maintainer ([#5982](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5982))
- Add @BionIT as a maintainer ([#5988](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5988))
- Move @kristenTian to emeritus maintainer ([#6136](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6136))
- Add @xinruiba as a maintainer ([#6217](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6217))

### 🔩 Tests

- Rename cypress config file to its version supported convention ([#6137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6137))

## [2.12.0 - 2024-02-20](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.12.0)

### 💥 Breaking Changes

### Deprecations

- Rename `withLongNumerals` to `withLongNumeralsSupport` in `HttpFetchOptions` [#5592](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5592)

### 🛡 Security

- Add support for TLS v1.3 ([#5133](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5133))
- [CVE-2023-45133] Bump all babel dependencies from `7.16.x` to `7.22.9` to fix upstream vulnerability ([#5428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5428))
- [CVE-2023-26159] Bump `follow-redirects` from `1.15.2` to `1.15.4` ([#5669](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5669))
- [CVE-2023-52079] Bump `msgpackr` from `1.9.7` to `1.10.1` ([#5803](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5803))
- [CVE-2020-8203] Bump `cheerio` from `0.22.0` to `1.0.0-rc.1` to fix vulnerable `lodash` dependency ([#5797](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5797))

### 📈 Features/Enhancements

- Add support for read-only mode through tenants ([#4498](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4498))
- Replace OuiSelect component with OuiSuperSelect in data-source plugin ([#5315](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5315))
- [Workspace] Add core workspace service module to enable the implementation of workspace features within OSD plugins ([#5092](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5092))
- [Decouple] Add new cross compatibility check core service which export functionality for plugins to verify if their OpenSearch plugin counterpart is installed on the cluster or has incompatible version to configure the plugin behavior([#4710](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4710))
- [Discover] Add long numerals support [#5592](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5592)
- [Discover] Display inner properties in the left navigation bar [#5429](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5429)
- [Discover] Added customizable pagination options based on Discover UI settings [#5610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5610)
- [PM] Enhance single version requirements imposed during bootstrapping ([#5675](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5675))
- [Custom Branding] Relative URL should be allowed for logos ([#5572](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5572))
- Revert to legacy discover table and add toggle to new discover table ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [Discover] Add collapsible and resizeable sidebar ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [Discover] Enhanced the data source selector with added sorting functionality ([#5719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5719))
- [Multiple Datasource] Add datasource picker component and use it in devtools and tutorial page when multiple datasource is enabled ([#5756](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5756))
- [Multiple Datasource] Add datasource picker to import saved object flyout when multiple data source is enabled ([#5781](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5781))

### 🐛 Bug Fixes

- Fix `maps.proxyOpenSearchMapsServiceInMaps` config definition so it can be set ([#5170](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5170))
- [Discover] Fix inactive state on 'Discover' tab in side navigation menu ([#5432](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5432))
- [BUG] Add platform "darwin-arm64" to unit test ([#5290](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5290))
- [BUG][Dev Tool] Add dev tool documentation link to dev tool's help menu [#5166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5166)
- Fix missing border for header navigation control on right ([#5450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5450))
- [BUG] Fix filtering issue in data source selector ([5484](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5484))
- [BUG][Data] Support for custom filters with heterogeneous data fields ([5577](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5577))
- [BUG][Data] Fix empty suggestion history when querying in search bar [#5349](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5349)
- [BUG][Discover] Fix what is displayed in `selected fields` when removing columns from canvas [#5537](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5537)
- [BUG][Discover] Fix advanced setting `discover:modifyColumnsOnSwitch` ([#5508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5508))
- [BUG][Discover] Show 0 filters when there are no active filters ([#5508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5508))
- [Discover] Fix missing index pattern field from breaking Discover [#5626](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5626)
- [BUG][Discover] Fix Discover table panel not adjusting its size automatically when the time range changes ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix issue where changing from a search with few results to a search with more results keeps the number of rows from the previous search ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix copying data from columns in Discover including extra data ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix no line wrapping when displaying fields in Discover datagrid ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix 'truncate:maxHeight' not working in Discover since 2.10.0 ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Fix UI glitch when mouseover Discover datagrid element ([#5789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5789))
- [BUG] Remove duplicate sample data as id 90943e30-9a47-11e8-b64d-95841ca0b247 ([5668](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5668))
- [BUG][Multiple Datasource] Fix datasource testing connection unexpectedly passed with wrong endpoint [#5663](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5663)
- [Table Visualization] Fix filter action buttons for split table aggregations ([#5619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5619))

### 🚞 Infrastructure

- [CI] Enable inputs for manually triggered Cypress test jobs ([#5134](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5134))
- [CI] Replace usage of deprecated `set-output` in workflows ([#5340](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5340))
- [Chore] Add `--security` for `opensearch snapshot` and `opensearch_dashboards` to configure local setup with the security plugin ([#5451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5451))
- [Chore] Updates default dev environment security credentials ([#5736](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5736))
- [Tests] Baseline screenshots for area and tsvb functional tests ([#5915](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5915))

### 📝 Documentation

- Remove ftr test step from PR template ([#5217](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5217))
- [Doc] Update EUI doc site links to point to OUI doc site ([#5293](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5293))
- Adds Developer Docs generation using Docsify to the repository ([#5977](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5977))

### 🛠 Maintenance

- Replace `node-sass` with `sass-embedded` ([#5338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5338))
- Bump `OUI` to `1.5.1` ([#5862](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5862))
- Add @SuZhou-Joe as a maintainer ([#5594](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5594))
- Move @seanneumann to emeritus maintainer ([#5634](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5634))
- Remove `ui-select` dev dependency ([#5660](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5660))

### 🪛 Refactoring

- [Home] Remove unused tutorials ([#5212](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5212))
- [UiSharedDeps] Standardize theme JSON imports to be light/dark-mode aware ([#5662](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5662))

### 🔩 Tests

- Update caniuse to `1.0.30001587` to fix failed integration tests ([#5886](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5886))
- [Home] Add more unit tests for other complications of overview ([#5418](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5418))

## [2.11.1 - 2023-11-21](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.11.1)

### 🛡 Security

- [CVE-2023-45133] Add package resolution for `@babel/traverse` to `7.23.2` to fix vulnerability ([#5309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5309))
- [CVE-2023-46234] Bump `eslint-import-resolver-webpack` from `0.11.1` to `0.13.8` and `browserify-sign` from `4.2.1` to `4.2.2` ([#5414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5414/))

### 📈 Features/Enhancements

### 🐛 Bug Fixes

- Fix navigation issue across dashboards ([#5435](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5435))
- [Discover] Fix table panel auto-sizing ([#5441](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5441))

### 🚞 Infrastructure

- [CI][Test] Add plugin functional tests on GitHub Actions ([#5383](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5383))

### 📝 Documentation

- Add Release Notes and update CHANGELOG.md for 2.11.1 ([#5486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5486))

### 🔩 Tests

### 🛠 Maintenance

## [2.11.0 - 2023-10-18](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.11.0)

### 🛡 Security

- [CVE-2022-25869] Remove AngularJS `1.8` ([#5086](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5086))

### 📈 Features/Enhancements

- [Console] Add support for JSON with long numerals ([#4562](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4562))
- [Data] Add `DataSource` service and `DataSourceSelector` for multiple datasource support ([#5167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5167))
- [Discover] Update embeddable for saved searches ([#5081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5081))

### 🐛 Bug Fixes

- Bump `agentkeepalive` to `4.5.0` to solve a problem preventing the use `https://ip` in `opensearch.hosts` ([#4949](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4949))
- [Data Explorer][Discover] Add `onQuerySubmit` to top nav and allow force update to embeddable ([#5160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5160))
- [Data Explorer][Discover] Automatically load default index pattern ([#5171](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5171))
- [Data Explorer][Discover] Fix total hits issue for no time based data ([#5087](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5087))
- [Data Explorer][Discover] Allow data grid to auto adjust size based on fetched data count ([#5191](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5191))
- [Data Explorer][Discover] Allow filter and query persist when refresh page or paste url to a new tab ([#5206](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5206))
- [Data Explorer][Discover] Fix misc navigation issues ([#5168](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5168))
- [Data Explorer][Discover] Fix mobile view ([#5168](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5168))
- [Table Visualization] Fix width of multiple tables when rendered in column view ([#4638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4638))
- [Table Visualization] Fix filter actions on data table vis cells ([#4837](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4837))
- [Vis Augmenter] Fix errors in conditions for activating `vizAugmenter` ([#5213](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5213))
- [Vis Augmenter] Fix `visAugmenter` forming empty key-value pairs in its calls to the `SavedObject` API ([#5190](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5190))
- [Data Explorer] Remove the `X` icon in data source selection field ([#5238](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5238))
- [BUG][Fuctional Test] Make setDefaultAbsoluteRange more robust and update doc views tests ([#5242](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5242))

### 🚞 Infrastructure

- [CI] Add `NODE_OPTIONS` and disable disk allocation threshold ([#5172](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5172))
- [CI] Supprt CI Groups for Cypress test jobs ([#5298](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5298))

### 🛠 Maintenance

- [Version] Version increment from 2.10 to 2.11 ([#4975](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4975))
- Remove angular html extractor ([#4680](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4680))
- Add @bandinib-amzn as maintainer ([#5113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5113))
- Add @bandinib-amzn to CODEOWNERS file. ([#5456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5456))

### 🔩 Tests

- [Functional][Doc Views] Remove angular code from `plugin_functional` and update tests ([#5221](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5221))
- [Unit][Data Explorer][Discover] Fix wrong test due to time conversion ([#5174](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5174))
- [Unit][Data Explorer][Discover]Fix `buildPointSeriesData` unit test fails due to local timezone ([#4992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4992))

## [2.10.0 - 2023-09-25](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.10.0)

### 🛡 Security

- Bump word-wrap from 1.2.3 to 1.2.4 ([#4589](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4589))
- Bump version of tinygradient from 0.4.3 to 1.1.5 ([#4742](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4742))
- Bump lmdb from 2.8.0 to 2.8.5 ([#4804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4804))
- Alias and bump mocha ([#4874](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4874))
- Remove examples and other unwanted artifacts from installed dependencies ([#4896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4896))

### 📈 Features/Enhancements

- [Vis colors] Update legacy mapped colors in charts plugin to use ouiPaletteColorBlind() ([#4398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4398))
- [Saved Objects Management] Add new or remove extra tags and styles ([#4069](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4069))
- Chore (home): Update visual consistency dashboard TSVB colors ([#4501](http://github.com/opensearch-project/OpenSearch-Dashboards/pull/4501))
- Feature (home): Update visual consistency sample dashboard with more vis ([#4581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4581))
- Add resource ID filtering in fetch augment-vis obj queries ([#4608](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4608))
- Enable theme-switching via Advanced Settings to preview the Next theme ([#4475](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4475))
- Feat (home): Add remaining vis type examples ([#4619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4619))
- Feat (Discover): Update styles to be compatible with next theme ([#4644](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4644))
- Update webpack environment targets ([#4649](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4649))
- [Table Visualization] Replace div containers with OuiFlex components ([#4272](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4272))
- Reduce the amount of comments in compiled CSS ([#4648](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4648))
- Feat (home): Remove color customizations from sample dashboards ([#4741](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4741))
- Remove visualization editor background ([#4719](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4719))
- Add saved objects service status api ([#4696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4696))
- Allow plugin manifest config to define semver compatible OpenSearch plugin and verify if it is installed on the cluster ([#4612](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4612))
- Eliminate duplicate dashboard breadcrumb text ID ([#4805](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4805))
- [@osd/pm] Automate multi-target bootstrap and build ([#4650](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4650))
- [Home] Add modal to introduce the `next` theme ([#4715](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4715))
- [Home] Add new theme sample dashboard screenshots ([#4906](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4906))
- Change color fn used to calculate icon colors for search typeahead suggestions ([#4884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4884))
- [Next Theme] Make next theme the default ([#4854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4854))
- [Vis Colors] Update color mapper to prioritize unique colors per vis ([#4890](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4890))
- [Advanced Settings] Consolidate settings into new "Appearance" category and add category IDs ([#4845](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4845))
- Adds Data explorer framework and implements Discover using it ([#4806](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4806))
- Use themes' definitions to render the initial view. This impacts the loading screen font and colors ([#4936](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4936))

### 🐛 Bug Fixes

- [VisLib] Replace legend color palette with OUI color palette ([#4365](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4365))
- Fix (styles): Make ace code editor themes consistent ([#4609](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4609))
- [i18n] fix generation scripts ([#4252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4252))
- Fix (Legacy Maps): Add necessary specificity for dark mode style overrides ([#4658](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4658))
- Fix --font-text CSS var usage and add more leaflet font overrides ([#4674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4674))
- Fix snapshots that didn't get updated between PRs ([#4863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4863))
- [BUG] Fix management overview page duplicate rendering ([#4636](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4636))
- Fixes broken app when management is turned off ([#4891](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4891))
- [CCI] Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))
- Correct the generated path for downloading plugins by their names on Windows ([#4953](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4953))

### 📝 Documentation

- Add missing 1.3.x patch release notes to 2.x branch ([#4771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4771))
- [Vis Augmenter] Add documentation to `vis_augmenter` plugin ([#4527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4527))

### 🛠 Maintenance

- Version increment from 2.9 to 2.10 ([#4545](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4545))
- Bump OpenSearch-Dashboards 2.10.0 to use nodejs 18.16.0 version ([#4948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4948))
- Bump `oui` to `1.3.0` ([#4941](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4941))
- Add @curq as maintainer ([#4760](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4760))
- Bump OpenSearch Dashboards to use nodejs v18.19.0 ([#4948](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5830))

### 🪛 Refactoring

- [Markdown] Replace custom css styles and native html with OUI ([#4390](http://github.com/opensearch-project/OpenSearch-Dashboards/pull/4390))
- Removed KUI usage in `maps_legacy` plugin ([#3998](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3998))
- [Console] Converted all `/lib/autocomplete/**/*.js` files to typescript ([#4148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4148))
- [Console] Convert all non-autocomplete lib files to typescript ([#4150](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4150))
- Refactor/remove breadcrumb styling main ([#4621](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4621))
- Bump `node-sass` to a version that uses a newer `libsass` ([#4651](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4651))
- [Dashboards] restructure folder to be more cohesive with the project ([#4575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4575))
- Remove minimum constraint on opensearch hosts ([#4701](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4701))
- [CCI] Remove unused tags in the navigation plugin ([#3964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3964))
- Refactor logo usage ([#4702](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4702))
- [Markdown] Replace custom CSS styles and HTML markup with OUI components ([#4390](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4390))
- Fix EUI/OUI type errors ([#3798](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3798))

### 🔩 Tests

- [CI] Fix BWC related CI failures by swapping dist url with snapshot url ([#4828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4828))
- [Dashboard De-Angular] Add unit tests for `dashboard_listing` and `dashboard_top_nav` ([#4640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4640))
- [Tests] Add BWC tests for 2.9 and 2.10 versions ([#4762](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4762))
- [Stylelint] Add `no_restricted_values` linter rule ([#4413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4413))
- Units test for utils folder ([#4641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4641))
- Test (linkchecker): Exclude checking dead link ([#4720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4720))
- Update baseline images for functional tests ([#4879](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4879))

## [1.3.13 - 2023-09-21](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.13)

### 🛡 Security

- [CVE-2019-11358] Bump version of `tinygradient` from `0.4.3` to `1.1.5` ([#4571](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4751))
- [CVE-2023-26136] Bump `word-wrap` from `1.2.3` to `1.2.4` ([#5002](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5002))
- [CVE-2022-21670] Bump `markdown-it` from `10.0.0` to `12.3.2` ([#5016](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5016))
- [CVE-2022-33987] Partially fix security issues for `got` by bumping `@elastic/makelogs` from `6.0.0` to `6.1.1` and updating yarn.lock ([#5006](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5006))
- Bump `yo` from `2.0.6` to `3.1.1` ([#5005]( https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5005))
- [CVE-2023-0842] Bump `xml2js` from `0.4.22` to `0.6.2` ([#5024](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5024))

### 📈 Features/Enhancements

### 🐛 Bug Fixes

### 🚞 Infrastructure

### 📝 Documentation

### 🛠 Maintenance

- [Version] Increment version to 1.3.13 ([#4721](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4721))
- [Chore] Add company.net to exclusion list in linkchecker ([#4704](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4704))
- [Chore] Exclude checking dead link in linkchecker ([#4868](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4868))

## [1.3.12 - 2023-08-10](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.12)

### 🛡 Security

- [CVE-2021-23382] Bump postcss from `8.2.10` to `8.4.24` ([#4403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4403))
- Bump `joi` to v14 to avoid the possibility of prototype poisoning in a nested dependency ([#3952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3952))
- [WS-2018-0347] Bump `sass-lint` from `1.12.1` to `1.13.0` to fix `eslint` security issue ([#4338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4338))
- [CVE-2022-25883] Resolve `semver` to `7.5.3` and remove unused package ([#4411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4411), [#4686](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4686))
- [CVE-2022-1537] Bump grunt from `1.4.1` to `1.5.3` ([#3723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3723))
- [CVE-2022-0436] Bump grunt from `1.4.1` to `1.5.3` ([#3723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3723))
- [CVE-2023-26136] Resolve `tough-cookie` to `4.1.3` ([#4682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4682))

### 📈 Features/Enhancements

### 🐛 Bug Fixes

### 🚞 Infrastructure

### 📝 Documentation

- added js documentation and a readme file to files in utils folder ([#5540])(https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5540/)

### 🛠 Maintenance

- Adding @ZilongX and @Flyingliuhub as maintainers. ([#4137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4137))
- Add new MAINTAINERS to CODEOWNERS file. ([#4199](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4199))
- Adding @BSFishy as maintainer. ([#4469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4469))
- [Version] Increment version to 1.3.12 ([#4656](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4656))

## [2.9.0 - 2023-07-24](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.9.0)

### 🛡 Security

- Bump `joi` to v14 to avoid the possibility of prototype poisoning in a nested dependency ([#3952](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3952))
- [CVE-2022-25883] Resolve `semver` to `7.5.3` and remove unused package ([#4411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4411))
- Bump tough-cookie from 4.0.0 to 4.1.3 ([#4531](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4531))

### 📈 Features/Enhancements

- Add plugin manifest config to define OpenSearch plugin dependency and verify if it is installed on the cluster ([#3116](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3116))
- Replace re2 with RegExp in timeline and add unit tests ([#3908](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3908))
- Hide any output from use_node checking for Node compatibility ([#4237](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4237))
- Add category option within groups for context menus ([#4144](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4144))
- [Saved Object Service] Add Repository Factory Provider ([#4149](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4149))
- [Sample Data] Add visual consistency dashboard to sample logs data ([#4339](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4339), [#4619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4619))
- [@osd/pm] Fix `file:`-linked dependencies' resolution to improve ability to test with local packages ([#4342](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4342))
- [Multiple DataSource] Backend support for adding sample data ([#4268](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4268))
- Add configurable defaults and overrides to uiSettings ([#4344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4344))
- Update header logo selection logic to match the header's theme ([#4383](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4383))
- Introduce new fonts for the Next theme ([#4381](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4381))
- Bump OUI to `1.1.2` to make `anomalyDetection` icon available ([#4408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4408))
- Add `color-scheme` to the root styling ([#4477](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4477))
- [Multiple DataSource] Frontend support for adding sample data ([#4412](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4412))
- Enable plugins to augment visualizations with additional data and context ([#4361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4361))
- Dashboard De-Angularization ([#4502](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4502))
- New management overview page and rename stack management to dashboard management ([#4287](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4287))
- [Console] Add support for JSON with long numerals ([#4562](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4562))
- [Vis Augmenter] Update base vis height in view events flyout ([#4535](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4535))
- [Dashboard De-Angular] Add more unit tests for utils folder ([#4641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4641))
- [Dashboard De-Angular] Add unit tests for dashboard_listing and dashboard_top_nav ([#4640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4640))
- Optimize `augment-vis` saved obj searching by adding arg to saved obj client ([#4595](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4595))
- Change SavedObjects' Import API to allow selecting a data source when uploading files ([#5777](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5777))

### 🐛 Bug Fixes

- [Chore] Update deprecated url methods (url.parse(), url.format()) ([#2910](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2910))
- Cleanup unused url ([#3847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3847))
- Fix `i18n` generation scripts ([#4252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4252))
- [Saved Objects Management] Fix relationships header overflow ([#4070](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4070))
- Update main menu to display 'Dashboards' for consistency ([#4453](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4453))
- [Multiple DataSource] Retain the original sample data API ([#4526](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4526))
- Remove `lmdb-store` to fix backport issue ([#4266](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4266))
- Fix Node.js download link ([#4556](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4556))

### 🚞 Infrastructure

- Upgrade the backport workflow ([#4343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4343))
- [Lint] Add custom stylelint rules and config to prevent unintended style overrides ([#4290](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4290))
- [Lint] Add stylelint rule to define properties that are restricted from being used ([#4374](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4374))
- [Lint] Add stylelint rule to define values that are restricted from being used ([#4413](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4413))
- [Lint] Add typing to Stylelint rules ([#4392](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4392))
- [CI] Split build and verify into parallel jobs ([#4467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4467))

### 📝 Documentation

- [Saved Object Service] Adds design doc for new Saved Object Service Interface for Custom Repository [#3954](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3954)

### 🛠 Maintenance

- Adding @ZilongX and @Flyingliuhub as maintainers. ([#4137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4137))
- Add new MAINTAINERS to CODEOWNERS file. ([#4199](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4199))
- Adding @BSFishy as maintainer. ([#4469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4469))

### 🪛 Refactoring

- [Table Visualization] Remove custom styling for text-align:center in favor of OUI utility class. ([#4164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4164))
- [Table Visualization] Replace div containers with OuiFlex components ([#4272](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4272))
- Migrate from legacy elasticsearch client to opensearch-js client in `osd-opensearch-archiver` package([#4142](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4142))
- Replace the use of `bluebird` in `saved_objects` plugin ([#4026](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4026))
- Relocate tutorials imagery into `src/plugins/home/public/assets/tutorials/logos` ([#4382](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4382))
- [VisBuilder] Use OUI icon ([#4446](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4446))
- [Vis Colors] [Region Maps] Replace hardcode color to OUI color in `region_map` plugin ([#4299](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4299))
- [Vis Colors] Replace color maps with OUI color palettes ([#4293](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4293))
- [Vis Colors] [Maps] Replace hardcoded color to OUI color in `maps_legacy` plugin ([#4294](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4294))
- [Vis Colors] [TSVB] Update default color in `vis_type_timeseries` to use `ouiPaletteColorBlind()[0]`([#4363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4363))
- [Vis Colors] [Timeline] Replace `vis_type_timeline` colors with `ouiPaletteColorBlind()` ([#4366](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4366))
- [Vis Colors] Update legacy seed colors to use `ouiPaletteColorBlind()` ([#4348](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4348))
- [Console] Migrate `/lib/mappings/` module to TypeScript ([#4008](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4008))
- [Console] Migrate `/lib/autocomplete/` module to TypeScript ([#4148](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4148))
- [Dashboard] Restructure the `Dashboard` plugin folder to be more cohesive with the project ([#4575](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4575))
- [Chrome] Remove breadcrumb style overrrides ([#4621](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4621))
- Replace tinymath with math.js ([#4492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4492))

### 🔩 Tests

- [Vis Augmenter Add UT for few fns ([#4516](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4516))
- [BWC Tests] Add BWC tests for 2.7.0 and 2.8.0 ([#4023](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4023))

## [1.3.11 - 2023-06-29](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.11)

### 🛡 Security

- [CVE-2022-1537] Bump grunt from `1.5.2` to `1.5.3` ([#4276](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4276))
- [CVE-2020-15366] Bump ajv from `4.11.8` to `6.12.6` ([#3769](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3769))

### 📈 Features/Enhancements

### 🐛 Bug Fixes

### 🚞 Infrastructure

- Upgrade the backport workflow ([#4343](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4343))

### 📝 Documentation

### 🛠 Maintenance

## [2.8.0 - 2023-06-06](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.8.0)

### Deprecations

- Remove timeline application ([#3971](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3971))

### 🛡 Security

- [CVE-2023-2251] Bump `yaml` to `2.2.2` ([#3947](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3947))

### 📈 Features/Enhancements

- [Multiple Datasource] Support Amazon OpenSearch Serverless ([#3957](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3957))
- Add support for Node.js >=14.20.1 <19 ([#4071](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4071))
- Bundle Node.js 14 as a fallback for operating systems that cannot run Node.js 18 ([#4151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4151))
- Enhance grouping for context menus ([#3924](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3924))

### 🐛 Bug Fixes

- [BUG] Fix bottom bar visibility using createPortal ([#3978](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3978))
- [Dashboards Listing] Fix listing limit to utilize `savedObjects:listingLimit` instead of `savedObjects:perPage` ([#4021](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4021))

### 🚞 Infrastructure

- Install chrome driver for functional tests from path set by environment variable `TEST_BROWSER_BINARY_PATH`([#3997](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3997))
- Add threshold to code coverage config to prevent workflow failures ([#4040](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4040))
- [CI] Skip checksum verification on OpenSearch snapshot for cypress tests ([#4188](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4188))

### 📝 Documentation

### 🛠 Maintenance

- Use `exec` in the CLI shell scripts to prevent new process creation ([#3955](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3955))

### 🪛 Refactoring

### 🔩 Tests

## [1.3.10 - 2023-05-18](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.7.0)

### 🛡 Security

- [CVE-2020-15366][1.x] Bump ajv from 4.11.8 to 6.12.6 ([#4035](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4035))
- [CVE-2022-48285][1.x] Bump jszip from 3.7.1 to 3.10.1 ([#4011](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4011))
- [CVE-2021-35065][1.x] Bump glob-parent from 6.0.0 to 6.0.2 ([#4005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4005))
- [CVE-2022-25851][1.x] Bump jpeg-js from 0.4.1 to 0.4.4 ([#3860](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3860))
- [CVE-2022-25858][1.x] Bump terser from 4.8.0 to 4.8.1 ([#3786](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3786))
- [CVE-2021-23490][1.x] Bump parse-link-header from 1.0.1 to 2.0.0 ([#3820](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3820))
- [CVE-2021-3765][1.x] Bump validator from 8.2.0 to 13.9.0 ([#3753](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3753))
- [CVE-2022-25758][1.x] Bump scss-tokenizer from 0.3.0 to 0.4.3 ([#3789](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3789))
- [CVE-2021-3803][1.x] Bump nth-check from 1.0.2 to 2.0.1 ([#3745](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3745))
- Bump highlight.js from 9.18.5 to 10.7.3 to solve security concerns （[#4062](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4062))

### 📈 Features/Enhancements

- Add tooltip to help icon ([#3872](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3872))

### 🐛 Bug Fixes

### 📝 Documentation

- Update jest documentation links ([#3939](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3939))

### 🛠 Maintenance

- Add threshold to code coverage changes for project ([#4050](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4050))
- Temporarily hardcode chromedriver to 112.0.0 to enable all ftr tests ([#4039](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4039))
- Update MAINTAINERS.md and CODEOWNERS ([#3938](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3938))
- Add opensearch-dashboards-docker-dev to .gitignore ([#3781](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3781))

### 🪛 Refactoring

### 🔩 Tests

## [2.7.0 - 2023-05-02](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.7.0)

### Deprecations

### 🛡 Security

- [CVE-2023-26486] Bump vega from `5.22.1` to `5.23.0` ([#3533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3533))
- [CVE-2023-26487] Bump vega from `5.22.1` to `5.23.0` ([#3533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3533))
- [CVE-2023-0842] Bump xml2js from `0.4.23` to `0.5.0` ([#3842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3842))
- [Multi DataSource] Add private IP blocking validation on server side ([#3912](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3912))

### 📈 Features/Enhancements

- Add satisfaction survey link to help menu ([#3676](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3676))
- Add `osd-xsrf` header to all requests that incorrectly used `node-version` to satisfy XSRF protection ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Dashboard] Add Dashboards-list integrations for Plugins ([#3090](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3090) )
- [Data] Add geo shape filter field ([#3605](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3605))
- [Doc Links] Add downgrade logic for branch in DocLinkService ([#3483](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3483))
- [Monaco editor] Add json worker support ([#3424](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3424))
- [Multiple DataSource] Allow create and distinguish index pattern with same name but from different datasources ([#3604](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3604))
- [Multiple DataSource] Integrate multiple datasource with dev tool console ([#3754](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3754))
- [Navigation] Remove unused tags ([#3964](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3964))
- [Notifications] Add id to toast api for deduplication ([#3752](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3752))
- [UI] Add support for comma delimiters in the global filter bar ([#3686](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3686))
- [UI] Indicate that IE is no longer supported ([#3641](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3641))
- [Vega] Add Filter custom label for opensearchDashboardsAddFilter ([#3640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3640))
- [VisBuilder] Add metric to metric, bucket to bucket aggregation persistence ([#3495](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3495))
- [VisBuilder] Add UI actions handler ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Add persistence to visualizations inner state ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))
- [Console] Add support for exporting and restoring commands in Dev Tools ([#3810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3810))

### 🐛 Bug Fixes

- Clean up and rebuild `@osd/pm` ([#3570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3570))
- Omit adding the `osd-version` header when the Fetch request is to an external origin ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Console] Fix/update documentation links in Dev Tools console ([#3724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3724))
- [Console] Fix dev tool console autocomplete not loading issue ([#3775](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3775))
- [Console] Fix dev tool console run command with query parameter error ([#3813](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3813))
- [Table Visualization] Fix table rendering empty unused space ([#3797](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3797))
- [Table Visualization] Fix data table not adjusting height on the initial load ([#3816](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3816))
- [Timeline] Fix y-axis label color in dark mode ([#3698](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3698))
- [TSVB] Fix undefined serial diff aggregation documentation link ([#3503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3503))
- [UI] Add clarifying tooltips to header navigation icons ([#3626](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3626))
- [VisBuilder] Fix multiple warnings thrown on page load ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix Firefox legend selection issue ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix type errors ([#3732](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3732))
- [VisBuilder] Fix indexpattern selection in filter bar ([#3751](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3751))
- [Console] Fix dev tool console autocomplete not loading issue for aliases ([#5568](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5568))

### 🚞 Infrastructure

- Use mirrors to download Node.js binaries to escape sporadic 404 errors ([#3619](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3619))
- [CI] Update NOTICE file, add validation to GitHub CI ([#3051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3051))
- [CI] Reduce redundancy by using matrix strategy on Windows and Linux workflows ([#3514](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3514))
- [Darwin] Add support for Darwin for running OpenSearch snapshots with `yarn opensearch snapshot` ([#3537](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3537))

### 📝 Documentation

- Correct copyright date range of NOTICE file and notice generator ([#3308](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3308))
- Simplify the in-code instructions for upgrading `re2` ([#3328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3328))
- [Doc] Improve DEVELOPER_GUIDE to make first time setup quicker and easier ([#3421](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3421))
- [Doc] Update DEVELOPER_GUIDE with added manual bootstrap timeout solution and max virtual memory error solution with docker ([#3764](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3764))
- [Doc] Add second command to install yarn step in DEVELOPER_GUIDE ([#3633](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3633))
- [Doc] Add docker dev set up instruction ([#3444](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3444))
- [Doc] Add docker files and instructions for debugging Selenium functional tests ([#3747](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3747))
- [Doc] Update SECURITY with instructions for nested dependencies and backporting ([#3497](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3497))
- [TSVB] Fix typo in TSVB README ([#3518](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3518))
- [UI Actions] Improve UI actions explorer ([#3614](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3614))

### 🛠 Maintenance

- Relax the Node.js requirement to `^14.20.1` ([#3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Bump the version of Node.js installed by `nvm` to `14.21.3` ([#3463](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3463))
- Allow selecting the Node.js binary using `NODE_HOME` and `OSD_NODE_HOME` ([#3508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3508))
- Remove the unused `renovate.json5` file ([#3489](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3489))
- Bump `styled-components` from `5.3.5` to `5.3.9` ([#3678](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3678))
- [Timeline] Update default expressions from `.es(*)` to `.opensearch(*)`. ([#2720](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2720))

### 🪛 Refactoring

- Remove automatic addition of `osd-version` header to requests outside of OpenSearch Dashboards ([#3643](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3643))
- [Console] Replace jQuery usage in console plugin with native methods ([#3733](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3733))
- [Doc Links] Clean up docs_link_service organization so that strings are in the right categories. ([#3685](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3685))
- [I18n] Fix Listr type errors and error handlers ([#3629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3629))
- [Multiple DataSource] Refactor dev tool console to use opensearch-js client to send requests ([#3544](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3544))
- [Multiple DataSource] Present the authentication type choices in a drop-down ([#3693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3693))
- [Table Visualization] Move format table, consolidate types and add unit tests ([#3397](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3397))

### 🔩 Tests

- Update caniuse to `1.0.30001460` to fix failed integration tests ([#3538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3538))
- [Tests] Fix unit tests for `get_keystore` ([#3854](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3854))
- [BWC Tests] Add BWC tests for 2.7.0 and 2.8.0 ([#4023](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4023))

## [1.3.9 - 2023-04-04](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.9)

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

## [2.6.0 - 2023-02-28](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.6.0)

### Deprecations

- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from `4.1.1` to `5.0.2` ([#3419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3419)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).

### 🛡 Security

- [CVE-2022-37599] Bump loader-utils from `2.0.3` to `2.0.4` ([#3318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3318))
- [CVE-2022-37603] Bump loader-utils from `2.0.3` to `2.0.4` ([#3318](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3318))
- [CVE-2022-25860] Bump simple-git from `3.15.1` to `3.16.0` ([#3345](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3345))
- [CVE-2022-25881] Resolve http-cache-semantics from `4.1.0` to `4.1.1` ([#3409](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3409))
- [Security] Bump hapi/statehood from `7.0.3` to `7.0.4` ([#3411](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3411))
- [CVE-2023-25166] Bump formula from `3.0.0` to `3.0.1` ([#3416](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3416))
- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from `4.1.1` to `5.0.2` ([#3419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3419)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).
- [CVE-2023-25653] Bump node-jose from `2.1.1` to `2.2.0` ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2022-24999] Resolve qs from `6.5.3` to `6.11.0` ([#3450](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3450))
- [CVE-2022-25758] Bump node-sass from `6.0.1` to `7.0.3` and sass-loader from `10.2.1` to `10.4.1` to bump scss-tokenizer from `0.2.3` to `0.4.3` ([#3455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3455))
- [CVE-2020-24025] Bump node-sass from `6.0.1` to `7.0.3` ([#3455](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3455))

### 📈 Features/Enhancements

- Add disablePrototypePoisoningProtection configuration to prevent JS client from erroring when cluster utilizes JS reserved words ([#2992](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2992))
- [Multiple DataSource] Add support for SigV4 authentication ([#3058](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3058))
- [Multiple DataSource] Refactor test connection to support SigV4 auth type ([#3456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3456))

### 🐛 Bug Fixes

- [Search Telemetry] Fix search telemetry's observable object that won't be GC-ed([#3390](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3390))
- [Region Maps] Add ui setting to configure custom vector map's size parameter([#3399](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3399))
- [Import API] Fix import saved objects always display overwritten issue([#5861](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5871))


### 🚞 Infrastructure

- Fix detection of Chrome's version on Darwin during CI ([#3296](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3296))

### 📝 Documentation

- [Docs] Fix documentation link for date math ([#3207](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3207))

### 🛠 Maintenance

- Bump `re2` and `supertest` ([#3018](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3018))
- Upgrade vega-tooltip to `0.30.0` to support custom tooltips ([#3359](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3359))
- Allow relaxing the Node.js runtime version requirement ([#3402](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3402))
- Make build scripts find and use the latest version of Node.js that satisfies `engines.node` ([#3467](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3467))
- Add `@opensearch-project/opensearch@^2.x` as dependency aliased as `@opensearch-project/opensearch-next` ([#3469](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3469))

### 🪛 Refactoring

### 🔩 Tests

- [BWC Tests] Add BWC tests for `2.6.0` ([#3356](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3356))
- Prevent primitive linting limitations from being applied to unit tests found under `src/setup_node_env` ([#3403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3403))

## [1.3.8 - 2023-02-15](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.8)

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

## [2.5.0 - 2023-01-25](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.5.0)

### 🛡 Security

- Introduce guidelines for reporting vulnerable dependencies ([#2674](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2674))
- Bump decode-uri-component from 0.2.0 to 0.2.2 ([3009](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3009))
- [CVE-2022-25912] Bump simple-git from 3.4.0 to 3.15.0 ([#3036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3036))
- [CVE-2022-35256] Bump node version from 14.20.0 to 14.20.1 [#3166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3166))
- [CVE-2022-46175] Bump json5 version from 1.0.1 and 2.2.1 to 1.0.2 and 2.2.3 ([#3201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3201))

### 📈 Features/Enhancements

- [CLI] Enhance `yarn opensearch snapshot` to facilitate installing plugins on an OpenSearch cluster ([#2734](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2734))
- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))
- [Multi DataSource] Introduce validation of new or modified connections to external data sources ([#2973](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2973), [#3110](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3110))
- [VisBuilder] Create global data persistence for VisBuilder ([#2896](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2896))
- [VisBuilder] Introduce Redux store persistence ([#3088](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3088))
- [VisBuilder] Enable persistence for app filter and query without using state containers ([#3100](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3100))
- [Data] Make the newly created configurations get added to beginning of the `aggConfig` array when using `createAggConfig` ([#3160](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3160))
- [Optimizer] Increase the amount of time an optimizer worker is provided to exit before throwing an error ([#3193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3193))

### 🐛 Bug Fixes

- Upgrade the `del` library to fix a race condition on macOS ([#2847](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2873))
- [Table Visualization] Fix a problem with table visualizations that prevented URLs from being rendered correctly ([#2918](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2918))
- [Embeddable] Fix a misleading error message ([#3043](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3043))
- Fix rendering issues when the obsolete `v8 (beta)` theme was carried over by an upgrade ([#3045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3045))
- [Multi Datasource] Replace the mock URL in tests ([#3099](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3099))
- [CI] Increase Yarn's timeout for installing dependencies in workflows ([#3118](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3118))
- [VisBuilder] Fix an issue that caused a crash when certain filters were added to a table visualization ([#3210](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3210))
- [VisBuilder] Fix errors throws when pipeline aggregations, like cumulative sum, were used in VisBuilder ([#3137](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3137))
- [Region Maps] Fix the problem of join fields being unusable ([#3213](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3213))
- [Multi DataSource] Update test connection button text ([#3247](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3247))

### 🚞 Infrastructure

- Bump the version of the `2.x` branch to 2.5.0 ([#2884](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2884))
- [CI] Create workflows that test and build on Windows ([#2966](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2966))
- [CI] Automate ChromeDriver installation for running functional tests ([#2990](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2990))
- Create the Release Notes for the 1.3.7 release ([#3066](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3066))
- [CI] Improve workflows by retaining Yarn's cache folder ([#3194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3194))

### 📝 Documentation

- Publish the release runbook ([#2533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2533))
- Document the capabilities of the Charts plugin and its current usage ([#2695](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2695))
- Document the correct version selection switch in `@osd/plugin-helpers` ([#2810](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2810))
- Document the global query persistence ([#3001](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3001))
- Document data persistence for plugins ([#3081](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3081))
- Document telemetry services ([#6020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6020))

### 🪛 Refactoring

- [VisBuilder] Extend the use of i18n ([#2867](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2867))
- [Console] Switch to using `core.http` when calling OSD APIs in console ([#3080](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3080))
- [Table Visualization] Refactor table visualization using React and DataGrid component ([#2863](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2863))

### 🛠 Maintenance

- Remove an unused dependency on `github-checks-reporter` ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- Introduce `vega-lite@5`, aliased as `vega-lite-next` ([#3151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3151))

### 🔩 Tests

- Enable retrying of flaky tests ([#2967](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2967))
- Enhance cross-platform testing of plugin installation on cluster snapshots ([#2994](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2994))
- [Tests] Bump `chromedriver` to v107 ([#3017](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3017))
- [CI] Disable the execution of the Build and Test workflow when the changes are limited to the docs folder ([#3197](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3197))
- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))
- [VisBuilder] Create unit tests for field utilities ([#3211](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3211))

## [2.4.1 - 2022-12-14](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.4.1)

### 🐛 Bug Fixes

- Update `leaflet-vega` and fixed its usage ([#3005](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3005))

### 🔩 Tests

- Correct the linting logic for `no-restricted-path` to ignore trailing slashes ([#3020](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3020))

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

## [2.4.0 - 2022-11-15](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/2.4.0)

### 🛡 Security

- Bump percy-agent to use non-beta version ([#2415](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2415))
- Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
- [CVE-2022-33987] Bump makelogs to remove dependency on got ([#2801](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2801))
- [CVE-2022-33987] Upgrade geckodriver to 3.0.2 ([#2166](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2166))
- [CVE-2022-3517] Bump minimatch to 3.0.5 and [IBM X-Force ID: 220063] unset-value to 2.0.1 ([#2640](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2640))
- [CVE-2022-37601] Bump loader-utils to 2.0.3 ([#2706](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2706))
- [GMS-2022-4708] Resolve sub-dependent d3-color version and potential security issue ([#2454](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2454))
- [Legacy Maps] Prevent reverse-tabnabbing ([#2540](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2540))
- [WS-2022-0284] [WS-2022-0280] Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))
- [Multi DataSource] Prevent spell-checking the password fields ([#2818](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2818))

### 📈 Features/Enhancements

- Add DataSource service and DataSourceSelector for multiple datasource support ([#5167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/5167))
- Add extension point in saved object management to register namespaces and show filter ([#2656](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2656))
- Add updated_at column to Saved Objects' tables ([#1218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1218))
- Change the links in the visualize plugin to use `href` rather than `onClick` ([#2395](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2395))
- Improve Discover field summaries ([#2391](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2391))
- Remove Add Integration button ([#2723](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2723))
- [Multi DataSource] Add data source column into index pattern table ([#2542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2542))
- [Multi DataSource] Add data source config to opensearch-dashboards-docker ([#2557](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2557))
- [Multi DataSource] Add data source signing support ([#2510](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2510))
- [Multi DataSource] Add experimental callout for index pattern section ([#2523](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2523))
- [Multi DataSource] Address UX comments on Data source list and create page ([#2625](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2625))
- [Multi DataSource] Apply get indices error handling in step index pattern ([#2652](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2652))
- [Multi DataSource] Display error toast for create index pattern with data source ([#2506](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2506))
- [Multi DataSource] Make text content dynamically translated & update unit tests ([#2570](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2570))
- [Multi DataSource] Support legacy client for data source ([#2204](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2204))
- [Multi DataSource] UX enhancement on Data source management creation page ([#2051](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2501))
- [Multi DataSource] UX enhancement on Data source management stack ([#2521](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2521))
- [Multi DataSource] UX enhancement on Index Pattern management stack ([#2505](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2505))([#2527](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2527))
- [Multi DataSource] UX enhancement on Update stored password modal for Data source management stack ([#2532](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2532))
- [Plugin Helpers] Facilitate version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398))
- [VisBuilder] Add an experimental table visualization in vis builder ([#2705](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2705))
- [VisBuilder] Add field summary popovers ([#2682](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2682))
- [VisBuilder] Add index pattern info when loading embeddable ([#2363](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2363))
- [VisBuilder] Add state validation before dispatching and loading ([#2351](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2351))
- [VisBuilder] Change VisBuilder flag for docker config ([#2804](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2804))
- [VisBuilder] Change classname prefix wiz to vb ([#2581](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2581/files))
- [VisBuilder] Change save object type, wizard id and name to visBuilder ([#2673](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2673))
- [VisBuilder] Change wizard to vis_builder in file names and paths ([#2587](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2587))
- [VisBuilder] Create a new wizard directly on a dashboard ([#2384](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2384))
- [VisBuilder] Edit wizard directly on dashboard ([#2508](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2508))
- [VisBuilder] Enable VisBuilder by default ([#2725](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2725))
- [VisBuilder] Rename wizard on save modal and visualization table ([#2645](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2645))
- [VisBuilder] Rename wizard to visBuilder in class name, type name and function name ([#2639](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2639))
- [VisBuilder] Rename wizard to visBuilder in i18n id and formatted message id ([#2635](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2635))
- [Windows] Add cross-platform helpers ([#2681](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2681))
- [Windows] Consume `@osd/cross-platform` package to standardize path handling across platforms ([#2703](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2703))
- [Windows] Facilitate building and running OSD and plugins on Windows platforms ([#2601](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2601))

### 🐛 Bug Fixes

- Fix management app breadcrumb error ([#2344](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2344))
- Fix suggestion list cutoff issue ([#2607](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2607))
- Remove Leftover X Pack references ([#2638](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2638))
- [Multi DataSource] Add data source param to low-level search call in Discover ([#2431](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2431))
- [Multi DataSource] Address UX comments on Edit Data source page ([#2629](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2629))
- [Multi DataSource] Address UX comments on index pattern management stack ([#2611](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2611))
- [Multi DataSource] Enhance data source error handling ([#2661](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2661))
- [Multi DataSource] Skip data source view in index pattern step when default is chosen ([#2574](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2574))
- [Multi DataSource] Update default audit log path ([#2793](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2793))
- [Save Object Aggregation View] Fix for export all after scroll count response changed ([#2696](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2696))
- [VisBuilder] Add additional aggregation parameters to Vislib charts (Bar, Line and Area) ([#2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [VisBuilder] Add missing test subject property of `DisabledVisualization` ([#2610](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2610))
- [VisBuilder] Fix Date Histogram auto bounds showing per 0 millisecond ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix Histogram updating bounds when date range updates ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix auto bounds for time-series bar chart visualization ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [VisBuilder] Fix broken UX after switching index pattern while editing an aggregation ([#2632](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2632))
- [VisBuilder] Fix rendering issues with time series for new chart types ([#2309](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2309))
- [VisBuilder] Fix the missing `Last Updated` timestamp in visualization list ([#2628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2628))
- [VisBuilder] Fix visualization shift when editing an aggregation ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [VisBuilder] Rename "Histogram" to "Bar" in visualization type picker ([2401](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2401))
- [Table Visualization] Fix an issue preventing sorting the first column ([#2828](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2828))
- Temporary workaround for task-kill exceptions on Windows when it is passed a pid for a process that is already dead ([#2842](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2842))

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Update WhiteSource scans to ignore Backward Compatibility artifacts in `cypress` ([#2408](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2408))
- [CI] Add Backward Compatibility tests for 2.4.0 ([#2393](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2393))
- [CI] Add path ignore for markdown files ([#2312](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2312))
- [CI] Prevent backport workflow from running on unmerged PRs ([#2746](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2746))
- [CI] Run functional test repo as workflow ([#2503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2503))
- [CI] Update backport custom branch name ([#2766](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2766))
- [CI] Update backport workflow to ignore changelog conflicts ([#2729](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2729))

### 📝 Documentation

- Add CHANGELOG.md and Release Notes for 2.4.0 ([#2809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2809))
- Add README.md for `dataSource` and `dataSourceManagement` plugins ([#2448](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2448))
- Add README.md for saving index pattern relationship ([#2276](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2276))
- Remove a repeated "to" from the README.md file ([#2403](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2403))
- Update functional testing information in TESTING.md ([#2492](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2492))
- [Multi DataSource] Add design documents of multiple data source feature [#2538](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2538)
- [Multi DataSource] Add sample configuration for multi data source to the yml template ([#2428](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2428))
- [Multi DataSource] Tweak multiple data source design doc ([#2724](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2724))
- [Multi DataSource] Update MD data source documentation link ([#2693](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2693))

### 🔩 Tests

- Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))
- [Multi DataSource] Add unit test coverage for Update Data source management stack ([#2567](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2567))
- [VisBuilder] Enable VisBuilder cypress tests ([#2728](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2728))

### 🛠 Maintenance

- Add @zengyan-amazon as a maintainer ([#2419](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2419))
- Increment from 2.3 to 2.4. ([#2295](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295))
- Add CHANGELOG.md for 2.4.0 ([#2809](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2809))

## [1.3.6 - 2022-10-06](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/1.3.6)

### 🛡 Security

- [CVE-2021-3807] Resolves ansi-regex to v5.0.1 ([#2425](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2425))
- [CVE-2022-23713] Handle invalid query, index and date in vega charts filter handlers ([#1932](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1932))
- Use a forced CSP-compliant interpreter with Vega visualizations ([#2352](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2352))
- Bump moment-timezone from 0.5.34 to 0.5.37 ([#2361](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2361))

### 📈 Features/Enhancements

- Custom healthcheck with filters ([#2232](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2232), [#2277](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2277)). To configure see example in [config/opensearch_dashboards.yml](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/6e2ec97459ae179c86201c611ce744c2c24ce150/config/opensearch_dashboards.yml#L44-L46)

### 🚞 Infrastructure

- Add CHANGELOG.md and related workflows ([#2414](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2414))
- Extends plugin-helpers to be used for automating version changes ([#2398](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2398),[#2486](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2486))

### 🛠 Maintenance

- Version Increment to 1.3.6 ([#2420](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2420))

### 🔩 Tests

- Update caniuse to fix failed integration tests ([#2322](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2322))
