/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  EuiToolTip,
} from '@elastic/eui';
import { TraceRow } from '../traces/hooks/tree_utils';
import { useTraceFlyout } from '../traces/flyout/trace_flyout_state';
import { TokenIcon } from '../../../components/data_table/table_cell/trace_utils/trace_utils';
import { SessionTrace, useSessionDetail } from './hooks/use_session_detail';
import { SessionSpansTable } from './session_spans_table';
import {
  CopyContentButton,
  MessageContent,
  MessageViewMode,
  MessageViewModeToggle,
  copyTextFor,
} from '../traces/flyout/message_content_view';
import '../traces/flyout/message_content_view.scss';
import {
  parseGenAiMessages,
  previewInputMessages,
  previewOutputMessages,
} from '../traces/hooks/genai_message_preview';
import { SessionRow, formatSessionDuration } from './session_utils';
import { FlyoutHistoryNav } from '../traces/flyout/flyout_history_nav';
import { FlyoutNavigation } from '../traces/flyout/trace_flyout_state';
// Header metadata row shared with the trace flyout.
import '../traces/flyout/trace_details_flyout.scss';

interface SessionDetailsFlyoutProps {
  session: SessionRow;
  /** Trace to focus once the traces load (the one the user came back from). */
  focusTraceId?: string;
  formatTs: (ts: string) => string;
  onClose: () => void;
  /** Back and Forward through the flyouts the user moved between. */
  navigation?: FlyoutNavigation;
}

type DrillTab = 'traces' | 'spans';

const tokensOf = (row: TraceRow): number | null =>
  typeof row.totalTokens === 'number' ? row.totalTokens : null;

/** Number of spans in a trace that ended in error. */
export const errorSpanCount = (trace: SessionTrace): number =>
  trace.spans.filter((span) => span.status === 'error').length;

/** One header metadata item, in the trace flyout's style so both headers line up. */
const MetaItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="agentTracesFlyout__metaItem">
    <EuiText size="xs" className="agentTracesFlyout__metaLabel">
      {label}
    </EuiText>
    <EuiText size="xs" className="agentTracesFlyout__metaValue">
      {children}
    </EuiText>
  </div>
);

const LatencyAndTokens: React.FC<{ row: TraceRow }> = ({ row }) => {
  const tokens = tokensOf(row);
  return (
    <span className="agtSessionFlyout__stats">
      <span className="agtSessionFlyout__stat">
        <EuiIcon type="clock" size="s" color="subdued" />
        {row.latency}
      </span>
      <span className="agtSessionFlyout__stat">
        <TokenIcon />
        {tokens === null ? '—' : tokens.toLocaleString()}
      </span>
    </span>
  );
};

/**
 * Role of the message a turn preview shows, per the OTel GenAI message schema: the last
 * user message for input, the first generation for output. Falls back to user/assistant.
 */
export const turnRole = (value: unknown, side: 'input' | 'output'): string => {
  const messages = parseGenAiMessages(value);
  const fallback = side === 'input' ? 'user' : 'assistant';
  if (!messages || messages.length === 0) return fallback;
  if (side === 'output') return messages[0].role || fallback;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return (lastUser ?? messages[messages.length - 1]).role || fallback;
};

