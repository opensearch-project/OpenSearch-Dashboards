/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const conditionFunction = `## Condition
---

### Condition functions

PPL functions use the search capabilities of the OpenSearch engine. However, these functions don't execute directly within the OpenSearch plugin's memory. Instead, they facilitate the global filtering of query results based on specific conditions, such as a \`WHERE\` or \`HAVING\` clause. 

The following sections describe the condition PPL functions.

### ISNULL

The \`isnull(field)\` function checks a specific field and returns \`true\` if the field contains no data, that is, it's null.

**Argument type:** All supported data types

**Return type:** \`BOOLEAN\`

#### Example

    os> source=accounts | eval result = isnull(employer) | fields result, employer, firstname
    fetched rows / total rows = 4/4
    +----------+------------+-------------+
    | result   | employer   | firstname   |
    |----------+------------+-------------|
    | False    | Pyrami     | Amber       |
    | False    | Netagy     | Hattie      |
    | False    | Quility    | Nanette     |
    | True     | null       | Dale        |
    +----------+------------+-------------+

### ISNOTNULL

The \`isnotnull(field)\` function is the opposite of \`isnull(field)\`. Instead of checking for null values, it checks a specific field and returns \`true\` if the field contains data, that is, it is not null.

**Argument type:** All supported data types

**Return type:** \`BOOLEAN\`

#### Example

    os> source=accounts | where not isnotnull(employer) | fields account_number, employer
    fetched rows / total rows = 1/1
    +------------------+------------+
    | account_number   | employer   |
    |------------------+------------|
    | 18               | null       |
    +------------------+------------+

### EXISTS

OpenSearch does not differentiate between null and missing. Thus, a function such as \`ismissing\` or \`isnotmissing\` cannot be used to test if a field exists or not. The \`isnull\` or \`isnotnull\` functions can be used for this purpose.

#### Example

    os> source=accounts | where isnull(email) | fields account_number, email
    fetched rows / total rows = 1/1
    +------------------+---------+
    | account_number   | email   |
    |------------------+---------|
    | 13               | null    |
    +------------------+---------+

### IFNULL

The \`ifnull(field1, field2)\` function returns the value in the first field if it is not null; otherwise, it returns the value in the second field.

**Argument type:** All supported data types (Note that the semantic check will fail if the parameters are different types.)

**Return type:** Any

#### Example

    os> source=accounts | eval result = ifnull(employer, 'default') | fields result, employer, firstname
    fetched rows / total rows = 4/4
    +----------+------------+-------------+
    | result   | employer   | firstname   |
    |----------+------------+-------------|
    | Pyrami   | Pyrami     | Amber       |
    | Netagy   | Netagy     | Hattie      |
    | Quility  | Quility    | Nanette     |
    | default  | null       | Dale        |
    +----------+------------+-------------+

### NULLIF

The \`nullif(field1, field2)\` function returns \`null\` if the values in both fields are identical. If the values differ, the function returns the value in the first field (field1).

**Argument type:** All supported data types (Note that the semantic check will fail if the parameters are different types.)

**Return type:** Any

#### Example

    os> source=accounts | eval result = nullif(employer, 'Pyrami') | fields result, employer, firstname
    fetched rows / total rows = 4/4
    +----------+------------+-------------+
    | result   | employer   | firstname   |
    |----------+------------+-------------|
    | null     | Pyrami     | Amber       |
    | Netagy   | Netagy     | Hattie      |
    | Quility  | Quility    | Nanette     |
    | null     | null       | Dale        |
    +----------+------------+-------------+

### ISNULL

The \`isnull(field1, field2)\` function checks for null values and returns \`null\` if the values in both fields are identical. If the values differ, the function returns the value in the first field (field1).

**Argument type:** All supported data types

**Return type:** Any

#### Example

    os> source=accounts | eval result = isnull(employer) | fields result, employer, firstname
    fetched rows / total rows = 4/4
    +----------+------------+-------------+
    | result   | employer   | firstname   |
    |----------+------------+-------------|
    | False    | Pyrami     | Amber       |
    | False    | Netagy     | Hattie      |
    | False    | Quility    | Nanette     |
    | True     | null       | Dale        |
    +----------+------------+-------------+

### IF

The \`if(condition, expr1, expr2)\` function returns \`expr1\` if \`condition\` is \`true\`, and \`expr2\` otherwise.

**Argument type:** All supported data types (Note that the semantic check will fail if \`expr1\` and \`expr2\` have different types.)

**Return type:** Any

Example:

    os> source=accounts | eval result = if(true, firstname, lastname) | fields result, firstname, lastname
    fetched rows / total rows = 4/4
    +----------+-------------+------------+
    | result   | firstname   | lastname   |
    |----------+-------------+------------|
    | Amber    | Amber       | Duke       |
    | Hattie   | Hattie      | Bond       |
    | Nanette  | Nanette     | Bates      |
    | Dale     | Dale        | Adams      |
    +----------+-------------+------------+

    os> source=accounts | eval result = if(false, firstname, lastname) | fields result, firstname, lastname
    fetched rows / total rows = 4/4
    +----------+-------------+------------+
    | result   | firstname   | lastname   |
    |----------+-------------+------------|
    | Duke     | Amber       | Duke       |
    | Bond     | Hattie      | Bond       |
    | Bates    | Nanette     | Bates      |
    | Adams    | Dale        | Adams      |
    +----------+-------------+------------+
`;
