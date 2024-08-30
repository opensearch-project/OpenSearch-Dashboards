/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const renameCmd = `## rename
---
### Description

Use the \`rename\` command to rename one or more fields in the search result.

### Syntax

rename &lt;source-field&gt; AS &lt;target-field&gt;\[","
&lt;source-field&gt; AS &lt;target-field&gt;\]...

-   \`source-field\`: Required. The field to rename.
-   \`target-field\`: Required. The new field.

#### Example 1: Rename one field

The following example PPL query renames a field:

    os> source=accounts | rename account_number as an | fields an;
    fetched rows / total rows = 4/4
    +------+
    | an   |
    |------|
    | 1    |
    | 6    |
    | 13   |
    | 18   |
    +------+

#### Example 2: Rename two or more fields

The following example PPL query renames two or more fields:

    os> source=accounts | rename account_number as an, employer as emp | fields an, emp;
    fetched rows / total rows = 4/4
    +------+---------+
    | an   | emp     |
    |------+---------|
    | 1    | Pyrami  |
    | 6    | Netagy  |
    | 13   | Quility |
    | 18   | null    |
    +------+---------+

#### Limitation
The \`rename\` command is not rewritten to [query domain-specific language (DSL)](https://opensearch.org/docs/latest/query-dsl/index/). It is only run on the coordinating node.
`;