const roleLabel = (role: string): string => {
  switch (role) {
    case 'user':
      return i18n.translate('agentTraces.sessions.flyout.roleUser', { defaultMessage: 'User' });
    case 'assistant':
      return i18n.translate('agentTraces.sessions.flyout.roleAssistant', {
        defaultMessage: 'Assistant',
      });
    case 'system':
      return i18n.translate('agentTraces.sessions.flyout.roleSystem', { defaultMessage: 'System' });
    case 'tool':
      return i18n.translate('agentTraces.sessions.flyout.roleTool', { defaultMessage: 'Tool' });
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

/** One side of a conversation turn, labeled with the message role. */
const MessagePanel: React.FC<{
  side: 'input' | 'output';
  value: unknown;
  text: string;
  mode: MessageViewMode;
}> = ({ side, value, text, mode }) => {
  const role = turnRole(value, side);
  const label = roleLabel(role);
  return (
    <EuiPanel
      paddingSize="none"
      hasBorder
      className={`agtSessionFlyout__message${
        side === 'output' ? ' agtSessionFlyout__message--output' : ''
      }`}
      data-test-subj={`agentTracesSessionMessage-${side}`}
    >
      <div className="agtSessionFlyout__messageHeader">
        <EuiIcon type={role === 'user' ? 'user' : 'compute'} size="s" />
        <strong>{label}</strong>
        <span className="agtSessionFlyout__messageActions">
          <CopyContentButton
            text={copyTextFor(value, mode, text)}
            label={i18n.translate('agentTraces.sessions.flyout.copyMessage', {
              defaultMessage: 'Copy {label} message',
              values: { label },
            })}
          />
        </span>
      </div>
      <div className="agtSessionFlyout__messageBody">
        <MessageContent value={value} mode={mode} formattedText={text} emptyText="—" />
      </div>
    </EuiPanel>
  );
};

/** Input and output messages for one trace in the session conversation. */
const ConversationTurn: React.FC<{
  index: number;
  trace: SessionTrace;
  focused: boolean;
  mode: MessageViewMode;
  turnRef: (el: HTMLDivElement | null) => void;
  onOpenTrace: () => void;
}> = ({ index, trace, focused, mode, turnRef, onOpenTrace }) => (
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
    <MessagePanel
      side="input"
      value={trace.root.input}
      text={previewInputMessages(trace.root.input)}
      mode={mode}
    />
    <EuiSpacer size="s" />
    <MessagePanel
      side="output"
      value={trace.root.output}
      text={previewOutputMessages(trace.root.output)}
      mode={mode}
    />
    <EuiSpacer size="m" />
  </div>
);

export const SessionDetailsFlyout: React.FC<SessionDetailsFlyoutProps> = ({
  session,
  focusTraceId,
  formatTs,
  onClose,
  navigation,
}) => {
  const { traces, loading, error } = useSessionDetail(session.traceIds, formatTs);
  const { openFlyout, updateFlyoutFullTree } = useTraceFlyout();

  const [view, setView] = useState<'overview' | 'all'>('overview');
  const [drillTab, setDrillTab] = useState<DrillTab>('traces');
  /** Index of the trace in focus; the conversation arrows step through traces. */
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [messageMode, setMessageMode] = useState<MessageViewMode>('formatted');
  const turnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const conversationRef = useRef<HTMLDivElement | null>(null);
  const conversationHeaderRef = useRef<HTMLDivElement | null>(null);

  const totalTokens = useMemo(() => {
    const values = traces.map((t) => tokensOf(t.root)).filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : session.totalTokens;
  }, [traces, session.totalTokens]);

  /** Open the existing trace flyout for a row (root or any span) of a session trace. */
  const openTrace = useCallback(
    (row: TraceRow) => {
      const trace = traces.find((t) => t.traceId === row.traceId);
      // Replaces this flyout with the trace flyout; Back returns here with this trace focused.
      openFlyout(row, { fromSession: session });
      if (trace) updateFlyoutFullTree(trace.traceId, trace.tree, false);
    },
    [traces, openFlyout, updateFlyoutFullTree, session]
  );

  /** Focus a trace: highlight it in the list and scroll its turn into view. */
  const focusTrace = useCallback(
    (index: number) => {
      if (index < 0 || index >= traces.length) return;
      setFocusedIndex(index);
      // Scroll only the conversation column (not the flyout body), landing the turn
      // just below the sticky header so its "Trace #n" link stays visible.
      const container = conversationRef.current;
      const turn = turnRefs.current[index];
      if (!container || !turn) return;
      const header = conversationHeaderRef.current;
      const headerHeight = header
        ? header.offsetHeight + parseFloat(getComputedStyle(header).marginBottom || '0')
        : 0;
      const top =
        container.scrollTop +
        turn.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        headerHeight;
      container.scrollTo?.({ top: Math.max(0, top), behavior: 'smooth' });
    },
    [traces.length]
  );

  // Coming back from a trace: focus it again once the session's traces are loaded.
  const restoredFocus = useRef(false);
  useEffect(() => {
    if (restoredFocus.current || !focusTraceId || traces.length === 0) return;
    restoredFocus.current = true;
    const index = traces.findIndex((t) => t.traceId === focusTraceId);
    if (index > 0) focusTrace(index);
  }, [focusTraceId, traces, focusTrace]);

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
        <FlyoutHistoryNav navigation={navigation} />
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false} className="agtSessionFlyout__titleItem">
            <EuiTitle size="m">
              <h2
                id="agentTracesSessionFlyoutTitle"
                className="agtSessionFlyout__title"
                title={session.sessionId}
              >
                {i18n.translate('agentTraces.sessions.flyout.title', {
                  defaultMessage: 'Session: {id}',
                  values: { id: session.sessionId },
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
        <EuiSpacer size="s" />
        <div className="agentTracesFlyout__metaRow">
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalDuration', {
              defaultMessage: 'DURATION',
            })}
          >
            {formatSessionDuration(session.durationMs)}
          </MetaItem>
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalTokens', {
              defaultMessage: 'TOKENS',
            })}
          >
            {totalTokens === null ? '—' : totalTokens.toLocaleString()}
          </MetaItem>
          <MetaItem
            label={i18n.translate('agentTraces.sessions.flyout.totalTraces', {
              defaultMessage: 'TRACES',
            })}
          >
            {session.totalTraces.toLocaleString()}
          </MetaItem>
        </div>
        <EuiSpacer size="s" />
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
              <div className="agtSessionFlyout__panelHeader">
                <EuiTitle size="xxs">
                  <h3>
                    {i18n.translate('agentTraces.sessions.flyout.traceList', {
                      defaultMessage: 'Trace list ({count})',
                      values: { count: traces.length },
                    })}
                  </h3>
                </EuiTitle>
                <EuiLink
                  onClick={() => setView('all')}
                  data-test-subj="agentTracesSessionViewAllTraces"
                >
                  {i18n.translate('agentTraces.sessions.flyout.viewAll', {
                    defaultMessage: 'View All Traces',
                  })}
                </EuiLink>
              </div>
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
                    {errorSpanCount(trace) > 0 && (
                      <EuiToolTip
                        content={i18n.translate('agentTraces.sessions.flyout.traceErrors', {
                          defaultMessage:
                            '{count, plural, one {# span} other {# spans}} with errors',
                          values: { count: errorSpanCount(trace) },
                        })}
                      >
                        <EuiIcon
                          type="alert"
                          color="danger"
                          size="s"
                          aria-label={i18n.translate('agentTraces.sessions.flyout.traceHasErrors', {
                            defaultMessage: 'Trace has errors',
                          })}
                          data-test-subj={`agentTracesSessionTraceError-${i + 1}`}
                        />
                      </EuiToolTip>
                    )}
                  </span>
                  <LatencyAndTokens row={trace.root} />
                </div>
              ))}
            </EuiFlexItem>

            <EuiFlexItem grow={7} className="agtSessionFlyout__conversation">
              <div className="agtSessionFlyout__conversationScroll" ref={conversationRef}>
                <div className="agtSessionFlyout__panelHeader" ref={conversationHeaderRef}>
                  <EuiTitle size="xxs">
                    <h3>
                      {i18n.translate('agentTraces.sessions.flyout.conversation', {
                        defaultMessage: 'Session Conversation',
                      })}
                    </h3>
                  </EuiTitle>
                  <div className="agtSessionFlyout__panelActions">
                    <MessageViewModeToggle
                      mode={messageMode}
                      onChange={setMessageMode}
                      idPrefix="agentTracesSessionMessages"
                    />
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
                  </div>
                </div>
                {traces.map((trace, i) => (
                  <ConversationTurn
                    key={trace.traceId}
                    index={i + 1}
                    trace={trace}
                    focused={i === focusedIndex}
                    mode={messageMode}
                    turnRef={(el) => {
                      turnRefs.current[i] = el;
                    }}
                    onOpenTrace={() => openTrace(trace.root)}
                  />
                ))}
              </div>
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
                    defaultMessage: 'Session: {id}',
                    values: { id: session.sessionId },
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
