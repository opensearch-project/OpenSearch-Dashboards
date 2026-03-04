/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface DonutSegmentProps {
  center: number;
  radius: number;
  stroke: string;
  strokeWidth: number;
  dashArray: string;
  fill?: string;
  dashOffset?: number;
  ariaLabel?: string;
  role?: string;
  description?: string;
  className?: string;
}

export const DonutSegment: React.FC<DonutSegmentProps> = ({
  center,
  radius,
  stroke,
  strokeWidth,
  fill = 'transparent',
  dashArray,
  dashOffset = 0,
  ariaLabel = 'Health donut segment',
  description,
  className = '',
}) => (
  <circle
    className={className}
    cx={center}
    cy={center}
    r={radius}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="butt"
    strokeDasharray={dashArray}
    strokeDashoffset={dashOffset}
    transform={`rotate(-90 ${center} ${center})`}
    role="img"
    aria-label={description ? `${ariaLabel} - ${description}` : ariaLabel}
  />
);
