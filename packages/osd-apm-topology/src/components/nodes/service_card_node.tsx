/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { CelestialCardProps } from '../celestial_card/types';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';
import { DEFAULT_METRICS } from '../../shared/constants/common.constants';
import { formatCount } from '../../shared/utils/format_count';
import { HealthDonut } from '../health_donut';
import { NodeShell } from './node_shell';
import { TypeBadge } from './type_badge';
import { MetricBar } from './metric_bar';
import { StatusIndicator } from './status_indicator';
import type { StatusLevel } from './status_indicator';
import './service_card_node.scss';

export type ServiceCardCustomNode = Node<
  CelestialCardProps & {
    showDonut?: boolean;
  },
  string
>;

/**
 * Modernized APM service card node with type badge, title/subtitle,
 * optional donut chart, metric bar, and configurable action button.
 */
export const ServiceCardNode = ({ data }: NodeProps<ServiceCardCustomNode>) => {
  const { onDashboardClick, selectedNodeId } = useCelestialNodeActionsContext();
  const isSelected = data.id === selectedNodeId;
  const isBreach = !!data.health?.breached;

  const totalRequests = formatCount(data.metrics?.requests);

  const errorRate = data.metrics?.requests
    ? ((data.metrics.errors4xx ?? 0) / data.metrics.requests) * 100
    : 0;

  const sliStatus: StatusLevel | undefined =
    data.health?.status === 'breached'
      ? 'error'
      : data.health?.status === 'recovered'
      ? 'warning'
      : undefined;

  const onViewDashboardClick = useCallback(
    (event: React.MouseEvent) => {
      onDashboardClick?.(event, data);
    },
    [onDashboardClick, data]
  );

  const actionButton = data.actionButton;
  const showDonut = (data as any).showDonut !== false;

  return (
    <NodeShell
      borderColor={isBreach ? 'var(--osd-color-status-breached)' : data.color}
      backgroundColor={isBreach ? 'var(--osd-color-container-breached)' : undefined}
      glowColor={isBreach ? 'var(--osd-color-status-breached)' : data.color}
      isSelected={isSelected}
      isFaded={!!data.isFaded}
      className="osd:bg-container-default osd:w-68 osd:min-h-24 osd:p-3"
      data-test-subj={`serviceCardNode-${data.id}`}
    >
      <div className="osd:flex osd:flex-col osd:gap-2">
        {/* Header: Type badge + Status */}
        <div className="osd:flex osd:items-center osd:justify-between">
          {data.typeBadge && data.typeBadge !== false && (
            <TypeBadge
              label={data.typeBadge.label}
              color={data.typeBadge.color}
              icon={data.typeBadge.icon}
              textColor={data.typeBadge.textColor}
            />
          )}
          {sliStatus && (
            <StatusIndicator
              status={sliStatus}
              label={data.health?.status === 'breached' ? 'SLI breach' : 'Recovered'}
            />
          )}
        </div>

        {/* Title + Action button */}
        <div className="osd:flex osd:items-start osd:justify-between osd:gap-2">
          <div className="osd:min-w-0">
            <div className="osd:font-bold osd:text-sm osd:text-body-default osd:truncate">
              {data.title}
            </div>
            {data.subtitle && (
              <div className="osd:text-xs osd:text-body-secondary osd:truncate">
                {data.subtitle}
              </div>
            )}
          </div>
          {actionButton !== false && (
            <button
              className="osd-resetFocusState osd:text-link-default osd:hover:text-link-hover osd:transition-colors osd:cursor-pointer osd:bg-transparent osd:border-0 osd:p-0 osd:text-xs osd:whitespace-nowrap osd:flex-shrink-0"
              onClick={actionButton?.onClick ?? onViewDashboardClick}
              aria-label={`${actionButton?.label ?? 'View insights'} for ${data.title}`}
              data-test-subj={`serviceCardNode-viewInsights-${data.id}`}
            >
              {actionButton?.label ?? 'View insights'}
            </button>
          )}
        </div>

        {/* Donut + Metrics row */}
        <div className="osd:flex osd:items-center osd:gap-3">
          {showDonut && data.icon && (
            <div className="osd:flex-shrink-0">
              <HealthDonut
                metrics={data.metrics || { ...DEFAULT_METRICS }}
                size={48}
                icon={data.icon}
                isLegendEnabled={true}
              />
            </div>
          )}
          <div className="osd:flex-1 osd:flex osd:flex-col osd:gap-1">
            <div className="osd:text-xs osd:text-body-secondary">Req: {totalRequests}</div>
            <MetricBar
              value={errorRate}
              max={100}
              color="var(--osd-color-ok)"
              label={`${errorRate.toFixed(1)}%`}
            />
          </div>
        </div>
      </div>
    </NodeShell>
  );
};
