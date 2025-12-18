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
    };
  }, [containerResizeObserver]);

  useEffect(() => {
    if (instance && spec) {
      instance.setOption({ ...spec, grid: { top: 60, bottom: 60, left: 60, right: 60 } });
    }
  }, [spec, instance]);

  return <div style={{ height: '100%', width: '100%' }} ref={containerRef} />;
};
