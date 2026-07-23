/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { DOTTED_PATH_RULES, findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { findLongestTypedPrefix, parseFieldPath } from '../field_path';

// Live 3.8 (Calcite): a flat_object field can't be referenced in PPL at all — dotted
// subfield and bare root both raise "Field not found". Diagnostic-only (no valid rewrite);
// flag a reference only when its longest typed prefix (not just leading segment) is flat_object.

const FLAT_OBJECT_TYPES: ReadonlySet<string> = new Set(['flat_object']);

export const flatObjectSubfieldDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const seen = new Set<number>();

  for (const ruleName of DOTTED_PATH_RULES) {
    for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, ruleName)) {
      const parsed = parseFieldPath(node.getText());
      if (!parsed) {
        continue;
      }
      const typedPrefix = findLongestTypedPrefix(parsed.segments, typeMap);
      if (!typedPrefix || !FLAT_OBJECT_TYPES.has(typedPrefix.type)) {
        continue;
      }

      // Dedup by source position: a node may be reachable via more than one rule name.
      const startIndex = node.start?.start ?? -1;
      if (seen.has(startIndex)) {
        continue;
      }
      seen.add(startIndex);

      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: config.message,
        range: rangeFromContext(node),
        docUrl: config.docUrl,
        hoverFacts: {
          field: parsed.canonical,
          root: typedPrefix.path,
          esType: typedPrefix.type,
        },
      });
    }
  }

  return diagnostics;
};
