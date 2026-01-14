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
    if (instance && spec) {
      instance.setOption(
        {
          ...spec,
        },
        { notMerge: true } // this is a must to update compulsorily otherwise will merge with previous option
      );
    }
  }, [spec, instance]);

  return (
    <div
      style={{
        height: '100%',
        overflowX: 'auto',
        ...(shouldScroll && { width: widthPercentage }),
      }}
      id="echartContainer"
      ref={containerRef}
    />
  );
};
