/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { TimeRange } from '../../../../data/public';
import { DEFAULT_THEME } from './theme/default';

interface Props {
  spec: echarts.EChartsOption;
  onSelectTimeRange?: (range: TimeRange) => void;
}

export const EchartsRender = React.memo(({ spec, onSelectTimeRange }: Props) => {
  const [instance, setInstance] = useState<echarts.ECharts | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const containerResizeObserver = useMemo(
    () =>
      new ResizeObserver(() => {
        if (instanceRef.current) {
          instanceRef.current.resize();
        }
      }),
    []
  );

  const gridArray = Array.isArray(spec?.grid) ? spec.grid : [];
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
      if (instance && onSelectTimeRange) {
        instance.off('brushEnd', onBrushEnd);
      }
    };
  }, [instance, onSelectTimeRange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (instance) {
        // @ts-ignore
        const legend = instance._componentsViews.find(
          (entry: any) => entry.type === 'legend.plain' || entry.type === 'legend.scroll'
        );
        const grid: echarts.EChartsOption['grid'] = {};
        const title: echarts.EChartsOption['title'] = {};
        if (legend) {
          const legendWidth = legend._backgroundEl.shape.width;
          const legendHeight = legend._backgroundEl.shape.height;
          if (!Array.isArray(spec.legend)) {
            if (spec.legend?.left) {
              grid.left = legendWidth + 40;
            } else if (spec.legend?.right) {
              grid.right = legendWidth + 30;
            } else if (spec.legend?.top) {
              grid.top = legendHeight + 50;
              title.top = legendHeight + 10;
            } else if (spec.legend?.bottom) {
              grid.bottom = legendHeight + 50;
            }
          }
        }
        if (spec.visualMap) {
          const visualMap = Array<echarts.VisualMapComponentOption>().concat(spec.visualMap);
          for (const v of visualMap) {
            if (v.right) {
              grid.right = 60;
            } else if (v.bottom) {
              grid.bottom = 80;
            }
          }
        }
        instance.setOption({ grid, title });
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [instance, spec.legend, spec.visualMap]);

  useEffect(() => {
    if (instance && spec) {
      const xAxis = Array.isArray(spec.xAxis) ? spec.xAxis[0] : spec.xAxis;
      const yAxis = Array.isArray(spec.yAxis) ? spec.yAxis[0] : spec.yAxis;
      let option = { ...spec };
      if (xAxis?.type === 'time') {
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
      } else if (yAxis?.type === 'time') {
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

      instance.setOption(
        option,
        { notMerge: true } // this is a must to update compulsorily otherwise will merge with previous option
      );
      instance.setTheme(DEFAULT_THEME);

      if (xAxis?.type === 'time' || yAxis?.type === 'time') {
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
  }, [spec, instance]);

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
});
