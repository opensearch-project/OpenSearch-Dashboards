/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { BehaviorSubject } from 'rxjs';

import { TimeRange } from '../../../../data/public';
import { DEFAULT_THEME } from './theme/default';
import { DEFAULT_GRID } from './constants';

interface Props {
  spec: echarts.EChartsOption;
  onSelectTimeRange?: (range: TimeRange) => void;
  legendSelected$?: BehaviorSubject<Record<string, boolean>>;
  highlightedSeries$?: BehaviorSubject<string | undefined>;
}

export const EchartsRender = React.memo(
  ({ spec, onSelectTimeRange, legendSelected$, highlightedSeries$ }: Props) => {
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
        if (instance && onSelectTimeRange && !instance.isDisposed()) {
          instance.off('brushEnd', onBrushEnd);
        }
      };
    }, [instance, onSelectTimeRange]);

    useEffect(() => {
      if (instance && spec) {
        const xAxis = Array.isArray(spec.xAxis) ? spec.xAxis[0] : spec.xAxis;
        const yAxis = Array.isArray(spec.yAxis) ? spec.yAxis[0] : spec.yAxis;
        let option = { ...spec };
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
        }

        // Apply legend selected state from BehaviorSubject
        if (legendSelected$) {
          const selected = legendSelected$.getValue();
          const legend = Array.isArray(option.legend) ? option.legend[0] : option.legend;
          if (legend && typeof legend === 'object' && Object.keys(selected).length > 0) {
            (legend as any).selected = selected;
          }
        }

        instance.setOption(option, { notMerge: true });
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
    }, [spec, instance, onSelectTimeRange, legendSelected$]);

    // Subscribe to legendSelected$ changes and update legend.selected without full re-render
    useEffect(() => {
      if (!instance || !legendSelected$) return;
      const sub = legendSelected$.subscribe((selected) => {
        instance.setOption({ legend: { selected } });
      });
      return () => sub.unsubscribe();
    }, [instance, legendSelected$]);

    // Subscribe to highlightedSeries$ for hover highlight/downplay
    useEffect(() => {
      if (!instance || !highlightedSeries$) return;
      const sub = highlightedSeries$.subscribe((name) => {
        if (name) {
          const seriesArr = Array.isArray(spec.series) ? spec.series : [spec.series];
          const isPie = seriesArr.some((s: any) => s?.type === 'pie');
          if (isPie) {
            instance.dispatchAction({ type: 'highlight', seriesIndex: 0, name });
          } else {
            instance.dispatchAction({ type: 'highlight', seriesName: name });
          }
        } else {
          // clear highlight state
          instance.dispatchAction({ type: 'downplay' });
        }
      });
      return () => sub.unsubscribe();
    }, [instance, highlightedSeries$, spec.series]);

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
