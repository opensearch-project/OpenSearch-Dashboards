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
# **📊 AD Command**
*Anomaly Detection using Random Cut Forest Algorithm*

---

## **📖 Description**
The **\`ad\`** command applies the Random Cut Forest (RCF) algorithm from the ml-commons plugin to search results returned by PPL commands. This powerful anomaly detection tool supports two distinct RCF algorithms: fixed in time RCF for processing time-series data, and batch RCF for processing non-time-series data.

---

## **⚙️ Syntax**
**Fixed in Time RCF (Time-series Data):**
\`\`\`sql
ad <number_of_trees> <shingle_size> <sample_size> <output_after> <time_decay> <anomaly_rate> <time_field> <date_format> <time_zone>
\`\`\`

**Batch RCF (Non-time-series Data):**
\`\`\`sql
ad <number_of_trees> <sample_size> <output_after> <training_data_size> <anomaly_score_threshold>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/ad.rst)

  `,
  DEDUP: `
# **📊 DEDUP Command**
*Remove Duplicate Documents from Search Results*

---

## **📖 Description**
The **\`dedup\`** command removes identical documents defined by specified fields from search results. This powerful deduplication tool helps clean and optimize your data analysis by eliminating redundant entries.

---

## **⚙️ Syntax**
\`\`\`sql
dedup [int] <field-list> [keepempty=<bool>] [consecutive=<bool>]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/dedup.rst)

*Explore comprehensive documentation and examples for deduplication*
  `,
  DESCRIBE: `
# **📊 DESCRIBE Command**
*Query Index Metadata Information*

---

## **📖 Description**
The **\`describe\`** command queries metadata of an index. This command provides essential information about table structure and must be used as the first command in a PPL query.

---

## **⚙️ Syntax**
\`\`\`sql
describe <dataSource>.<schema>.<tablename>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/describe.rst)

*Explore comprehensive documentation and examples for metadata queries*
  `,
  EVAL: `
# **📊 EVAL Command**
*Evaluate Expressions and Append Results*

---

## **📖 Description**
The **\`eval\`** command evaluates expressions and appends the results to search results. This powerful command enables dynamic field creation and data transformation within your PPL queries.

---

## **⚙️ Syntax**
\`\`\`sql
eval <field>=<expression> ["," <field>=<expression> ]...
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/eval.rst)

*Explore comprehensive documentation and examples for expression evaluation*
  `,
  EVENTSTATS: `
# **📊 EVENTSTATS Command**
*Enrich Events with Statistical Summary Data*

🧪 **Experimental Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`eventstats\`** command enriches event data with calculated summary statistics. It analyzes specified fields within events, computes statistical measures, and appends results as new fields to each original event.

---

## **⚙️ Syntax**
\`\`\`sql
eventstats <function>... [by-clause]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/eventstats.rst)

*Explore comprehensive documentation and examples for event statistics*
  `,
  APPENDCOL: `
# **📊 APPENDCOL Command**
*Append Sub-search Results to Main Search*

🧪 **Experimental Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`appendcol\`** command appends the result of a sub-search and attaches it alongside the input search results. This experimental feature requires Calcite to be enabled.

---

## **⚙️ Syntax**
\`\`\`sql
appendcol [override=<boolean>] <sub-search>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/appendcol.rst)

*Explore comprehensive documentation and examples for appending columns*
  `,
  EXPAND: `
# **📊 EXPAND Command**
*Transform Single Document into Multiple Documents*

🧪 **Experimental Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`expand\`** command transforms a single document into multiple documents by expanding nested array fields. Each resulting document contains one element from the array.

---

## **⚙️ Syntax**
\`\`\`sql
expand <field> [as alias]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/expand.rst)

*Explore comprehensive documentation and examples for expanding arrays*
  `,
  EXPLAIN: `
# **📊 EXPLAIN Command**
*Show Query Execution Plan*

---

## **📖 Description**
The **\`explain\`** command shows the execution plan of a query, commonly used for query translation and troubleshooting. Must be used as the first command in a PPL query.

---

## **⚙️ Syntax**
\`\`\`sql
explain <mode> queryStatement
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/explain.rst)

*Explore comprehensive documentation and examples for query explanation*
  `,
  FIELDS: `
# **📊 FIELDS Command**
*Select or Remove Specific Fields*

---

## **📖 Description**
The **\`fields\`** command keeps or removes fields from search results. Use \`+\` to keep only specified fields or \`-\` to remove specified fields.

---

## **⚙️ Syntax**
\`\`\`sql
fields [+|-] <field-list>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/fields.rst)

*Explore comprehensive documentation and examples for field selection*
  `,
  FILLNULL: `
# **📊 FILLNULL Command**
*Fill Null Values with Replacement*

---

## **📖 Description**
The **\`fillnull\`** command fills null values with a provided replacement value in one or more fields in the search result.

---

## **⚙️ Syntax**
\`\`\`sql
fillnull with <replacement> [in <field-list>]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/fillnull.rst)

*Explore comprehensive documentation and examples for filling null values*
  `,
  FLATTEN: `
# **📊 FLATTEN Command**
*Flatten Nested Objects into Separate Fields*

🧪 **Experimental Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`flatten\`** command flattens a struct or object field into separate fields in a document. This feature requires Calcite to be enabled.

---

## **⚙️ Syntax**
\`\`\`sql
flatten <field> [as (<alias-list>)]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/flatten.rst)

*Explore comprehensive documentation and examples for flattening objects*
  `,
  GROK: `
# **📊 GROK Command**
*Parse Text with Grok Patterns*

---

## **📖 Description**
The **\`grok\`** command parses a text field using grok patterns and appends the results to the search result. Grok patterns help extract structured data from unstructured text.

---

## **⚙️ Syntax**
\`\`\`sql
grok <field> <pattern>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/grok.rst)

*Explore comprehensive documentation and examples for grok parsing*
  `,
  HEAD: `
# **📊 HEAD Command**
*Return First N Results*

---

## **📖 Description**
The **\`head\`** command returns the first N number of results after an optional offset in search order. Default size is 10 with offset 0.

---

## **⚙️ Syntax**
\`\`\`sql
head [<size>] [from <offset>]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/head.rst)

*Explore comprehensive documentation and examples for limiting results*
  `,
  JOIN: `
# **📊 JOIN Command**
*Combine Two Datasets*

🧪 **Experimental Feature** *(Available from v3.0.0)*

---

## **📖 Description**
The **\`join\`** command combines two datasets together. The left side can be an index or results from piped commands, while the right side can be either an index or a subsearch.

---

## **⚙️ Syntax**
\`\`\`sql
[joinType] join [leftAlias] [rightAlias] on <joinCriteria> <right-dataset>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/join.rst)

*Explore comprehensive documentation and examples for joining datasets*
  `,
  KMEANS: `
# **📊 KMEANS Command**
*K-Means Clustering Algorithm*

---

## **📖 Description**
The **\`kmeans\`** command applies the k-means clustering algorithm from the ml-commons plugin on search results. Note: This command is deprecated by the ml command.

---

## **⚙️ Syntax**
\`\`\`sql
kmeans <centroids> <iterations> <distance_type>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/kmeans.rst)

*Explore comprehensive documentation and examples for k-means clustering*
  `,
  LOOKUP: `
# **📊 LOOKUP Command**
*Enrich Data from Lookup Index*

🧪 **Experimental Feature** *(Available from v3.0.0)*

---

## **📖 Description**
The **\`lookup\`** command enriches search data by adding or replacing data from a lookup index (dimension table). This is an alternative to the join command.

---

## **⚙️ Syntax**
\`\`\`sql
LOOKUP <lookupIndex> (<lookupMappingField> [AS <sourceMappingField>])...
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/lookup.rst)

*Explore comprehensive documentation and examples for data lookup*
  `,
  ML: `
# **📊 ML Command**
*Machine Learning Operations*

---

## **📖 Description**
The **\`ml\`** command performs machine learning operations (train/predict/trainandpredict) on algorithms in the ml-commons plugin using search results from PPL commands.

---

## **⚙️ Syntax**
\`\`\`sql
ml action='train' algorithm='<algorithm>' <parameters>...
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/ml.rst)

*Explore comprehensive documentation and examples for machine learning*
  `,
  PARSE: `
# **📊 PARSE Command**
*Parse Text with Regular Expressions*

---

## **📖 Description**
The **\`parse\`** command parses a text field using regular expressions and appends the result to the search result. Uses Java regex engine with named capture groups.

---

## **⚙️ Syntax**
\`\`\`sql
parse <field> <pattern>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/parse.rst)

*Explore comprehensive documentation and examples for text parsing*
  `,
  PATTERNS: `
# **📊 PATTERNS Command**
*Extract Log Patterns from Text*

🧪 **Experimental Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`patterns\`** command extracts log patterns from a text field and appends the results to the search result. Supports simple_pattern and brain algorithms.

---

## **⚙️ Syntax**
\`\`\`sql
patterns <field> [by byClause...] [method=simple_pattern | brain]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/patterns.rst)

*Explore comprehensive documentation and examples for pattern extraction*
  `,
  RARE: `
# **📊 RARE Command**
*Find Least Common Values*

---

## **📖 Description**
The **\`rare\`** command finds the least common tuple of values of all fields in the field list. Returns a maximum of 10 results for each distinct tuple.

---

## **⚙️ Syntax**
\`\`\`sql
rare <field-list> [by-clause]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/rare.rst)

*Explore comprehensive documentation and examples for finding rare values*
  `,
  RENAME: `
# **📊 RENAME Command**
*Rename Fields in Search Results*

---

## **📖 Description**
The **\`rename\`** command renames one or more fields in the search result. This operation is executed only on the coordination node.

---

## **⚙️ Syntax**
\`\`\`sql
rename <source-field> AS <target-field>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/rename.rst)

*Explore comprehensive documentation and examples for renaming fields*
  `,
  SEARCH: `
# **📊 SEARCH Command**
*Retrieve Documents from Index*

---

## **📖 Description**
The **\`search\`** command retrieves documents from an index. Must be used as the first command in a PPL query and supports cross-cluster search.

---

## **⚙️ Syntax**
\`\`\`sql
search source=[<remote-cluster>:]<index> [boolean-expression]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/search.rst)

*Explore comprehensive documentation and examples for searching data*
  `,
  SHOWDATASOURCES: `
# **📊 SHOWDATASOURCES Command**
*Query Available Data Sources*

---

## **📖 Description**
The **\`show datasources\`** command queries datasources configured in the PPL engine. Must be used as the first command in a PPL query.

---

## **⚙️ Syntax**
\`\`\`sql
show datasources
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/showdatasources.rst)

*Explore comprehensive documentation and examples for showing datasources*
  `,
  SORT: `
# **📊 SORT Command**
*Sort Search Results*

---

## **📖 Description**
The **\`sort\`** command sorts all search results by the specified fields. Use \`+\` for ascending order or \`-\` for descending order.

---

## **⚙️ Syntax**
\`\`\`sql
sort <[+|-] sort-field>...
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/sort.rst)

*Explore comprehensive documentation and examples for sorting results*
  `,
  STATS: `
# **📊 STATS Command**
*Calculate Aggregations from Search Results*

---

## **📖 Description**
The **\`stats\`** command calculates aggregations from search results. Supports various aggregation functions and grouping with by-clause.

---

## **⚙️ Syntax**
\`\`\`sql
stats <aggregation>... [by-clause]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/stats.rst)

*Explore comprehensive documentation and examples for statistical calculations*
  `,
  SUBQUERY: `
# **📊 SUBQUERY Command**
*Execute Subqueries and Subsearches*

🧪 **Experimental Feature** *(Available from v3.0.0)*

---

## **📖 Description**
The **\`subquery\`** command contains 4 types: InSubquery, ExistsSubquery, ScalarSubquery, and RelationSubquery. Used in WHERE clauses, search filters, and join statements.

---

## **⚙️ Syntax**
\`\`\`sql
[ source=... | ... | ... ]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/subquery.rst)

*Explore comprehensive documentation and examples for subqueries*
  `,
  TOP: `
# **📊 TOP Command**
*Find Most Common Values*

---

## **📖 Description**
The **\`top\`** command finds the most common tuple of values of all fields in the field list. Default returns top 10 results.

---

## **⚙️ Syntax**
\`\`\`sql
top [N] <field-list> [by-clause]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/top.rst)

*Explore comprehensive documentation and examples for finding top values*
  `,
  TRENDLINE: `
# **📊 TRENDLINE Command**
*Calculate Moving Averages*

🧪 **Enhanced Feature** *(Available from v3.1.0)*

---

## **📖 Description**
The **\`trendline\`** command calculates moving averages of fields. Supports both Simple Moving Average (SMA) and Weighted Moving Average (WMA).

---

## **⚙️ Syntax**
\`\`\`sql
TRENDLINE [sort <[+|-] sort-field>] [SMA|WMA](number-of-datapoints, field) [AS alias]
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/trendline.rst)

*Explore comprehensive documentation and examples for trend analysis*
  `,
  WHERE: `
# **📊 WHERE Command**
*Filter Search Results with Conditions*

---

## **📖 Description**
The **\`where\`** command filters search results using boolean expressions. Only returns results when the boolean expression evaluates to true.

---

## **⚙️ Syntax**
\`\`\`sql
where <boolean-expression>
\`\`\`

---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/where.rst)

*Explore comprehensive documentation and examples for filtering data*
  `,
  ABS: `
# **📊 ABS Math Function**

---

## **📖 Description**
Usage: abs(x) calculate the abs x.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: INTEGER/LONG/FLOAT/DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ACOS: `
# **📊 ACOS Math Function**

