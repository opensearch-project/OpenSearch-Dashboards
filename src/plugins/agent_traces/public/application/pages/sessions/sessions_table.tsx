/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiIcon, EuiLink, EuiProgress, EuiToolTip } from '@elastic/eui';
import { TableHeaderColumn } from '../../../components/data_table/table_header/table_header_column';
import { TokenIcon } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { SortOrder } from '../../../helpers/data_table_helper';
import { SessionRow, formatSessionDuration } from './session_utils';
import { setTitleIfTruncated, useLazyRows } from './lazy_rows';

const DEFAULT_SORT: SortOrder[] = [['startTime', 'desc']];

interface SessionsTableProps {
  sessions: SessionRow[];
  formatTs: (ts: string) => string;
  wrapCellText: boolean;
  onSessionClick: (session: SessionRow) => void;
  /** Session currently open in the flyout; its row is highlighted. */
  selectedSessionId?: string;
}

type SessionColumnKey =
  | 'startTime'
  | 'sessionId'
  | 'firstMessage'
  | 'lastMessage'
  | 'durationMs'
  | 'userId'
  | 'totalTraces'
  | 'totalTokens';

interface SessionColumn {
  key: SessionColumnKey;
  label: string;
  sortable: boolean;
  wideText?: boolean;
}

export const TokensBadge: React.FC<{ tokens: number | null }> = ({ tokens }) =>
  tokens === null ? (
    <>—</>
  ) : (
    <EuiBadge color="hollow" iconType={() => <TokenIcon />} style={{ borderRadius: 999 }}>
      {tokens.toLocaleString()}
    </EuiBadge>
  );

const compareSessions = (a: SessionRow, b: SessionRow, key: SessionColumnKey): number => {
  const va = a[key];
  const vb = b[key];
  if (va === vb) return 0;
  if (va === null || va === undefined) return 1; // missing values last
  if (vb === null || vb === undefined) return -1;
  if (typeof va === 'number' && typeof vb === 'number') return va - vb;
  return String(va).localeCompare(String(vb)); // PPL timestamps sort lexicographically
};

