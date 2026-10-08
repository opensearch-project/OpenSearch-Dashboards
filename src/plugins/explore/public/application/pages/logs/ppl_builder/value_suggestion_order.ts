/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const stripQuotes = (text: string): string => text.replace(/^["']/, '');

export const compareValueSuggestions = (query: string) => {
  const q = stripQuotes(query.trim()).toLowerCase();
  return (a: string, b: string): number => {
    if (q) {
      const aPrefix = a.toLowerCase().startsWith(q);
      const bPrefix = b.toLowerCase().startsWith(q);
      if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
    }
    if (a.length !== b.length) return a.length - b.length;
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    return aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
  };
};
