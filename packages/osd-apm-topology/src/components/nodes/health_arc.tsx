/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface HealthArcSegment {
  value: number;
  color: string;
}

export interface HealthArcProps {
  segments: HealthArcSegment[];
  diameter: number;
  strokeWidth?: number;
  /** Accessible label describing the arc content */
  'aria-label'?: string;
}

/**
 * SVG arc segments rendered around a circle.
 * Each segment's arc length is proportional to its value / total.
 */
export const HealthArc: React.FC<HealthArcProps> = ({
  segments,
  diameter,
  strokeWidth = 6,
  ...rest
}) => {
  const ariaLabel = rest['aria-label'] ?? 'Health arc';
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const center = diameter / 2;

  if (total === 0) {
    return (
      <svg width={diameter} height={diameter} role="img" aria-label={ariaLabel}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--osd-color-cl-gray-350)"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  let cumulativeOffset = 0;

  return (
    <svg width={diameter} height={diameter} role="img" aria-label={ariaLabel}>
      {segments.map((segment, i) => {
        if (segment.value <= 0) return null;
        const segmentLength = (segment.value / total) * circumference;
        const gap = circumference - segmentLength;
        const offset = -cumulativeOffset + circumference / 4;
        cumulativeOffset += segmentLength;

        return (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${gap}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        );
      })}
    </svg>
  );
};
