/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';

const hit = (over: Partial<ServiceFlowHit> & { spanId: string }): ServiceFlowHit => ({
  parentSpanId: '',
  serviceName: 'frontend',
  ...over,
});

describe('spansToServiceFlow', () => {
  it('returns an empty map for no hits', () => {
    expect(spansToServiceFlow([])).toEqual({ root: { nodes: [], edges: [] } });
  });

  it('creates one node per service with request counts and applies the color map', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }),
      hit({ spanId: 'c', parentSpanId: 'b', serviceName: 'cart' }),
    ];

    const { root } = spansToServiceFlow(hits, { frontend: '#111', cart: '#222' });

    expect(root.nodes).toHaveLength(2);
    const frontend = root.nodes.find((n) => n.id === 'frontend')!;
    const cart = root.nodes.find((n) => n.id === 'cart')!;
    expect(frontend.type).toBe('serviceCircle');
    expect(frontend.data.color).toBe('#111');
    expect(frontend.data.metrics.requests).toBe(1);
    expect(cart.data.metrics.requests).toBe(2);
    expect(cart.data.color).toBe('#222');
  });

  it('counts error spans (status.code === 2) as faults', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'cart', status: { code: 2 } }),
      hit({ spanId: 'b', serviceName: 'cart', status: { code: 0 } }),
    ];

    const { root } = spansToServiceFlow(hits);
    const cart = root.nodes.find((n) => n.id === 'cart')!;
    expect(cart.data.metrics.requests).toBe(2);
    expect(cart.data.metrics.faults5xx).toBe(1);
    expect(cart.data.metrics.errors4xx).toBe(0);
  });

  it('builds deduped cross-service edges and skips self-calls', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }), // frontend -> cart
      hit({ spanId: 'c', parentSpanId: 'a', serviceName: 'cart' }), // duplicate frontend -> cart
      hit({ spanId: 'd', parentSpanId: 'b', serviceName: 'cart' }), // cart -> cart (self, skipped)
      hit({ spanId: 'e', parentSpanId: 'b', serviceName: 'payment' }), // cart -> payment
    ];

    const { root } = spansToServiceFlow(hits);
    const edgeKeys = root.edges.map((e) => e.id).sort();
    expect(edgeKeys).toEqual(['cart->payment', 'frontend->cart']);
    root.edges.forEach((e) => {
      expect(e.type).toBe('celestialEdge');
      expect(e.data.style.animationType).toBe('flow');
      expect(e.data.style.marker).toBe('arrowClosed');
    });
  });
});
