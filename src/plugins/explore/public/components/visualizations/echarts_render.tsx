/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { isEqual } from 'lodash';

import { TimeRange } from '../../../../data/public';
import { DEFAULT_THEME } from './theme/default';
import { MultiMetricComponent } from './metric/multi_metric_component';
import { MetricComponent } from './metric/metric_component';
import './metric/multi_metric_component.scss';

interface MultiMetricSpec {
  __multiMetricReactComponent: boolean;
  facetedData: any[][];
  categoryNames: string[];
  styles: any;
  metricField: string;
  timeField?: string;
  numericalColumns: any[];
  categoricalColumns: any[];
  dateColumns: any[];
  axisColumnMappings?: any;
}

interface SingleMetricSpec {
  __singleMetricReactComponent: boolean;
  data: Array<Record<string, any>>;
  styles: any;
  metricField: string;
  timeField?: string;
  numericalColumns: any[];
  categoricalColumns: any[];
  dateColumns: any[];
  axisColumnMappings?: any;
}

interface Props {
  spec: echarts.EChartsOption | MultiMetricSpec | SingleMetricSpec;
  onSelectTimeRange?: (range: TimeRange) => void;
}

const DEFAULT_GRID = {
  top: 50,
  right: 30,
  bottom: 50,
  left: 40,
};

// Type guard to check if spec is MultiMetricSpec
const isMultiMetricSpec = (
  spec: echarts.EChartsOption | MultiMetricSpec | SingleMetricSpec
): spec is MultiMetricSpec => {
  return typeof spec === 'object' && spec !== null && '__multiMetricReactComponent' in spec;
};

// Type guard to check if spec is SingleMetricSpec
const isSingleMetricSpec = (
  spec: echarts.EChartsOption | MultiMetricSpec | SingleMetricSpec
): spec is SingleMetricSpec => {
  return typeof spec === 'object' && spec !== null && '__singleMetricReactComponent' in spec;
};

