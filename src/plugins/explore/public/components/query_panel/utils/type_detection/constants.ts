/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Security: Maximum query length to prevent ReDoS attacks
export const MAX_QUERY_LENGTH = 1000;

// PPL Keywords and Patterns
export const PPL_START_KEYWORDS = ['source', 'from', 'search'] as const;

export const PPL_PIPE_COMMANDS = [
  'where',
  'filter',
  'fields',
  'sort',
  'limit',
  'stats',
  'rename',
  'eval',
] as const;

export const NATURAL_LANGUAGE_STARTERS = [
  // Action verbs
  'show',
  'list',
  'get',
  'find',
  'search',
  'display',
  'give',
  'retrieve',
  'fetch',
  'tell',
  // Question words
  'what',
  'how',
  'when',
  'where',
  'why',
  'which',
  'who',
  // Modal verbs
  'can',
  'could',
  'would',
  'will',
  'please',
  'should',
  'may',
  'might',
  'shall',
  // Analytical verbs
  'explain',
  'describe',
  'summarize',
  'analyze',
  'compare',
  'calculate',
  // Auxiliary verbs
  'is',
  'are',
  'was',
  'were',
  'do',
  'does',
  'did',
  'has',
  'have',
  'had',
  'am',
  'be',
  'being',
  'been',
  'the',
] as const;

// Safe RegExp patterns (no backtracking)
export const PPL_START_PATTERNS = [
  /^source$/i,
  /^source=/i,
  /^from [a-zA-Z_][a-zA-Z0-9_]*$/i,
  /^search index=/i,
] as const;

// Boolean operators for key-value detection
export const BOOLEAN_OPERATORS = ['and', 'or'] as const;

// Key-value patterns (simplified to avoid backtracking)
export const KEY_VALUE_PATTERNS = {
  // Simple key=value without complex whitespace matching
  SIMPLE_KV: /^[a-zA-Z_][a-zA-Z0-9_]*=[^=]+$/,
  // Source pattern
  SOURCE_EQUALS: /^source=/i,
} as const;

// Utility functions for safe pattern matching
export const PatternUtils = {
  // Safely normalize whitespace and truncate query
  normalizeQuery(query: string): string {
    return query.trim().substring(0, MAX_QUERY_LENGTH).replace(/\s+/g, ' '); // Replace multiple whitespace with single space
  },

  // Tokenize query safely
  tokenize(query: string): string[] {
    return query.split(/\s+/).filter((token) => token.length > 0);
  },

  // Check if first token matches PPL start patterns
  isPplStart(firstToken: string): boolean {
    return PPL_START_KEYWORDS.some((keyword) =>
      firstToken.toLowerCase().startsWith(keyword.toLowerCase())
    );
  },

  // Check if any token is a PPL pipe command
  hasPplPipeCommand(tokens: string[]): boolean {
    return tokens.some((token) =>
      PPL_PIPE_COMMANDS.includes(token.toLowerCase() as typeof PPL_PIPE_COMMANDS[number])
    );
  },

  // Check if first token is a natural language starter
  isNaturalLanguageStart(firstToken: string): boolean {
    return NATURAL_LANGUAGE_STARTERS.some(
      (starter) => firstToken.toLowerCase() === starter.toLowerCase()
    );
  },

  // Parse key-value pairs safely
  parseKeyValuePairs(query: string): Array<{ key: string; value: string }> {
    const pairs: Array<{ key: string; value: string }> = [];
    const normalized = this.normalizeQuery(query);

    // Split by boolean operators first
    const segments = normalized.split(/\b(and|or)\b/i);

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (trimmed && !BOOLEAN_OPERATORS.includes(trimmed.toLowerCase() as any)) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0 && eqIndex < trimmed.length - 1) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          if (key && value) {
            pairs.push({ key, value });
          }
        }
      }
    }

    return pairs;
  },

  // Count boolean operators safely
  countBooleanOperators(query: string): number {
    const normalized = this.normalizeQuery(query).toLowerCase();
    let count = 0;
    for (const op of BOOLEAN_OPERATORS) {
      const regex = new RegExp(`\\b${op}\\b`, 'g');
      const matches = normalized.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  },
};
