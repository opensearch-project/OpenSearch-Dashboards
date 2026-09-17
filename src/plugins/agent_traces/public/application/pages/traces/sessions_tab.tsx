/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import moment from 'moment-timezone';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { AGENT_TRACES_APP_URL_GENERATOR } from '../../../url_generator';
import { useDatasetContext } from '../../context/dataset_context/dataset_context';
import { useTabResults } from '../../utils/hooks/use_tab_results';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { TableEmptyState, TableLoadingState } from './table_shared';
import { formatTimestamp } from './hooks/tree_utils';
import {
  buildPPLQueryRequest,
  escapePPLValue,
  executePPLQuery,
} from './trace_details/data_fetching/ppl_request_helpers';
import { transformPPLDataToTraceHits } from './trace_details/traces/ppl_to_trace_hits';

const CONVERSATION_ID_FIELD = 'attributes.gen_ai.conversation.id';

/**
 * Upper bound on spans fetched for a single conversation flyout. Conversations
 * longer than this are truncated and the flyout surfaces a notice (see
 * `SessionDetailFlyout`).
 */
const MAX_CONVERSATION_SPANS = 1000;

/**
 * How many trace exchanges the flyout renders before requiring an explicit
 * "show more". A long conversation can fold into hundreds of exchanges, each
 * with its own chat bubbles and (for structured turns) a Prism-highlighted
 * `EuiCodeBlock`; rendering them all at once jank the main thread and inflates
 * the DOM. Cap the initial paint and let the user expand on demand.
 */
const INITIAL_EXCHANGE_RENDER = 25;

/**
 * Reads a field from a span/aggregation record whose attributes may be flattened
 * (dotted keys) at any level or fully nested. PPL `stats ... by` output uses the
 * literal dotted group-by column name; span records normalized by
 * `transformPPLDataToTraceHits` carry a nested `attributes` object that may in
 * turn hold either nested or dotted sub-keys. Resolve all of these by trying the
 * longest remaining dotted key at each level before descending one segment.
 */
const readField = (source: Record<string, any> | undefined, key: string): any => {
  if (!source) return undefined;
  if (key in source) return source[key];
  const parts = key.split('.');
  let current: any = source;
  for (let i = 0; i < parts.length; i++) {
    if (current == null || typeof current !== 'object') return undefined;
    const remaining = parts.slice(i).join('.');
    if (remaining in current) return current[remaining];
    current = current[parts[i]];
  }
  return current;
};

const toNumber = (value: any): number => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Projects a gen_ai chat-message attribute to a short display string. The
 * message field may arrive as a scalar string, a single `{ role, content }`
 * object, or an array of such objects (gen_ai semconv), or as pre-serialized
 * JSON. The `take(field, 1)` aggregation feeding these columns yields a
 * single-element array, which this helper unwraps. Extract the human-readable
 * text so the message-forward list columns stay legible.
 */
