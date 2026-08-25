/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceServiceEdge } from './trace_service_edge';

jest.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M0,0 L100,100', 50, 50],
  BaseEdge: ({ id, style }: any) => (
    <path data-test-subj={`base-edge-${id}`} data-stroke-width={style?.strokeWidth} />
  ),
  EdgeLabelRenderer: ({ children }: any) => <div>{children}</div>,
}));

const props = {
  id: 'e1',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: 'right',
  targetPosition: 'left',
};

describe('TraceServiceEdge', () => {
  it('scales stroke width with call count', () => {
    const { getByTestId } = render(
      <TraceServiceEdge {...(props as any)} data={{ callCount: 4, hasError: false }} />
    );
    // 1.5 + min(4, 8) * 0.75 = 4.5
    expect(getByTestId('base-edge-e1')).toHaveAttribute('data-stroke-width', '4.5');
  });

  it('shows the call count only on hover', () => {
    const { getByTestId, queryByTestId } = render(
      <TraceServiceEdge {...(props as any)} data={{ callCount: 4, hasError: false }} />
    );
    expect(queryByTestId('traceCallEdgeLabel-e1')).toBeNull();
    fireEvent.mouseEnter(getByTestId('traceCallEdgeHit-e1'));
    const label = getByTestId('traceCallEdgeLabel-e1');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toContain('4 calls');
    fireEvent.mouseLeave(getByTestId('traceCallEdgeHit-e1'));
    expect(queryByTestId('traceCallEdgeLabel-e1')).toBeNull();
  });

  it('notes errors in the hover label for an errored call', () => {
    const { getByTestId } = render(
      <TraceServiceEdge {...(props as any)} data={{ callCount: 1, hasError: true }} />
    );
    fireEvent.mouseEnter(getByTestId('traceCallEdgeHit-e1'));
    expect(getByTestId('traceCallEdgeLabel-e1').textContent).toContain('1 call');
    expect(getByTestId('traceCallEdgeLabel-e1').textContent).toContain('has errors');
  });
});
