/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const rareCmd = `## rare
---

### Description

Use the \`rare\` command to find the least common tuple of values across all fields in the \`field-list\` field. A maximum of 10 results is returned for each distinct tuple of group-by field values.

### Syntax

rare &lt;field-list&gt; \[by-clause\]

-   \`field-list\`: Required. A comma-separated list of field names.
-   \`by-clause\`: Optional. One or more fields to group by.

#### Example 1: Find a field's least common values

The following example PPL query shows how to find a least common value in the \`gender\` field:

    os> source=accounts | rare gender;
    fetched rows / total rows = 2/2
    +------------+
    | gender     |
    |------------|
    | F          |
    |------------|
    | M          |
    +------------+

#### Example 2: Find least common values in group-by fields

The following example PPL query shows how to find a least common value in the \`age\` field that is grouped by \`gender\`:

    os> source=accounts | rare age by gender;
    fetched rows / total rows = 20/20
    +----------+----------+
    | gender   | age      |
    |----------+----------|
    | F        | 29       |
    | F        | 20       |
    | F        | 23       |
    | F        | 25       |
    | F        | 37       |
    | F        | 38       |
    | F        | 40       |
    | F        | 27       |
    | F        | 36       |
    | F        | 24       |
    | M        | 27       |
    | M        | 24       |
    | M        | 34       |
    | M        | 38       |
    | M        | 28       |
    | M        | 39       |
    | M        | 21       |
    | M        | 30       |
    | M        | 25       |
    | M        | 29       |
    +----------+----------+

#### Limitation
The \`rare\` command is not rewritten to [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/). It is only run on the coordinating node.
`;
