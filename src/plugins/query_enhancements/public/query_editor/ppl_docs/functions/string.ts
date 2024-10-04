/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const stringFunction = `## String
---

### String functions

PPL functions use the search capabilities of the OpenSearch engine. However, these functions don't execute directly within the OpenSearch plugin's memory. Instead, they facilitate the global filtering of query results based on specific conditions, such as a \`WHERE\` or \`HAVING\` clause. 

The following sections describe the string functions.

### CONCAT

The \`CONCAT(str1, str2)\` function returns \`str1\` and \`str\` concatenated strings.

**Argument type:** \`STRING, STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`CONCAT('hello', 'world')\` = CONCAT('hello', 'world') | fields \`CONCAT('hello', 'world')\`
    fetched rows / total rows = 1/1
    +----------------------------+
    | CONCAT('hello', 'world')   |
    |----------------------------|
    | helloworld                 |
    +----------------------------+

### CONCAT\_WS

The \`CONCAT\_WS(sep, str1, str2)\` function concatenates two strings together, using \`sep\` as a separator between them.

**Argument type:** \`STRING, STRING, STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`CONCAT_WS(',', 'hello', 'world')\` = CONCAT_WS(',', 'hello', 'world') | fields \`CONCAT_WS(',', 'hello', 'world')\`
    fetched rows / total rows = 1/1
    +------------------------------------+
    | CONCAT_WS(',', 'hello', 'world')   |
    |------------------------------------|
    | hello,world                        |
    +------------------------------------+

### LENGTH

The \`length(str)\` function returns the length of a string, measured in number of bytes.

**Function signature:** \`LENGTH(STRING) -&gt; INTEGER\`

**Argument type:** \`STRING\`

**Return type:** \`INTEGER\`

#### Example

    os> source=people | eval \`LENGTH('helloworld')\` = LENGTH('helloworld') | fields \`LENGTH('helloworld')\`
    fetched rows / total rows = 1/1
    +------------------------+
    | LENGTH('helloworld')   |
    |------------------------|
    | 10                     |
    +------------------------+

### LIKE

The \`like(string, PATTERN)\` function returns \`true\` if the string matches the \`PATTERN\` value. The following two wildcards are commonly used with the \`like\` operator:

- \`%\`: A percent sign represents zero, one, or multiple characters.
- \`_\`: An underscore represents a single character.

#### Example

    os> source=people | eval \`LIKE('hello world', '_ello%')\` = LIKE('hello world', '_ello%') | fields \`LIKE('hello world', '_ello%')\`
    fetched rows / total rows = 1/1
    +---------------------------------+
    | LIKE('hello world', '_ello%')   |
    |---------------------------------|
    | True                            |
    +---------------------------------+

### LOWER

The \`lower(string)\` function converts a string to lowercase.

**Argument type:** \`STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`LOWER('helloworld')\` = LOWER('helloworld'), \`LOWER('HELLOWORLD')\` = LOWER('HELLOWORLD') | fields \`LOWER('helloworld')\`, \`LOWER('HELLOWORLD')\`
    fetched rows / total rows = 1/1
    +-----------------------+-----------------------+
    | LOWER('helloworld')   | LOWER('HELLOWORLD')   |
    |-----------------------+-----------------------|
    | helloworld            | helloworld            |
    +-----------------------+-----------------------+

### LTRIM

The \`ltrim(str)\` function trims leading space characters from a string.

**Argument type:** \`STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`LTRIM('   hello')\` = LTRIM('   hello'), \`LTRIM('hello   ')\` = LTRIM('hello   ') | fields \`LTRIM('   hello')\`, \`LTRIM('hello   ')\`
    fetched rows / total rows = 1/1
    +---------------------+---------------------+
    | LTRIM('   hello')   | LTRIM('hello   ')   |
    |---------------------+---------------------|
    | hello               | hello               |
    +---------------------+---------------------+

### RIGHT

The \`right(str, len)\` function returns the rightmost \`len\` characters from a \`str\` value. \`NULL\` is returned if any argument is null.

**Argument type:** \`STRING, INTEGER\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`RIGHT('helloworld', 5)\` = RIGHT('helloworld', 5), \`RIGHT('HELLOWORLD', 0)\` = RIGHT('HELLOWORLD', 0) | fields \`RIGHT('helloworld', 5)\`, \`RIGHT('HELLOWORLD', 0)\`
    fetched rows / total rows = 1/1
    +--------------------------+--------------------------+
    | RIGHT('helloworld', 5)   | RIGHT('HELLOWORLD', 0)   |
    |--------------------------+--------------------------|
    | world                    |                          |
    +--------------------------+--------------------------+

### RTRIM

The \`rtrim(str)\` function trims trailing space characters from a string.

**Argument type:** \`STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`RTRIM('   hello')\` = RTRIM('   hello'), \`RTRIM('hello   ')\` = RTRIM('hello   ') | fields \`RTRIM('   hello')\`, \`RTRIM('hello   ')\`
    fetched rows / total rows = 1/1
    +---------------------+---------------------+
    | RTRIM('   hello')   | RTRIM('hello   ')   |
    |---------------------+---------------------|
    |    hello            | hello               |
    +---------------------+---------------------+

### SUBSTRING

The \`substring(str, start)\` or \`substring(str, start, length)\`function returns a substring of the input string \`str\`. If \`length\` is not specified, the function returns the entire string from the \`start\` index.

**Argument type:** \`STRING, INTEGER, INTEGER\`

**Return type:** \`STRING\`

**Synonyms:** \`SUBSTR\`

#### Example

    os> source=people | eval \`SUBSTRING('helloworld', 5)\` = SUBSTRING('helloworld', 5), \`SUBSTRING('helloworld', 5, 3)\` = SUBSTRING('helloworld', 5, 3) | fields \`SUBSTRING('helloworld', 5)\`, \`SUBSTRING('helloworld', 5, 3)\`
    fetched rows / total rows = 1/1
    +------------------------------+---------------------------------+
    | SUBSTRING('helloworld', 5)   | SUBSTRING('helloworld', 5, 3)   |
    |------------------------------+---------------------------------|
    | oworld                       | owo                             |
    +------------------------------+---------------------------------+

### TRIM

The \`trim\` function removes leading and trailing white space from a string.

**Argument type:** \`STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`TRIM('   hello')\` = TRIM('   hello'), \`TRIM('hello   ')\` = TRIM('hello   ') | fields \`TRIM('   hello')\`, \`TRIM('hello   ')\`
    fetched rows / total rows = 1/1
    +--------------------+--------------------+
    | TRIM('   hello')   | TRIM('hello   ')   |
    |--------------------+--------------------|
    | hello              | hello              |
    +--------------------+--------------------+

### UPPER

The \`upper(string)\` function converts a string to uppercase.

**Argument type:** \`STRING\`

**Return type:** \`STRING\`

#### Example

    os> source=people | eval \`UPPER('helloworld')\` = UPPER('helloworld'), \`UPPER('HELLOWORLD')\` = UPPER('HELLOWORLD') | fields \`UPPER('helloworld')\`, \`UPPER('HELLOWORLD')\`
    fetched rows / total rows = 1/1
    +-----------------------+-----------------------+
    | UPPER('helloworld')   | UPPER('HELLOWORLD')   |
    |-----------------------+-----------------------|
    | HELLOWORLD            | HELLOWORLD            |
    +-----------------------+-----------------------+
`;