---

## **📖 Description**
Usage: acos(x) calculate the arc cosine of x. Returns NULL if x is not in the range -1 to 1.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ASIN: `
# **📊 ASIN Math Function**

---

## **📖 Description**
Usage: asin(x) calculate the arc sine of x. Returns NULL if x is not in the range -1 to 1.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ATAN: `
# **📊 ATAN Math Function**

---

## **📖 Description**
Usage: atan(x) calculates the arc tangent of x. atan(y, x) calculates the arc tangent of y / x, except that the signs of both arguments are used to determine the quadrant of the result.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  CEIL: `
# **📊 CEIL Math Function**

---

## **📖 Description**
Usage: CEILING(T) takes the ceiling of value T.

Note: CEIL and CEILING functions have the same implementation & functionality

Limitation: CEILING only works as expected when IEEE 754 double type displays decimal when stored.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: LONG
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ATAN2: `
# **📊 ATAN2 Math Function**

---

## **📖 Description**
Usage: atan2(y, x) calculates the arc tangent of y / x, except that the signs of both arguments are used to determine the quadrant of the result.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  CEILING: `
# **📊 CEILING Math Function**

---

## **📖 Description**
Usage: CEILING(T) takes the ceiling of value T.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: LONG
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  CONV: `
# **📊 CONV Math Function**

