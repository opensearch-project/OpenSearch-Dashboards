/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiCallOut,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLoadingSpinner,
  EuiTitle,
} from '@elastic/eui';
import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../common';
import { usePPLQueryDeps } from '../traces/hooks/use_ppl_query_deps';
import { escapePPLValue } from '../traces/trace_details/data_fetching/ppl_request_helpers';
import { fetchSessions } from './fetch_sessions';
import { SessionDetailsFlyout } from './session_details_flyout';
import { SessionRow, getSourceCommand } from './session_utils';

interface SessionFlyoutHostProps {
  sessionId: string;
  /** The session row when it is already loaded (sessions list); fetched by id otherwise. */
  session?: SessionRow;
  formatTs: (ts: string) => string;
  onClose: () => void;
}

/** The session flyout, loading the session by id first when only the id is known. */
export const SessionFlyoutHost: React.FC<SessionFlyoutHostProps> = ({
  sessionId,
  session,
  formatTs,
  onClose,
}) => {
  const { pplService, datasetParam, baseQueryString } = usePPLQueryDeps();
  const [row, setRow] = useState<SessionRow | null>(session ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setRow(session);
      return;
    }
    if (!pplService || !datasetParam || !baseQueryString) return;
    let cancelled = false;
    setRow(null);
    setError(null);
    const query = `${getSourceCommand(baseQueryString)} | where \`${AGENT_TRACES_SESSION_ID_FIELD}\` = ${escapePPLValue(sessionId)}`;
    fetchSessions(pplService, datasetParam, query, formatTs)
      .then(({ sessions }) => {
        if (cancelled) return;
        if (sessions[0]) setRow(sessions[0]);
        else
          setError(
            i18n.translate('agentTraces.sessions.flyout.notFound', {
              defaultMessage: 'Session {sessionId} was not found in the selected time range.',
              values: { sessionId },
            })
          );
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, session, pplService, datasetParam, baseQueryString, formatTs]);

  if (row) {
    return <SessionDetailsFlyout session={row} formatTs={formatTs} onClose={onClose} />;
  }

  return (
    <EuiFlyout
      onClose={onClose}
      size="l"
      ownFocus={false}
      className="agtSessionFlyout"
      data-test-subj="agentTracesSessionFlyoutLoading"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2>
            {i18n.translate('agentTraces.sessions.flyout.title', {
              defaultMessage: 'Session: {id}',
              values: { id: sessionId },
            })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {error ? (
          <EuiCallOut color="warning" iconType="alert" title={error} />
        ) : (
          <EuiLoadingSpinner size="l" />
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
