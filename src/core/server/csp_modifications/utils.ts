/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a single CSP modification rule.
 */
export interface CspModificationRule {
  directive: string;
  action: 'add' | 'remove' | 'set';
  values: string[];
}

/**
 * Applies CSP modifications to base rules and returns the modified CSP header string.
 *
 * @param baseRules - Array of CSP rule strings (e.g., ["script-src 'self'", "style-src 'self'"])
 * @param modifications - Array of modification rules to apply
 * @returns Modified CSP header string
 */
export function applyCspModifications(
  baseRules: string[],
  modifications: CspModificationRule[]
): string {
  const directiveMap = new Map<string, Set<string>>();

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
          const valueSet = directiveMap.get(directive)!;
          values.forEach((v) => valueSet.add(v));
        }
        break;

      case 'remove':
        if (directiveMap.has(directive)) {
          const valueSet = directiveMap.get(directive)!;
          values.forEach((v) => valueSet.delete(v));
        }
        break;

      case 'set':
        directiveMap.set(directive, new Set(values));
        break;
    }
  }

  const parts: string[] = [];
  for (const [directive, values] of directiveMap.entries()) {
    if (values.size === 0) {
      parts.push(directive);
    } else {
      // Directive with no values (e.g., "upgrade-insecure-requests")
      parts.push(`${directive} ${Array.from(values).join(' ')}`);
    }
  }
  return parts.join('; ');
}
