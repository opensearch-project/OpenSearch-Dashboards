/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const fullTextSearchFunction = `## Full-text search
---

### Full-text search function

PPL functions use the search capabilities of the OpenSearch engine. However, these functions don't execute directly within the OpenSearch plugin's memory. Instead, they facilitate the global filtering of query results based on specific conditions, such as a \`WHERE\` or \`HAVING\` clause.

Full-text search allows for searching by full-text queries. For details about full-text search in OpenSearch, see the [Full-text search](https://opensearch.org/docs/latest/search-plugins/sql/full-text/) documentation.

### MATCH

The \`match\` function maps user-defined criteria to OpenSearch queries, returning documents that match specific text, number, date, or Boolean values. 

The function signature is \`match(field_expression, query_expression[, option=<option_value>]*)\`.

The available parameters are:

-   analyzer
-   auto\_generate\_synonyms\_phrase
-   fuzziness
-   max\_expansions
-   prefix\_length
-   fuzzy\_transpositions
-   fuzzy\_rewrite
-   lenient
-   operator
-   minimum\_should\_match
-   zero\_terms\_query
-   boost

**Example 1: Using specific expressions and default values**

The following example PPL query uses only the \`field\` and \`query\` expressions, with all other parameters set to their default values:

    os> source=accounts | where match(address, 'Street') | fields lastname, address;
    fetched rows / total rows = 2/2
    +------------+--------------------+
    | lastname   | address            |
    |------------+--------------------|
    | Bond       | 671 Bristol Street |
    | Bates      | 789 Madison Street |
    +------------+--------------------+

**Example 2: Setting custom values for optional parameters**

The following example PPL query sets custom values for the optional parameters:

    os> source=accounts | where match(firstname, 'Hattie', operator='AND', boost=2.0) | fields lastname;
    fetched rows / total rows = 1/1
    +------------+
    | lastname   |
    |------------|
    | Bond       |
    +------------+

### Limitations

The full-text search functions can be executed only in [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/), not in-memory. 

To ensure optimal performance and avoid translation issues with complex full-text searhes, place them as clauses within the search command.

#### Example

The following is an example complex query that could fail because it is difficult to translate to query DSL: 

    \`search source = people | rename firstname as name | dedup account_number | fields name, account_number, balance, employer | where match(employer, 'Open Search') | stats count() by city\` 

To optimize full-text search performance, rewrite the query by placing the \`WHERE\` clause with the full-text search function as the second command after the \`SEARCH\` command. This ensures the full-text search gets pushed down to query DSL. The following is an example query: 

    \`search source = people | where match(employer, 'Open Search') | rename firstname as name | dedup account_number | fields name, account_number, balance, employer | stats count() by city\` 

For details about query engine optimization, see the [Optimizations](https://github.com/opensearch-project/sql/blob/22924b13d9cb46759c8d213a7ce903effe06ab47/docs/user/optimization/optimization.rst) developer documentation on GitHub.
`;
