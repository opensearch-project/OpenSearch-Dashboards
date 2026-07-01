/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllChildrenByRule, findAllDescendantsByRule } from '../rule_index';
import { rangeFromContext } from '../range_utils';

export const multisearchMinSubsearchDetector: Detector = (
  tree,
  config,
  _context,
  ruleNameToIndex
) => {
  const diagnostics: Diagnostic[] = [];
  const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'multisearchCommand');

  for (const command of commands) {
    const subSearches = findAllChildrenByRule(command, ruleNameToIndex, 'subSearch');
    if (subSearches.length < 2) {
      diagnostics.push({
        ruleId: config.id,
        severity: config.severity,
        message: 'multisearch requires at least two subsearches.',
        range: rangeFromContext(command),
        docUrl: config.docUrl,
      });
    }
  }

  return diagnostics;
};
