/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule, RuleNameToIndex } from '../rule_index';
import { rangeFromContext, rangeWithinToken } from '../range_utils';

const VALID_GROUP_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

function sanitizeGroupName(name: string): string | undefined {
  const cleaned = name.replace(/[^A-Za-z0-9]/g, '').replace(/^[0-9]+/, '');
  return VALID_GROUP_NAME.test(cleaned) ? cleaned : undefined;
}

const CAPTURE_GROUP_OPENER = /\(\?(P?)<([^>]*)>/g;

const REGEX_COMMAND_RULES = ['rexExpr', 'parseCommand', 'grokCommand'];

interface ExtractedGroup {
  name: string;
  isPythonOpener: boolean;
  nameOffsetInLiteral: number;
  pOffsetInLiteral?: number;
}

function extractGroups(literalRaw: string): ExtractedGroup[] {
  const groups: ExtractedGroup[] = [];
  CAPTURE_GROUP_OPENER.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CAPTURE_GROUP_OPENER.exec(literalRaw)) !== null) {
    const isPythonOpener = match[1] === 'P';
    const name = match[2];
    const openerStart = match.index;
    const prefixLength = isPythonOpener ? '(?P<'.length : '(?<'.length;
    groups.push({
      name,
      isPythonOpener,
      nameOffsetInLiteral: openerStart + prefixLength,
      pOffsetInLiteral: isPythonOpener ? openerStart + '(?'.length : undefined,
    });
  }
  return groups;
}

function findStringLiteral(
  command: ParserRuleContext,
  ruleNameToIndex: RuleNameToIndex
): ParserRuleContext | undefined {
  const direct = findChildByRule(command, ruleNameToIndex, 'stringLiteral');
  if (direct) {
    return direct;
  }
  const descendants = findAllDescendantsByRule(command, ruleNameToIndex, 'stringLiteral');
  let pattern: ParserRuleContext | undefined;
  for (const node of descendants) {
    if (!pattern || (node.start?.start ?? -1) > (pattern.start?.start ?? -1)) {
      pattern = node;
    }
  }
  return pattern;
}

export const invalidCaptureGroupNameDetector: Detector = (
  tree,
  config,
  _context,
  ruleNameToIndex
) => {
  const diagnostics: Diagnostic[] = [];

  const commands: ParserRuleContext[] = [];
  for (const ruleName of REGEX_COMMAND_RULES) {
    commands.push(...findAllDescendantsByRule(tree, ruleNameToIndex, ruleName));
  }

  for (const command of commands) {
    const literalNode = findStringLiteral(command, ruleNameToIndex);
    if (!literalNode) {
      continue;
    }
    const literalRaw = literalNode.getText();
    const groups = extractGroups(literalRaw);
    const literalToken = literalNode.start;

    for (const group of groups) {
      const range = literalToken
        ? rangeWithinToken(literalToken, group.nameOffsetInLiteral, Math.max(1, group.name.length))
        : rangeFromContext(literalNode);

      if (group.isPythonOpener) {
        const fixRange =
          literalToken && group.pOffsetInLiteral !== undefined
            ? rangeWithinToken(literalToken, group.pOffsetInLiteral, 1)
            : undefined;
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: `Python/PCRE named-group opener "(?P<${group.name}>" is invalid in Java regex; use "(?<${group.name}>" instead.`,
          range,
          docUrl: config.docUrl,
          ...(fixRange
            ? {
                fix: {
                  title: 'Convert to Java named-group syntax "(?<…>"',
                  text: '',
                  range: fixRange,
                },
              }
            : {}),
        });
        continue;
      }

      if (!VALID_GROUP_NAME.test(group.name)) {
        const fixed = sanitizeGroupName(group.name);
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: `Invalid capture group name "${group.name}". Names must match ^[A-Za-z][A-Za-z0-9]*$.`,
          range,
          docUrl: config.docUrl,
          ...(fixed
            ? { fix: { title: `Remove invalid characters → "${fixed}"`, text: fixed } }
            : {}),
        });
      }
    }
  }

  return diagnostics;
};
