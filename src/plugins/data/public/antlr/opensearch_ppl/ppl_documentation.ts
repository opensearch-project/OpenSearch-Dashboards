/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Add a script that scrapes the data to generate this file

/**
 * Contains mapping of PPL commands to the documentation
 */
export const Documentation: Record<string, string> = {
  AD: `
# **AD Command**
*Anomaly Detection using Random Cut Forest Algorithm*

&nbsp;

Fixed in Time RCF (Time-series Data):
\`\`\`
ad <number_of_trees> <shingle_size> <sample_size> <output_after> <time_decay> <anomaly_rate> <time_field> <date_format> <time_zone>
\`\`\`

Batch RCF (Non-time-series Data):
\`\`\`
ad <number_of_trees> <sample_size> <output_after> <training_data_size> <anomaly_score_threshold>
\`\`\`

&nbsp;

The \`ad\` command applies the Random Cut Forest (RCF) algorithm from the ml-commons plugin to search results returned by PPL commands. This powerful anomaly detection tool supports two distinct RCF algorithms: fixed in time RCF for processing time-series data, and batch RCF for processing non-time-series data.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/ad.rst)
  `,
  DEDUP: `
# **DEDUP Command**
*Remove Duplicate Documents from Search Results*

&nbsp;

\`\`\`
dedup [int] <field-list> [keepempty=<bool>] [consecutive=<bool>]
\`\`\`

&nbsp;

The \`dedup\` command removes identical documents defined by specified fields from search results. This powerful deduplication tool helps clean and optimize your data analysis by eliminating redundant entries.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/dedup.rst)
  `,
  DESCRIBE: `
# **DESCRIBE Command**
*Query Index Metadata Information*

&nbsp;

\`\`\`
describe <dataSource>.<schema>.<tablename>
\`\`\`

&nbsp;

The \`describe\` command queries metadata of an index. This command provides essential information about table structure and must be used as the first command in a PPL query.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/describe.rst)
  `,
  EVAL: `
# **EVAL Command**
*Evaluate Expressions and Append Results*

&nbsp;

\`\`\`
eval <field>=<expression> ["," <field>=<expression> ]...
\`\`\`

&nbsp;

The \`eval\` command evaluates expressions and appends the results to search results. This powerful command enables dynamic field creation and data transformation within your PPL queries.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/eval.rst)
  `,
  EVENTSTATS: `
# **EVENTSTATS Command**
*Enrich Events with Statistical Summary Data*

**Experimental Feature** *(Available from v3.1.0)*

&nbsp;

\`\`\`
eventstats <function>... [by-clause]
\`\`\`

&nbsp;

The \`eventstats\` command enriches event data with calculated summary statistics. It analyzes specified fields within events, computes statistical measures, and appends results as new fields to each original event.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/eventstats.rst)
  `,
  APPENDCOL: `
# **APPENDCOL Command**
*Append Sub-search Results to Main Search*

**Experimental Feature** *(Available from v3.1.0)*

&nbsp;

\`\`\`
appendcol [override=<boolean>] <sub-search>
\`\`\`

&nbsp;

The \`appendcol\` command appends the result of a sub-search and attaches it alongside the input search results. This experimental feature requires Calcite to be enabled.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/appendcol.rst)
  `,
  EXPAND: `
# **EXPAND Command**
*Transform Single Document into Multiple Documents*

**Experimental Feature** *(Available from v3.1.0)*

&nbsp;

\`\`\`
expand <field> [as alias]
\`\`\`

&nbsp;

The \`expand\` command transforms a single document into multiple documents by expanding nested array fields. Each resulting document contains one element from the array.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/expand.rst)
  `,
  EXPLAIN: `
# **EXPLAIN Command**
*Show Query Execution Plan*

&nbsp;

\`\`\`
explain <mode> queryStatement
\`\`\`

&nbsp;

The \`explain\` command shows the execution plan of a query, commonly used for query translation and troubleshooting. Must be used as the first command in a PPL query.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/explain.rst)
  `,
  FIELDS: `
# **FIELDS Command**
*Select or Remove Specific Fields*

&nbsp;

\`\`\`
fields [+|-] <field-list>
\`\`\`

&nbsp;

The \`fields\` command keeps or removes fields from search results. Use \`+\` to keep only specified fields or \`-\` to remove specified fields.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/fields.rst)
  `,
  FILLNULL: `
# **FILLNULL Command**
*Fill Null Values with Replacement*

&nbsp;

\`\`\`
fillnull with <replacement> [in <field-list>]
\`\`\`

&nbsp;

The \`fillnull\` command fills null values with a provided replacement value in one or more fields in the search result.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/fillnull.rst)
  `,
  FLATTEN: `
# **FLATTEN Command**
*Flatten Nested Objects into Separate Fields*

**Experimental Feature** *(Available from v3.1.0)*

&nbsp;

The \`flatten\` command flattens a struct or object field into separate fields in a document. This feature requires Calcite to be enabled.

&nbsp;

\`\`\`
flatten <field> [as (<alias-list>)]
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/flatten.rst)
  `,
  GROK: `
# **GROK Command**
*Parse Text with Grok Patterns*

&nbsp;

\`\`\`
grok <field> <pattern>
\`\`\`

&nbsp;

The \`grok\` command parses a text field using grok patterns and appends the results to the search result. Grok patterns help extract structured data from unstructured text.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/grok.rst)
  `,
  HEAD: `
# **HEAD Command**
*Return First N Results*

&nbsp;

\`\`\`
head [<size>] [from <offset>]
\`\`\`

&nbsp;

The \`head\` command returns the first N number of results after an optional offset in search order. Default size is 10 with offset 0.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/head.rst)
  `,
  JOIN: `
# **JOIN Command**
*Combine Two Datasets*

**Experimental Feature** *(Available from v3.0.0)*

&nbsp;

The \`join\` command combines two datasets together. The left side can be an index or results from piped commands, while the right side can be either an index or a subsearch.

&nbsp;

\`\`\`
[joinType] join [leftAlias] [rightAlias] on <joinCriteria> <right-dataset>
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/join.rst)
  `,
  KMEANS: `
# **KMEANS Command**
*K-Means Clustering Algorithm*

&nbsp;

The \`kmeans\` command applies the k-means clustering algorithm from the ml-commons plugin on search results. Note: This command is deprecated by the ml command.

&nbsp;

\`\`\`
kmeans <centroids> <iterations> <distance_type>
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/kmeans.rst)
  `,
  LOOKUP: `
# **LOOKUP Command**
*Enrich Data from Lookup Index*

**Experimental Feature** *(Available from v3.0.0)*

&nbsp;

The \`lookup\` command enriches search data by adding or replacing data from a lookup index (dimension table). This is an alternative to the join command.

&nbsp;

\`\`\`
LOOKUP <lookupIndex> (<lookupMappingField> [AS <sourceMappingField>])...
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/lookup.rst)
  `,
  ML: `
# **ML Command**
*Machine Learning Operations*

&nbsp;

The \`ml\` command performs machine learning operations (train/predict/trainandpredict) on algorithms in the ml-commons plugin using search results from PPL commands.

&nbsp;

\`\`\`
ml action='train' algorithm='<algorithm>' <parameters>...
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/ml.rst)
  `,
  PARSE: `
# **PARSE Command**
*Parse Text with Regular Expressions*

&nbsp;

\`\`\`
parse <field> <pattern>
\`\`\`

&nbsp;

The \`parse\` command parses a text field using regular expressions and appends the result to the search result. Uses Java regex engine with named capture groups.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/parse.rst)
  `,
  PATTERNS: `
# **PATTERNS Command**
*Extract Log Patterns from Text*

**Experimental Feature** *(Available from v3.1.0)*

&nbsp;

\`\`\`
patterns <field> [by byClause...] [method=simple_pattern | brain]
\`\`\`

&nbsp;

The \`patterns\` command extracts log patterns from a text field and appends the results to the search result. Supports simple_pattern and brain algorithms.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/patterns.rst)
  `,
  RARE: `
# **RARE Command**
*Find Least Common Values*

&nbsp;

\`\`\`
rare <field-list> [by-clause]
\`\`\`

&nbsp;

The \`rare\` command finds the least common tuple of values of all fields in the field list. Returns a maximum of 10 results for each distinct tuple.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/rare.rst)
  `,
  RENAME: `
# **RENAME Command**
*Rename Fields in Search Results*

&nbsp;

The \`rename\` command renames one or more fields in the search result. This operation is executed only on the coordination node.

&nbsp;

\`\`\`
rename <source-field> AS <target-field>
\`\`\`

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/rename.rst)
  `,
  SEARCH: `
# **SEARCH Command**
*Retrieve Documents from Index*

&nbsp;

\`\`\`
search source=[<remote-cluster>:]<index> [boolean-expression]
\`\`\`

&nbsp;

The \`search\` command retrieves documents from an index. Must be used as the first command in a PPL query and supports cross-cluster search.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/search.rst)
  `,
  SHOWDATASOURCES: `
# **SHOWDATASOURCES Command**
*Query Available Data Sources*

&nbsp;

\`\`\`
show datasources
\`\`\`

&nbsp;

The \`show datasources\` command queries datasources configured in the PPL engine. Must be used as the first command in a PPL query.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/showdatasources.rst)
  `,
  SORT: `
# **SORT Command**
*Sort Search Results*

&nbsp;

\`\`\`
sort <[+|-] sort-field>...
\`\`\`

&nbsp;

The \`sort\` command sorts all search results by the specified fields. Use \`+\` for ascending order or \`-\` for descending order.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/sort.rst)
  `,
  STATS: `
# **STATS Command**
*Calculate Aggregations from Search Results*

&nbsp;

\`\`\`
stats <aggregation>... [by-clause]
\`\`\`

&nbsp;

The \`stats\` command calculates aggregations from search results. Supports various aggregation functions and grouping with by-clause.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/stats.rst)
  `,
  SUBQUERY: `
# **SUBQUERY Command**
*Execute Subqueries and Subsearches*

**Experimental Feature** *(Available from v3.0.0)*

&nbsp;

\`\`\`
[ source=... | ... | ... ]
\`\`\`

&nbsp;

The \`subquery\` command contains 4 types: InSubquery, ExistsSubquery, ScalarSubquery, and RelationSubquery. Used in WHERE clauses, search filters, and join statements.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/subquery.rst)
  `,
  TOP: `
# **TOP Command**
*Find Most Common Values*

&nbsp;

\`\`\`
top [N] <field-list> [by-clause]
\`\`\`

&nbsp;

The \`top\` command finds the most common tuple of values of all fields in the field list. Default returns top 10 results.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/top.rst)
  `,
  TRENDLINE: `
# **TRENDLINE Command**
*Calculate Moving Averages*

**Enhanced Feature** *(Available from v3.1.0)*

&nbsp;

\`\`\`
TRENDLINE [sort <[+|-] sort-field>] [SMA|WMA](number-of-datapoints, field) [AS alias]
\`\`\`

&nbsp;

The \`trendline\` command calculates moving averages of fields. Supports both Simple Moving Average (SMA) and Weighted Moving Average (WMA).

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/trendline.rst)
  `,
  WHERE: `
# **WHERE Command**
*Filter Search Results with Conditions*

&nbsp;

\`\`\`
where <boolean-expression>
\`\`\`

&nbsp;

The \`where\` command filters search results using boolean expressions. Only returns results when the boolean expression evaluates to true.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/where.rst)
  `,
  SOURCE: `
# **SOURCE Command**
*Specify Data Source for Query*

&nbsp;

\`\`\`
source=<index-name> [boolean-expression]
\`\`\`

&nbsp;

The \`source\` command specifies the data source (index) for the query. This is the starting point for most PPL queries and must be the first command.

&nbsp;

[Command Reference](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/search.rst)
  `,
};
