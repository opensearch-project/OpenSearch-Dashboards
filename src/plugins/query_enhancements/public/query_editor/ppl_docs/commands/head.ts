/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const headCmd = `## head
---

### Description

Use the \`head\` command to return the first N number of lines from a search result.

### Syntax

head \[N\]

-   \`N\`: Optional. The number of results you want to return. Default is 10.

#### Example 1: Get the first 10 results

The following example PPL query shows how to use \`head\` to return the first 10 search results:

    os> source=accounts | fields firstname, age | head;
    fetched rows / total rows = 10/10
    +---------------+-----------+
    | firstname     | age       |
    |---------------+-----------|
    | Amber         | 32        |
    | Hattie        | 36        |
    | Nanette       | 28        |
    | Dale          | 33        |
    | Elinor        | 36        |
    | Virginia      | 39        |
    | Dillard       | 34        |
    | Mcgee         | 39        |
    | Aurelia       | 37        |
    | Fulton        | 23        |
    +---------------+-----------+

#### Example 2: Get the first N results

The following example PPL query shows how to use \`head\` to get a specified number of search results. In this example, N is equal to 3: 

    os> source=accounts | fields firstname, age | head 3;
    fetched rows / total rows = 3/3
    +---------------+-----------+
    | firstname     | age       |
    |---------------+-----------|
    | Amber         | 32        |
    | Hattie        | 36        |
    | Nanette       | 28        |
    +---------------+-----------+

#### Limitation
The \`head\` command is not rewritten to [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/). It is only run on the coordinating node.
`;
