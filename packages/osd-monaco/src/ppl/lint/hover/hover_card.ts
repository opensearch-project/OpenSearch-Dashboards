/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure renderer for supplemental lint-hover guidance. Monaco's built-in marker
 * hover already renders the diagnostic message, severity, and linked rule code;
 * this renderer adds only the next action, an optional quick-fix preview, and
 * the documentation link.
 *
 * Intentionally free of any Monaco import so it is trivially unit-testable; the
 * provider does the Monaco-specific marker extraction and hands plain values
 * here.
 */

export interface HoverCardInput {
  /** code.target — the specific doc link from the catalog. */
  docUrl?: string;
  /** Static, task-oriented guidance for this rule (catalog `howToFix`). */
  howToFix?: string;
  /** Quick-fix preview text (the replacement), when a MarkerFix exists. */
  fixText?: string;
}

/**
 * Render a value as inline code. When the value itself contains backticks, fence
 * it with a longer run of backticks (and pad with a space, per CommonMark §6.3)
 * so the literal backticks survive verbatim rather than being substituted for a
 * lookalike glyph.
 */
function code(text: string): string {
  const runs = text.match(/`+/g);
  const longestRun = runs ? Math.max(...runs.map((r) => r.length)) : 0;
  const fence = '`'.repeat(longestRun + 1);
  const pad = longestRun > 0 ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

/** Percent-encode parentheses so they cannot close a Markdown link target. */
function encodeLinkTarget(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * Render supplemental hover sections to a Markdown string. The provider wraps
 * non-empty output in `{ value, isTrusted: false }` and hands it to Monaco.
 */
export function renderHoverCard(input: HoverCardInput): string {
  const { docUrl, howToFix, fixText } = input;
  const sections: string[] = [];

  // Every known rule gives the user a concrete next action, whether or not an
  // automatic edit can be offered safely.
  if (howToFix) {
    // Bundled repository-authored guidance intentionally retains inline-code
    // Markdown. The provider does not read execution-time overrides here and
    // returns this section with isTrusted:false.
    sections.push(`**Fix** — ${howToFix}`);
  }

  // Exact replacement preview for deterministic quick fixes.
  if (fixText !== undefined) {
    sections.push(`**Quick fix available** — ${code(fixText)}`);
  }

  if (docUrl) {
    sections.push(`[Learn more →](${encodeLinkTarget(docUrl)})`);
  }

  return sections.join('\n\n');
}
