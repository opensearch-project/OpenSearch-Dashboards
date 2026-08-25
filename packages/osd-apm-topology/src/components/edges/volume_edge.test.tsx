/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { VolumeEdge } from './volume_edge';

jest.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M0,0 L100,100', 50, 50],
  BaseEdge: ({ id, style, markerEnd }: any) => (
    <path
      data-test-subj={`base-edge-${id}`}
      data-stroke-width={style?.strokeWidth}
      data-marker-end={markerEnd}
    />
  ),
  EdgeLabelRenderer: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('./volume_edge.scss', () => ({}));

const props = {
  id: 'e1',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: 'right',
  targetPosition: 'left',
} as any;

describe('VolumeEdge', () => {
  it('scales stroke thickness by volume/maxVolume and uses a fixed custom arrow marker', () => {
    const { getByTestId, container } = render(
      <VolumeEdge {...props} data={{ volume: 10, maxVolume: 10, label: '10 calls' }} />
    );
    // ratio 1 -> 1.25 + 3.25 = 4.5
    expect(getByTestId('base-edge-e1')).toHaveAttribute('data-stroke-width', '4.5');
    expect(getByTestId('base-edge-e1')).toHaveAttribute('data-marker-end', 'url(#volumeArrow-e1)');
    // Fixed-size marker (does not scale with stroke width).
    const marker = container.querySelector('marker');
    expect(marker).toHaveAttribute('markerUnits', 'userSpaceOnUse');
    expect(marker).toHaveAttribute('markerWidth', '11');
  });

  it('shows the volume label only on hover', () => {
    const { getByTestId, queryByTestId } = render(
      <VolumeEdge {...props} data={{ volume: 4, maxVolume: 10, label: '4 calls' }} />
    );
    expect(queryByTestId('volumeEdgeLabel-e1')).toBeNull();
    fireEvent.mouseEnter(getByTestId('volumeEdgeHit-e1'));
    expect(getByTestId('volumeEdgeLabel-e1').textContent).toBe('4 calls');
    fireEvent.mouseLeave(getByTestId('volumeEdgeHit-e1'));
    expect(queryByTestId('volumeEdgeLabel-e1')).toBeNull();
  });
});
