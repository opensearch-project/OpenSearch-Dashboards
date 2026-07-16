/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { DOTTED_PATH_RULES, findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';
import { findLongestTypedPrefix, parseFieldPath } from '../field_path';

// Engine ground truth (live-verified 2026-06-25, OpenSearch 3.8 with Calcite on;
// see ppl-flat-object-engine-behavior.md): a `flat_object` field cannot be
// referenced in PPL at all. Both a dotted subfield (`attributes.http.method`)
// AND the bare root (`attributes`) raise `IllegalArgumentException: Field [...]
// not found.` The data is reachable only at the DSL/document level, never
// through a PPL expression. This rule surfaces it before Run, as an error.
// Self-suppresses without a typeMap.
//
// No quick-fix: there is no valid PPL rewrite target (neither the root, a
// flatten, nor a cast works), so the rule is diagnostic-only.
//
// field-validation does NOT cover the bare root: the root IS present in
// `_field_caps` (as a flat_object), so a bare `fields attributes` slips through
// it. This rule therefore flags the whole reference — dotted or not — whose
// longest typed prefix is a flat_object.
//
// Longest typed prefix (not just the leading segment): for `a.b.c`, if `a.b` is
// independently typed (e.g. `keyword`), the reference is to that queryable field
// and must NOT be flagged even when `a` is a flat_object. A flat_object's
// subfields never appear in `_field_caps` as separately-typed fields, so a more
// specific typed prefix proves the reference is not under the flat_object.
//
// Grammar anchor (both surfaces): field references parse to a `qualifiedName`
// (where/eval/by) or a `wcQualifiedName` (fields projection); both carry the
// full reference text.
const FLAT_OBJECT_TYPES: ReadonlySet<string> = new Set(['flat_object']);

export const flatObjectSubfieldDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const typeMap = context.typeMap;
  if (!typeMap || typeMap.size === 0) {
    return []; // self-suppress without type metadata
  }

  const diagnostics: Diagnostic[] = [];
  const seen = new Set<number>();

  for (const ruleName of DOTTED_PATH_RULES) {
    for (const node of findAllDescendantsByRule(tree, ruleNameToIndex, ruleName)) {
      const parsed = parseFieldPath(node.getText());
      if (!parsed) {
        continue; // malformed quoted path — suppress rather than guess
      }
      const typedPrefix = findLongestTypedPrefix(parsed.segments, typeMap);
      if (!typedPrefix || !FLAT_OBJECT_TYPES.has(typedPrefix.type)) {
        continue;
      }

      // Dedup by source position so a node reachable via more than one rule name
      // is reported once.
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
