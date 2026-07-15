/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';

/**
 * The visual state a drilldown row resolves to. This is the single source of truth for which card
 * variant renders — a full histogram+logs card, one of the compact one-row treatments, or the
 * collapsed/no-time-field row — so `rows_view` and `log_stream_card` never re-derive it ad hoc.
 */
export enum LogRowState {
  /** Fetch not yet resolved (no result, no error). Stays in the primary list (in place). */
  LOADING = 'loading',
  /** Has events in the selected window → the full histogram + log-lines card. */
  FULL = 'full',
  /** Has documents but none in the selected time range → compact "No events in the last {range}". */
  NO_RECENT = 'no_recent',
  /** Zero documents ever (docs.count === 0) → compact "No documents yet"; no create action. */
  EMPTY_INDEX = 'empty_index',
  /** The preview fetch failed → compact danger/warning row with the error + Retry. */
  ERROR = 'error',
  /** Index has no date field → collapsed row; can't chart or become a dataset. */
  NO_TIME_FIELD = 'no_time_field',
}

interface DeriveArgs {
  kind: 'index' | 'dataset';
  /** True when a raw index has been classified as having no date field. */
  isNoTimeField?: boolean;
  /** Cumulative doc count from cat.indices; `0` ⇒ empty index, `undefined` ⇒ unknown. */
  docsCount?: number;
  /** Whether this row's preview/histogram fetch has produced a result. */
  hasResult: boolean;
  /** Whether this row's (preview) fetch errored. */
  hasError: boolean;
  /** Sum of the histogram severity totals for the selected window (undefined = no histogram yet). */
  histogramTotalsSum?: number;
}

/**
 * Resolve a row's {@link LogRowState}. Precedence (highest first):
 *   NO_TIME_FIELD → ERROR → EMPTY_INDEX → NO_RECENT → LOADING → FULL
 *
 * Rationale for the order: a structural fact (no time field) trumps everything; a hard failure
 * (error) trumps emptiness; a definitively-empty index (docs.count === 0, known up-front from
 * cat.indices) trumps a window-empty one; "no events in range" only applies once a histogram has
 * come back with a zero total; otherwise we're still loading, and finally the happy full card.
 */
export const deriveRowState = ({
  kind,
  isNoTimeField,
  docsCount,
  hasResult,
  hasError,
  histogramTotalsSum,
}: DeriveArgs): LogRowState => {
  if (kind === 'index' && isNoTimeField) return LogRowState.NO_TIME_FIELD;
  if (hasError) return LogRowState.ERROR;
  // Empty-index is known synchronously from cat.indices — only ever on an explicit 0, never on
  // `undefined` (remote/closed indices report no count and must not be mistaken for empty).
  if (docsCount === 0) return LogRowState.EMPTY_INDEX;
  // "No events in range" requires a resolved histogram whose totals sum to exactly zero.
  if (hasResult && histogramTotalsSum === 0) return LogRowState.NO_RECENT;
  if (!hasResult) return LogRowState.LOADING;
  return LogRowState.FULL;
};

/**
 * A "dead" row is one that carries no events to look at in the current window and can be demoted
 * into the collapsed "no recent data" drawer at the bottom of the list. LOADING/UNKNOWN rows are
 * NOT dead (we can't know until their fetch lands), which is what keeps the sort from thrashing.
 */
export const isDead = (state: LogRowState): boolean =>
  state === LogRowState.NO_RECENT || state === LogRowState.EMPTY_INDEX;

/**
 * A humanized label for a time range, e.g. `15 minutes`, `24 hours`. Used in copy such as
 * "No events in the last {range}". Falls back to an empty string for a non-positive span.
 */
export const formatRangeLabel = (fromMs: number, toMs: number): string => {
  const ms = toMs - fromMs;
  if (!Number.isFinite(ms) || ms <= 0) return '';
  return moment.duration(ms, 'milliseconds').humanize();
};