---

## **📖 Description**
Usage: CONV(x, a, b) converts the number x from a base to b base.

Argument type: x: STRING, a: INTEGER, b: INTEGER

Return type: STRING
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  COS: `
# **📊 COS Math Function**

---

## **📖 Description**
Usage: cos(x) calculate the cosine of x, where x is given in radians.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  COT: `
# **📊 COT Math Function**

---

## **📖 Description**
Usage: cot(x) calculate the cotangent of x. Returns out-of-range error if x equals to 0.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  CRC32: `
# **📊 CRC32 Math Function**

---

## **📖 Description**
Usage: Calculates a cyclic redundancy check value and returns a 32-bit unsigned value.

Argument type: STRING

Return type: LONG
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  DEGREES: `
# **📊 DEGREES Math Function**

---

## **📖 Description**
Usage: degrees(x) converts x from radians to degrees.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  E: `
# **📊 E Math Function**

---

## **📖 Description**
Usage: E() returns the Euler's number

Argument type: None

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  EXP: `
# **📊 EXP Math Function**

---

## **📖 Description**
Usage: exp(x) return e raised to the power of x.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  FLOOR: `
# **📊 FLOOR Math Function**

---

## **📖 Description**
Usage: FLOOR(T) takes the floor of value T.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: LONG
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  LN: `
# **📊 LN Math Function**

