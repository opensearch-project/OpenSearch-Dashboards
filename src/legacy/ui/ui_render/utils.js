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
    const trimmed = rule.trim().toLowerCase();
    if (!trimmed) continue;

    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) {
      // Directive with no values (e.g., "upgrade-insecure-requests")
      directiveMap.set(trimmed, new Set());
    } else {
      const [directive, ...values] = trimmed.split(' ').filter((v) => !!v.length);
      directiveMap.set(directive, new Set(values));
    }
  }

  for (const mod of modifications) {
    const directive = mod.directive.toLowerCase();
    const action = mod.action;
    const values = mod.values.map((v) => v.toLowerCase());

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
