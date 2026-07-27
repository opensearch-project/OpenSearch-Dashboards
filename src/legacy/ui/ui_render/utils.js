/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Applies CSP modifications to base rules and returns the modified CSP header string.
 *
 * @param {string[]} baseRules - Array of CSP rule strings (e.g., ["script-src 'self'", "style-src 'self'"])
 * @param {Array<{directive: string, action: 'add' | 'remove' | 'set', values: string[]}>} modifications - Array of modification rules
 * @returns {string} Modified CSP header string
 */
export function applyCspModifications(baseRules, modifications) {
  const directiveMap = new Map();

  for (const rule of baseRules) {
    // Rules may carry embedded or trailing ';' separators.
    for (const segment of rule.split(';')) {
      const tokens = segment
        .trim()
        .split(' ')
        .filter((v) => !!v.length);
      if (tokens.length === 0) continue;
      // Directive names are case-insensitive; values (e.g. nonces, hashes) are not.
      const [directive, ...values] = tokens;
      directiveMap.set(directive.toLowerCase(), new Set(values));
    }
  }

  for (const mod of modifications) {
    const directive = mod.directive.toLowerCase();
    const action = mod.action;
    const values = mod.values;

    switch (action) {
      case 'add':
        if (!directiveMap.has(directive)) {
          directiveMap.set(directive, new Set());
        }
        if (values.length > 0) {
          values.forEach((v) => directiveMap.get(directive).add(v));
        }
        break;

      case 'remove':
        if (directiveMap.has(directive)) {
          values.forEach((v) => directiveMap.get(directive).delete(v));
        }
        break;

      case 'set':
        directiveMap.set(directive, new Set(values));
        break;
    }
  }

  const parts = [];
  for (const [directive, values] of directiveMap.entries()) {
    if (values.size === 0) {
      parts.push(directive);
    } else {
      parts.push(`${directive} ${Array.from(values).join(' ')}`);
    }
  }
  return parts.join('; ');
}