---

## **📖 Description**
Usage: ln(x) return the the natural logarithm of x.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  LOG: `
# **📊 LOG Math Function**

---

## **📖 Description**
Usage: log(x) returns the natural logarithm of x that is the base e logarithm of the x. log(B, x) is equivalent to log(x)/log(B).

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  LOG2: `
# **📊 LOG2 Math Function**

---

## **📖 Description**
Usage: log2(x) is equivalent to log(x)/log(2).

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  LOG10: `
# **📊 LOG10 Math Function**

---

## **📖 Description**
Usage: log10(x) is equivalent to log(x)/log(10).

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  MOD: `
# **📊 MOD Math Function**

---

## **📖 Description**
Usage: MOD(n, m) calculates the remainder of the number n divided by m.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: Wider type between types of n and m if m is nonzero value. If m equals to 0, then returns NULL.
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  PI: `
# **📊 PI Math Function**

---

## **📖 Description**
Usage: PI() returns the constant pi

Argument type: None

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  POW: `
# **📊 POW Math Function**

---

## **📖 Description**
Usage: POW(x, y) calculates the value of x raised to the power of y. Bad inputs return NULL result.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  POWER: `
# **📊 POWER Math Function**

---

## **📖 Description**
Usage: POWER(x, y) calculates the value of x raised to the power of y. Bad inputs return NULL result.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  RADIANS: `
# **📊 RADIANS Math Function**

