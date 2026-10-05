/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';
import { NodeShell } from './node_shell';
import { MetricBar, MetricBarGroupItem } from './metric_bar';
import './metrics_card_node.scss';

export interface MetricsCardData {
  id: string;
  title: string;
  subtitle?: string;
  /** Identity color (border/glow/dot) when not in error. */
  color?: string;
  /** When true, the card is styled as an error (red border, tint, badge). */
  hasError?: boolean;
  /** Tooltip/aria text for the error badge. Defaults to "Has errors". */
  errorLabel?: string;
  /** Highlights the card (glow) without moving the camera. */
  isSelected?: boolean;
  /** Labeled metric bars rendered as "label ........ value" + a proportional bar. */
  metrics: MetricBarGroupItem[];
}

export type MetricsCardCustomNode = Node<MetricsCardData, string>;

const NEUTRAL_BORDER = 'var(--osd-color-cl-gray-350, #98A2B3)';

/**
 * A compact, clickable entity card that renders any number of labeled metric
 * bars (e.g. a per-trace RED view: Requests / Errors / Duration). Unlike
 * ServiceCardNode, the whole card is clickable (fires the map's onDashboardClick)
 * and health is driven by a plain `hasError` flag rather than SLO state, so the
 * border encodes error state consistently while `color` carries identity.
 */
export const MetricsCardNode = ({ data }: NodeProps<MetricsCardCustomNode>) => {
  const { onDashboardClick } = useCelestialNodeActionsContext();
  // Border stays neutral. Error is signaled by the pink tint + red "!" badge
  // (two channels) — keeping a red border too made the card read as an over-red
  // alarm. Identity color lives on the header dot.
  const borderColor = NEUTRAL_BORDER;

  const handleClick = useCallback(
    (event: React.MouseEvent) => onDashboardClick?.(event, data as any),
    [onDashboardClick, data]
  );

  return (
    <NodeShell
      borderColor={borderColor}
      backgroundColor={
        data.hasError
          ? 'color-mix(in srgb, var(--osd-color-status-error, #BD271E) 6%, #FFFFFF)'
          : undefined
      }
      glowColor={data.isSelected ? 'var(--osd-color-cl-blue-450, #0268BC)' : borderColor}
      isSelected={!!data.isSelected}
      onClick={handleClick}
      className="celMetricsCard__shell osd:bg-container-default osd:w-64 osd:p-3"
      data-test-subj={`metricsCardNode-${data.id}`}
      aria-label={data.title}
    >
      <div className="celMetricsCard">
        <div className="celMetricsCard__header">
          <span
            className="celMetricsCard__dot"
            style={{ backgroundColor: data.color || NEUTRAL_BORDER }}
          />
          <span className="celMetricsCard__title">{data.title}</span>
          {data.hasError && (
            <span
              className="celMetricsCard__errorBadge"
              title={data.errorLabel ?? 'Has errors'}
              aria-label={data.errorLabel ?? 'Has errors'}
            >
              !
            </span>
          )}
        </div>
        {data.subtitle && <div className="celMetricsCard__subtitle">{data.subtitle}</div>}
        <div className="celMetricsCard__metrics">
          {data.metrics.map((metric) => (
            <div key={metric.label} className="celMetricsCard__metric">
              <div className="celMetricsCard__metricHead">
                <span className="celMetricsCard__metricLabel">{metric.label}</span>
                <span className="celMetricsCard__metricValue">
                  {metric.formattedValue ?? metric.value}
                </span>
              </div>
              <MetricBar value={metric.value} max={metric.max} color={metric.color} />
            </div>
          ))}
        </div>
      </div>
    </NodeShell>
  );
};
