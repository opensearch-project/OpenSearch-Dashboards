/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBasicTableColumn,
  EuiInMemoryTable,
  EuiLink,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { TokenIcon } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { SessionRow, formatSessionDuration } from './session_utils';

interface SessionsTableProps {
  sessions: SessionRow[];
  formatTs: (ts: string) => string;
  wrapCellText: boolean;
  onSessionClick: (session: SessionRow) => void;
}

/** Text cell: single line with a tooltip, or full text when wrapping is on. */
const TextCell: React.FC<{ text: string; wrap: boolean; mono?: boolean }> = ({
  text,
  wrap,
  mono,
}) => {
  if (!text) return <>—</>;
  const className = `agtSessionsTable__text${wrap ? ' agtSessionsTable__text--wrap' : ''}${
    mono ? ' agtSessionsTable__text--mono' : ''
  }`;
  if (wrap) return <span className={className}>{text}</span>;
  return (
    <EuiToolTip content={text} position="top" anchorClassName="agtSessionsTable__tooltipAnchor">
      <span className={className}>{text}</span>
    </EuiToolTip>
  );
};

export const TokensBadge: React.FC<{ tokens: number | null }> = ({ tokens }) =>
  tokens === null ? (
    <>—</>
  ) : (
    <EuiBadge color="hollow" iconType={() => <TokenIcon />} style={{ borderRadius: 999 }}>
      {tokens.toLocaleString()}
    </EuiBadge>
  );

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  formatTs,
  wrapCellText,
  onSessionClick,
}) => {
  // User ID comes from the optional `user.id` attribute; hide the column when no session has one.
  const hasUserIds = useMemo(() => sessions.some((s) => !!s.userId), [sessions]);

  const columns: Array<EuiBasicTableColumn<SessionRow>> = useMemo(
    () => [
      {
        field: 'startTime',
        name: i18n.translate('agentTraces.sessions.column.time', { defaultMessage: 'Time' }),
        sortable: true,
        width: '215px',
        render: (startTime: string, session: SessionRow) => (
          <EuiLink
            onClick={() => onSessionClick(session)}
            data-test-subj="agentTracesSessionTimeLink"
          >
            {formatTs(startTime)}
          </EuiLink>
        ),
      },
      {
        field: 'sessionId',
        name: i18n.translate('agentTraces.sessions.column.sessionId', {
          defaultMessage: 'Session ID',
        }),
        width: '170px',
        render: (id: string) => <TextCell text={id} wrap={wrapCellText} mono />,
      },
      {
        field: 'firstMessage',
        name: i18n.translate('agentTraces.sessions.column.firstMessage', {
          defaultMessage: 'First Message',
        }),
        render: (text: string) => <TextCell text={text} wrap={wrapCellText} />,
      },
      {
        field: 'lastMessage',
        name: i18n.translate('agentTraces.sessions.column.lastMessage', {
          defaultMessage: 'Last Message',
        }),
        render: (text: string) => <TextCell text={text} wrap={wrapCellText} />,
      },
      {
        field: 'durationMs',
        name: i18n.translate('agentTraces.sessions.column.duration', {
          defaultMessage: 'Duration',
        }),
        sortable: true,
        width: '100px',
        render: (ms: number) => formatSessionDuration(ms),
      },
      ...(hasUserIds
        ? [
            {
              field: 'userId',
              name: i18n.translate('agentTraces.sessions.column.userId', {
                defaultMessage: 'User ID',
              }),
              width: '140px',
              render: (id: string | null) => <TextCell text={id ?? ''} wrap={wrapCellText} mono />,
            },
          ]
        : []),
      {
        field: 'totalTraces',
        name: i18n.translate('agentTraces.sessions.column.totalTraces', {
          defaultMessage: 'Total Traces',
        }),
        sortable: true,
        width: '105px',
        render: (n: number) => <EuiText size="s">{n.toLocaleString()}</EuiText>,
      },
      {
        field: 'totalTokens',
        name: i18n.translate('agentTraces.sessions.column.totalTokens', {
          defaultMessage: 'Total Tokens',
        }),
        sortable: true,
        width: '120px',
        render: (tokens: number | null) => <TokensBadge tokens={tokens} />,
      },
    ],
    [formatTs, wrapCellText, onSessionClick, hasUserIds]
  );

  return (
    <EuiInMemoryTable<SessionRow>
      items={sessions}
      itemId="sessionId"
      columns={columns}
      sorting={{ sort: { field: 'startTime', direction: 'desc' } }}
      pagination={{ initialPageSize: 25, pageSizeOptions: [25, 50, 100] }}
      rowProps={(session: SessionRow) => ({
        className: 'agtSessionsTable__row',
        onClick: () => onSessionClick(session),
        'data-test-subj': `agentTracesSessionRow-${session.sessionId}`,
      })}
      tableLayout="fixed"
      className="agtSessionsTable"
      data-test-subj="agentTracesSessionsTable"
    />
  );
};