const previewText = (value: any): string => {
  if (value == null) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // A message attribute may arrive as a JSON-encoded object/array — unwrap it.
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return previewText(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (Array.isArray(value)) {
    return value.map(previewText).filter(Boolean).join(' · ');
  }
  if (typeof value === 'object') {
    const content = value.content ?? value.text ?? value.message;
    if (content != null) return previewText(content);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

/** A single aggregated session row derived from the tab's `stats` query. */
interface SessionRow {
  conversationId: string;
  sessionStart?: string;
  sessionEnd?: string;
  /** Session span-latency percentiles, in nanoseconds (`percentile(durationInNanos, N)`). */
  p50LatencyNs: number;
  p99LatencyNs: number;
  firstInput: string;
  firstOutput: string;
  spanCount: number;
  traceCount: number;
  turnCount: number;
  errorCount: number;
  inputTokens: number;
  outputTokens: number;
  agentId?: string;
  agentName?: string;
  requestModel?: string;
  responseModel?: string;
  providerName?: string;
}

const hitToSessionRow = (source: Record<string, any>): SessionRow => ({
  conversationId: String(readField(source, CONVERSATION_ID_FIELD) ?? ''),
  sessionStart: readField(source, 'session_start'),
  sessionEnd: readField(source, 'session_end'),
  p50LatencyNs: toNumber(readField(source, 'p50_latency')),
  p99LatencyNs: toNumber(readField(source, 'p99_latency')),
  firstInput: previewText(readField(source, 'first_input')),
  firstOutput: previewText(readField(source, 'first_output')),
  spanCount: toNumber(readField(source, 'span_count')),
  traceCount: toNumber(readField(source, 'trace_count')),
  turnCount: toNumber(readField(source, 'turn_count')),
  errorCount: toNumber(readField(source, 'error_count')),
  inputTokens: toNumber(readField(source, 'input_tokens')),
  outputTokens: toNumber(readField(source, 'output_tokens')),
  agentId: readField(source, 'agent_id'),
  agentName: readField(source, 'agent_name'),
  requestModel: readField(source, 'request_model'),
  responseModel: readField(source, 'response_model'),
  providerName: readField(source, 'provider_name'),
});

/**
 * Timestamp for display. Delegates to the plugin's shared `formatTimestamp`,
 * which parses PPL's timezone-less timestamps as UTC and then converts to the
 * user's configured `dateFormat:tz` — matching the Traces/Spans tabs and the
 * trace-detail view. (A bare `moment(ts)` here parsed as local time, so the same
 * span rendered at a different wall-clock in Sessions than everywhere else.)
 */
const formatTs = (ts: string | undefined, timezone: string): string =>
  ts ? formatTimestamp(ts, timezone) : '—';

/** Resolve the configured display timezone (`dateFormat:tz`), Browser-aware. */
const useDisplayTimezone = (uiSettings?: { get: (k: string) => any }): string =>
  useMemo(() => {
    const tz = uiSettings?.get('dateFormat:tz');
    if (tz && tz !== 'Browser') return tz;
    return moment.tz.guess() || moment().format('Z');
  }, [uiSettings]);

/** Humanized latency from a nanosecond duration. */
const formatLatencyNs = (ns?: number): string => {
  if (!ns || !Number.isFinite(ns) || ns <= 0) return '—';
  const ms = ns / 1e6;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

/** Humanized latency from a millisecond duration (per-turn rail metadata). */
const formatLatencyMs = (ms?: number): string => {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

/**
 * Percentile across a set of values (nearest-rank). Used for the KPI-strip
 * latency figures, which aggregate the per-session percentile columns across
 * the visible sessions — an approximation that avoids a second global-percentile
 * query at list scale (see role note on high-cardinality scaling).
 */
const percentileOf = (values: number[], p: number): number => {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(rank, sorted.length) - 1];
};

const modelLabel = (row: SessionRow): string => {
  if (row.requestModel && row.responseModel && row.requestModel !== row.responseModel) {
    return `${row.requestModel} → ${row.responseModel}`;
  }
  return row.requestModel || row.responseModel || '—';
};

/** Two-line clamped text for the message-forward list columns. */
const ClampText: React.FC<{ text: string; subdued?: boolean }> = ({ text, subdued }) =>
  text ? (
    <EuiText
      size="s"
      color={subdued ? 'subdued' : 'default'}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {text}
    </EuiText>
  ) : (
    <EuiText size="s" color="subdued">
      —
    </EuiText>
  );

/**
 * A single conversation turn rendered in the chat flyout. Derived UI-side from
 * the gen_ai chat spans within the conversation.
 */
interface ConversationTurn {
  key: string;
  role: 'user' | 'assistant';
  content: string;
  traceId?: string;
  timestamp?: string;
  userId?: string;
  hasError: boolean;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  tools: string[];
}

/**
 * A trace-scoped exchange: the human turn(s) plus the AI answer for one trace,
 * rendered as a chat block on the left with a per-trace metadata card on the
 * right (Phoenix parity — see IMPLEMENTATION_SPEC §3).
 */
interface TraceExchange {
  traceId?: string;
  index: number;
  turns: ConversationTurn[];
  userId?: string;
  timestamp?: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  hasError: boolean;
}

const stringifyMessages = (value: any): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/**
 * Whether a turn's serialized content is a structured JSON payload (object or
 * array) rather than plain prose. Plain conversational text renders as readable
 * prose; only genuine JSON gets the monospace code-block treatment so short
 * chat turns stay compact and legible (Phoenix parity).
 */
const isStructuredContent = (content: string): boolean => {
  const t = content.trim();
  return t.startsWith('{') || t.startsWith('[');
};

/**
 * Fetches the spans for one conversation and folds them into user/assistant
 * turns for the chat view. Routes through the same dataset/PPL request path the
 * Sessions tab itself uses (`buildPPLQueryRequest` / `buildPPLDataset`) so the
 * dataset's `dataSource` reference is preserved (multi-data-source) and the
 * conversation filter uses the exact same field reference as the tab's `stats`
 * aggregation (avoids a raw `term` that assumes a `keyword` mapping). The
 * dataset's `timeFieldName` is intentionally omitted so the full conversation is
 * returned regardless of the active time window.
 *
 * NOTE (dev-server validation): the message-attribute keys below follow the
 * gen_ai semconv and the source-field map in `common/index.ts`; confirm the
 * live shape against obs-stack telemetry when running OSD `--dev`.
 */
const useConversationExchanges = (conversationId: string | null) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { dataset } = useDatasetContext();
  const [exchanges, setExchanges] = useState<TraceExchange[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !dataset?.title) {
      setExchanges([]);
      setTruncated(false);
      return;
    }
    let cancelled = false;
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    // Omit timeFieldName to prevent automatic time filtering — the flyout shows
    // the whole conversation, not just spans in the current time range.
    const pplDataset = {
      id: dataset.id,
      title: dataset.title,
      type: dataset.type,
      ...(dataset.dataSource && { dataSource: dataset.dataSource }),
    };

    const pplQuery =
      `source = ${dataset.title}` +
      ` | where \`${CONVERSATION_ID_FIELD}\` = ${escapePPLValue(conversationId)}` +
      ` | sort + startTime` +
      ` | head ${MAX_CONVERSATION_SPANS}`;

    const run = async () => {
      try {
        const request = buildPPLQueryRequest(pplDataset, pplQuery);
        const response = await executePPLQuery(services.data, request, abortController.signal);
        if (cancelled) return;
        const hits = transformPPLDataToTraceHits(response);
        setExchanges(turnsToExchanges(spansToTurns(hits)));
        setTruncated(hits.length >= MAX_CONVERSATION_SPANS);
      } catch (e) {
        if (cancelled) return;
        setError(
          (e as Error)?.message ||
            i18n.translate('agentTraces.sessions.flyout.loadError', {
              defaultMessage: 'Failed to load conversation',
            })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [conversationId, dataset, services]);

  return { exchanges, truncated, loading, error };
};

/** Folds ordered spans into alternating user/assistant turns. */
const spansToTurns = (hits: Array<Record<string, any>>): ConversationTurn[] => {
  const turns: ConversationTurn[] = [];
  hits.forEach((src, idx) => {
    const input = readField(src, 'attributes.gen_ai.input.messages');
    const output = readField(src, 'attributes.gen_ai.output.messages');
    const traceId = readField(src, 'traceId');
    const toolName = readField(src, 'attributes.gen_ai.tool.name');
    const startTime = readField(src, 'startTime');
    const endTime = readField(src, 'endTime');
    const userId = readField(src, 'attributes.enduser.id');
    const hasError = String(readField(src, 'status.code') ?? '').toUpperCase() === 'ERROR';
    const latencyMs =
      startTime && endTime ? moment(endTime).valueOf() - moment(startTime).valueOf() : undefined;

    if (input) {
      turns.push({
        key: `${idx}-user`,
        role: 'user',
        content: stringifyMessages(input),
        traceId,
        timestamp: startTime,
        userId,
        hasError,
        tools: [],
      });
    }
    if (output || toolName) {
      turns.push({
        key: `${idx}-assistant`,
        role: 'assistant',
        content: stringifyMessages(output),
        traceId,
        timestamp: startTime,
        userId,
        hasError,
        model:
          readField(src, 'attributes.gen_ai.response.model') ||
          readField(src, 'attributes.gen_ai.request.model'),
        inputTokens: toNumber(readField(src, 'attributes.gen_ai.usage.input_tokens')) || undefined,
        outputTokens:
          toNumber(readField(src, 'attributes.gen_ai.usage.output_tokens')) || undefined,
        latencyMs,
        tools: toolName ? [String(toolName)] : [],
      });
    }
  });
  return turns;
};

/** Groups ordered turns into trace-scoped exchanges (one card per trace). */
const turnsToExchanges = (turns: ConversationTurn[]): TraceExchange[] => {
  const exchanges: TraceExchange[] = [];
  const byTrace = new Map<string, TraceExchange>();
  turns.forEach((turn) => {
    const key = turn.traceId || `_turn_${turn.key}`;
    let exchange = byTrace.get(key);
    if (!exchange) {
      exchange = {
        traceId: turn.traceId,
        index: exchanges.length + 1,
        turns: [],
        userId: turn.userId,
        timestamp: turn.timestamp,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: undefined,
        hasError: false,
      };
      byTrace.set(key, exchange);
      exchanges.push(exchange);
    }
    exchange.turns.push(turn);
    exchange.userId = exchange.userId || turn.userId;
    exchange.timestamp = exchange.timestamp || turn.timestamp;
    exchange.model = exchange.model || turn.model;
    exchange.inputTokens += turn.inputTokens ?? 0;
    exchange.outputTokens += turn.outputTokens ?? 0;
    if (turn.latencyMs != null) {
      exchange.latencyMs = Math.max(exchange.latencyMs ?? 0, turn.latencyMs);
    }
    exchange.hasError = exchange.hasError || turn.hasError;
  });
  return exchanges;
};

/** A HUMAN/AI chat bubble. */
const TurnBubble: React.FC<{ turn: ConversationTurn }> = ({ turn }) => {
  const isUser = turn.role === 'user';
  return (
    <EuiPanel
      // `hasBorder` is a no-op on colored (non-plain/-transparent) panels in
      // OUI, so the error outline is applied via an inline border using the
      // theme's danger token (theme-aware in light and dark, unlike the old
      // hardcoded hex fallback).
      color={isUser ? 'subdued' : 'primary'}
      hasShadow={false}
      paddingSize="m"
      data-test-subj={`agentTracesTurn-${turn.role}`}
      style={turn.hasError ? { border: `1px solid ${euiThemeVars.euiColorDanger}` } : {}}
    >
      <EuiText size="xs" color="subdued">
        <strong>
          {isUser
            ? i18n.translate('agentTraces.sessions.flyout.role.user', {
                defaultMessage: 'HUMAN',
              })
            : i18n.translate('agentTraces.sessions.flyout.role.assistant', {
                defaultMessage: 'AI',
              })}
        </strong>
      </EuiText>
      <EuiSpacer size="xs" />
      {turn.content ? (
        isStructuredContent(turn.content) ? (
          <EuiCodeBlock
            language="json"
            fontSize="s"
            paddingSize="s"
            isCopyable
            overflowHeight={320}
          >
            {turn.content}
          </EuiCodeBlock>
        ) : (
          <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
            {turn.content}
          </EuiText>
        )
      ) : (
        <EuiText size="s" color="subdued">
          <em>
            {i18n.translate('agentTraces.sessions.flyout.noContent', {
              defaultMessage: '(no content)',
            })}
          </em>
        </EuiText>
      )}
      {turn.tools.length > 0 && (
        <>
          <EuiSpacer size="xs" />
          <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
            {turn.tools.map((tool) => (
              <EuiFlexItem grow={false} key={tool}>
                <EuiBadge iconType="wrench" color="hollow">
                  {tool}
                </EuiBadge>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </>
      )}
      {turn.hasError && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="danger">
            {i18n.translate('agentTraces.sessions.flyout.turnError', {
              defaultMessage: 'This turn recorded an error.',
            })}
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};

/** Per-trace metadata card in the right rail. */
const TraceRailCard: React.FC<{
  exchange: TraceExchange;
  onViewTrace: (traceId: string) => void;
  timezone: string;
}> = ({ exchange, onViewTrace, timezone }) => (
  <EuiPanel hasBorder paddingSize="s" color="transparent">
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiText size="xs">
          <strong>
            {i18n.translate('agentTraces.sessions.flyout.traceN', {
              defaultMessage: 'Trace #{n}',
              values: { n: exchange.index },
            })}
          </strong>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem />
      {exchange.traceId && (
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            iconType="popout"
            iconSide="right"
            onClick={() => onViewTrace(exchange.traceId!)}
            data-test-subj="agentTracesViewTraceLink"
          >
            {i18n.translate('agentTraces.sessions.flyout.viewTrace', {
              defaultMessage: 'View Trace ›',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
    <EuiText size="xs" color="subdued">
      {exchange.userId
        ? i18n.translate('agentTraces.sessions.flyout.user', {
            defaultMessage: 'user: {id}',
            values: { id: exchange.userId },
          })
        : i18n.translate('agentTraces.sessions.flyout.userUnknown', {
            defaultMessage: 'user: —',
          })}
    </EuiText>
    <EuiText size="xs" color="subdued">
      {formatTs(exchange.timestamp, timezone)}
    </EuiText>
    <EuiSpacer size="xs" />
    <EuiFlexGroup gutterSize="m" responsive={false} wrap>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued">
          <EuiIcon type="database" size="s" />{' '}
          {i18n.translate('agentTraces.sessions.flyout.tokensCount', {
            defaultMessage: '{count, plural, one {# token} other {# tokens}}',
            values: { count: exchange.inputTokens + exchange.outputTokens },
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued">
          <EuiIcon type="clock" size="s" /> {formatLatencyMs(exchange.latencyMs)}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
);

interface SessionDetailFlyoutProps {
  session: SessionRow;
  onClose: () => void;
  onViewTrace: (traceId: string) => void;
  timezone: string;
}

const SESSION_FLYOUT_TITLE_ID = 'agentTracesSessionFlyoutTitle';

const SessionDetailFlyout: React.FC<SessionDetailFlyoutProps> = ({
  session,
  onClose,
  onViewTrace,
  timezone,
}) => {
  const { exchanges, truncated, loading, error } = useConversationExchanges(session.conversationId);
  const [visibleCount, setVisibleCount] = useState(INITIAL_EXCHANGE_RENDER);
  const visibleExchanges = exchanges.slice(0, visibleCount);
  const hiddenCount = exchanges.length - visibleExchanges.length;

  return (
    <EuiFlyout
      onClose={onClose}
      size="l"
      ownFocus
      aria-labelledby={SESSION_FLYOUT_TITLE_ID}
      data-test-subj="agentTracesSessionFlyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={SESSION_FLYOUT_TITLE_ID} className="eui-textTruncate">
            {i18n.translate('agentTraces.sessions.flyout.title', {
              defaultMessage: 'Session ID: {id}',
              values: { id: session.conversationId },
            })}
          </h2>
        </EuiTitle>
        <EuiSpacer size="xs" />
        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">{modelLabel(session)}</EuiBadge>
          </EuiFlexItem>
          {session.providerName && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="default">{session.providerName}</EuiBadge>
            </EuiFlexItem>
          )}
          {(session.agentName || session.agentId) && (
            <EuiFlexItem grow={false}>
              <EuiToolTip content={session.agentId}>
                <EuiBadge color="primary">{session.agentName || session.agentId}</EuiBadge>
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="l" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <EuiStat
              title={session.traceCount.toLocaleString()}
              description={i18n.translate('agentTraces.sessions.flyout.stat.traces', {
                defaultMessage: 'Traces',
              })}
              titleSize="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiStat
              title={(session.inputTokens + session.outputTokens).toLocaleString()}
              description={i18n.translate('agentTraces.sessions.flyout.stat.tokens', {
                defaultMessage: 'Total tokens',
              })}
              titleSize="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiStat
              title={formatLatencyNs(session.p50LatencyNs)}
              description={i18n.translate('agentTraces.sessions.flyout.stat.p50', {
                defaultMessage: 'Latency P50',
              })}
              titleSize="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiStat
              title={formatLatencyNs(session.p99LatencyNs)}
              description={i18n.translate('agentTraces.sessions.flyout.stat.p99', {
                defaultMessage: 'Latency P99',
              })}
              titleSize="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiStat
              title={session.errorCount.toLocaleString()}
              description={i18n.translate('agentTraces.sessions.flyout.stat.errors', {
                defaultMessage: 'Errors',
              })}
              titleSize="s"
              titleColor={session.errorCount > 0 ? 'danger' : 'default'}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {loading && (
          <TableLoadingState
            message={i18n.translate('agentTraces.sessions.flyout.loading', {
              defaultMessage: 'Loading conversation…',
            })}
          />
        )}
        {!loading && error && (
          <EuiEmptyPrompt
            iconType="alert"
            title={
              <h3>
                {i18n.translate('agentTraces.sessions.flyout.errorTitle', {
                  defaultMessage: 'Could not load conversation',
                })}
              </h3>
            }
            body={<p>{error}</p>}
          />
        )}
        {!loading && !error && exchanges.length === 0 && (
          <EuiEmptyPrompt
            iconType="editorComment"
            title={
              <h3>
                {i18n.translate('agentTraces.sessions.flyout.emptyTitle', {
                  defaultMessage: 'No conversation content',
                })}
              </h3>
            }
            body={
              <p>
                {i18n.translate('agentTraces.sessions.flyout.emptyBody', {
                  defaultMessage: 'This session has no gen_ai chat messages to display.',
                })}
              </p>
            }
          />
        )}
        {!loading && !error && truncated && (
          <>
            <EuiCallOut
              size="s"
              color="warning"
              iconType="alert"
              title={i18n.translate('agentTraces.sessions.flyout.truncated', {
                defaultMessage:
                  'Showing the first {limit} spans of this conversation. Later spans are not displayed.',
                values: { limit: MAX_CONVERSATION_SPANS },
              })}
            />
            <EuiSpacer size="s" />
          </>
        )}
        {!loading &&
          !error &&
          visibleExchanges.map((exchange, idx) => (
            <React.Fragment key={exchange.traceId || `exchange-${idx}`}>
              {idx > 0 && <EuiHorizontalRule margin="s" />}
              <EuiFlexGroup gutterSize="m" responsive={false} alignItems="flexStart">
                {/* Left: chat transcript for this trace */}
                <EuiFlexItem grow={7}>
                  {exchange.turns.map((turn) => (
                    <React.Fragment key={turn.key}>
                      <TurnBubble turn={turn} />
                      <EuiSpacer size="s" />
                    </React.Fragment>
                  ))}
                </EuiFlexItem>
                {/* Right: per-trace metadata rail */}
                <EuiFlexItem grow={3}>
                  <TraceRailCard
                    exchange={exchange}
                    onViewTrace={onViewTrace}
                    timezone={timezone}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </React.Fragment>
          ))}
        {!loading && !error && hiddenCount > 0 && (
          <>
            <EuiHorizontalRule margin="s" />
            <EuiFlexGroup justifyContent="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="arrowDown"
                  onClick={() => setVisibleCount((c) => c + INITIAL_EXCHANGE_RENDER)}
                  data-test-subj="agentTracesShowMoreExchanges"
                >
                  {i18n.translate('agentTraces.sessions.flyout.showMore', {
                    defaultMessage: 'Show {count} more {count, plural, one {trace} other {traces}}',
                    values: { count: Math.min(hiddenCount, INITIAL_EXCHANGE_RENDER) },
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

/**
 * Sessions tab: lists conversations derived at query time (see the tab's
 * `prepareQuery` in `register_tabs.ts`) and opens a Phoenix-style chat flyout
 * for a selected conversation. The list is message-forward: first input /
 * last output lead, and agent/model fold into the Session-ID sub-line.
 */
export const SessionsTab = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { dataset } = useDatasetContext();
  const { results, status } = useTabResults();
  const [selected, setSelected] = useState<SessionRow | null>(null);
  const timezone = useDisplayTimezone(services.uiSettings);

  const sessions: SessionRow[] = useMemo(() => {
    const hits = results?.hits?.hits ?? [];
    return hits
      .map((hit: any) => hitToSessionRow(hit._source || {}))
      .filter((row: SessionRow) => row.conversationId);
  }, [results]);

  const isLoading =
    status?.status === QueryExecutionStatus.LOADING ||
    status?.status === QueryExecutionStatus.UNINITIALIZED;

  const openTraceForTurn = useCallback(
    async (traceId: string) => {
      const generator = services.share?.urlGenerators?.getUrlGenerator(
        AGENT_TRACES_APP_URL_GENERATOR
      );
      if (!generator) return;
      // Open the tab synchronously inside the click's user-activation window,
      // then navigate it once the URL resolves. Awaiting `createUrl` first and
      // then calling `window.open` breaks the activation chain, so Safari/
      // Firefox (and Chrome under stricter settings) block the popup. Null the
      // opener to keep the `noopener` security posture (passing 'noopener' to
      // window.open would return null and defeat this pattern).
      const win = window.open('about:blank', '_blank');
      if (win) win.opener = null;
      try {
        const url = await generator.createUrl({
          query: {
            language: 'PPL',
            query: `source = ${dataset?.title ?? ''} | where traceId = ${escapePPLValue(traceId)}`,
            dataset: dataset as any,
          } as any,
          timeRange: services.timefilter?.getTime(),
        });
        // Same-origin: createUrl returns an app-relative hash URL.
        if (win) {
          win.location.href = url;
        } else {
          // Popup was blocked despite the synchronous open — fall back to a
          // best-effort direct open so the action is not silently lost.
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (e) {
        if (win) win.close();
      }
    },
    [services, dataset]
  );

  const kpis = useMemo(() => {
    const totalSessions = sessions.length;
    const totalTraces = sessions.reduce((acc, s) => acc + s.traceCount, 0);
    const totalTokens = sessions.reduce((acc, s) => acc + s.inputTokens + s.outputTokens, 0);
    // KPI-strip latency = percentile across sessions of the per-session latency
    // percentiles (approximation; avoids a second global-percentile query).
    const latencyP50 = percentileOf(
      sessions.map((s) => s.p50LatencyNs),
      50
    );
    const latencyP99 = percentileOf(
      sessions.map((s) => s.p99LatencyNs),
      99
    );
    return { totalSessions, totalTraces, totalTokens, latencyP50, latencyP99 };
  }, [sessions]);

  const columns: Array<EuiBasicTableColumn<SessionRow>> = [
    {
      field: 'conversationId',
      name: i18n.translate('agentTraces.sessions.col.sessionId', {
        defaultMessage: 'Session ID',
      }),
      render: (id: string, row: SessionRow) => {
        // Accessible name for the error indicator — an `EuiIcon` with no
        // aria-label/title is `aria-hidden` in OUI, so a color-only dot is
        // invisible to screen readers. Give it (and its tooltip) real text.
        const errLabel = i18n.translate('agentTraces.sessions.status.error', {
          defaultMessage: '{count, plural, one {# error} other {# errors}}',
          values: { count: row.errorCount },
        });
        return (
          <div>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              {row.errorCount > 0 && (
                <EuiFlexItem grow={false}>
                  <EuiToolTip content={errLabel}>
                    <EuiIcon
                      type="dot"
                      color="danger"
                      aria-label={errLabel}
                      title={errLabel}
                      data-test-subj="agentTracesSessionErrorDot"
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <EuiLink
                  onClick={() => setSelected(row)}
                  data-test-subj="agentTracesSessionIdLink"
                  className="eui-textTruncate"
                >
                  <code>{id}</code>
                </EuiLink>
              </EuiFlexItem>
            </EuiFlexGroup>
            {(row.agentName || row.requestModel) && (
              <EuiText size="xs" color="subdued" className="eui-textTruncate">
                {[row.agentName, row.requestModel].filter(Boolean).join(' · ')}
              </EuiText>
            )}
          </div>
        );
      },
      sortable: (row: SessionRow) => row.conversationId,
    },
    {
      field: 'firstInput',
      name: i18n.translate('agentTraces.sessions.col.firstInput', {
        defaultMessage: 'First input',
      }),
      render: (text: string) => <ClampText text={text} />,
    },
    {
      field: 'firstOutput',
      name: i18n.translate('agentTraces.sessions.col.firstOutput', {
        defaultMessage: 'First response',
      }),
      render: (text: string) => <ClampText text={text} subdued />,
    },
    {
      field: 'sessionStart',
      name: i18n.translate('agentTraces.sessions.col.start', { defaultMessage: 'Start time' }),
      render: (ts: string | undefined) => formatTs(ts, timezone),
      sortable: true,
    },
    {
      field: 'sessionEnd',
      name: i18n.translate('agentTraces.sessions.col.end', { defaultMessage: 'End time' }),
      render: (ts: string | undefined) => formatTs(ts, timezone),
      sortable: true,
    },
    {
      field: 'p50LatencyNs',
      name: i18n.translate('agentTraces.sessions.col.p50', { defaultMessage: 'P50 latency' }),
      dataType: 'number',
      render: (ns: number) => (
        <EuiText size="s" color="success">
          <EuiIcon type="clock" size="s" /> {formatLatencyNs(ns)}
        </EuiText>
      ),
      sortable: true,
    },
    {
      field: 'p99LatencyNs',
      name: i18n.translate('agentTraces.sessions.col.p99', { defaultMessage: 'P99 latency' }),
      dataType: 'number',
      render: (ns: number) => (
        <EuiText size="s">
          <EuiIcon type="clock" size="s" /> {formatLatencyNs(ns)}
        </EuiText>
      ),
      sortable: true,
    },
    {
      name: i18n.translate('agentTraces.sessions.col.tokens', {
        defaultMessage: 'Total tokens',
      }),
      render: (row: SessionRow) => (
        <span>
          <EuiIcon type="database" size="s" />{' '}
          {(row.inputTokens + row.outputTokens).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'traceCount',
      name: i18n.translate('agentTraces.sessions.col.traces', { defaultMessage: 'Total traces' }),
      dataType: 'number',
      sortable: true,
    },
  ];

  if (isLoading && sessions.length === 0) {
    return (
      <div className="agentTraces-sessions-tab tab-container">
        <TableLoadingState
          message={i18n.translate('agentTraces.sessions.loading', {
            defaultMessage: 'Loading sessions…',
          })}
        />
      </div>
    );
  }

  if (!isLoading && sessions.length === 0) {
    return (
      <div className="agentTraces-sessions-tab tab-container">
        <TableEmptyState
          title={i18n.translate('agentTraces.sessions.empty.title', {
            defaultMessage: 'No sessions found',
          })}
        />
      </div>
    );
  }

  return (
    <div className="agentTraces-sessions-tab tab-container">
      {/*
       * `.tab-container` is a flex column, and `EuiFlexGroup` defaults to
       * `flex-grow: 1`, so an unconstrained KPI strip balloons to fill the
       * column and shoves the table far down the viewport. Pin it to its
       * content height so the table sits directly beneath the KPIs.
       */}
      <EuiFlexGroup
        gutterSize="l"
        responsive={false}
        wrap
        style={{ flexGrow: 0, flexShrink: 0 }}
        data-test-subj="agentTracesSessionsKpiStrip"
      >
        <EuiFlexItem grow={false}>
          <EuiStat
            title={kpis.totalSessions}
            description={i18n.translate('agentTraces.sessions.kpi.sessions', {
              defaultMessage: 'Sessions',
            })}
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={kpis.totalTraces.toLocaleString()}
            description={i18n.translate('agentTraces.sessions.kpi.totalTraces', {
              defaultMessage: 'Total traces',
            })}
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={kpis.totalTokens.toLocaleString()}
            description={i18n.translate('agentTraces.sessions.kpi.totalTokens', {
              defaultMessage: 'Total tokens',
            })}
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={formatLatencyNs(kpis.latencyP50)}
            description={i18n.translate('agentTraces.sessions.kpi.p50', {
              defaultMessage: 'Latency P50',
            })}
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={formatLatencyNs(kpis.latencyP99)}
            description={i18n.translate('agentTraces.sessions.kpi.p99', {
              defaultMessage: 'Latency P99',
            })}
            titleSize="m"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiInMemoryTable
        items={sessions}
        columns={columns}
        pagination={{ initialPageSize: 25, pageSizeOptions: [25, 50, 100] }}
        sorting={{ sort: { field: 'sessionStart', direction: 'desc' } }}
        search={{
          box: {
            incremental: true,
            schema: true,
            placeholder: i18n.translate('agentTraces.sessions.searchPlaceholder', {
              defaultMessage: 'Search messages…',
            }),
          },
        }}
        itemId="conversationId"
        data-test-subj="agentTracesSessionsTable"
        loading={isLoading}
      />
      {selected && (
        <SessionDetailFlyout
          session={selected}
          onClose={() => setSelected(null)}
          onViewTrace={openTraceForTurn}
          timezone={timezone}
        />
      )}
    </div>
  );
};
