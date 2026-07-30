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
//
// Catalogued `sourceScoped`: `disabledObjectFields` describes the selected
// dataset's mapping, so an explicit `source=` naming a different index would have
// this checked against the wrong mapping and report a field that is perfectly
// indexed there.
export const enabledFalseObjectDetector: Detector = (tree, config, context, ruleNameToIndex) => {
  const disabled = context.disabledObjectFields;
  if (!disabled || disabled.size === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];

  for (const node of collectDottedPathNodes(tree, ruleNameToIndex)) {
    const path = node.getText();
    // A disabled object may itself be dotted (e.g. `outer.inner`), which is the
    // form the producer (`collectDisabledObjectFields`) emits. Match the full
    // path or any subfield beneath it; the `d + '.'` boundary keeps `log` from
    // matching an unrelated `logger.field`.
    const disabledRoot = [...disabled].find((d) => path === d || path.startsWith(d + '.'));
    if (!disabledRoot) {
      continue;
    }

    diagnostics.push({
      ruleId: config.id,
      severity: config.severity,
      message: config.message,
      range: rangeFromContext(node),
      docUrl: config.docUrl,
    });
  }

  return diagnostics;
};
