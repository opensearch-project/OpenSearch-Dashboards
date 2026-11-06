/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CelestialCardProps } from '../celestial_card/types';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';
import { useElementHover } from '../../shared/hooks/use_element_hover.hook';
import { formatCount } from '../../shared/utils/format_count';
import { Legend } from '../health_donut/components/legend';
import { NodeShell } from './node_shell';
import { HealthArc } from './health_arc';
import './service_circle_node.scss';

export type ServiceCircleCustomNode = Node<
  CelestialCardProps & {
    /** Diameter of the circle. Defaults to 80. */
    circleDiameter?: number;
  },
  string
>;

/**
 * Circle node with health arc segments, interior icon/metric, and label below.
 * Inspired by Datadog/Grafana service map visualizations.
 */
export const ServiceCircleNode = ({ data }: NodeProps<ServiceCircleCustomNode>) => {
  const { onDashboardClick, selectedNodeId } = useCelestialNodeActionsContext();
  const { isHovered, ...hoverHandlers } = useElementHover();
  const isSelected = data.id === selectedNodeId;
  const diameter = (data as any).circleDiameter ?? 80;
  const hasMetrics = !!data.metrics?.requests;
  const glowColor = data.color ?? 'var(--osd-color-type-service)';

  const totalRequests = formatCount(data.metrics?.requests);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      onDashboardClick?.(event, data);
    },
    [onDashboardClick, data]
  );

  const arcSegments = [
    { value: data.metrics?.faults5xx ?? 0, color: 'var(--osd-color-faults)' },
    { value: data.metrics?.errors4xx ?? 0, color: 'var(--osd-color-errors)' },
    {
      value:
        (data.metrics?.requests ?? 0) -
        (data.metrics?.faults5xx ?? 0) -
        (data.metrics?.errors4xx ?? 0),
      color: 'var(--osd-color-ok)',
    },
  ];

  return (
    <NodeShell
      isSelected={isSelected}
      isFaded={!!data.isFaded}
      onClick={handleClick}
      glowColor={glowColor}
      disableGlow
      className="osd:bg-transparent osd:border-0 osd:rounded-full"
      style={{ border: 'none', borderRadius: '50%', background: 'transparent' }}
      data-test-subj={`serviceCircleNode-${data.id}`}
    >
      <div className="celServiceCircle">
        <div
          className={`celServiceCircle__container${
            isSelected ? ' celServiceCircle__container--selected' : ''
          }${!hasMetrics ? ' celServiceCircle__container--no-metrics' : ''}`}
          {...hoverHandlers}
          style={
            {
              width: diameter,
              height: diameter,
              '--osd-node-glow-color': glowColor,
              ...(data.color && !hasMetrics ? { borderColor: data.color } : {}),
            } as React.CSSProperties
          }
        >
          {hasMetrics && (
            <HealthArc
              segments={arcSegments}
              diameter={diameter}
              strokeWidth={6}
              aria-label={`Health: ${totalRequests} requests`}
            />
          )}
          <div className="celServiceCircle__interior">
            {data.icon && (
              <div className="osd:flex osd:items-center osd:justify-center osd:w-6 osd:h-6 osd:text-icon">
                {data.icon}
              </div>
            )}
            {hasMetrics && (
              <span className="osd:text-xs osd:font-bold osd:text-body-default">
                {totalRequests}
              </span>
            )}
          </div>
        </div>
        {isHovered && hasMetrics && (
          <Legend metrics={data.metrics} health={data.health} trianglePosition="left" />
        )}
        <div className="celServiceCircle__label">
          <div className="osd:text-xs osd:font-bold osd:text-body-default osd:truncate">
            {data.title}
          </div>
          {data.subtitle && (
            <div className="osd:text-xs osd:text-body-secondary osd:truncate">{data.subtitle}</div>
          )}
        </div>
      </div>
    </NodeShell>
  );
};
