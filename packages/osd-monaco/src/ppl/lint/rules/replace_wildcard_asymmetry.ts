/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllChildrenByRule, findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext, unquote } from '../range_utils';

// Engine ground truth: replace throws IllegalArgumentException (wildcard
// symmetry validation) when the replacement wildcard count differs from the
// pattern count and is non-zero. Not caught by the Calcite-to-v2 fallback
// (default plugins.calcite.fallback.allowed=false). `replace` is Calcite-only
// and runtime-only.

/** Count unescaped `*` occurrences in a string, excluding `\*`. Exported for unit tests. */
export function countUnescapedWildcards(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*') {
      // An odd number of preceding backslashes means the `*` is escaped.
      let backslashes = 0;
      let j = i - 1;
      while (j >= 0 && text[j] === '\\') {
        backslashes++;
        j--;
      }
      if (backslashes % 2 === 0) {
        count++;
      }
    }
  }
  return count;
}

export const replaceWildcardAsymmetryDetector: Detector = (
  tree,
  config,
  context,
  ruleNameToIndex
) => {
  // Runtime-only + Calcite-gated. `replacePair` is absent on the compiled
  // surface → findAllDescendantsByRule returns [] → clean no-op.
  if (context.isCalcite !== true) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const pairs = findAllDescendantsByRule(tree, ruleNameToIndex, 'replacePair');

  for (const pair of pairs) {
    const literals = findAllChildrenByRule(pair, ruleNameToIndex, 'stringLiteral');
    if (literals.length < 2) {
      continue;
    }
    // getText() returns the raw literal, so countUnescapedWildcards sees escapes
    // exactly as written in the query (e.g. `\*` stays escaped, `\\*` is a real
    // wildcard) — the same view the user sees in the editor, which is what we
    // want to lint against.
    const patternText = unquote(literals[0].getText());
    const replacementText = unquote(literals[1].getText());
    const patternCount = countUnescapedWildcards(patternText);
    const replacementCount = countUnescapedWildcards(replacementText);

    if (replacementCount !== 0 && replacementCount !== patternCount) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(pair),
        docUrl: config.docUrl,
        hoverFacts: { patternWildcards: patternCount, replacementWildcards: replacementCount },
      });
    }
  }

  return diagnostics;
};
