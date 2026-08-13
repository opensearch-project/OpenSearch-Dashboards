/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AskPPLLintFixRequest } from '../../lint_bridge';

/** Hard cap on the query characters included in an AI chat fix request. */
export const MAX_QUERY_CHARS = 4096;

/** Truncate to the requested cap, marking the cut so the model knows it is partial. */
export function capLength(text: string, max: number = MAX_QUERY_CHARS): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}… [truncated]`;
}

export type BuildChatFixMessageInput = Omit<AskPPLLintFixRequest, 'chatMessage' | 'lintContext'>;

export const DEFAULT_PPL_LINT_FIX_TOOL_NAME = 'apply_ppl_lint_fix';

/**
 * Derive the silent test-tool name from the apply-tool name by swapping the
 * `apply_` prefix for `test_`. The host registers the two names as a pair (see
 * PPL_LINT_FIX_DATA_TOOL_NAME / PPL_LINT_FIX_TEST_DATA_TOOL_NAME); deriving it
 * here keeps the leaf package from needing a second injected name.
 */
export function deriveTestToolName(applyToolName: string): string {
  return applyToolName.startsWith('apply_')
    ? `test_${applyToolName.slice('apply_'.length)}`
    : `test_${applyToolName}`;
}

/** Stable, non-cryptographic hash used only to correlate a fix with its source text. */
export function hashPPLLintFixSource(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash * 31 + query.charCodeAt(i)) % 4294967291;
  }
  return hash.toString(36).padStart(7, '0');
}

/**
 * The SHORT, human-facing chat bubble the user sees when they click "Ask AI to
 * fix". It carries only a plain-language explanation, the part to fix, and the
 * query. Technical instructions for the model ride out-of-band via
 * {@link buildChatFixContext} so they never clutter the chat.
 */
export function buildChatFixMessage(request: BuildChatFixMessageInput): string {
  const query = capLength(request.query);
  const target = request.diagnostic.targetText;

  return [
    'Please fix this query.',
    '',
    request.diagnostic.message,
    ...(target ? ['', `Part to fix: \`${capLength(target, 512)}\``] : []),
    '',
    '```ppl',
    query,
    '```',
  ].join('\n');
}

/**
 * The out-of-band instructions for the model: how to correct the query and how to
 * hand the result back. Pushed into the assistant context store (AG-UI `context`
 * array) so the model receives it while the chat UI renders nothing for it. No
 * correlation ids are included — the UI tracks the single active fix request, so
 * the tool takes only the corrected query (no id/hash to echo, which weaker models
 * filled incorrectly and sent into a tool-call loop).
 */
export function buildChatFixContext(request: BuildChatFixMessageInput): string {
  const ruleId = request.diagnostic.ruleId || 'ppl-lint';
  const target = request.diagnostic.targetText;
  const related = request.diagnostic.relatedTexts?.filter(Boolean) ?? [];
  const rewriteContract = request.diagnostic.fixInstructions?.trim();
  const testToolName = deriveTestToolName(request.toolName);

  return [
    'You are correcting a PPL query for the OpenSearch Explore lint quick-fix flow.',
    `Diagnostic: ${ruleId} - ${request.diagnostic.message}`,
    '',
    ...(target
      ? [
          `The finding is precisely attributed to this source slice: ${capLength(target, 512)}`,
          ...(related.length
            ? [
                `Related definition/use slice(s): ${related
                  .map((text) => capLength(text, 256))
                  .join(', ')}`,
              ]
            : []),
          ...(rewriteContract
            ? [
                'This source slice identifies where the finding occurs; do not rewrite it unless the mandatory contract below explicitly says to.',
              ]
            : [
                'Change ONLY that attributed slice. Every other part of the query — the source, each WHERE clause (including any time-range filter), rex/grok/parse, stats, eventstats, eval, sort, head, and every field name and literal — MUST be copied into your candidate character-for-character, unchanged and in the same order.',
                'Do NOT remove, reorder, add, merge, or "improve" any other stage, even one that looks unrelated or redundant. A time-range filter or any other WHERE is intentional; dropping it is wrong.',
                'A candidate that alters, drops, or reorders any stage other than the attributed slice is WRONG and must not be proposed, even if it happens to clear the finding. If your only way to clear the finding would change another stage, treat the query as not automatically fixable.',
              ]),
        ]
      : [
          'Make the smallest possible correction that clears the diagnostic. Preserve every pipeline command, field, filter (including any time-range WHERE), literal, and the command order exactly; change only the minimal text needed. Do not remove or reorder stages that look unrelated — they are intentional.',
        ]),
    ...(rewriteContract
      ? [
          'MANDATORY rule-specific rewrite contract:',
          rewriteContract,
          'Your FIRST candidate MUST implement that contract literally. Copy every quoted query stage and literal character-for-character; do not specialize, broaden, substitute, or otherwise reinterpret it.',
        ]
      : []),
    'Do not execute the query.',
    `For this fix flow, call only ${testToolName} and ${request.toolName}. Never call a query execution, search, visualization, or other tool.`,
    // The core behavioral change: test candidates silently, then only surface the
    // best one that actually clears the finding — never propose a fix that would
    // be rejected in front of the user.
    `First, silently verify the candidate with the ${testToolName} tool, which returns { ok, reason, message }. It shows the user nothing.`,
    ...(rewriteContract
      ? [
          `If ${testToolName} returns ok:false, reread the mandatory contract and correct only transcription or placement mistakes. Do not improvise a different rewrite.`,
        ]
      : [
          `If ${testToolName} returns ok:false, use its reason and message to try a genuinely different candidate.`,
        ]),
    `Only call the ${request.toolName} tool for a candidate whose ${testToolName} result was ok:true — that is the only call the user sees, so it must be a fix that works.`,
    `As soon as ${testToolName} returns ok:true, immediately call ${request.toolName} with that same candidate. Do NOT stop to ask the user whether to apply it, and do NOT describe the fix and wait — calling ${request.toolName} renders an Apply / Dismiss card, which IS the user's approval step, so asking first is redundant and leaves the fix unusable.`,
    `If, after a few genuinely different candidates, none return ok:true, tell the user in one plain sentence that this query cannot be automatically fixed, and do NOT call ${request.toolName} at all. Never present a fix you could not verify.`,
    'Keep any explanation to one short sentence in plain language. Say what changed and why it helps. Do not mention rule IDs, attribution, Painless scripts, pushdown, indexes, data nodes, coordinators, or per-document evaluation.',
    'Do not ask the user for a request id or hash — the UI already tracks the active request.',
  ].join('\n');
}
