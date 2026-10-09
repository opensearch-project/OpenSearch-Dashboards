/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCallOut, EuiEmptyPrompt, EuiSwitch } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { formatTimestamp } from '../traces/hooks/tree_utils';
import { DataTableInfoBar, TableLoadingState } from '../traces/table_shared';
import '../traces/traces_table.scss';
import { useSessions } from './hooks/use_sessions';
import { SessionsTable } from './sessions_table';
import { SESSION_TRACES_LIMIT } from './session_utils';
import { useTraceFlyout } from '../traces/flyout/trace_flyout_state';
import './sessions_tab.scss';

export const SessionsTab = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const uiSettings = services.uiSettings;

  const timezone = useMemo(() => {
    const tz = uiSettings?.get('dateFormat:tz');
    if (tz && tz !== 'Browser') return tz;
    return moment.tz.guess() || moment().format('Z');
  }, [uiSettings]);
  const formatTs = useCallback((ts: string) => formatTimestamp(ts, timezone), [timezone]);

  const [onlyWithErrors, setOnlyWithErrors] = useState(false);
  const {
    sessions,
    loading,
    error,
    elapsedMs,
    ignoredCommands,
    hasFilter,
    totalSessions,
    partial,
    errorsPartial,
  } = useSessions(formatTs, onlyWithErrors);
  const [wrapCellText, setWrapCellText] = useState(false);
  // Sessions open in the shared Agent Traces flyout slot (no stacking with trace flyouts).
  const { openSession, activeSessionId } = useTraceFlyout();

  let body: React.ReactNode;
  if (loading && sessions.length === 0) {
    body = (
      <TableLoadingState
        message={
          <FormattedMessage
            id="agentTraces.sessions.loading"
            defaultMessage="Loading sessions..."
          />
        }
      />
    );
  } else if (error) {
    body = (
      <EuiCallOut
        color="danger"
        iconType="alert"
        title={i18n.translate('agentTraces.sessions.error', {
          defaultMessage: 'Failed to load sessions',
        })}
      >
        {error}
      </EuiCallOut>
    );
  } else if (sessions.length === 0 && (hasFilter || onlyWithErrors)) {
    body = (
      <EuiEmptyPrompt
        iconType="search"
        title={
          <h3>
            {i18n.translate('agentTraces.sessions.noMatchTitle', {
              defaultMessage: 'No sessions match your query',
            })}
          </h3>
        }
        body={
          <p>
            {i18n.translate('agentTraces.sessions.noMatchBody', {
              defaultMessage:
                'No span in any session matches the current filter and time range. Try a broader filter or time range.',
            })}
          </p>
        }
        data-test-subj="agentTracesSessionsNoMatch"
      />
    );
  } else if (sessions.length === 0) {
    body = (
      <EuiEmptyPrompt
        iconType="apmTrace"
        title={
          <h3>
            {i18n.translate('agentTraces.sessions.emptyTitle', {
              defaultMessage: 'No sessions found',
            })}
          </h3>
        }
        body={
          <p>
            <FormattedMessage
              id="agentTraces.sessions.emptyBody"
              defaultMessage="Sessions group traces that share a {attributeName} attribute. Set it on your agent spans (for example with the GenAI SDK's session_id) to see multi-turn conversations here."
              values={{ attributeName: <code>gen_ai.conversation.id</code> }}
            />
          </p>
        }
        data-test-subj="agentTracesSessionsEmpty"
      />
    );
  } else {
    body = (
      <div className="agentTracesTable__scrollContainer eui-xScrollWithShadows">
        <SessionsTable
          sessions={sessions}
          formatTs={formatTs}
          wrapCellText={wrapCellText}
          onSessionClick={openSession}
          selectedSessionId={activeSessionId}
        />
      </div>
    );
  }

  return (
    <div className="agentTraces-sessions-tab tab-container" data-test-subj="agentTracesSessionsTab">
      <div className="agentTracesTable__container">
        <DataTableInfoBar
          hasHead={false}
          hitsCount={sessions.length}
          totalCount={totalSessions ?? sessions.length}
          elapsedMs={elapsedMs ?? undefined}
          entityName="session"
          wrapCellText={wrapCellText}
          onWrapCellTextChange={setWrapCellText}
        />
        <EuiSwitch
          compressed
          className="agtSessionsTab__errorsSwitch"
          label={i18n.translate('agentTraces.sessions.onlyWithErrors', {
            defaultMessage: 'Only sessions with errors',
          })}
          checked={onlyWithErrors}
          onChange={(e) => setOnlyWithErrors(e.target.checked)}
          data-test-subj="agentTracesSessionsOnlyErrors"
        />
        {ignoredCommands.length > 0 && !error && (
          <EuiCallOut
            size="s"
            iconType="iInCircle"
            className="agtSessionsTab__ignoredCallout"
            data-test-subj="agentTracesSessionsIgnoredCommands"
            title={i18n.translate('agentTraces.sessions.ignoredCommands', {
              defaultMessage:
                'Sessions applies only row filters (where, eval, parse). Not applied here: {commands}. Use the Traces or Visualization tab for these.',
              values: { commands: ignoredCommands.join(', ') },
            })}
          />
        )}
        {partial && !error && (
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            className="agtSessionsTab__ignoredCallout"
            data-test-subj="agentTracesSessionsPartial"
            title={i18n.translate('agentTraces.sessions.partial', {
              defaultMessage:
                'These sessions hold more traces than can be loaded at once. First and last message, tokens and trace lists come from a subset of their traces. Narrow the time range or filter to see complete details.',
            })}
          />
        )}
        {onlyWithErrors && errorsPartial && !error && (
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            className="agtSessionsTab__ignoredCallout"
            data-test-subj="agentTracesSessionsErrorsPartial"
            title={i18n.translate('agentTraces.sessions.errorsPartial', {
              defaultMessage:
                'Checked the most recent {count} session traces for errors. Narrow the time range or filter to check all of them.',
              values: { count: SESSION_TRACES_LIMIT.toLocaleString() },
            })}
          />
        )}
        {body}
      </div>
    </div>
  );
};
