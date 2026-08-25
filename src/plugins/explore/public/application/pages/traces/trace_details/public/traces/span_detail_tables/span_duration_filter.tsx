/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { SpanFilter } from '../../../trace_view';
import { DURATION_MIN_FILTER_FIELD } from './utils';
import { extractSpanDuration } from '../../utils/span_data_utils';

export interface SpanDurationFilterProps {
  /** All spans in the trace, used to derive the p90/p99 presets. */
  spans: Array<Record<string, any>>;
  spanFilters: SpanFilter[];
  setSpanFiltersWithStorage: (filters: SpanFilter[]) => void;
}

const NANOS_PER_MS = 1e6;

const percentile = (sortedNanos: number[], p: number): number => {
  if (sortedNanos.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedNanos.length) - 1;
  return sortedNanos[Math.max(0, Math.min(sortedNanos.length - 1, index))];
};

const formatNanos = (nanos: number): string => {
  const ms = nanos / NANOS_PER_MS;
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${Math.round(ms)}ms`;
  return `${Math.round(nanos / 1000)}µs`;
};

/**
 * "Filter by duration" — a Grafana-style minimum span-duration filter. Users can
 * type a minimum (in ms) or pick a p90/p99 preset derived from this trace's
 * spans; both add a single client-side `durationMin` filter (value in nanos).
 */
export const SpanDurationFilter: React.FC<SpanDurationFilterProps> = ({
  spans,
  spanFilters,
  setSpanFiltersWithStorage,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const activeFilter = spanFilters.find((filter) => filter.field === DURATION_MIN_FILTER_FIELD);
  const activeNanos = typeof activeFilter?.value === 'number' ? activeFilter.value : undefined;

  const [minMs, setMinMs] = useState<string>(
    activeNanos !== undefined ? String(activeNanos / NANOS_PER_MS) : ''
  );

  const sortedNanos = useMemo(
    () =>
      spans
        .map((span) => extractSpanDuration(span))
        .filter((nanos) => nanos > 0)
        .sort((a, b) => a - b),
    [spans]
  );

  const p90 = useMemo(() => percentile(sortedNanos, 90), [sortedNanos]);
  const p99 = useMemo(() => percentile(sortedNanos, 99), [sortedNanos]);

  const applyNanos = (nanos: number) => {
    const others = spanFilters.filter((filter) => filter.field !== DURATION_MIN_FILTER_FIELD);
    setSpanFiltersWithStorage([...others, { field: DURATION_MIN_FILTER_FIELD, value: nanos }]);
    setMinMs(String(nanos / NANOS_PER_MS));
    setIsPopoverOpen(false);
  };

  const clear = () => {
    setSpanFiltersWithStorage(
      spanFilters.filter((filter) => filter.field !== DURATION_MIN_FILTER_FIELD)
    );
    setMinMs('');
    setIsPopoverOpen(false);
  };

  const applyFromInput = () => {
    const ms = parseFloat(minMs);
    if (!isNaN(ms) && ms > 0) {
      applyNanos(Math.round(ms * NANOS_PER_MS));
    } else {
      clear();
    }
  };

  const button = (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          size="xs"
          color="text"
          iconType="clock"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          data-test-subj="span-duration-filter-button"
          isSelected={isPopoverOpen}
        >
          {i18n.translate('explore.traceView.button.filterByDuration', {
            defaultMessage: 'Filter by duration',
          })}
        </EuiButtonEmpty>
      </EuiFlexItem>
      {activeNanos !== undefined && (
        <EuiFlexItem grow={false}>
          <EuiBadge color="primary">{`≥ ${formatNanos(activeNanos)}`}</EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="m"
      data-test-subj="span-duration-filter-popover"
    >
      <div style={{ width: 260 }}>
        <EuiFormRow
          label={i18n.translate('explore.traceView.duration.minLabel', {
            defaultMessage: 'Minimum span duration (ms)',
          })}
          fullWidth
        >
          <EuiFieldNumber
            value={minMs}
            min={0}
            onChange={(e) => setMinMs(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFromInput();
            }}
            append="ms"
            fullWidth
            data-test-subj="span-duration-filter-input"
            aria-label={i18n.translate('explore.traceView.duration.minAriaLabel', {
              defaultMessage: 'Minimum span duration in milliseconds',
            })}
          />
        </EuiFormRow>

        {sortedNanos.length > 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              {i18n.translate('explore.traceView.duration.presetsLabel', {
                defaultMessage: 'Presets',
              })}
            </EuiText>
            <EuiSpacer size="xs" />
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  onClick={() => applyNanos(p90)}
                  data-test-subj="span-duration-filter-p90"
                >
                  {`p90 (${formatNanos(p90)})`}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  onClick={() => applyNanos(p99)}
                  data-test-subj="span-duration-filter-p99"
                >
                  {`p99 (${formatNanos(p99)})`}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}

        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              onClick={clear}
              disabled={activeNanos === undefined && !minMs}
              data-test-subj="span-duration-filter-clear"
            >
              {i18n.translate('explore.traceView.duration.clear', { defaultMessage: 'Clear' })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              fill
              onClick={applyFromInput}
              data-test-subj="span-duration-filter-apply"
            >
              {i18n.translate('explore.traceView.duration.apply', { defaultMessage: 'Apply' })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPopover>
  );
};
