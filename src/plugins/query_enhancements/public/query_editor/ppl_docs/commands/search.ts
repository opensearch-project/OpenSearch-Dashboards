/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const searchCmd = `## search 
---

### Description

Use the \`search\` command to retrieve a document from the index. The \`search\`
command can only be used as the first command in a PPL query.

### Syntax

search source=&lt;index&gt; \[boolean-expression\]

-   \`search\`: Search keywords, which can be ignored.
-   \`index\`: Required. Search commands must specify the index to query.
-   \`bool-expression\`: Optional. Any expression that can be evaluated to a Boolean value.

#### Example 1: Fetch all data from an index

The following example PPL query shows how to fetch all documents from the \`accounts\` index:

    os> source=accounts;
    fetched rows / total rows = 4/4
    +----------------+-----------+----------------------+---------+--------+--------+----------+-------+-----+-----------------------+----------+
    | account_number | firstname | address              | balance | gender | city   | employer | state | age | email                 | lastname |
    +----------------+-----------+----------------------+---------+--------+--------+----------+-------+-----+-----------------------+----------+
    | 1              | Amber     | 880 Holmes Lane      | 39225   | M      | Brogan | Pyrami   | IL    | 32  | amberduke@pyrami.com  | Duke     |
    | 6              | Hattie    | 671 Bristol Street   | 5686    | M      | Dante  | Netagy   | TN    | 36  | hattiebond@netagy.com | Bond     |
    | 13             | Nanette   | 789 Madison Street   | 32838   | F      | Nogal  | Quility  | VA    | 28  | null                  | Bates    |
    | 18             | Dale      | 467 Hutchinson Court | 4180    | M      | Orick  | null     | MD    | 33  | daleadams@boink.com   | Adams    |
    +----------------+-----------+----------------------+---------+--------+--------+----------+-------+-----+-----------------------+----------+

#### Example 2: Fetch data with a condition

The following example PPL query shows how to fetch all documents from the \`accounts\` index by using the \`or\` condition.

    os> source=accounts account_number=1 or gender="F";
    fetched rows / total rows = 2/2
    +------------------+-------------+--------------------+-----------+----------+--------+------------+---------+-------+----------------------+------------+
    | account_number   | firstname   | address            | balance   | gender   | city   | employer   | state   | age   | email                | lastname   |
    |------------------+-------------+--------------------+-----------+----------+--------+------------+---------+-------+----------------------+------------|
    | 1                | Amber       | 880 Holmes Lane    | 39225     | M        | Brogan | Pyrami     | IL      | 32    | amberduke@pyrami.com | Duke       |
    | 13               | Nanette     | 789 Madison Street | 32838     | F        | Nogal  | Quility    | VA      | 28    | null                 | Bates      |
    +------------------+-------------+--------------------+-----------+----------+--------+------------+---------+-------+----------------------+------------+
`;
