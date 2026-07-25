/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { collectDottedPathNodes } from '../rule_index';
import { rangeFromContext } from '../range_utils';

// Engine ground truth (verified live on OpenSearch 3.7): a field inside an object
// mapped `enabled: false` is not indexed. A reference to it returns null with
// schema type `undefined` and HTTP 200 — a silent failure, unlike flat_object
// subfields, which error loudly. The real value is never surfaced.
//
// `typeMap` cannot detect this: enabled:false fields are absent from
// `_field_caps`, which is what typeMap is built from. The host instead supplies
// `disabledObjectFields` — the object field names mapped `enabled:false`, derived
// from a `_mappings` walk. The rule self-suppresses when that set is absent.
//
// Grammar anchor (both surfaces): a dotted reference parses to a `qualifiedName`
// (where/eval/by) or a `wcQualifiedName` (fields projection), and both carry the
// full dotted path as their text.
export const enabledFalseObjectDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const disabled = context.disabledObjectFields;
  if (!disabled || disabled.size === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];

  for (const node of collectDottedPathNodes(tree, ruleNameToIndex)) {
    const path = node.getText();
    const root = path.slice(0, path.indexOf('.'));
    if (!disabled.has(root)) {
      continue;
    }

    diagnostics.push({
      ruleId: config.id,
      severity: config.severity,
      message: config.message,
      range: rangeFromContext(node),
      docUrl: config.docUrl,
      // The hover card renders the specific field and its enclosing object.
      hoverFacts: { field: path, root },
    });
  }

  return diagnostics;
};
