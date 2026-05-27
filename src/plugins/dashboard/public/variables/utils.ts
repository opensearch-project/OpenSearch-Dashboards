/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VARIABLE_REFERENCE_PATTERN } from './constants';

/**
 * Utility functions for working with variable references
 */
export const VariableUtils = {
  /**
   * Escape special regex characters in a string to use it safely in a RegExp
   * @param str String to escape
   * @returns Escaped string safe to use in RegExp constructor
   */
  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Create a regex pattern to match references to a specific variable name
   * Handles both ${varName} and $varName syntax with word boundaries
   * @param variableName Name of the variable to match
   * @returns RegExp that matches references to the variable
   * @example
   * const pattern = VariableUtils.createReferencePattern('region');
   * pattern.test('where host=$region'); // true
   * pattern.test('where host=${region}'); // true
   * pattern.test('where host=$region_prod'); // false (word boundary)
   */
  createReferencePattern(variableName: string): RegExp {
    // Escape special regex characters for defense in depth
    // Note: Variable names are validated to only contain [a-zA-Z0-9_], so special chars
    // shouldn't appear, but we escape anyway as a safety measure
    const escapedName = this.escapeRegex(variableName);
    return new RegExp(`\\$\\{${escapedName}\\}|\\$${escapedName}\\b`);
  },

  /**
   * Extract all variable names referenced in a string
   * @param text Text to search for variable references
   * @returns Array of unique variable names found
   * @example
   * VariableUtils.extractVariableNames('where region=$region and host=${host}');
   * // Returns: ['region', 'host']
   */
  extractVariableNames(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const names = new Set<string>();
    // Create a new RegExp instance to avoid state pollution from the global flag
    const pattern = new RegExp(VARIABLE_REFERENCE_PATTERN.source, VARIABLE_REFERENCE_PATTERN.flags);
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const varName = match[1] || match[2]; // match[1] for ${var}, match[2] for $var
      names.add(varName);
    }

    return Array.from(names);
  },

  /**
   * Check if a text contains any reference to a specific variable
   * @param text Text to search
   * @param variableName Variable name to look for
   * @returns True if the variable is referenced in the text
   * @example
   * VariableUtils.containsReference('where host=$region', 'region'); // true
   * VariableUtils.containsReference('where host=$region', 'host'); // false
   */
  containsReference(text: string, variableName: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    return this.createReferencePattern(variableName).test(text);
  },
};
