/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceServiceFlow } from './trace_service_flow';
import { ServiceFlowHit } from './trace_service_flow_transform';

jest.mock('@osd/apm-topology', () => ({
  CelestialMap: (props: any) => (
    <div
      data-test-subj="celestial-map"
      data-node-count={props.map?.root?.nodes?.length ?? 0}
      data-edge-count={props.map?.root?.edges?.length ?? 0}
      data-selected={props.selectedNodeId ?? ''}
      data-has-circle-type={props.nodeTypes?.serviceCircle ? 'true' : 'false'}
    >
      <button
        data-test-subj="fireNodeClick"
        onClick={() => props.onDashboardClick?.({ id: 'cart' })}
      >
        click
      </button>
    </div>
  ),
  ServiceCircleNode: () => null,
}));

const hits: ServiceFlowHit[] = [
  { spanId: 'a', parentSpanId: '', serviceName: 'frontend' },
  { spanId: 'b', parentSpanId: 'a', serviceName: 'cart' },
];

describe('TraceServiceFlow', () => {
  it('renders the CelestialMap with the built service flow and serviceCircle node type', () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} colorMap={{}} />);
    const map = getByTestId('celestial-map');
    expect(map).toHaveAttribute('data-node-count', '2');
    expect(map).toHaveAttribute('data-edge-count', '1');
    expect(map).toHaveAttribute('data-has-circle-type', 'true');
  });

  it("passes the selected span's service as selectedNodeId", () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} selectedSpanId="b" />);
    expect(getByTestId('celestial-map')).toHaveAttribute('data-selected', 'cart');
  });

  it('invokes onSelectService with the clicked node id', () => {
    const onSelectService = jest.fn();
    const { getByTestId } = render(
      <TraceServiceFlow hits={hits} onSelectService={onSelectService} />
    );
    fireEvent.click(getByTestId('fireNodeClick'));
    expect(onSelectService).toHaveBeenCalledWith('cart');
  });

  it('renders an empty prompt when there are no services', () => {
    const { container, queryByTestId } = render(<TraceServiceFlow hits={[]} />);
    // EuiEmptyPrompt is rendered instead of the map
    expect(queryByTestId('celestial-map')).toBeNull();
    expect(container.querySelector('[data-test-subj="traceServiceFlowEmpty"]')).toBeInTheDocument();
  });
});
