# VERSION 2.17.0 Release Note

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
 - [MDS]Add MDS support for Integration #8008 ([#8008](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/8008))

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