// Separate component for regular ECharts rendering
const RegularEchartsRender = React.memo(
  ({
    spec: echartsSpec,
    onSelectTimeRange,
  }: {
    spec: echarts.EChartsOption;
    onSelectTimeRange?: (range: TimeRange) => void;
  }) => {
    const [instance, setInstance] = useState<echarts.ECharts | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<echarts.ECharts | null>(null);
    // grid config computed at runtime
    const gridConfigRef = useRef<echarts.GridComponentOption | null>(null);

    const containerResizeObserver = useMemo(
      () =>
        new ResizeObserver(() => {
          if (instanceRef.current) {
            instanceRef.current.resize();
          }
        }),
      []
    );

    const gridArray = Array.isArray(echartsSpec?.grid) ? echartsSpec.grid : [];
    const shouldScroll = gridArray.length > 10;
    const widthPercentage = shouldScroll ? `${Math.ceil(gridArray.length / 10) * 100}%` : '100%';

    useEffect(() => {
      if (containerRef.current) {
        const echartsInstance = echarts.init(containerRef.current);
        instanceRef.current = echartsInstance;
        containerResizeObserver.observe(containerRef.current);
        setInstance(echartsInstance);
      }

      return () => {
        containerResizeObserver.disconnect();
        if (instanceRef.current) {
          instanceRef.current.dispose();
          instanceRef.current = null;
        }
      };
    }, [containerResizeObserver]);

    useEffect(() => {
      function onBrushEnd(params: any) {
        const [from, to] = params.areas?.[0]?.coordRange ?? [];
        if (from && to) {
          onSelectTimeRange?.({
            from: new Date(from).toString(),
            to: new Date(to).toString(),
          });
        }
      }

      if (instance && onSelectTimeRange) {
        instance.on('brushEnd', onBrushEnd);
      }

      return () => {
        if (instance && onSelectTimeRange && !instance.isDisposed()) {
          instance.off('brushEnd', onBrushEnd);
        }
      };
    }, [instance, onSelectTimeRange]);

    useEffect(() => {
      function adjustGrid() {
        // if grid is not specified, use a default grid config
        // and adjust the grid dynamically based on legend and visualMap
        if (echartsSpec.grid) {
          return;
        }
        if (instance) {
          // Echarts lacks the capability to handle legend and grid responsively
          // instance._componentsViews is a non-public API so @ts-ignore is added
          // @ts-ignore
          const legend = instance._componentsViews.find(
            (entry: any) => entry.type === 'legend.plain' || entry.type === 'legend.scroll'
          );
          const grid = { ...DEFAULT_GRID };
          const legendConfig: echarts.EChartsOption['legend'] = {};
          if (legend) {
            const legendWidth = legend._backgroundEl?.shape?.width ?? 0;
            const legendHeight = legend._backgroundEl?.shape?.height ?? 0;
            if (!Array.isArray(echartsSpec.legend)) {
              if (echartsSpec.legend?.left) {
                grid.left = legendWidth + grid.left;
              } else if (echartsSpec.legend?.right) {
                grid.right = legendWidth + 30;
              } else if (echartsSpec.legend?.top) {
                grid.top = legendHeight + grid.top;
                legendConfig.top = 18;
                if (
                  echartsSpec.title &&
                  !Array.isArray(echartsSpec.title) &&
                  echartsSpec.title.text
                ) {
                  grid.top = 20 + grid.top;
                  legendConfig.top = 50;
                }
              } else if (echartsSpec.legend?.bottom) {
                grid.bottom = legendHeight + grid.bottom;
              }
            }
          }

          if (echartsSpec.visualMap) {
            const visualMap = Array<echarts.VisualMapComponentOption>().concat(
              echartsSpec.visualMap
            );
            for (const v of visualMap) {
              if (v.right) {
                grid.right = 60;
              } else if (v.bottom) {
                grid.bottom = 80;
              }
            }
          }
          if (!isEqual(gridConfigRef.current, grid)) {
            gridConfigRef.current = grid;
            instance.setOption({ grid, legend: legendConfig });
          }
        }
      }
      instance?.on('finished', adjustGrid);

      return () => {
        instance?.off('finished', adjustGrid);
      };
    }, [instance, echartsSpec.legend, echartsSpec.visualMap, echartsSpec.grid, echartsSpec.title]);

    useEffect(() => {
      if (instance && echartsSpec) {
        const xAxis = Array.isArray(echartsSpec.xAxis) ? echartsSpec.xAxis[0] : echartsSpec.xAxis;
        const yAxis = Array.isArray(echartsSpec.yAxis) ? echartsSpec.yAxis[0] : echartsSpec.yAxis;
        let option = { ...echartsSpec };
        // time range selection brush
        if (xAxis?.type === 'time' && !xAxis.silent) {
          option = {
            ...option,
            brush: {
              toolbox: ['lineX'],
              xAxisIndex: 0,
            },
            toolbox: {
              show: false,
            },
          };
        } else if (yAxis?.type === 'time' && !yAxis.silent) {
          option = {
            ...option,
            brush: {
              toolbox: ['lineY'],
              yAxisIndex: 0,
            },
            toolbox: {
              show: false,
            },
          };
        }

        if (!option.grid) {
          option.grid = { ...DEFAULT_GRID };
          if (gridConfigRef.current) {
            option.grid = { ...option.grid, ...gridConfigRef.current };
          }
        }

        instance.setOption(
          option,
          { notMerge: true } // this is a must to update compulsorily otherwise will merge with previous option
        );
        instance.setTheme(DEFAULT_THEME);

        if (
          (xAxis?.type === 'time' && !xAxis.silent) ||
          (yAxis?.type === 'time' && !yAxis.silent)
        ) {
          instance.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'brush',
            brushOption: {
              brushType: xAxis?.type === 'time' ? 'lineX' : 'lineY',
              brushMode: 'single',
            },
          });
        }
      }
    }, [echartsSpec, instance, onSelectTimeRange]);

    return (
      <div
        style={{
          height: '100%',
          overflowX: 'auto',
          ...(shouldScroll && { width: widthPercentage }),
        }}
        ref={containerRef}
      />
    );
  }
);

// Main EchartsRender component that routes between single-metric, multi-metric and regular rendering
export const EchartsRender = React.memo(({ spec, onSelectTimeRange }: Props) => {
  // Check if this is a single-metric React component
  if (isSingleMetricSpec(spec)) {
    return (
      <MetricComponent
        key={`${spec.metricField}-${spec.timeField || 'no-time'}`}
        data={spec.data}
        styles={spec.styles}
        metricField={spec.metricField}
        timeField={spec.timeField}
        numericalColumns={spec.numericalColumns}
        categoricalColumns={spec.categoricalColumns}
        dateColumns={spec.dateColumns}
        axisColumnMappings={spec.axisColumnMappings}
      />
    );
  }

  // Check if this is a multi-metric React component
  if (isMultiMetricSpec(spec)) {
    return (
      <MultiMetricComponent
        facetedData={spec.facetedData}
        categoryNames={spec.categoryNames}
        styles={spec.styles}
        metricField={spec.metricField}
        timeField={spec.timeField}
        numericalColumns={spec.numericalColumns}
        categoricalColumns={spec.categoricalColumns}
        dateColumns={spec.dateColumns}
        axisColumnMappings={spec.axisColumnMappings}
      />
    );
  }

  // Regular ECharts rendering for non-metric cases
  return <RegularEchartsRender spec={spec} onSelectTimeRange={onSelectTimeRange} />;
});