export const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  formatTs,
  wrapCellText,
  onSessionClick,
  selectedSessionId,
}) => {
  const [sortOrder, setSortOrder] = useState<SortOrder[]>(DEFAULT_SORT);

  // User ID comes from the optional `user.id` attribute; hide the column when no session has one.
  const hasUserIds = useMemo(() => sessions.some((s) => !!s.userId), [sessions]);

  const columns: SessionColumn[] = useMemo(() => {
    const cols: SessionColumn[] = [
      {
        key: 'startTime',
        label: i18n.translate('agentTraces.sessions.column.time', { defaultMessage: 'Time' }),
        sortable: true,
      },
      {
        key: 'sessionId',
        label: i18n.translate('agentTraces.sessions.column.sessionId', {
          defaultMessage: 'Session ID',
        }),
        sortable: true,
      },
      {
        key: 'firstMessage',
        label: i18n.translate('agentTraces.sessions.column.firstMessage', {
          defaultMessage: 'First Message',
        }),
        sortable: false,
        wideText: true,
      },
      {
        key: 'lastMessage',
        label: i18n.translate('agentTraces.sessions.column.lastMessage', {
          defaultMessage: 'Last Message',
        }),
        sortable: false,
        wideText: true,
      },
      {
        key: 'durationMs',
        label: i18n.translate('agentTraces.sessions.column.duration', {
          defaultMessage: 'Duration',
        }),
        sortable: true,
      },
    ];
    if (hasUserIds) {
      cols.push({
        key: 'userId',
        label: i18n.translate('agentTraces.sessions.column.userId', { defaultMessage: 'User ID' }),
        sortable: true,
      });
    }
    cols.push(
      {
        key: 'totalTraces',
        label: i18n.translate('agentTraces.sessions.column.totalTraces', {
          defaultMessage: 'Total Traces',
        }),
        sortable: true,
      },
      {
        key: 'totalTokens',
        label: i18n.translate('agentTraces.sessions.column.totalTokens', {
          defaultMessage: 'Total Tokens',
        }),
        sortable: true,
      }
    );
    return cols;
  }, [hasUserIds]);

  const sortedSessions = useMemo(() => {
    const [field, direction] = (sortOrder[0] ?? DEFAULT_SORT[0]) as [SessionColumnKey, string];
    const sign = direction === 'asc' ? 1 : -1;
    return [...sessions].sort((a, b) => sign * compareSessions(a, b, field));
  }, [sessions, sortOrder]);

  // Infinite-scroll lazy loading, mirroring the Traces/Spans DataTable.
  const { renderedCount, sentinelRef } = useLazyRows(sortedSessions);

  const visible = sortedSessions.slice(0, renderedCount);

  const renderCell = (session: SessionRow, column: SessionColumn) => {
    switch (column.key) {
      case 'startTime':
        return (
          <EuiLink
            color="primary"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onSessionClick(session);
            }}
            data-test-subj="agentTracesSessionTimeLink"
          >
            {formatTs(session.startTime)}
          </EuiLink>
        );
      case 'durationMs':
        return formatSessionDuration(session.durationMs);
      case 'totalTraces':
        return session.totalTraces.toLocaleString();
      case 'totalTokens':
        return <TokensBadge tokens={session.totalTokens} />;
      case 'sessionId':
        return (
          <span className="agtSessionsTable__sessionId">
            <span onMouseEnter={wrapCellText ? undefined : setTitleIfTruncated(session.sessionId)}>
              {session.sessionId}
            </span>
            {session.errorTraces > 0 && (
              <EuiToolTip
                content={i18n.translate('agentTraces.sessions.table.errorTraces', {
                  defaultMessage: '{count, plural, one {# trace} other {# traces}} with errors',
                  values: { count: session.errorTraces },
                })}
              >
                <EuiIcon
                  type="alert"
                  color="danger"
                  size="s"
                  aria-label={i18n.translate('agentTraces.sessions.table.hasErrors', {
                    defaultMessage: 'Session has errors',
                  })}
                  data-test-subj={`agentTracesSessionErrors-${session.sessionId}`}
                />
              </EuiToolTip>
            )}
          </span>
        );
      default: {
        const text = (session[column.key] as string | null) ?? '';
        return text ? (
          <span onMouseEnter={wrapCellText ? undefined : setTitleIfTruncated(text)}>{text}</span>
        ) : (
          '—'
        );
      }
    }
  };

  return (
    <div className="agentTraces-table-container">
      <table
        data-test-subj="agentTracesSessionsTable"
        className={`agentTraces-table table${wrapCellText ? ' agentTraces-table--wrap' : ''}`}
      >
        <thead>
          <tr className="agentTracesDocTableHeader">
            {columns.map((column) => (
              <TableHeaderColumn
                key={column.key}
                name={column.key}
                displayName={column.label}
                isRemoveable={false}
                isSortable={column.sortable}
                sortOrder={sortOrder}
                onChangeSortOrder={(next) => setSortOrder(next.length ? next : DEFAULT_SORT)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((session) => (
            <tr
              key={session.sessionId}
              className={`agtSessionsTable__row${
                session.sessionId === selectedSessionId
                  ? ' agentTracesDocTable__row--highlight'
                  : ''
              }`}
              onClick={() => onSessionClick(session)}
              data-test-subj={`agentTracesSessionRow-${session.sessionId}`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`agentTracesDocTableCell${
                    column.wideText ? ' agentTracesDocTableCell--wideText' : ' eui-textNoWrap'
                  }`}
                >
                  <div className="agentTracesDocTableCell__content">
                    <span className="agentTracesDocTableCell__dataField">
                      {column.wideText ? (
                        renderCell(session, column)
                      ) : (
                        // Short values (time, ids, counts) never wrap, as in Traces/Spans
                        <span className="agtSessionsTable__nowrap">
                          {renderCell(session, column)}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {renderedCount < sortedSessions.length && (
        <div ref={sentinelRef}>
          <EuiProgress size="xs" color="accent" data-test-subj="agentTracesSessionsMoreRows" />
        </div>
      )}
    </div>
  );
};
