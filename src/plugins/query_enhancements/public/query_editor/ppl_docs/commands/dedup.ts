/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const dedupCmd = `## dedup
---

### Description

Use the \'dedup\' command to remove identical documents from the search results, based on the specified field.

### Syntax

dedup \[int\] &lt;field-list&gt; \[keepempty=&lt;bool&gt;\]
\[consecutive=&lt;bool&gt;\]

-   \`field-list\`: Required. The comma-delimited field list. At least one field is required.
-   \`consecutive\`: Optional. If set to \`true\`, removes duplicate events, where the duplicate events have consecutive timestamps. Default is \`false\`.
-   \`int\`: Optional. The \'dedup\' command retains multiple events for each combination when you specify \`&lt;int&gt;\`. The number for \`&lt;int&gt;\` must be greater than 0. If you do not specify a number, only the first occurring event is kept. All other duplicates are removed from the results. Default is \`1\`.
-   \`keepempty\`: Optional. If set to \`true\`, keeps the document if any field in the \`field-list\` is null or missing. Default is \`false\`.

#### Example 1: Dedup by one field

The following example PPL query shows how to use \`dedup\` to remove duplicate documents based on the \`gender\` field:

    os> source=accounts | dedup gender | fields account_number, gender;
    fetched rows / total rows = 2/2
    +------------------+----------+
    | account_number   | gender   |
    |------------------+----------|
    | 1                | M        |
    | 13               | F        |
    +------------------+----------+

#### Example 2: Keep two duplicate documents

The following example PPL query shows how to use \`dedup\` to remove duplicate documents based on the \`gender\` field while keeping two duplicates:

    os> source=accounts | dedup 2 gender | fields account_number, gender;
    fetched rows / total rows = 3/3
    +------------------+----------+
    | account_number   | gender   |
    |------------------+----------|
    | 1                | M        |
    | 6                | M        |
    | 13               | F        |
    +------------------+----------+

#### Example 3: Keep or ignore empty fields by default

The following example PPL query shows how to use \`dedup\` to remove duplicate documents while keeping documents with null values in the specified field:

    os> source=accounts | dedup email keepempty=true | fields account_number, email;
    fetched rows / total rows = 4/4
    +------------------+-----------------------+
    | account_number   | email                 |
    |------------------+-----------------------|
    | 1                | amberduke@pyrami.com  |
    | 6                | hattiebond@netagy.com |
    | 13               | null                  |
    | 18               | daleadams@boink.com   |
    +------------------+-----------------------+

The following example PPL query shows how to use \`dedup\` to remove duplicate documents while ignoring documents with empty values in the specified field:

    os> source=accounts | dedup email | fields account_number, email;
    fetched rows / total rows = 3/3
    +------------------+-----------------------+
    | account_number   | email                 |
    |------------------+-----------------------|
    | 1                | amberduke@pyrami.com  |
    | 6                | hattiebond@netagy.com |
    | 18               | daleadams@boink.com   |
    +------------------+-----------------------+

#### Example 4: Remove duplicate consecutive documents

The following example PPL query shows how to use \`dedup\` to remove duplicate consecutive documents:

    os> source=accounts | dedup gender consecutive=true | fields account_number, gender;
    fetched rows / total rows = 3/3
    +------------------+----------+
    | account_number   | gender   |
    |------------------+----------|
    | 1                | M        |
    | 13               | F        |
    | 18               | M        |
    +------------------+----------+

### Limitation
The \`dedup\` command is not rewritten to [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/). It is only run on the coordinating node.
`;
