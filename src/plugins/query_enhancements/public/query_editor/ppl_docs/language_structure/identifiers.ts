/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const pplIdentifiers = `## Indentifiers
---

### Identifiers

Identifiers are used for naming database objects, such as an index name, a field name, or a custom label. The two types of identifiers are _regular identifiers_ and _delimited identifiers_.

#### Regular identifiers

A regular identifier is a string of characters that starts with an ASCII letter (lowercase or uppercase). The subsequent characters can be a combination of letters, digits, or underscores (\`_\`). A regular identifier cannot be a reversed keyword, and white space or other special characters are not allowed.

The following identifiers are supported by OpenSearch extensions:

- **Identifiers prefixed by dot \`.\`:** This is called a hidden index. An example is \`.opensearch_dashboards\`.
- **Identifiers prefixed by the \`@\` symbol:** This is common in meta fields generated for data ingestion.
- **Identifiers with \`-\` in the middle:** This is common in index naming conventions with date information.
- **Identifiers with the \`*\` symbol:** This is common in wildcard matches in an index pattern.

Index names with a date suffix separated by dashes or dots, such as \`cwl-2020.01.11\` or \`logs-7.0-2020.01.11\`, are common in data ingestion. Identifiers used as index names do not need to be enclosed in quotation marks. Additionally, wildcards within date patterns are accepted, enabling data retrieval across indexes covering different date ranges. For example, you can use \`logs-2020.1*\` to search in indexes for October, November, and December 2020.

#### Example 1: Index pattern without quotes 

The following example PPL query uses an index pattern directly without quotes:

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

### Delimited identifiers

A delimited identifier is an identifier enclosed in backticks \`\` that contains special characters not permitted in regular identifiers. This allows for the use of characters that would otherwise violate the naming rules for identifiers.

#### Use cases

Common use cases for delimited identifiers include the following:

- Identifiers that coincide with reserved keywords.
- Identifiers that contain a dot \`.\` or a dash \`-\` need to be distinguished from regular identifiers with qualifiers. Enclosing such identifiers in backticks \`\` allows for the parser to differentiate them from qualified identifiers and enables date information within index names.
- Identifiers with special characters in index names. Note that OpenSearch permits the use of special characters, including Unicode characters.

#### Example 2: Index name enclosed in backticks

The following example PPL query uses an index name enclosed in backticks \`\`:

    os> source=\`accounts\` | fields \`account_number\`;
    fetched rows / total rows = 4/4
    +------------------+
    | account_number   |
    |------------------|
    | 1                |
    | 6                |
    | 13               |
    | 18               |
    +------------------+

### Case sensitivity

Identifiers are case sensitive and must match what is stored in OpenSearch. For example, if you run \`source=Accounts\`, an error \`index not found\` occurs \` because the index name \`accounts\` is lowercase.
`;
