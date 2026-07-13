/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Matches named capture groups: (?<name>) and (?P<name>). The name charset
// (letter followed by alphanumerics) excludes lookbehind openers (?<=...) and
// (?<!...) by construction, so `lastIndex` never skips a real group after one
// — a greedy `[^>]*` opener would consume across a preceding lookbehind and
// drop the real group, wrongly flagging its created field as unknown.
const CAPTURE_GROUP_OPENER = /\(\?P?<([A-Za-z][A-Za-z0-9]*)>/g;

// Only names the engine would accept. A name that fails this test never
// becomes a runtime field — registering it would mask a real downstream typo.
const VALID_JAVA_GROUP_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

// grok semantics: `%{SYNTAX:name}`. Underscores are legal here (unlike Java
// groups), so `%{IP:client_ip}` correctly creates field `client_ip`.
const GROK_SEMANTIC = /%\{[A-Za-z0-9_]+:([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Field names a grok/parse/rex pattern string creates. Returns only names that
 * actually materialize at runtime (Java group names filtered by engine rules;
 * grok semantic names with their own charset).
 */
export function extractCreatedFieldNames(literalRaw: string): string[] {
  const names: string[] = [];

  CAPTURE_GROUP_OPENER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CAPTURE_GROUP_OPENER.exec(literalRaw)) !== null) {
    if (VALID_JAVA_GROUP_NAME.test(m[1])) {
      names.push(m[1]);
    }
  }

  GROK_SEMANTIC.lastIndex = 0;
  while ((m = GROK_SEMANTIC.exec(literalRaw)) !== null) {
    names.push(m[1]);
  }

  return names;
}
