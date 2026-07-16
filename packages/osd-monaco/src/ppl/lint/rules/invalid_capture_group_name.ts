/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, findChildByRule } from '../rule_index';
import { rangeFromContext, rangeWithinToken } from '../range_utils';

// Engine ground truth: RegexCommonUtils.isValidJavaRegexGroupName validates
// names against this pattern (core/.../parse/RegexCommonUtils.java:73,101,105).
const VALID_GROUP_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

// Source for the named-group opener matcher. Matches the Java `(?<name>` opener
// and the Python/PCRE `(?P<name>` opener. Group 1 captures the `P` (Python
// opener only); group 2 captures the name.
//
// The `(?![=!])` after `<` excludes a lookbehind opener — `(?<=...)` (positive)
// and `(?<!...)` (negative) are zero-width assertions, NOT named groups, so a
// name must not begin with `=` or `!`. Without this, `(?<=foo)` would be
// mis-read as a capture group named `=foo`.
const CAPTURE_GROUP_OPENER_SOURCE = '\\(\\?(P?)<(?![=!])([^>]*)>';

// Rule names whose string-literal argument carries a regex with capture groups.
// `rexExpr` exists only on the compiled-simplified surface; `parseCommand` and
// `grokCommand` exist on both. `findAllDescendantsByRule` returns [] for a rule
// name absent from the active grammar, so this list degrades gracefully per
// surface with no explicit guard.
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
  // A fresh global regex per call: a module-level `/g` regex carries `lastIndex`
  // across invocations, so a shared instance would skip openers depending on the
  // previous literal's length. This detector runs on every keystroke, so the
  // shared-state bug would be intermittent and hard to reproduce.
  const opener = new RegExp(CAPTURE_GROUP_OPENER_SOURCE, 'g');
  let match: RegExpExecArray | null;

  while ((match = opener.exec(literalRaw)) !== null) {
    const isPythonOpener = match[1] === 'P';
    const name = match[2];
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
    // Guard against a zero-width match looping forever (defensive; the opener
    // always consumes at least `(?<>`).
    if (match.index === opener.lastIndex) {
      opener.lastIndex++;
    }
  }
  return groups;
}

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

/**
 * Locate the regex pattern's string-literal node for an extraction command.
 * `grok`/`parse` carry it as a direct `stringLiteral` child; `rex` nests it
 * under `rexExpr`. The pattern is always the last string literal in source order
 * (a quoted field/mode argument, when present, precedes it), and descendant
 * search yields DFS pop order, so select by source position.
 */
function findPatternLiteral(
  command: ParserRuleContext,
  ruleNameToIndex: (name: string) => number
): ParserRuleContext | undefined {
  const direct = findChildByRule(command, ruleNameToIndex, 'stringLiteral');
  if (direct) {
    return direct;
  }
  let pattern: ParserRuleContext | undefined;
  for (const node of findAllDescendantsByRule(command, ruleNameToIndex, 'stringLiteral')) {
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
    const literalNode = findPatternLiteral(command, ruleNameToIndex);
    if (!literalNode) {
      continue;
    }
    const literalRaw = literalNode.getText();
    const literalToken = literalNode.start;

    for (const group of extractGroups(literalRaw)) {
      // Highlight the exact name; for an empty name there is no name span, so
      // highlight the `<>` pair (one char before the name offset, length 2).
      const isEmptyName = group.name.length === 0;
      const highlightOffset = isEmptyName
        ? group.nameOffsetInLiteral - 1
        : group.nameOffsetInLiteral;
      const highlightLength = isEmptyName ? 2 : group.name.length;
      const range = literalToken
        ? rangeWithinToken(literalToken, highlightOffset, highlightLength)
        : rangeFromContext(literalNode);

      if (group.isPythonOpener) {
        // Fix: delete the single `P`, turning `(?P<name>` into `(?<name>`. The
        // edit targets the `P` span, different from the squiggle (the name), so
        // it needs an explicit fix range.
        const fixRange =
          literalToken && group.pOffsetInLiteral !== undefined
            ? rangeWithinToken(literalToken, group.pOffsetInLiteral, 1)
            : undefined;
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: config.message,
          range,
          docUrl: config.docUrl,
          hoverFacts: { literal: `(?P<${group.name}>` },
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
        // Fix: strip disallowed characters from the name. The squiggle spans the
        // name, so this is an in-place replacement (default range). Offered only
        // when sanitizing yields a valid non-empty name.
        const fixed = isEmptyName ? undefined : sanitizeGroupName(group.name);
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: config.message,
          range,
          docUrl: config.docUrl,
          hoverFacts: { literal: `(?<${group.name}>` },
          ...(fixed
            ? { fix: { title: `Remove invalid characters → "${fixed}"`, text: fixed } }
            : {}),
        });
      }
    }
  }

  return diagnostics;
};
