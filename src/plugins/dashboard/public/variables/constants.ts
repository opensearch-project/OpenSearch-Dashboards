/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regular expression pattern to match all variable references in a string.
 * Matches both ${variableName} and $variableName syntax.
 * Use with the 'g' flag to find all occurrences.
 */
export const VARIABLE_REFERENCE_PATTERN = /\$\{(\w+)\}|\$(\w+)/g;
