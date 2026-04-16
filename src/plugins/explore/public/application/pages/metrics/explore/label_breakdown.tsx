/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { darkMode } from '@osd/ui-shared-deps/theme';
import React, { useEffect, useState } from 'react';
import { useExploration } from './exploration_context';
import { ErrorCallout, LoadingIndicator } from './loading_state';
import { renderSvgLine } from './sparkline';
import { LABEL_BREAKDOWN_LIMIT, MetricType } from './types';

interface BreakdownSeries {
  labelValue: string;
  values: Array<[number, string]>;
  avg: number;
}

export const LabelBreakdown: React.FC = () => {
  const { state, dispatch, client, queryGen, executePromQL, refreshCounter } = useExploration();
  const [series, setSeries] = useState<BreakdownSeries[]>([]);
  const [totalValues, setTotalValues] = useState(0);
  const [metricType, setMetricType] = useState<MetricType>(MetricType.GAUGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const promql = queryGen.forBreakdown(state.metric, metricType, state.label, state.filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchBreakdown = async () => {
      try {
        const [metaMap, allValues] = await Promise.all([
          client.getMetadata(state.metric),
          client.getLabelValues(state.label, state.metric),
        ]);
        const type = metaMap[state.metric]?.type || MetricType.GAUGE;
        if (!cancelled) {
          setMetricType(type);
          setTotalValues(allValues.length);
        }

        const query = queryGen.forBreakdown(state.metric, type, state.label, state.filters);
        const result = await client.queryRange(query);

        if (!cancelled && result) {
          const breakdowns: BreakdownSeries[] = result.map((r: any) => {
            const vals: Array<[number, string]> = r.values || [];
            const numericVals = vals
              .map(([, v]: [number, string]) => parseFloat(v))
              .filter((v: number) => !isNaN(v));
            const avg = numericVals.length
              ? numericVals.reduce((a: number, b: number) => a + b, 0) / numericVals.length
              : 0;
            return { labelValue: r.metric?.[state.label] ?? '', values: vals, avg };
          });
          const present = new Set(breakdowns.map((b) => b.labelValue));
          for (const v of allValues) {
            if (!present.has(v)) breakdowns.push({ labelValue: v, values: [], avg: 0 });
          }
          breakdowns.sort((a, b) => a.labelValue.localeCompare(b.labelValue));
          setSeries(breakdowns);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBreakdown();
    return () => {
      cancelled = true;
    };
  }, [state.metric, state.label, state.filters, client, queryGen, refreshCounter]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorCallout error={error} />;
  }

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem>
          <EuiTitle size="s">
            <h2>Breakdown by: {state.label}</h2>
          </EuiTitle>
          <EuiText size="xs" color="subdued">
            {totalValues} values
            {totalValues > LABEL_BREAKDOWN_LIMIT && ` (showing top ${LABEL_BREAKDOWN_LIMIT})`}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton iconType="play" onClick={() => executePromQL(promql)} size="s" fill>
            Execute
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="m" wrap>
        {series.map((s) => (
          <EuiFlexItem key={s.labelValue || '__empty__'} grow={false} style={{ width: 240 }}>
            <EuiPanel
              paddingSize="s"
              hasBorder
              style={{ display: 'flex', flexDirection: 'column', height: 120 }}
              aria-label={`${state.label}="${s.labelValue}"`}
            >
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {state.label}=&quot;{s.labelValue}&quot;
              </EuiText>
              <div
                style={{
                  flex: 1,
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {renderSvgLine(s.values, 200, 60, undefined, darkMode)}
              </div>
              <EuiText size="xs" color="subdued">
                avg: {s.avg.toFixed(2)}
              </EuiText>
            </EuiPanel>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      {totalValues > LABEL_BREAKDOWN_LIMIT && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut size="s" color="warning">
            Showing top {LABEL_BREAKDOWN_LIMIT} of {totalValues} values by series count.
          </EuiCallOut>
        </>
      )}
    </>
  );
};
