/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as echarts from 'echarts';
import React, { useMemo, useRef, useEffect, useState } from 'react';

interface Props {
  spec: echarts.EChartsOption;
}

export const EchartsRender = ({ spec }: Props) => {
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
    if (instance && spec) {
      // Check if this is a multi-grid (faceted) chart
      const isMultiGrid = Array.isArray(spec.grid);

      const finalSpec = isMultiGrid
        ? spec // Use the multi-grid spec as-is
        : { ...spec, grid: { top: 60, bottom: 60, left: 60, right: 60 } }; // Apply default grid for single charts

      instance.setOption(finalSpec, { notMerge: true });

      // Force resize after setting options, especially important for scrolling layouts
      setTimeout(() => {
        if (instance) {
          instance.resize();
        }
      }, 0);
    }
  }, [spec, instance]);

  // Check if we need horizontal scrolling
  const specWithWidth = spec as any;
  const totalWidthPercent = specWithWidth?.totalWidth || 100;
  const needsScrolling = totalWidthPercent > 100;

  // Use calculated width based on actual requirements
  const containerStyle: React.CSSProperties = {
    height: '100%',
    width: needsScrolling ? `${totalWidthPercent}%` : '100%',
    minWidth: needsScrolling ? `${totalWidthPercent}%` : '100%',
  };

  const wrapperStyle: React.CSSProperties = needsScrolling
    ? {
        height: '100%',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
      }
    : { height: '100%', width: '100%' };

  return (
    <div
      style={wrapperStyle}
      onWheel={(e) => {
        // Force horizontal scrolling with mouse wheel
        if (needsScrolling && e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }}
    >
      <div style={containerStyle} ref={containerRef} />
    </div>
  );
};
