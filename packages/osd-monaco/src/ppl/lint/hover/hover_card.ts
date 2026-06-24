/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleHoverContent, FailureClass } from './engine_outcomes';
import { HoverFacts } from './hover_registry';

export type SeverityLabel = 'Error' | 'Warning' | 'Info';

export interface HoverCardInput {
  ruleId: string;
  severityLabel: SeverityLabel;
  message: string;
  docUrl?: string;
  content?: RuleHoverContent;
  facts?: HoverFacts;
}

const SEVERITY_GLYPH: Record<SeverityLabel, string> = {
  Error: '❌',
  Warning: '⚠️',
  Info: 'ℹ️',
};

const FAILURE_CLASS_EXPLAINER: Record<FailureClass, string> = {
  'silent-null':
    'the query succeeds (HTTP 200) but a value resolves to null and propagates silently — nothing signals that anything went wrong.',
  'silent-empty':
    'the query succeeds (HTTP 200) but matches zero rows — it looks like "no data" rather than a mistake.',
  'engine-throw': 'the engine rejects the query, so it will not run.',
  nondeterministic:
    'the query runs, but the rows it returns are not stable across identical re-runs.',
  fallback:
    'the primary engine cannot run this natively and falls back to a secondary engine — it succeeds, but on a slower path.',
  advisory:
    'the query runs and may return data, but the command can behave differently than intended on this input — this is a heads-up, not a guaranteed outcome.',
};

function escapeInline(text: string): string {
  return text.replace(/([\\`*_[\]<>~|])/g, '\\$1');
}

function code(text: string): string {
  const runs = text.match(/`+/g);
  const longestRun = runs ? Math.max(...runs.map((r) => r.length)) : 0;
  const fence = '`'.repeat(longestRun + 1);
  const pad = longestRun > 0 ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

function encodeLinkTarget(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function renderFactsLine(facts: HoverFacts): string | undefined {
  if (facts.pattern !== undefined) {
    const head =
      facts.totalIndices !== undefined
        ? `${code(facts.pattern)} matched 0 of ${facts.totalIndices} visible indices.`
        : `${code(facts.pattern)} matched no visible index.`;
    if (facts.candidateIndices && facts.candidateIndices.length > 0) {
      return `${head} Did you mean one of: ${facts.candidateIndices.map(code).join(', ')}?`;
    }
    return head;
  }

  if (facts.field !== undefined) {
    const parts: string[] = [];
    if (facts.root !== undefined) {
      parts.push(
        facts.esType !== undefined
          ? `${code(facts.field)} lives inside ${code(facts.root)}, mapped as ${code(
              facts.esType
            )} on this index.`
          : `${code(facts.field)} lives inside ${code(facts.root)}.`
      );
    } else if (facts.esType !== undefined) {
      parts.push(`${code(facts.field)} is mapped as ${code(facts.esType)} on this index.`);
    } else {
      parts.push(`${code(facts.field)}.`);
    }
    if (facts.aggName !== undefined) {
      parts.push(`${code(facts.aggName + '()')} needs a numeric type.`);
    }
    if (facts.literal !== undefined) {
      parts.push(`Compared to ${code(facts.literal)}.`);
    }
    if (facts.suggestion !== undefined) {
      parts.push(`Closest known field: ${code(facts.suggestion)}.`);
    }
    return parts.join(' ');
  }

  if (facts.literal !== undefined) {
    return `Offending value: ${code(facts.literal)}.`;
  }

  return undefined;
}

export function renderHoverCard(input: HoverCardInput): string {
  const { ruleId, severityLabel, message, docUrl, content, facts } = input;
  const lines: string[] = [];

  lines.push(`${SEVERITY_GLYPH[severityLabel]} **${escapeInline(ruleId)}** · ${severityLabel}`);

  lines.push('');
  lines.push(escapeInline(message));

  if (content) {
    const verified = content.verifiedVersion
      ? ` _(verified on OpenSearch ${escapeInline(content.verifiedVersion)})_`
      : '';
    lines.push('');
    lines.push(`**Engine behavior** — ${escapeInline(content.engineBehavior)}${verified}`);
  }

  if (facts) {
    const factsLine = renderFactsLine(facts);
    if (factsLine) {
      lines.push('');
      lines.push(`**Your query** — ${factsLine}`);
    }
  }

  if (content) {
    lines.push('');
    lines.push(
      `**Why ${severityLabel.toLowerCase()}** — ${FAILURE_CLASS_EXPLAINER[content.failureClass]}`
    );
  }

  if (content?.safeToIgnoreWhen) {
    const label =
      content.failureClass === 'engine-throw' ? 'Possible false positive' : 'Safe to ignore';
    lines.push('');
    lines.push(`**${label}** — ${escapeInline(content.safeToIgnoreWhen)}`);
  }

  if (docUrl) {
    lines.push('');
    lines.push(`[Learn more →](${encodeLinkTarget(docUrl)})`);
  }

  return lines.join('\n');
}
