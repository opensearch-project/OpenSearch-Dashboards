/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BezierEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { CelestialEdgeStyleData } from '../../types';
import './celestial_edge.scss';

/**
 * Custom edge type with data-driven styling.
 * Default: solid directed arrow with arrowhead marker.
 * Supports dashed/dotted strokes, flow/pulse animations, and configurable markers.
 *
 * Note: Marker definitions are resolved in MapContainer via `resolveEdgeMarkers`.
 * `props.markerEnd` arrives as a pre-resolved URL string from ReactFlow.
 */
export const CelestialEdge: React.FC<EdgeProps> = (props) => {
  const edgeStyle: CelestialEdgeStyleData = (props.data as any)?.style ?? {};

  // Resolve stroke dasharray: type takes precedence over dashed
  const strokeDasharray =
    edgeStyle.type === 'dotted'
      ? '2 4'
      : edgeStyle.type === 'dashed' || edgeStyle.dashed
      ? '8 4'
      : undefined;

  // Resolve animation class: animationType takes precedence over animated
  const animClass =
    edgeStyle.animationType === 'flow'
      ? 'celEdge--flow'
      : edgeStyle.animationType === 'pulse'
      ? 'celEdge--pulse'
      : edgeStyle.animated
      ? 'celEdge--flow'
      : '';

  const labelStyleProps = edgeStyle.labelStyle
    ? {
        labelBgStyle: {
          fill: edgeStyle.labelStyle.backgroundColor ?? 'var(--osd-color-container-default)',
        },
        labelStyle: {
          fill: edgeStyle.labelStyle.color,
          fontSize: edgeStyle.labelStyle.fontSize,
        },
      }
    : {};

  return (
    <g className={`celEdge ${animClass}`}>
      <BezierEdge
        {...props}
        style={{
          strokeWidth: edgeStyle.strokeWidth ?? 2,
          strokeDasharray,
          stroke: edgeStyle.color ?? 'var(--osd-color-status-default)',
          ...props.style,
        }}
        label={edgeStyle.label}
        {...labelStyleProps}
      />
    </g>
  );
};
