/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface SplitChartInstanceProps {
  label: string;
  data: Array<Record<string, any>>;
  style?: React.CSSProperties;
  showLabel?: boolean;
  scrollRoot?: React.RefObject<HTMLElement>;
  renderChart: (groupData: Array<Record<string, any>>, groupKey: string) => React.ReactNode;
}

export const SplitChartInstance: React.FC<SplitChartInstanceProps> = ({
  label,
  data,
  style,
  showLabel = false,
  scrollRoot,
  renderChart,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const instanceRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = instanceRef.current;
    if (!element) return;

    // Delay observer setup to allow CSS Grid layout to settle
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { root: scrollRoot?.current ?? null, rootMargin: '200px' }
      );
      observer.observe(element);
      observerRef.current = observer;
    }, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [scrollRoot]);

  return (
    <div ref={instanceRef} className="splitChartInstance" style={style}>
      {showLabel && (
        <div className="splitChartInstance__label" title={label}>
          {label}
        </div>
      )}
      <div className="splitChartInstance__chart">{isVisible ? renderChart(data, label) : null}</div>
    </div>
  );
};
