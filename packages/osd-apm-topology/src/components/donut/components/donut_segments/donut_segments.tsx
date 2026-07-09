/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { memo } from 'react';
import { DonutSegment } from './donut_segment';
import { useCircleDimensions } from './use_circle_dimensions.hook';
import type { Segment } from '../../types';

interface DonutSegmentsProps {
  diameter: number;
  segments: Segment[];
  stroke: string;
  fill: string;
}

export const DonutSegments = memo(({ diameter, segments, fill, stroke }: DonutSegmentsProps) => {
  const {
    center,
    radius,
    backgroundStrokeWidth,
    segmentStrokeWidth,
    getArcLength,
    circumference,
  } = useCircleDimensions(diameter);

  return (
    <>
      <DonutSegment
        center={center}
        radius={radius}
        stroke={stroke}
        fill={fill}
        strokeWidth={backgroundStrokeWidth}
        dashArray=""
      />
      {segments.map((segment, index) => (
        <DonutSegment
          key={index}
          center={center}
          radius={radius}
          stroke={segment.color}
          strokeWidth={segmentStrokeWidth}
          dashArray={`${getArcLength(segment.percent)} ${circumference}`}
          dashOffset={-getArcLength(segment.offset)}
          ariaLabel={segment.label}
          description={segment.label}
        />
      ))}
    </>
  );
});
