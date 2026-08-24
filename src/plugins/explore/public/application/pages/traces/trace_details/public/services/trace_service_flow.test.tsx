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
      data-selected-service={
        (props.map?.root?.nodes ?? []).find((n: any) => n.data?.typeBadge?.label === 'Selected')
          ?.id ?? ''
      }
      data-has-card-type={props.nodeTypes?.serviceCard ? 'true' : 'false'}
      data-breadcrumbs={JSON.stringify(props.breadcrumbs)}
      data-zoom={props.onNodeClickZoom ?? 'none'}
    >
      <button
        data-test-subj="fireNodeClick"
        onClick={() => props.onDashboardClick?.({ id: 'cart' })}
      >
        click
      </button>
    </div>
  ),
  ServiceCardNode: () => null,
}));

const hits: ServiceFlowHit[] = [
  { spanId: 'a', parentSpanId: '', serviceName: 'frontend' },
  { spanId: 'b', parentSpanId: 'a', serviceName: 'cart' },
];

describe('TraceServiceFlow', () => {
  it('renders CelestialMap with serviceCard nodes and no breadcrumb bar', () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} colorMap={{}} />);
    const map = getByTestId('celestial-map');
    expect(map).toHaveAttribute('data-node-count', '2');
    expect(map).toHaveAttribute('data-edge-count', '1');
    expect(map).toHaveAttribute('data-has-card-type', 'true');
    expect(map).toHaveAttribute('data-breadcrumbs', '[]');
  });

  it('does not enable onNodeClickZoom (avoids fighting the selected-node focus)', () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} />);
    expect(getByTestId('celestial-map')).toHaveAttribute('data-zoom', 'none');
  });

  it("badges the selected span's service (without driving camera-focusing selectedNodeId)", () => {
    const { getByTestId } = render(<TraceServiceFlow hits={hits} selectedSpanId="b" />);
    const map = getByTestId('celestial-map');
    // We intentionally do NOT set selectedNodeId (it would zoom to the node).
    expect(map).toHaveAttribute('data-selected', '');
    // Instead the selected service ('cart', which contains span 'b') gets a badge.
    expect(map).toHaveAttribute('data-selected-service', 'cart');
  });

  it("selects the clicked service's entry span, not an arbitrary one", () => {
    const onSelectSpan = jest.fn();
    const { getByTestId } = render(<TraceServiceFlow hits={hits} onSelectSpan={onSelectSpan} />);
    fireEvent.click(getByTestId('fireNodeClick'));
    // cart's entry span is 'b' (its parent 'a' is in a different service).
    expect(onSelectSpan).toHaveBeenCalledWith('b');
  });

  it('renders an empty prompt when there are no services', () => {
    const { container, queryByTestId } = render(<TraceServiceFlow hits={[]} />);
    expect(queryByTestId('celestial-map')).toBeNull();
    expect(container.querySelector('[data-test-subj="traceServiceFlowEmpty"]')).toBeInTheDocument();
  });
});
