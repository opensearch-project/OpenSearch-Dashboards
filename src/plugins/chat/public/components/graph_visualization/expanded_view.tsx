/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import {
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { Chart, LineSeries, Axis, Settings, Position, ScaleType } from '@elastic/charts';
import { ChartData } from './types';
import { createTooltipSettings } from './chart_config';
import { useChartsTheme, useChartsBaseTheme, getGraphVisualizationTheme } from './theme_utils';

interface ExpandedViewProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: ChartData;
  title?: string;
}

export const ExpandedView: React.FC<ExpandedViewProps> = ({
  isOpen,
  onClose,
  chartData,
  title,
}) => {
  const chartsTheme = useChartsTheme();
  const chartsBaseTheme = useChartsBaseTheme();
  const graphTheme = getGraphVisualizationTheme();

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove ESC key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const tooltipSettings = createTooltipSettings();

  return (
    <EuiOverlayMask onClick={onClose}>
      <EuiModal
        onClose={onClose}
        style={{ width: '90vw', height: '80vh' }}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <EuiModalHeader>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="none">
            <EuiFlexItem grow={true}>
              <EuiModalHeaderTitle>
                {title || chartData.title || 'Time Series Chart'}
              </EuiModalHeaderTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="cross"
                onClick={onClose}
                aria-label="Close expanded chart view"
                size="m"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalHeader>

        <EuiModalBody style={{ padding: '16px', height: 'calc(80vh - 120px)' }}>
          <div style={{ width: '100%', height: '100%' }}>
            {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
            <Chart size={{ width: '100%', height: '100%' }}>
              <Settings
                theme={[graphTheme, chartsTheme, chartsBaseTheme]}
                tooltip={tooltipSettings}
                showLegend={true}
                legendPosition={Position.Right}
                brushAxis="x"
                onBrushEnd={() => {}} // Enable zoom functionality
                onPointerUpdate={() => {}} // Enable crosshair
              />

              <Axis
                id="bottom"
                position={Position.Bottom}
                title={chartData.xAxisLabel}
                showOverlappingTicks={false}
                gridLine={{ visible: false }}
                tickFormat={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }}
              />

              {(() => {
                // Calculate Y-axis domain from actual data
                const allYValues = chartData.series
                  .filter((s) => s.visible)
                  .flatMap((s) => s.data.map((d) => d.y))
                  .filter((y) => y !== null && y !== undefined && !isNaN(y));

                const minY = Math.min(...allYValues);
                const maxY = Math.max(...allYValues);
                const padding = (maxY - minY) * 0.1;
                const yDomain = {
                  min: Math.max(0, minY - padding),
                  max: maxY + padding,
                };

                return (
                  <Axis
                    id="left"
                    title={chartData.yAxisLabel}
                    position={Position.Left}
                    domain={yDomain}
                    gridLine={{
                      visible: true,
                      stroke: '#E5E5E5',
                      strokeWidth: 1,
                      opacity: 0.5,
                    }}
                    tickFormat={(value) => {
                      if (typeof value === 'number') {
                        // Format small numbers with more precision
                        if (Math.abs(value) < 0.01) {
                          return value.toFixed(4);
                        } else if (Math.abs(value) < 1) {
                          return value.toFixed(3);
                        } else if (Math.abs(value) >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (Math.abs(value) >= 1000) {
                          return `${(value / 1000).toFixed(1)}K`;
                        } else {
                          return value.toFixed(2);
                        }
                      }
                      return String(value);
                    }}
                  />
                );
              })()}

              {chartData.series
                .filter((series) => series.visible)
                .map((series) => {
                  // Convert Date objects to timestamps for Elastic Charts
                  const seriesData = series.data.map((point) => ({
                    x: point.x instanceof Date ? point.x.getTime() : point.x,
                    y: point.y,
                  }));

                  return (
                    <LineSeries
                      key={series.id}
                      id={series.id}
                      name={series.name}
                      xScaleType={ScaleType.Time}
                      yScaleType={ScaleType.Linear}
                      xAccessor="x"
                      yAccessors={['y']}
                      data={seriesData}
                      color={series.color}
                      lineSeriesStyle={{
                        line: {
                          strokeWidth: 2,
                        },
                        point: {
                          radius: 3,
                          strokeWidth: 1,
                          visible: false,
                        },
                      }}
                    />
                  );
                })}
            </Chart>
          </div>
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );
};
