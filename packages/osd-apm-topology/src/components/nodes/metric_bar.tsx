/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface MetricBarProps {
  /** Current value */
  value: number;
  /** Maximum value (100% width) */
  max: number;
  /** Bar fill color. Defaults to blue. */
  color?: string;
  /** Label displayed to the right of the bar */
  label?: string;
}

/**
 * Horizontal progress bar for any metric (error rate, duration, token usage).
 */
export const MetricBar: React.FC<MetricBarProps> = ({
  value,
  max,
  color = 'var(--osd-color-cl-blue-450)',
  label,
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="osd:flex osd:items-center osd:gap-2 osd:w-full">
      <div
        className="osd:flex-1 osd:h-2 osd:rounded-full osd:overflow-hidden"
        style={{ backgroundColor: 'var(--osd-color-cl-gray-250)' }}
      >
        <div
          className="osd:h-full osd:rounded-full osd:transition-all osd:duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {label && (
        <span className="osd:text-xs osd:text-body-secondary osd:whitespace-nowrap osd:min-w-8 osd:text-right">
          {label}
        </span>
      )}
    </div>
  );
};

export interface MetricBarGroupItem {
  label: string;
  value: number;
  max: number;
  color?: string;
  formattedValue?: string;
}

export interface MetricBarGroupProps {
  metrics: MetricBarGroupItem[];
}

/**
 * Renders an array of MetricBars stacked vertically.
 */
export const MetricBarGroup: React.FC<MetricBarGroupProps> = ({ metrics }) => (
  <div className="osd:flex osd:flex-col osd:gap-1 osd:w-full">
    {metrics.map((m, i) => (
      <MetricBar
        key={i}
        value={m.value}
        max={m.max}
        color={m.color}
        label={m.formattedValue ?? m.label}
      />
    ))}
  </div>
);
