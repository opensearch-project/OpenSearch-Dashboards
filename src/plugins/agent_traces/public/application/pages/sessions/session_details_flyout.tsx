/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { TraceRow } from '../traces/hooks/tree_utils';
import { useTraceFlyout } from '../traces/flyout/trace_flyout_context';
import { TokenIcon } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { SessionTrace, useSessionDetail } from './hooks/use_session_detail';
import { SessionSpansTable } from './session_spans_table';
import { previewInputMessages, previewOutputMessages } from '../traces/hooks/genai_message_preview';
import { SessionRow, formatSessionDuration, shortenId } from './session_utils';

interface SessionDetailsFlyoutProps {
  session: SessionRow;
  formatTs: (ts: string) => string;
  onClose: () => void;
}

type DrillTab = 'traces' | 'spans';

const tokensOf = (row: TraceRow): number | null =>
  typeof row.totalTokens === 'number' ? row.totalTokens : null;

const MetaItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="agtSessionFlyout__metaItem">
    <EuiText size="xs" className="agtSessionFlyout__metaLabel">
      {label}
    </EuiText>
    <EuiText size="s" className="agtSessionFlyout__metaValue">
      {children}
    </EuiText>
  </div>
);

const LatencyAndTokens: React.FC<{ row: TraceRow }> = ({ row }) => {
  const tokens = tokensOf(row);
  return (
    <span className="agtSessionFlyout__stats">
      <span className="agtSessionFlyout__stat">
        <EuiIcon type="clock" size="s" color="danger" />
        {row.latency}
      </span>
      <span className="agtSessionFlyout__stat">
        <TokenIcon />
        {tokens === null ? '—' : tokens.toLocaleString()}
      </span>
    </span>
  );
};

/** Human/AI turns for one trace in the session conversation. */
const ConversationTurn: React.FC<{
  index: number;
  trace: SessionTrace;
  focused: boolean;
  turnRef: (el: HTMLDivElement | null) => void;
  onOpenTrace: () => void;
}> = ({ index, trace, focused, turnRef, onOpenTrace }) => {
  const userText = previewInputMessages(trace.root.input);
  const aiText = previewOutputMessages(trace.root.output);
  return (
    <div
      ref={turnRef}
      className={`agtSessionFlyout__turn${focused ? ' agtSessionFlyout__turn--focused' : ''}`}
      data-test-subj={`agentTracesSessionTurn-${index}`}
    >
      <EuiLink onClick={onOpenTrace} data-test-subj={`agentTracesSessionTurnLink-${index}`}>
        {i18n.translate('agentTraces.sessions.flyout.traceLink', {
          defaultMessage: 'Trace #{index}',
          values: { index },
        })}{' '}
        <EuiIcon type="arrowRight" size="s" />
      </EuiLink>
      <EuiSpacer size="xs" />
      <EuiPanel paddingSize="none" hasBorder className="agtSessionFlyout__message">
        <div className="agtSessionFlyout__messageHeader">
          <EuiIcon type="user" size="s" />
          <strong>
            {i18n.translate('agentTraces.sessions.flyout.human', { defaultMessage: 'Human' })}
          </strong>
        </div>
        <div className="agtSessionFlyout__messageBody">{userText || '—'}</div>
      </EuiPanel>
      <EuiSpacer size="s" />
      <EuiPanel
        paddingSize="none"
        hasBorder
        className="agtSessionFlyout__message agtSessionFlyout__message--ai"
      >
        <div className="agtSessionFlyout__messageHeader">
          <EuiIcon type="compute" size="s" />
          <strong>
            {i18n.translate('agentTraces.sessions.flyout.ai', { defaultMessage: 'AI' })}
          </strong>
        </div>
        <div className="agtSessionFlyout__messageBody">{aiText || '—'}</div>
      </EuiPanel>
      <EuiSpacer size="m" />
    </div>
  );
};

