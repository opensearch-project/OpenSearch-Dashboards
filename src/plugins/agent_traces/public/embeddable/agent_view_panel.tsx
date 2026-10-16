/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiText } from '@elastic/eui';
import { SessionsTable } from '../application/pages/sessions/sessions_table';
import { SessionSpansTable } from '../application/pages/sessions/session_spans_table';
import { SessionRow } from '../application/pages/sessions/session_utils';
import { TraceRow } from '../application/pages/traces/hooks/tree_utils';
import '../application/pages/traces/traces_table.scss';
import '../application/pages/sessions/sessions_tab.scss';

/** Agent Traces tabs whose saved searches render as agent tables on a dashboard. */
export type AgentView = 'traces' | 'spans' | 'sessions';

export const isAgentView = (tab: unknown): tab is AgentView =>
  tab === 'traces' || tab === 'spans' || tab === 'sessions';

export interface AgentViewPanelProps {
  view: AgentView;
  /** Rows for the Traces / Spans views */
  rows?: TraceRow[];
  /** Rows for the Sessions view */
  sessions?: SessionRow[];
  /** Total matching items when the panel shows a capped list */
  total?: number | null;
  error?: string;
  formatTs: (ts: string) => string;
  onOpenTrace: (row: TraceRow) => void;
  onOpenSession: (session: SessionRow) => void;
}

/**
 * Dashboard panel body for saved Traces, Spans and Sessions searches: the same agent
 * tables the Agent Traces app shows, instead of raw span documents. Rows open the item
 * in Agent Traces.
 */
export const AgentViewPanel: React.FC<AgentViewPanelProps> = ({
  view,
  rows = [],
  sessions = [],
  total,
  error,
  formatTs,
  onOpenTrace,
  onOpenSession,
}) => {
  if (error) {
    return (
      <EuiCallOut
        size="s"
        color="danger"
        iconType="alert"
        title={i18n.translate('agentTraces.embeddable.agentViewError', {
          defaultMessage: 'Failed to load {view}',
          values: { view },
        })}
      >
        {error}
      </EuiCallOut>
    );
  }

  const shown = view === 'sessions' ? sessions.length : rows.length;
  const noun = (n: number) => {
    switch (view) {
      case 'sessions':
        return i18n.translate('agentTraces.embeddable.sessionsNoun', {
          defaultMessage: '{n, plural, one {session} other {sessions}}',
          values: { n },
        });
      case 'spans':
        return i18n.translate('agentTraces.embeddable.spansNoun', {
          defaultMessage: '{n, plural, one {span} other {spans}}',
          values: { n },
        });
      default:
        return i18n.translate('agentTraces.embeddable.tracesNoun', {
          defaultMessage: '{n, plural, one {trace} other {traces}}',
          values: { n },
        });
    }
  };
  const summary =
    total && total > shown
      ? i18n.translate('agentTraces.embeddable.agentViewCountOfTotal', {
          defaultMessage: '{shown} of {total} {noun}',
          values: {
            shown: shown.toLocaleString(),
            total: total.toLocaleString(),
            noun: noun(total),
          },
        })
      : i18n.translate('agentTraces.embeddable.agentViewCount', {
          defaultMessage: '{shown} {noun}',
          values: { shown: shown.toLocaleString(), noun: noun(shown) },
        });

  return (
    <div className="agentTracesEmbeddableAgentView" data-test-subj={`agentTracesPanel-${view}`}>
      <EuiText size="xs" color="subdued" className="agentTracesEmbeddableAgentView__summary">
        {summary}
      </EuiText>
      <div className="agentTracesTable__scrollContainer eui-xScrollWithShadows">
        {view === 'sessions' ? (
          <SessionsTable
            sessions={sessions}
            formatTs={formatTs}
            wrapCellText={false}
            onSessionClick={onOpenSession}
          />
        ) : (
          <SessionSpansTable rows={rows} onRowClick={onOpenTrace} />
        )}
      </div>
    </div>
  );
};
