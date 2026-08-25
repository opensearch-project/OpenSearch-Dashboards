/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

const EDGE_COLOR = '#98A2B3'; // EUI mediumShade
const ERROR_COLOR = '#BD271E'; // EUI danger

interface TraceCallEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  markerEnd?: string;
  data?: { callCount: number; hasError: boolean };
}

/**
 * Custom edge for the trace map: stroke thickness encodes the number of calls
 * between two services; the exact count is shown on hover (rather than as
 * permanent text). Turns red when a call between the services errored.
 */
export const TraceServiceEdge: React.FC<TraceCallEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) => {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const callCount = data?.callCount ?? 1;
  const hasError = !!data?.hasError;
  // 1 call -> ~1.5px, growing (capped) with volume.
  const strokeWidth = 1.5 + Math.min(callCount, 8) * 0.75;
  const color = hasError ? ERROR_COLOR : EDGE_COLOR;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: hovered ? strokeWidth + 1 : strokeWidth,
          strokeDasharray: '6 4',
        }}
      />
      {/* Wide invisible hit area so hover is easy to trigger. */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={16}
        stroke="transparent"
        style={{ cursor: 'default' }}
        data-test-subj={`traceCallEdgeHit-${id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered && (
        <EdgeLabelRenderer>
          <div
            className="exploreTraceCallEdge__label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#343741',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            data-test-subj={`traceCallEdgeLabel-${id}`}
          >
            {callCount} call{callCount === 1 ? '' : 's'}
            {hasError ? ' · has errors' : ''}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
