/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const parseCmd = `## parse 
---
### Description

Use the \`parse\` command to extract information from a text field using a regular expression and add it to the search result.

### Syntax

parse &lt;field&gt; &lt;regular-expression&gt;

- \`field\`: Required. Must be a text field.
- \`regular-expression\`: Required. The regular expression used to extract new fields from a text field. It replaces the original field if a new field name exists.

### Regular expression

Use the Java regular expression engine to match the entire text field of each document. Each named capture group in the expression will be converted to a new \`string\` field.

#### Example 1: Create a new field

The following example PPL query shows how to create new field \`host\` for each document. \`host\` becomes the hostname after the @ symbol in the \`email\` field. Parsing a null field returns an empty string.

    os> source=accounts | parse email '.+@(?<host>.+)' | fields email, host;
    fetched rows / total rows = 4/4
    +-----------------------+------------+
    | email                 | host       |
    |-----------------------+------------|
    | amberduke@pyrami.com  | pyrami.com |
    | hattiebond@netagy.com | netagy.com |
    | null                  |            |
    | daleadams@boink.com   | boink.com  |
    +-----------------------+------------+

#### Example 2: Override an existing field

The following example PPL query shows how to override the existing \`address\` field while excluding the street number:

    os> source=accounts | parse address '\\d+ (?<address>.+)' | fields address;
    fetched rows / total rows = 4/4
    +------------------+
    | address          |
    |------------------|
    | Holmes Lane      |
    | Bristol Street   |
    | Madison Street   |
    | Hutchinson Court |
    +------------------+

#### Example 3: Filter and sort by casted-parsed field

The following example PPL query shows how to sort street numbers that are greater than 500 in the \`address\` field:

    os> source=accounts | parse address '(?<streetNumber>\d+) (?<street>.+)' | where cast(streetNumber as int) > 500 | sort num(streetNumber) | fields streetNumber, street;
    fetched rows / total rows = 3/3
    +----------------+----------------+
    | streetNumber   | street         |
    |----------------+----------------|
    | 671            | Bristol Street |
    | 789            | Madison Street |
    | 880            | Holmes Lane    |
    +----------------+----------------+

### Limitation

The following limitations apply:

- Parsed fields cannot be parsed again. For example, the following command is not valid:

      source=accounts | parse address '\\d+ (?<street>.+)' | parse street '\\w+ (?<road>\\w+)';

- Other commands cannot overwrite fields created by parsing. For example, in the following query, \`where\` does not match any documents because \`street\` cannot be overridden:

      source=accounts | parse address '\\d+ (?<street>.+)' | eval street='1' | where street='1';

- The text field that is parsed cannot be overridden. For example, in the following query, \`street\` is not successfully parsed because \`address\` is overridden:

      source=accounts | parse address '\\d+ (?<street>.+)' | eval address='1';

- Fields created by parsing cannot be filtered or sorted after using them in the \`stats\` command. For example, in the following query, \`where\` is not valid:

      source=accounts | parse email '.+@(?<host>.+)' | stats avg(age) by host | where host=pyrami.com;
`;
