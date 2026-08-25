/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiToolTip } from '@elastic/eui';
// @ts-expect-error TS7016 @osd/apm-topology ships without consumer-resolvable types here
import { NodeShell } from '@osd/apm-topology';
import { ServiceMetric } from './trace_service_flow_transform';
import './trace_service_node.scss';

const ERROR_COLOR = '#BD271E';
const NEUTRAL_BORDER = '#98A2B3'; // EUI mediumShade

export interface TraceServiceNodeData {
  id: string;
  title: string;
  subtitle: string;
  color?: string;
  hasError: boolean;
  metrics: ServiceMetric[];
  /** Injected by TraceServiceFlow. */
  isFilterActive?: boolean;
  onSelect?: (serviceName: string) => void;
}

const clampPct = (value: number, max: number): number =>
  max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;

/**
 * Custom per-trace service node: title, duration, and three labeled metric bars
 * (Requests / Errors / Duration). The whole card is clickable (filters the trace
 * by this service). Error services get a red border + tint; the service's Gantt
 * legend color is used for the healthy border and a small identity dot.
 */
export const TraceServiceNode = ({ data }: { data: TraceServiceNodeData }) => {
  const borderColor = data.hasError ? ERROR_COLOR : data.color || NEUTRAL_BORDER;
  const tooltip = data.isFilterActive
    ? `Filtering by ${data.title} — click a filter chip above to remove`
    : `Filter this trace by ${data.title}`;

  return (
    <EuiToolTip content={tooltip} position="top">
      <NodeShell
        borderColor={borderColor}
        backgroundColor={data.hasError ? 'color-mix(in srgb, #BD271E 6%, #FFFFFF)' : '#FFFFFF'}
        glowColor={data.isFilterActive ? '#0268BC' : borderColor}
        isSelected={!!data.isFilterActive}
        onClick={() => data.onSelect?.(data.id)}
        style={{ width: 232, padding: 10, borderRadius: 10 }}
        data-test-subj={`traceServiceNode-${data.id}`}
        aria-label={tooltip}
      >
        <div className="exploreTraceServiceNode">
          <div className="exploreTraceServiceNode__header">
            <span
              className="exploreTraceServiceNode__dot"
              style={{ backgroundColor: data.color || NEUTRAL_BORDER }}
            />
            <span className="exploreTraceServiceNode__title">{data.title}</span>
            {data.hasError && <span className="exploreTraceServiceNode__errorDot" />}
          </div>
          <div className="exploreTraceServiceNode__metrics">
            {data.metrics.map((metric) => (
              <div key={metric.label} className="exploreTraceServiceNode__metric">
                <div className="exploreTraceServiceNode__metricHead">
                  <span className="exploreTraceServiceNode__metricLabel">{metric.label}</span>
                  <span className="exploreTraceServiceNode__metricValue">
                    {metric.formattedValue}
                  </span>
                </div>
                <div className="exploreTraceServiceNode__metricTrack">
                  <div
                    className="exploreTraceServiceNode__metricFill"
                    style={{
                      width: `${clampPct(metric.value, metric.max)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </NodeShell>
    </EuiToolTip>
  );
};
