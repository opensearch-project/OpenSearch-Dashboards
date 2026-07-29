/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from '../diagnostic';
import { Detector } from '../types';
import { findAllDescendantsByRule, isTerminalNode, RuleNameToIndex } from '../rule_index';
import { findPatternLiteral } from '../pattern_literal';
import { rangeFromContext, rangeWithinToken } from '../range_utils';

// Engine ground truth: OpenSearch validates capture-group names with
// RegexCommonUtils.isValidJavaRegexGroupName, which accepts exactly this shape
// (core/.../parse/RegexCommonUtils.java, present from 3.4 onward via #4434 and
// unchanged through current main). Matched verbatim so the rule and the engine
// never disagree on which names are invalid.
const VALID_GROUP_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

// Mirrors OpenSearch's own lexerless name scan
// (RegexCommonUtils.ANY_NAMED_GROUP_PATTERN = `\(\?<([^>]+)>`, unchanged 3.4 →
// main). It is deliberately naive: it does NOT understand escapes, character
// classes, `\Q…\E`, or lookbehind, because the engine's scan does not either. On
// 3.4+ clusters that means a lookbehind such as `(?<=id: )(?<word>…)` is rejected
// by the engine (it reads the phantom name `=id: )(?<word`), so this rule flags
// it too — an escape/lexer-aware scan here would emit a false negative against
// the real engine. Group 1 captures the `P` of a Python/PCRE opener
// (`(?P<name>`); group 2 captures the name.
const CAPTURE_GROUP_OPENER = /\(\?(P?)<([^>]*)>/g;

// Extraction commands whose string-literal pattern reaches the engine's
// capture-group name validator: `rex` in extract mode and `parse`. `grok` uses a
// different dialect that never reaches this validator, and `rex mode=sed` treats
// the pattern as a sed substitution (its text is never read as capture-group
// names), so both are excluded — grok by its absence here, sed by `isSedMode`.
const REGEX_COMMAND_RULES = ['rexExpr', 'parseCommand'];

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

/**
 * True when a `rex` command runs in sed mode (`rex field=… mode=sed …`). In sed
 * mode the pattern is a sed substitution whose text OpenSearch never reads as
 * capture-group names, so this rule must not inspect it. Detected off the parse
 * tree — a `rexOption` child whose `MODE EQUAL (EXTRACT | SED)` alternative
 * resolved to the `SED` terminal — rather than by text matching, so option
 * order, casing (the lexer is case-insensitive), and whitespace do not affect
 * the result. Returns false for a `parseCommand`, which carries no `rexOption`.
 */
function isSedMode(command: ParserRuleContext, ruleNameToIndex: RuleNameToIndex): boolean {
  for (const option of findAllDescendantsByRule(command, ruleNameToIndex, 'rexOption')) {
    for (const child of option.children ?? []) {
      if (isTerminalNode(child) && child.getText().toUpperCase() === 'SED') {
        return true;
      }
    }
  }
  return false;
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
    if (isSedMode(command, ruleNameToIndex)) {
      continue;
    }
    const literalNode = findPatternLiteral(command, ruleNameToIndex);
    if (!literalNode) {
      continue;
    }
    const literalRaw = literalNode.getText();
    const groups = extractGroups(literalRaw);
    const literalToken = literalNode.start;

    // Case-sensitive count of the names that would exist after every Python
    // opener is converted to Java syntax. Conversion keeps the name unchanged,
    // so this is simply the multiset of all group names in this one pattern.
    // Used to withhold the Python-opener fix when converting would introduce a
    // duplicate named group (which the engine rejects) rather than silently
    // create one. Names are case-sensitive in Java regex, so the raw name keys
    // the map directly.
    const nameCounts = new Map<string, number>();
    for (const group of groups) {
      nameCounts.set(group.name, (nameCounts.get(group.name) ?? 0) + 1);
    }

    for (const group of groups) {
      const range = literalToken
        ? rangeWithinToken(literalToken, group.nameOffsetInLiteral, Math.max(1, group.name.length))
        : rangeFromContext(literalNode);
      const nameIsValid = VALID_GROUP_NAME.test(group.name);

      if (group.isPythonOpener) {
        if (!nameIsValid) {
          // Two defects in one opener: unsupported Python/PCRE syntax AND an
          // invalid name. One combined diagnostic, and no fix — deleting the `P`
          // would leave the still-invalid name and re-fire the rule.
          diagnostics.push({
            ruleId: config.id,
            severity: config.severity,
            message: `Python/PCRE named-group syntax "(?P<${group.name}>" is not supported, and "${group.name}" is not a valid capture group name. Use "(?<…>" with a name containing only letters and numbers and starting with a letter.`,
            range,
            docUrl: config.docUrl,
          });
          continue;
        }

        // Valid Python name. Offer the P-deletion fix only when the resulting
        // name is unique among all groups in the pattern; if it collides,
        // converting would create a duplicate named group the engine rejects, so
        // withhold the fix. The edit targets the `P` (a span different from the
        // squiggled name) and needs an explicit fix range.
        const unique = nameCounts.get(group.name) === 1;
        const fixRange =
          unique && literalToken && group.pOffsetInLiteral !== undefined
            ? rangeWithinToken(literalToken, group.pOffsetInLiteral, 1)
            : undefined;
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: `Python/PCRE named-group syntax "(?P<${group.name}>" is not supported; use "(?<${group.name}>" instead.`,
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

      // Java opener: flag only an invalid name. A valid name is accepted by the
      // engine and gets no diagnostic; this rule does not offer a rename fix,
      // because renaming would silently change the extracted field name.
      if (!nameIsValid) {
        diagnostics.push({
          ruleId: config.id,
          severity: config.severity,
          message: `Invalid capture group name "${group.name}". Use only letters and numbers, and start with a letter.`,
          range,
          docUrl: config.docUrl,
        });
      }
    }
  }

  return diagnostics;
};
