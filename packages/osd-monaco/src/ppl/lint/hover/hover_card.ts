/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure renderer for the lint hover card ("view more") body. Composes the
 * detector message, static per-rule guidance (`Fix`), an optional quick-fix
 * preview, and the doc link into a single Markdown string. Intentionally free of
 * any Monaco import so it is trivially unit-testable; the provider does the
 * Monaco-specific marker extraction and hands plain values here.
 *
 * The detector message already identifies the problem and its consequence.
 * Keeping the card focused on that message and the next action avoids repeating
 * the same field, value, and engine outcome in several differently named
 * sections.
 */

export type SeverityLabel = 'Error' | 'Warning' | 'Info';

export interface HoverCardInput {
  severityLabel: SeverityLabel;
  /** The marker's short message — always shown as the card lead. */
  message: string;
  /** code.target — the specific doc link from the catalog. */
  docUrl?: string;
  /** Static, task-oriented guidance for this rule (catalog `howToFix`). */
  howToFix?: string;
  /** Quick-fix preview text (the replacement), when a MarkerFix exists. */
  fixText?: string;
}

const SEVERITY_GLYPH: Record<SeverityLabel, string> = {
  Error: '❌',
  Warning: '⚠️',
  Info: 'ℹ️',
};

// Escapes Markdown inline-formatting chars in untrusted text. ( ) # ! are intentionally
// omitted: hover content renders with isTrusted:false (no command links), link targets are
// built separately via encodeLinkTarget (which percent-encodes parentheses), and ! cannot
// form an image because [ is already escaped here.
function escapeInline(text: string): string {
  return text.replace(/([\\`*_[\]<>~|])/g, '\\$1');
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

/**
 * Make a URL safe to drop into a Markdown link target. An unescaped `)` would
 * close the `[text](url)` form early; percent-encoding parens keeps the link
 * intact and is decoded transparently by the browser.
 */
function encodeLinkTarget(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

/**
 * Render the full hover card to a Markdown string. The provider wraps the result
 * in `{ value, isTrusted: false }` and hands it to Monaco.
 */
export function renderHoverCard(input: HoverCardInput): string {
  const { severityLabel, message, docUrl, howToFix, fixText } = input;
  const lines: string[] = [];

  // The rule id remains on the marker for lookup and support diagnostics, but it
  // is implementation detail rather than the card's headline.
  lines.push(`${SEVERITY_GLYPH[severityLabel]} **${severityLabel}**`);

  // Lead: the short message (always present).
  lines.push('');
  lines.push(escapeInline(message));

  // Every known rule gives the user a concrete next action, whether or not an
  // automatic edit can be offered safely.
  if (howToFix) {
    lines.push('');
    lines.push(`**Fix** — ${howToFix}`);
  }

  // Exact replacement preview for deterministic quick fixes.
  if (fixText !== undefined) {
    lines.push('');
    lines.push(`**Quick fix available** — ${code(fixText)}`);
  }

  // Learn more — the specific doc link.
  if (docUrl) {
    lines.push('');
    lines.push(`[Learn more →](${encodeLinkTarget(docUrl)})`);
  }

  return lines.join('\n');
}
