/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

/** Maps UI column field names to PPL index field names */
export const PPL_SORT_FIELDS: Record<string, string> = {
  startTime: 'startTime',
  kind: '`attributes.gen_ai.operation.name`',
  latency: 'durationInNanos',
  name: 'name',
  status: '`status.code`',
};

/** Build a PPL sort clause from UI sort state */
export const buildPplSortClause = (field: string, direction: 'asc' | 'desc'): string => {
  const pplField = PPL_SORT_FIELDS[field] || (field.includes('.') ? `\`${field}\`` : field);
  const prefix = direction === 'desc' ? '- ' : '';
  return `| sort ${prefix}${pplField}`;
};

/**
 * Splits a PPL query string into the source+where portion and remaining
 * non-where commands (head, sort, dedup, eval, etc.).
 *
 * This ensures user-entered non-where commands (like `| head 1`) are placed
 * after hardcoded where clauses when assembling the final query.
 */
export const splitPplWhereAndTail = (
  queryString: string
): { whereQuery: string; tailCommands: string } => {
  const parts = queryString.split(/\s*\|\s*/);
  const whereParts: string[] = [];
  const tailParts: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('source') || lower.startsWith('where')) {
      whereParts.push(trimmed);
    } else {
      tailParts.push(trimmed);
    }
  }

  return {
    whereQuery: whereParts.join(' | '),
    tailCommands: tailParts.length > 0 ? '| ' + tailParts.join(' | ') : '',
  };
};

/**
 * Checks if the main query ends with a head command (optionally followed by `from N` or `| where`).
 * Subquery brackets [...] are masked so that head inside subqueries is ignored.
 *
 * Aligned with the explore plugin's queryEndsWithHead implementation.
 */
export const queryEndsWithHead = (queryString: string): boolean => {
  const masked = queryString.replace(/\[.*?\]/g, (match) => '\0'.repeat(match.length));
  return /\|\s*head\b(\s+\d+)?(\s+from\s+\d+)?\s*(\|\s*where\b.*)?\s*$/i.test(masked);
};

/** Shared loading state */
export const TableLoadingState: React.FC<{ message: React.ReactNode }> = ({ message }) => (
  <EuiEmptyPrompt
    icon={<EuiLoadingSpinner size="xl" />}
    body={
      <EuiText size="s" color="subdued">
        {message}
      </EuiText>
    }
  />
);

/** Shared empty state */
export const TableEmptyState: React.FC<{
  title: React.ReactNode;
}> = ({ title }) => (
  <EuiEmptyPrompt
    iconType="apmTrace"
    title={<h3>{title}</h3>}
    body={
      <p>
        <FormattedMessage
          id="agentTraces.table.emptyBody"
          defaultMessage="No AI agent spans were found in the {indexName} index. Make sure your application is instrumented with OpenTelemetry and is sending spans with {attributeName} attribute."
          values={{
            indexName: <code>otel-v1-apm-span-*</code>,
            attributeName: <code>gen_ai.operation.name</code>,
          }}
        />
      </p>
    }
  />
);