export const SessionDetailsFlyout: React.FC<SessionDetailsFlyoutProps> = ({
  session,
  formatTs,
  onClose,
}) => {
  const { traces, loading, error } = useSessionDetail(session.traceIds, formatTs);
  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();

  const [view, setView] = useState<'overview' | 'all'>('overview');
  const [drillTab, setDrillTab] = useState<DrillTab>('traces');
  /** Index of the trace in focus; the conversation arrows step through traces. */
  const [focusedIndex, setFocusedIndex] = useState(0);
  const turnRefs = useRef<Array<HTMLDivElement | null>>([]);

  const totalTokens = useMemo(() => {
    const values = traces.map((t) => tokensOf(t.root)).filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : session.totalTokens;
  }, [traces, session.totalTokens]);

  /** Open the existing trace flyout for a row (root or any span) of a session trace. */
  const openTrace = useCallback(
    (row: TraceRow) => {
      const trace = traces.find((t) => t.traceId === row.traceId);
      openFlyout(row);
      if (trace) updateFlyoutFullTree(trace.tree, false);
    },
    [traces, openFlyout, updateFlyoutFullTree]
  );

  /** Focus a trace: highlight it in the list and scroll its turn into view. */
  const focusTrace = useCallback(
    (index: number) => {
      if (index < 0 || index >= traces.length) return;
      setFocusedIndex(index);
      turnRefs.current[index]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    },
    [traces.length]
  );

  const drillItems = useMemo(
    () => (drillTab === 'traces' ? traces.map((t) => t.root) : traces.flatMap((t) => t.spans)),
    [drillTab, traces]
  );

  return (
    <EuiFlyout
      onClose={onClose}
      size="l"
      ownFocus={false}
      className="agtSessionFlyout"
      data-test-subj="agentTracesSessionFlyout"
      aria-labelledby="agentTracesSessionFlyoutTitle"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h2 id="agentTracesSessionFlyoutTitle">
                {i18n.translate('agentTraces.sessions.flyout.title', {
                  defaultMessage: 'SessionID: {id}',
                  values: { id: shortenId(session.sessionId) },
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiCopy textToCopy={session.sessionId}>
              {(copy) => (
                <EuiButtonEmpty
                  size="xs"
                  iconType="copy"
                  onClick={copy}
                  data-test-subj="agentTracesSessionCopyId"
                >
                  {i18n.translate('agentTraces.sessions.flyout.copyId', {
                    defaultMessage: 'Session ID',
                  })}
                </EuiButtonEmpty>
              )}
            </EuiCopy>
          </EuiFlexItem>
        </EuiFlexGroup>
        <div className="agtSessionFlyout__metaRow">
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalDuration', {
              defaultMessage: 'Total Duration',
            })}
          >
            <EuiIcon type="clock" size="s" color="danger" />{' '}
            {formatSessionDuration(session.durationMs)}
          </MetaItem>
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalTokens', {
              defaultMessage: 'Total Tokens',
            })}
          >
            <TokenIcon />
            {totalTokens === null ? '—' : totalTokens.toLocaleString()}
          </MetaItem>
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalTraces', {
              defaultMessage: 'Total Traces',
            })}
          >
            {session.totalTraces.toLocaleString()}
          </MetaItem>
        </div>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {error && (
          <EuiCallOut
            color="danger"
            iconType="alert"
            title={i18n.translate('agentTraces.sessions.flyout.error', {
              defaultMessage: 'Failed to load session',
            })}
          >
            {error}
          </EuiCallOut>
        )}
        {loading && (
          <EuiFlexGroup justifyContent="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="l" />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}

        {!loading && !error && view === 'overview' && (
          <EuiFlexGroup
            gutterSize="m"
            responsive={false}
            alignItems="flexStart"
            className="agtSessionFlyout__overview"
          >
            <EuiFlexItem grow={3} className="agtSessionFlyout__traceList">
              <EuiFlexGroup
                justifyContent="spaceBetween"
                alignItems="center"
                responsive={false}
                className="agtSessionFlyout__panelHeader"
              >
                <EuiFlexItem grow={false}>
                  <EuiTitle size="xxs">
                    <h3>
                      {i18n.translate('agentTraces.sessions.flyout.traceList', {
                        defaultMessage: 'Trace list ({count})',
                        values: { count: traces.length },
                      })}
                    </h3>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiLink
                    onClick={() => setView('all')}
                    data-test-subj="agentTracesSessionViewAllTraces"
                  >
                    {i18n.translate('agentTraces.sessions.flyout.viewAll', {
                      defaultMessage: 'View All Traces',
                    })}
                  </EuiLink>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              {traces.map((trace, i) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={trace.traceId}
                  className={`agtSessionFlyout__traceItem${
                    i === focusedIndex ? ' agtSessionFlyout__traceItem--focused' : ''
                  }`}
                  aria-current={i === focusedIndex}
                  onClick={() => focusTrace(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      focusTrace(i);
                    }
                  }}
                  data-test-subj={`agentTracesSessionTraceItem-${i + 1}`}
                >
                  <span className="agtSessionFlyout__traceItemLabel">
                    <EuiButtonIcon
                      size="xs"
                      color="text"
                      iconType="arrowRight"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        openTrace(trace.root);
                      }}
                      aria-label={i18n.translate('agentTraces.sessions.flyout.openTrace', {
                        defaultMessage: 'Open trace {index}',
                        values: { index: i + 1 },
                      })}
                      data-test-subj={`agentTracesSessionOpenTrace-${i + 1}`}
                    />
                    <strong>
                      {i18n.translate('agentTraces.sessions.flyout.traceLink', {
                        defaultMessage: 'Trace #{index}',
                        values: { index: i + 1 },
                      })}
                    </strong>
                  </span>
                  <LatencyAndTokens row={trace.root} />
                </div>
              ))}
            </EuiFlexItem>

            <EuiFlexItem grow={7} className="agtSessionFlyout__conversation">
              <EuiFlexGroup
                justifyContent="spaceBetween"
                alignItems="center"
                responsive={false}
                className="agtSessionFlyout__panelHeader"
              >
                <EuiFlexItem grow={false}>
                  <EuiTitle size="xxs">
                    <h3>
                      {i18n.translate('agentTraces.sessions.flyout.conversation', {
                        defaultMessage: 'Session Conversation',
                      })}
                    </h3>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="xs" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        iconType="arrowDown"
                        color="text"
                        isDisabled={focusedIndex >= traces.length - 1}
                        onClick={() => focusTrace(focusedIndex + 1)}
                        aria-label={i18n.translate('agentTraces.sessions.flyout.nextTrace', {
                          defaultMessage: 'Next trace',
                        })}
                        data-test-subj="agentTracesSessionNextTrace"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        iconType="arrowUp"
                        color="text"
                        isDisabled={focusedIndex <= 0}
                        onClick={() => focusTrace(focusedIndex - 1)}
                        aria-label={i18n.translate('agentTraces.sessions.flyout.previousTrace', {
                          defaultMessage: 'Previous trace',
                        })}
                        data-test-subj="agentTracesSessionPreviousTrace"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              {traces.map((trace, i) => (
                <ConversationTurn
                  key={trace.traceId}
                  index={i + 1}
                  trace={trace}
                  focused={i === focusedIndex}
                  turnRef={(el) => {
                    turnRefs.current[i] = el;
                  }}
                  onOpenTrace={() => openTrace(trace.root)}
                />
              ))}
            </EuiFlexItem>
          </EuiFlexGroup>
        )}

        {!loading && !error && view === 'all' && (
          <>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="arrowLeft"
                  flush="left"
                  onClick={() => setView('overview')}
                  data-test-subj="agentTracesSessionBack"
                >
                  <strong>
                    {i18n.translate('agentTraces.sessions.flyout.viewAll', {
                      defaultMessage: 'View All Traces',
                    })}
                  </strong>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">
                  {i18n.translate('agentTraces.sessions.flyout.sessionChip', {
                    defaultMessage: 'Session ID: {id}',
                    values: { id: shortenId(session.sessionId, 12, 0) },
                  })}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiTabs size="s">
              <EuiTab
                isSelected={drillTab === 'traces'}
                onClick={() => setDrillTab('traces')}
                data-test-subj="agentTracesSessionDrillTraces"
              >
                {i18n.translate('agentTraces.sessions.drill.traces', { defaultMessage: 'Traces' })}
              </EuiTab>
              <EuiTab
                isSelected={drillTab === 'spans'}
                onClick={() => setDrillTab('spans')}
                data-test-subj="agentTracesSessionDrillSpans"
              >
                {i18n.translate('agentTraces.sessions.drill.spans', { defaultMessage: 'Spans' })}
              </EuiTab>
            </EuiTabs>
            <EuiSpacer size="s" />
            <SessionSpansTable key={drillTab} rows={drillItems} onRowClick={openTrace} />
          </>
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
