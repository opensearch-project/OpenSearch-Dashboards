# OpenSearch Dashboards-related util files 

Below is an overview of each file:

## `compliance_engine.ts`
- **Purpose:**
  - Implements a compliance engine for tracking and validating rules.
  - Provides functions to check if a node is tracked, retrieve compliance rules, and more.
- **Exported Functions:**
  - `isTracked(rules: ValueBasedConfig, nodeInfo: { selector: string; prop: string }): boolean`
  - `getComplianceRule(rules: ValueBasedConfig, nodeInfo: { selector: string; prop: string; value: string }): ComplianceRule | undefined`


## `extract_regex.ts`
- **Purpose:**
  - Defines a function to extract a regular expression from a string value.
- **Exported Function:**
  - `extractRegex(value: string): RegExp | undefined`


## `get_message.ts`
- **Purpose:**
  - Contains functions to generate messages related to compliance tracking.
- **Exported Functions:**
  - `getUntrackedMessage(nodeInfo: { selector: string; prop: string; value: string }): string`
  - `getTrackedMessage(nodeInfo: { selector: string; prop: string; value: string }): string`
  - `getNotCompliantMessage(message: string, explanation?: string): string`


## `get_rules_from_config.ts`
- **Purpose:**
  - Provides functions to retrieve rules from a configuration file.
- **Exported Functions:**
  - `getRulesFromConfig(configPath: string): ValueBasedConfig`
  - `getRuleFromConfig(rules: FileBasedConfig, value: string): { approved?: string[]; explanation?: string } | undefined`


## `is_color_property.ts`
- **Purpose:**
  - Checks if a given CSS property potentially modifies a color.
  - Provides a function to get the parent rule of a declaration if the declaration is a color property.
- **Exported Functions:**
  - `isColorProperty(prop: string): boolean`
  - `getColorPropertyParent(decl: Declaration): Rule | undefined`


## `is_valid_options.ts`
- **Purpose:**
  - Validates options for a Stylelint rule.
- **Exported Function:**
  - `isValidOptions(postcssResult: any, ruleName: string, primaryOption: Record<string, any>): boolean`


## `matches.ts`
- **Purpose:**
  - Checks if a given value matches a specified pattern.
- **Exported Function:**
  - `matches(matcher: string, value: string): boolean`

This project follows the Apache-2.0 license. Contributions must be made under this license or a compatible open-source license.
