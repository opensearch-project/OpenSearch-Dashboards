/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TraceServiceFlow } from './trace_service_flow';
import { ServiceFlowHit } from './trace_service_flow_transform';

jest.mock('@osd/apm-topology', () => ({
  MetricsCardNode: () => null,
  VolumeEdge: () => null,
  CelestialMap: (props: any) => {
    const nodes = props.map?.root?.nodes ?? [];
    return (
      <div
        data-test-subj="celestial-map"
        data-node-count={nodes.length}
        data-edge-count={props.map?.root?.edges?.length ?? 0}
        data-active={nodes.find((n: any) => n.data?.isSelected)?.id ?? ''}
        data-node-type={nodes[0]?.type ?? ''}
        data-edge-type={props.map?.root?.edges?.[0]?.type ?? ''}
        data-has-node-type={props.nodeTypes?.metricsCard ? 'true' : 'false'}
        data-has-edge-type={props.edgeTypes?.volumeEdge ? 'true' : 'false'}
        data-breadcrumbs={JSON.stringify(props.breadcrumbs)}
        data-selected-node-id={props.selectedNodeId ?? ''}
      >
        <button
          data-test-subj="fireSelect"
          onClick={() => props.onDashboardClick?.({ id: nodes[0]?.id })}
        >
          select
        </button>
      </div>
    );
  },
}));

const hits: ServiceFlowHit[] = [
  { spanId: 'a', parentSpanId: '', serviceName: 'frontend' },
  { spanId: 'b', parentSpanId: 'a', serviceName: 'cart' },
];

describe('TraceServiceFlow', () => {
  it('renders metricsCard nodes + volumeEdge edges and hides the breadcrumb bar', () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} colorMap={{}} />);
    const map = getByTestId('celestial-map');
    expect(map).toHaveAttribute('data-node-count', '2');
    expect(map).toHaveAttribute('data-edge-count', '1');
    expect(map).toHaveAttribute('data-node-type', 'metricsCard');
    expect(map).toHaveAttribute('data-edge-type', 'volumeEdge');
    expect(map).toHaveAttribute('data-has-node-type', 'true');
    expect(map).toHaveAttribute('data-has-edge-type', 'true');
    expect(map).toHaveAttribute('data-breadcrumbs', '[]');
    // Never drives selectedNodeId (which would camera-focus a single node).
    expect(map).toHaveAttribute('data-selected-node-id', '');
  });

  it('highlights the service that matches the active filter', () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} activeServiceFilter="cart" />);
    expect(getByTestId('celestial-map')).toHaveAttribute('data-active', 'cart');
  });

  it('clicking a service calls onFilterService with its name', () => {
    const onFilterService = jest.fn();
    const { getByTestId } = render(
      <TraceServiceFlow hits={hits} onFilterService={onFilterService} />
    );
    fireEvent.click(getByTestId('fireSelect'));
    expect(onFilterService).toHaveBeenCalledWith('frontend');
  });

  it('renders an empty prompt when there are no services', () => {
    const { container, queryByTestId } = render(<TraceServiceFlow hits={[]} />);
    expect(queryByTestId('celestial-map')).toBeNull();
    expect(container.querySelector('[data-test-subj="traceServiceFlowEmpty"]')).toBeInTheDocument();
  });
});
