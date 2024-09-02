/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const fieldsCmd = `## fields
---
### Description

Use the \`fields\` command to specify the fields that should be included in or excluded from the search results.

### Syntax

fields \[+\|-\] &lt;field-list&gt;

-   \`field-list\`: Required. Comma-separated list of fields to keep or remove.
-   \`index\`: Optional. If the plus sign \`+\` is used, only the fields specified in the field list will be included. If the minus \`-\` is used, all the fields specified in the field list will be excluded. Default is \`+\`.

#### Example 1: Select specified fields from the search result

The following example PPL query shows how to retrieve the \`account\_number\`, \`firstname\`, and \`lastname\` fields from the search results:

    os> source=accounts | fields account_number, firstname, lastname;
    fetched rows / total rows = 4/4
    +------------------+-------------+------------+
    | account_number   | firstname   | lastname   |
    |------------------+-------------+------------|
    | 1                | Amber       | Duke       |
    | 6                | Hattie      | Bond       |
    | 13               | Nanette     | Bates      |
    | 18               | Dale        | Adams      |
    +------------------+-------------+------------+

#### Example 2: Remove specified fields from the search results

The following example PPL query shows how to remove the \`account\_number\` field from the search results:

    os> source=accounts | fields account_number, firstname, lastname | fields - account_number;
    fetched rows / total rows = 4/4
    +-------------+------------+
    | firstname   | lastname   |
    |-------------+------------|
    | Amber       | Duke       |
    | Hattie      | Bond       |
    | Nanette     | Bates      |
    | Dale        | Adams      |
    +-------------+------------+
`;
