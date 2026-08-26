/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import './volume_edge.scss';

export interface VolumeEdgeData {
  /** Drives stroke thickness (e.g. number of calls between two nodes). */
  volume: number;
  /** Max volume across edges, for scaling. Defaults to `volume`. */
  maxVolume?: number;
  /** Renders the edge (and arrow) in the error color. */
  hasError?: boolean;
  /** Text shown in the hover tooltip (e.g. "4 calls"). */
  label?: string;
}

const EDGE_COLOR = 'var(--osd-color-status-default, #98a2b3)';
const ERROR_COLOR = 'var(--osd-color-status-error, #bd271e)';

/**
 * Directed edge whose stroke thickness encodes a volume metric, with a compact
 * fixed-size arrowhead (does NOT scale with stroke width, unlike the default
 * ArrowClosed marker) and the exact value shown on hover instead of a permanent
 * label. Turns red on error. Register as an edge type (e.g. `volumeEdge`).
 */
export const VolumeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const edgeData = (data as VolumeEdgeData) ?? { volume: 1 };
  const volume = edgeData.volume ?? 1;
  const maxVolume = edgeData.maxVolume && edgeData.maxVolume > 0 ? edgeData.maxVolume : volume;
  const hasError = !!edgeData.hasError;
  const color = hasError ? ERROR_COLOR : EDGE_COLOR;
  // 1.25px base, up to ~4.5px at max volume — a subtle, readable range.
  const ratio = maxVolume > 0 ? Math.min(volume / maxVolume, 1) : 1;
  const strokeWidth = 1.25 + ratio * 3.25;
  const markerId = `volumeArrow-${id}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth={11}
          markerHeight={11}
          refX={9}
          refY={5.5}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M1,1 L10,5.5 L1,10 z" fill={color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{ stroke: color, strokeWidth }}
      />
      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            className="celVolumeEdge__label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            data-test-subj={`volumeEdgeLabel-${id}`}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
