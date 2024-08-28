/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const whereCmd = `## where
---

### Description

Use the \`where\` command to filter search results. The \`where\` command only returns the result when the \`bool-expression\` is set to \`true\`.

### Syntax

\`where &lt;boolean-expression&gt;\`

-   \`bool-expression\`: Optional. Any expression that can be evaluated to a Boolean expression.

#### Example 1: Filter the result set with a condition

The following example PPL query fetches all documents from the \`accounts\` index using an \`or\ condition.

    os> source=accounts | where account_number=1 or gender="F" | fields account_number, gender;
    fetched rows / total rows = 2/2
    +------------------+----------+
    | account_number   | gender   |
    |------------------+----------|
    | 1                | M        |
    | 13               | F        |
    +------------------+----------+
`;
