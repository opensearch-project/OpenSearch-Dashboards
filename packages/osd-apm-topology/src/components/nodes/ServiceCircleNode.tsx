/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CelestialCardProps } from '../CelestialCard/types';
import { useCelestialNodeActionsContext } from '../../shared/contexts/NodeActionsContext';
import { useElementHover } from '../../shared/hooks/use-element-hover.hook';
import { Legend } from '../HealthDonut/components/Legend';
import { NodeShell } from './NodeShell';
import { HealthArc } from './HealthArc';
import './ServiceCircleNode.scss';

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

  const totalRequests: string = !data.metrics?.requests
    ? '0'
    : data.metrics.requests < 1000
    ? `${data.metrics.requests}`
    : `${(data.metrics.requests / 1000).toFixed(1)}k`;

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
      glowColor="var(--osd-color-type-service)"
      className="osd:bg-transparent osd:border-0 osd:rounded-full"
      style={{ border: 'none', borderRadius: '50%', background: 'transparent' }}
      data-test-subj={`serviceCircleNode-${data.id}`}
    >
      <div className="celServiceCircle">
        <div
          className="celServiceCircle__container"
          {...hoverHandlers}
          style={{ width: diameter, height: diameter }}
        >
          <HealthArc
            segments={arcSegments}
            diameter={diameter}
            strokeWidth={6}
            aria-label={`Health: ${totalRequests} requests`}
          />
          <div className="celServiceCircle__interior">
            {data.icon && (
              <div className="osd:flex osd:items-center osd:justify-center osd:w-6 osd:h-6 osd:text-icon">
                {data.icon}
              </div>
            )}
            <span className="osd:text-xs osd:font-bold osd:text-body-default">{totalRequests}</span>
          </div>
        </div>
        {isHovered && (
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
