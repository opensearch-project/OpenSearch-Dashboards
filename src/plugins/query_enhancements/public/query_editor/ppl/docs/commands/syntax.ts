/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const syntaxCmd = `## Syntax
---
### Command order

The PPL query starts with a \`search\` command to reference a table to search.
Commands can be in any order. For example, in the following query, the \`search\` command references the \`accounts\` index as the source and then uses fields and a \`where\` command to perform further processing. 

\`\`\` 
search source=accounts
| where age > 18
| fields firstname, lastname
\`\`\`

### Required and optional arguments

Required arguments are enclosed in angle brackets \< \>, and optional arguments are enclosed in square brackets \[ \].`;
