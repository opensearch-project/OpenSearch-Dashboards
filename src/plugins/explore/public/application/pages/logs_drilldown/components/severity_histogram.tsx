/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHealth, EuiText, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';
import { HistogramResult, SeverityTotal } from '../hooks/fetch_histogram';
import { severityColor } from '../severity';
import { HistogramChart } from './histogram_chart';

interface Props {
  services: ExploreServices;
  histogram: HistogramResult;
  /** Brush-select → caller updates the global time picker. */
  onBrush?: (from: number, to: number) => void;
  /** Stable id for cursor-sync. */
  chartId: string;
}

const CHART_HEIGHT = 96;

/** Humanize a count like 14100 → "14.1K". */
const humanize = (n: number): string => {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
};

/**
 * Card histogram = an ECharts bar chart (severity-stacked, with native tooltip + brush + synced
 * cursor) plus a single compact legend below with humanized per-severity totals. Bars, legend, and
 * the log-line level tokens all draw from the ONE severity→color map (`severity.ts` / getColors).
 */
export const SeverityHistogram: React.FC<Props> = ({ services, histogram, onBrush, chartId }) => {
  const totalCount = histogram.totals.reduce((sum, t) => sum + t.total, 0);

  // 0 docs across the whole range → an explicit "no data in range" message, not an empty axis (#18).
  if (totalCount === 0) {
    return (
      <div
        className="logStreamCard__histEmpty"
        style={{ height: CHART_HEIGHT }}
        data-test-subj="logsExploreHistNoData"
      >
        <EuiText size="xs" color="subdued">
          {i18n.translate('explore.logsDrilldown.rows.noDataInRange', {
            defaultMessage: 'No data in the selected time range',
          })}
        </EuiText>
      </div>
    );
  }

  return (
    <div className="logStreamCard__histWrap">
      <HistogramChart
        services={services}
        histogram={histogram}
        height={CHART_HEIGHT}
        onBrush={onBrush}
        chartId={chartId}
      />
      <div className="logStreamCard__legend">
        {histogram.totals.map((t: SeverityTotal) => (
          <EuiHealth
            key={t.name}
            color={severityColor(t.bucket)}
            data-test-subj={`logsExploreLegend-${t.name}`}
          >
            <EuiText size="xs" className="logStreamCard__legendRow">
              <span className="logStreamCard__legendName">
                {t.name === 'count' ? 'logs' : t.name}
              </span>{' '}
              <EuiTextColor color="subdued">{humanize(t.total)}</EuiTextColor>
            </EuiText>
          </EuiHealth>
        ))}
      </div>
    </div>
  );
};
