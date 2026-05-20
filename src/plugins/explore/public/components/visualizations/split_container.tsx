/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SplitLayout } from './visualization_builder.types';
import { SplitGroup } from './utils/group_data_by_split';
import { SplitChartInstance } from './split_chart_instance';

import './split_container.scss';

interface SplitContainerProps {
  groups: SplitGroup[];
  layout: SplitLayout;
  showLabel?: boolean;
  renderChart: (groupData: Array<Record<string, any>>, groupKey: string) => React.ReactNode;
}

/**
 * Computes the number of columns for the auto layout based on container width.
 */
export function getColumnCount(width: number): number {
  if (width > 1600) return 6;
  if (width > 1200) return 5;
  if (width > 800) return 3;
  if (width > 500) return 2;
  return 1;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({
  groups,
  layout,
  showLabel = false,
  renderChart,
}) => {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only re-render when the column count actually changes
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const newColumns = getColumnCount(entry.contentRect.width);
      setColumns((prev) => (prev !== newColumns ? newColumns : prev));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Use 60 sub-columns (LCM of 2,3,4,5,6) so last-row items can spread evenly
  const SUB_COLUMNS = 60;

  const containerStyle = useMemo((): React.CSSProperties | undefined => {
    if (layout === 'auto') {
      return { gridTemplateColumns: `repeat(${SUB_COLUMNS}, 1fr)` };
    }
    return undefined;
  }, [layout]);

  const itemStyles = useMemo((): React.CSSProperties[] => {
    if (layout === 'horizontal') {
      return groups.map(() => ({ flex: 1, minWidth: 300 }));
    }
    if (layout === 'vertical') {
      return groups.map(() => ({ flex: 1, minHeight: 200 }));
    }
    const span = SUB_COLUMNS / columns;
    const itemsInLastRow = groups.length % columns || columns;
    const lastRowStart = groups.length - itemsInLastRow;
    const lastRowSpan = SUB_COLUMNS / itemsInLastRow;
    return groups.map((_, index) => {
      if (index >= lastRowStart && itemsInLastRow < columns) {
        return { gridColumn: `span ${lastRowSpan}` };
      }
      return { gridColumn: `span ${span}` };
    });
  }, [layout, columns, groups]);

  const layoutClass = `splitContainer--${layout || 'auto'}`;

  return (
    <div className="splitContainer__wrapper">
      <div ref={containerRef} className={`splitContainer ${layoutClass}`} style={containerStyle}>
        {groups.map((group, index) => (
          <SplitChartInstance
            key={group.key}
            label={group.key}
            data={group.data}
            style={itemStyles[index]}
            showLabel={showLabel}
            scrollRoot={containerRef}
            renderChart={renderChart}
          />
        ))}
      </div>
    </div>
  );
};
