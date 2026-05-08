# VERSION 3.5.0 Release Note

### 💥 Breaking Changes

### Deprecations

### 🛡 Security

### 📈 Features/Enhancements

 - Simplify threshold logic ([#10909](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10909))
 - Enhance execute_ppl_query tool execution result ([#11023](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11023))
 - Add RED metrics charts for Discover:Traces ([#11030](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11030))
 - Table visualization re-write ([#11031](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11031))
 - Add prometheus grammar and autocomplete functions ([#11037](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11037))
 - Add prometheus server APIs and frontend type config ([#11039](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11039))
 - CVEs addresses ([#11048](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11048))
 - Fix table vis header row UI ([#11056](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11056))
 - [Explore] Add rare values to field stats detail sections ([#11062](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11062))
 - [Chat] Add gradient icon and styling to chat header button ([#11066](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11066))
 - Add prometheus metrics page in explore ([#11073](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11073))
 - Style-src-elem nonces for CSP report-only ([#11074](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11074))
 - Introducing ECharts to discover visualization ([#11077](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11077))
 - [Data] Support flat_object field type ([#11085](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11085))
 - Add raw table to prometheus results page in explore metrics flavor ([#11095](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11095))
 - Dataset UI and observability workspace + Trace automation ([#11096](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11096))
 - Data processing for applying threshold colors ([#11106](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11106))
 - Migrate explore area chart from vega-lite to echarts ([#11111](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11111))
 - Migrate line and facet bar chart to echart ([#11113](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11113))
 - Migrate pie chart ([#11116](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11116))
 - Support multi query for prometheus in explore ([#11127](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11127))
 - Add Client-Side Math Expression Evaluation for TSVB ([#11129](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11129))
 - [chat] expose action register method to allow plugins to register permanent actions ([#11131](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11131))
 - Add context awareness for explore visualizations ([#11134](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11134))
 - Add `Ask AI` Context Menu Action to explore visualizations ([#11134](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11134))
 - Support gzip for OpenSearch responses ([#11135](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11135))
 - Migrate state timeline ([#11136](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11136))
 - Support _id when insert data into sample dataset index ([#11139](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11139))
 - Bump @modelcontextprotocol/sdk to 1.25.2 and qs to 6.14.1 ([#11151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11151))
 - Support query generation for PromQL in Explore ([#11153](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11153))
 - Remove MDS support for Prometheus connections ([#11154](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11154))
 - Add thinking message in chat conversation ([#11157](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11157))
 - Show PromQL label in explore metrics page query editor ([#11165](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11165))
 - Add CSP modifications using dynamic config ([#11168](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11168))
 - Migrate gauge to ECharts ([#11170](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11170))
 - Integrate data importer with Discover ([#11180](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11180))
 - Migrate heatmap to echarts ([#11192](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11192))
 - Add slash command system with autocomplete and user confirmations for chatbot ([#11194](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11194))
 - Change PromQL generation to use ag-ui agent ([#11201](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11201))
 - Add logs default columns and remove system fields from source column ([#11203](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11203))
 - Add `opensearch.requestCompression` flag opensearch requests ([#11205](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11205))
 - [Chat]Hide ask ai in explore visualization ([#11214](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11214))
 - Add dynamic setting flag for Explore Traces + Metrics ([#11220](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11220))
 - Create a more condensed UI for the Explore Discover page ([#11221](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11221))
 - [Enhancement][MDS] Implement 1st MV Refresh Window For Integration Creation ([#11226](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11226))
 - Add gzip compression support for PPL queries ([#11240](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11240))

### 🐛 Bug Fixes

 - Fix wildcard pattern validation ([#10939](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10939))
 - Fix ui changes for data importer ([#10961](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10961))
 - Add auto scroll when new line is added ([#10977](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10977))
 - Use variable for language placeholder in explore editor ([#11018](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11018))
 - Respect DatasetTypeConfig.searchOnLoad in explore ([#11018](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11018))
 - [Chat][BUG] Remove stale network error messages after page refresh in chat ([#11025](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11025))
 - [Chat][Context][BUG] Fix page context replacement and get dataSourceId from page context ([#11027](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11027))
 - [chat]suggested actions service is undefined ([#11029](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11029))
 - Update timechart onIntervalChange to execute data table queries ([#11035](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11035))
 - [Chat][Context] Fix page context cleanup when navigating to pages without page context ([#11036](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11036))
 - Flaky test for global threshold custom value ([#11045](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11045))
 - Update PatternsTableFlyout to render without timefield ([#11057](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11057))
 - Fix RED metric query for Discover:Traces ([#11063](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11063))
 - Fix mlClient is not defined for chatbot ([#11064](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11064))
 - Discover:Traces redirection fix + testing improvement ([#11068](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11068))
 - [Explore] Memoize patterns components to fix pagination in tables ([#11069](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11069))
 - ML router error response format ([#11103](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11103))
 - Add back handlebars to fix bwc tests ([#11105](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11105))
 - [chat] Fix ppl execution tool incorrect status ([#11112](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11112))
 - [Chat] Fix tool call positioning in conversation timeline ([#11115](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11115))
 - Support content-encoding in `HttpAmazonESConnector` ([#11158](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11158))
 - Migrate bar gauge ([#11163](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11163))
 - Improve error handling for prometheus APIs in Explore ([#11167](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11167))
 - Fix trace automation naming convention ([#11174](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11174))
 - Filter Rows with null values in Patterns Table ([#11182](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11182))
 - Explore embeddable not able to render echarts ([#11184](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11184))
 - Fix Traces: Auto detect bug ([#11191](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11191))
 - Fix server basepath is missing for recently accessed assets ([#11193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11193))
 - Update caniuse-lite ([#11195](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11195))
 - Update the OTel sample data index names ([#11208](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11208))
 - Visualizations should hide ailias type ([#11212](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11212))
 - Update correlationType for trace-to-logs objects ([#11215](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11215))
 - Apply data table columns filter to download csv ([#11219](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11219))
 - Discover visualization fix and ux improvements ([#11230](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11230))
 - Use URL param filters with saved search as fallback ([#11239](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11239))
 - Improve style and overflow behavior for embedded data importers ([#11241](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11241))
 - Fixed an issue that pivot function not handle timestamp properly ([#11242](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11242))
 - Address bugs for echarts migration ([#11244](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11244))
 - Bump less to 4.1.3 to use disablePluginRule when in Markdown panel ([#11250](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11250))
 - Add stricter sanitization on axis label and name in visualizations ([#11251](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11251))
 - Use dompurify to sanitize URL and imageLabel ([#11252](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11252))
 - Add title field to correlations saved object ([#11256](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11256))
 - Bug y_two axis not working ([#11257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11257))
 - Add thresholds visual map for scatter ([#11268](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11268))
 - Remove meta field for prometheus data-connection ([#11280](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11280))
 - Histogram x-axis incorrectly have type 'category' ([#11298](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11298))
 - Fix new discover logs table overflow ([#11310](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11310))

### 🚞 Infrastructure

 - Replace handlebars package with kbn-handlebars ([#11084](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11084))
 - Allow external plugins to be a different version from OSD. ([#11179](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11179))
 - Make single-version=ignore as default ([#11183](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11183))

### 📝 Documentation

### 🛠 Maintenance

 - Update DEVELOPER_GUIDE.md to include darwin-arm ([#10997](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10997))
 - Upgrade oui version to 1.22 ([#11042](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11042))
 - [chore]Update node to 22.21.1 ([#11076](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11076))
 - Update dependency @modelcontextprotocol/sdk to v1.24.0 ([#11086](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11086))
 - Add echarts theme ([#11184](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11184))
 - Bump node to v22.22.0 ([#11218](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11218))
 - Bump axios ([#11233](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11233))
 - Update lodash and lodash-es to 4.17.23 ([#11254](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11254))

### 🪛 Refactoring

 - Axes panel of line & area chart to use StandardAxes ([#10935](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/10935))
 - Remove Intentional CSP Violation Detection Mechanism ([#11060](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11060))
 - Refactor bar charts from Vega to ECharts ([#11077](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11077))
 - Migrate OSD build from Webpack4 to Rspack ([#11102](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11102))
 - Discover vis data transformation refactor with flatten function ([#11124](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11124))
 - Add echarts implementation of metric visualization ([#11155](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11155))
 - Echarts implementation of histogram visualization ([#11164](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11164))

### 🔩 Tests

 - Improve the Integration Utils ([#11138](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11138))