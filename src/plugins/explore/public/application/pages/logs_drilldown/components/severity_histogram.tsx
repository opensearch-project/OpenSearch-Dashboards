/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHealth, EuiText, EuiTextColor, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';
import { HistogramResult, SeverityTotal } from '../hooks/fetch_histogram';
import { severityColor } from '../severity';
import { HistogramChart, SINGLE_SERIES_BUCKET } from './histogram_chart';

interface Props {
  services: ExploreServices;
  histogram: HistogramResult;
  /** Brush-select → caller updates the global time picker. */
  onBrush?: (from: number, to: number) => void;
  /** Stable id for cursor-sync. */
  chartId: string;
}

const CHART_HEIGHT = 96;

/** Humanize a count with K / M / B units, e.g. 999 → "999", 14100 → "14.1K", 2_500_000 → "2.5M",
 *  3_200_000_000 → "3.2B". One decimal below 10×the unit, none above (14.1K but 141K). */
const humanize = (n: number): string => {
  const unit = (value: number, suffix: string) =>
    `${value < 10 ? value.toFixed(1) : Math.round(value)}${suffix}`;
  if (n < 1000) return String(n);
  if (n < 1_000_000) return unit(n / 1000, 'K');
  if (n < 1_000_000_000) return unit(n / 1_000_000, 'M');
  return unit(n / 1_000_000_000, 'B');
};

/** Legend hover copy. `unknown`/`count` explain the "no recognized level" case; others name the level. */
const legendTooltip = (t: SeverityTotal): string => {
  if (t.name === 'count' || t.bucket === 'unknown') {
    return i18n.translate('explore.logsDrilldown.histogram.legend.unknownTip', {
      defaultMessage:
        'Documents with no recognized severity/level field (e.g. severityText, level). Counted as logs.',
    });
  }
  return i18n.translate('explore.logsDrilldown.histogram.legend.severityTip', {
    defaultMessage: 'Documents at the {level} severity level',
    values: { level: t.name },
  });
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
          <EuiToolTip key={t.name} content={legendTooltip(t)} position="top">
            <EuiHealth
              // The no-severity single series ('count') colors the legend dot the SAME blue as its
              // bars (SINGLE_SERIES_BUCKET), matching the severity series' own bucket colors.
              color={severityColor(t.name === 'count' ? SINGLE_SERIES_BUCKET : t.bucket)}
              data-test-subj={`logsExploreLegend-${t.name}`}
            >
              <EuiText size="xs" className="logStreamCard__legendRow">
                <span className="logStreamCard__legendName">
                  {t.name === 'count' ? 'logs' : t.name}
                </span>{' '}
                <EuiTextColor color="subdued">{humanize(t.total)}</EuiTextColor>
              </EuiText>
            </EuiHealth>
          </EuiToolTip>
        ))}
      </div>
    </div>
  );
};
