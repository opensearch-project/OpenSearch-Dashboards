/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule } from '../rule_index';
import { findPatternLiteral } from '../pattern_literal';
import { rangeFromContext, rangeWithinToken } from '../range_utils';

// Engine ground truth: RegexCommonUtils.isValidJavaRegexGroupName validates
// names against this pattern (core/.../parse/RegexCommonUtils.java:73,101,105).
const VALID_GROUP_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

/**
 * Produce the Java-valid form of a capture-group name by stripping disallowed
 * characters, then removing any leading digits so the first-character rule
 * holds. Returns `undefined` when nothing valid remains (e.g. `123` -> `''`,
 * `1-2` -> `''`), so a quick-fix is never offered when it would re-fire the
 * same diagnostic.
 */
function sanitizeGroupName(name: string): string | undefined {
  const cleaned = name.replace(/[^A-Za-z0-9]/g, '').replace(/^[0-9]+/, '');
  return VALID_GROUP_NAME.test(cleaned) ? cleaned : undefined;
}

// Matches both the Java `(?<name>` opener and the Python/PCRE `(?P<name>`
// opener. Group 1 captures the `P` when the Python opener is used; group 2
// captures the name.
const CAPTURE_GROUP_OPENER = /\(\?(P?)<([^>]*)>/g;

// Rule names whose string-literal argument carries a regex with capture groups.
const REGEX_COMMAND_RULES = ['rexExpr', 'parseCommand', 'grokCommand'];

interface ExtractedGroup {
  name: string;
  isPythonOpener: boolean;
  /** 0-based offset of the name within the raw (quoted) literal text. */
  nameOffsetInLiteral: number;
  /** 0-based offset of the `P` char within the raw literal (Python opener only). */
  pOffsetInLiteral?: number;
}

function extractGroups(literalRaw: string): ExtractedGroup[] {
  const groups: ExtractedGroup[] = [];
  CAPTURE_GROUP_OPENER.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CAPTURE_GROUP_OPENER.exec(literalRaw)) !== null) {
    const isPythonOpener = match[1] === 'P';
    const name = match[2];
    // Offset of the name within the literal: opener start + length up to name.
    const openerStart = match.index;
    const prefixLength = isPythonOpener ? '(?P<'.length : '(?<'.length;
    groups.push({
      name,
      isPythonOpener,
      nameOffsetInLiteral: openerStart + prefixLength,
      // The `P` sits right after `(?`; recording its offset lets the quick-fix
      // delete just that one character.
      pOffsetInLiteral: isPythonOpener ? openerStart + '(?'.length : undefined,
    });
  }
  return groups;
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
    const literalNode = findPatternLiteral(command, ruleNameToIndex);
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
        // Fix A: delete the single `P`, turning `(?P<name>` into `(?<name>`.
        // The name is untouched, so the edit targets a span (the `P`) different
        // from the squiggle (the name) and needs an explicit fix range.
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
        // Fix B: strip disallowed characters from the name. The squiggle spans
        // exactly the name, so this is an in-place replacement (default range).
        // Only offered when sanitizing yields a valid non-empty name.
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
