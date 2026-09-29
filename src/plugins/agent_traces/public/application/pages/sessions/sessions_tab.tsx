/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiCallOut,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSwitch,
  EuiText,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { formatTimestamp } from '../traces/hooks/tree_utils';
import { TableLoadingState } from '../traces/table_shared';
import { useSessions } from './hooks/use_sessions';
import { SessionsTable } from './sessions_table';
import { SessionDetailsFlyout } from './session_details_flyout';
import { SessionRow } from './session_utils';
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

  const { sessions, loading, error, elapsedMs } = useSessions(formatTs);
  const [wrapCellText, setWrapCellText] = useState(false);
  const [selected, setSelected] = useState<SessionRow | null>(null);

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
      <SessionsTable
        sessions={sessions}
        formatTs={formatTs}
        wrapCellText={wrapCellText}
        onSessionClick={setSelected}
      />
    );
  }

  return (
    <div className="agentTraces-sessions-tab tab-container" data-test-subj="agentTracesSessionsTab">
      <EuiFlexGroup
        className="agtSessionsTab__infoBar"
        alignItems="center"
        justifyContent="spaceBetween"
        gutterSize="m"
      >
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            <FormattedMessage
              id="agentTraces.sessions.count"
              defaultMessage="{count} {count, plural, one {Session} other {Sessions}}{elapsed}"
              values={{
                count: sessions.length,
                elapsed: elapsedMs != null ? ` in ${elapsedMs.toLocaleString()} ms` : '',
              }}
            />
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            label={i18n.translate('agentTraces.sessions.wrapCellText', {
              defaultMessage: 'Wrap cell text',
            })}
            checked={wrapCellText}
            onChange={(e) => setWrapCellText(e.target.checked)}
            compressed
            data-test-subj="agentTracesSessionsWrapSwitch"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {body}
      {selected && (
        <SessionDetailsFlyout
          session={selected}
          formatTs={formatTs}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