---

## **📖 Description**
Usage: radians(x) converts x from degrees to radians.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  RAND: `
# **📊 RAND Math Function**

---

## **📖 Description**
Usage: RAND()/RAND(N) returns a random floating-point value in the range 0 <= value < 1.0. If integer N is specified, the seed is initialized prior to execution.

Argument type: INTEGER

Return type: FLOAT
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ROUND: `
# **📊 ROUND Math Function**

---

## **📖 Description**
Usage: ROUND(x, d) rounds the argument x to d decimal places, d defaults to 0 if not specified

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: (INTEGER/LONG [,INTEGER]) -> LONG, (FLOAT/DOUBLE [,INTEGER]) -> LONG
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  SIGN: `
# **📊 SIGN Math Function**

---

## **📖 Description**
Usage: Returns the sign of the argument as -1, 0, or 1, depending on whether the number is negative, zero, or positive

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: INTEGER
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  SIN: `
# **📊 SIN Math Function**

---

## **📖 Description**
Usage: sin(x) calculate the sine of x, where x is given in radians.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  SQRT: `
# **📊 SQRT Math Function**

---

## **📖 Description**
Usage: Calculates the square root of a non-negative number

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: (Non-negative) INTEGER/LONG/FLOAT/DOUBLE -> DOUBLE, (Negative) INTEGER/LONG/FLOAT/DOUBLE -> NULL
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  CBRT: `
# **📊 CBRT Math Function**

---

## **📖 Description**
Usage: Calculates the cube root of a number

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  TAN: `
# **📊 TAN Math Function**

---

## **📖 Description**
Usage: tan(x) calculate the tangent of x, where x is given in radians.

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  TRUNCATE: `
# **📊 TRUNCATE Math Function**

---

## **📖 Description**
Usage: TRUNCATE(x, d) returns the number x, truncated to d decimal places

Argument type: INTEGER/LONG/FLOAT/DOUBLE

Return type: (INTEGER/LONG [,INTEGER]) -> LONG, (FLOAT/DOUBLE [,INTEGER]) -> DOUBLE
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/math.rst)

*Explore comprehensive documentation and examples for math functions*
  `,
  ISNULL: `
# **📊 ISNULL Function**

---

## **📖 Description**
Usage: isnull(field) return true if field is null.

Argument type: all the supported data type.

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  ISNOTNULL: `
# **📊 ISNOTNULL Function**

---

## **📖 Description**
Usage: isnotnull(field) return true if field is not null.

Argument type: all the supported data type.

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  IFNULL: `
# **📊 IFNULL Function**

---

## **📖 Description**
Usage: ifnull(field1, field2) return field2 if field1 is null.

Argument type: all the supported data type, (NOTE : if two parameters has different type, you will fail semantic check.)

Return type: any
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  NULLIF: `
# **📊 NULLIF Function**

---

## **📖 Description**
Usage: nullif(field1, field2) return null if two parameters are same, otherwise return field1.

Argument type: all the supported data type, (NOTE : if two parameters has different type, if two parameters has different type, you will fail semantic check)

Return type: any
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  IF: `
# **📊 IF Function**

---

## **📖 Description**
Usage: if(condition, expr1, expr2) return expr1 if condition is true, otherwise return expr2.

Argument type: all the supported data type, (NOTE : if expr1 and expr2 are different type,  you will fail semantic check

Return type: any
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  CASE: `
# **📊 CASE Function**

---

## **📖 Description**
Usage: case(condition1, expr1, condition2, expr2, ... conditionN, exprN else default) return expr1 if condition1 is true, or return expr2 if condition2 is true, ... if no condition is true, then return the value of ELSE clause. If the ELSE clause is not defined, it returns NULL.

Argument type: all the supported data type, (NOTE : there is no comma before "else")

Return type: any
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  COALESCE: `
# **📊 COALESCE Function**

---

## **📖 Description**
Usage: coalesce(field1, field2, ...) return the first non-null value in the argument list.

Argument type: all the supported data type. The data types of all fields must be same.

Return type: any
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  ISPRESENT: `
# **📊 ISPRESENT Function**

---

## **📖 Description**
Usage: ispresent(field) return true if the field exists.

Argument type: all the supported data type.

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  ISBLANK: `
# **📊 ISBLANK Function**

---

## **📖 Description**
Usage: isblank(field) returns true if the field is null, an empty string, or contains only white space.

Argument type: all the supported data type.

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  ISEMPTY: `
# **📊 ISEMPTY Function**

---

## **📖 Description**
Usage: isempty(field) returns true if the field is null or is an empty string.

Argument type: all the supported data type.

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  EARLIEST: `
# **📊 EARLIEST Function**

---

## **📖 Description**
Usage: earliest(relative_string, field) returns true if the value of field is after the timestamp derived from relative_string relative to the current time. Otherwise, return false.

Argument type: relative_string:STRING, field: TIMESTAMP

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
  LATEST: `
# **📊 LATEST Function**

---

## **📖 Description**
Usage: latest(relative_string, field) returns true if the value of field is before the timestamp derived from relative_string relative to the current time. Otherwise, return false.

Argument type: relative_string:STRING, field: TIMESTAMP

Return type: BOOLEAN
---

## **🔗 Resources**
📚 [**Learn More →**](https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/functions/condition.rst)

*Explore comprehensive documentation and examples for functions*
  `,
};
