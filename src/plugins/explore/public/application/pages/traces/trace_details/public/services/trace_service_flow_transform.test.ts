/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';

const hit = (over: Partial<ServiceFlowHit> & { spanId: string }): ServiceFlowHit => ({
  parentSpanId: '',
  serviceName: 'frontend',
  durationInNanos: 1_000_000, // 1ms
  ...over,
});

describe('spansToServiceFlow', () => {
  it('returns an empty map for no hits', () => {
    expect(spansToServiceFlow([])).toEqual({
      map: { root: { nodes: [], edges: [] } },
      entrySpanByService: {},
    });
  });

  it('creates one serviceCard node per service with request counts and color', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }),
      hit({ spanId: 'c', parentSpanId: 'b', serviceName: 'cart' }),
    ];

    const { map } = spansToServiceFlow(hits, { frontend: '#111', cart: '#222' });
    const { nodes } = map.root;

    expect(nodes).toHaveLength(2);
    const frontend = nodes.find((n) => n.id === 'frontend')!;
    const cart = nodes.find((n) => n.id === 'cart')!;
    expect(frontend.type).toBe('serviceCard');
    expect(frontend.data.color).toBe('#111');
    expect(frontend.data.metrics.requests).toBe(1);
    expect(cart.data.metrics.requests).toBe(2);
    expect(cart.data.subtitle).toContain('2 spans');
  });

  it('records error spans in errors4xx and shows a red "N errors" badge (not SLI breach)', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'cart', status: { code: 2 } }),
      hit({ spanId: 'b', serviceName: 'cart', status: { code: 0 } }),
    ];

    const cart = spansToServiceFlow(hits).map.root.nodes.find((n) => n.id === 'cart')!;
    expect(cart.data.metrics.errors4xx).toBe(1);
    expect(cart.data.metrics.faults5xx).toBe(0);
    // No health -> no red-breach border override and no "SLI breach" label.
    expect((cart.data as any).health).toBeUndefined();
    expect(cart.data.typeBadge).toEqual({ label: '1 error', color: '#BD271E' });
  });

  it('pluralizes the error badge and leaves error-free services badge-less', () => {
    const multi = spansToServiceFlow([
      hit({ spanId: 'a', serviceName: 'cart', status: { code: 2 } }),
      hit({ spanId: 'b', serviceName: 'cart', status: { code: 2 } }),
    ]).map.root.nodes[0];
    expect(multi.data.typeBadge).toEqual({ label: '2 errors', color: '#BD271E' });

    const clean = spansToServiceFlow([hit({ spanId: 'a', serviceName: 'cart' })]).map.root.nodes[0];
    expect(clean.data.typeBadge).toBe(false);
  });

  it('builds deduped cross-service edges with call counts, skipping self-calls', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }), // frontend -> cart
      hit({ spanId: 'c', parentSpanId: 'a', serviceName: 'cart' }), // frontend -> cart again
      hit({ spanId: 'd', parentSpanId: 'b', serviceName: 'cart' }), // cart -> cart (self, skipped)
      hit({ spanId: 'e', parentSpanId: 'b', serviceName: 'payment' }), // cart -> payment
    ];

    const { edges } = spansToServiceFlow(hits).map.root;
    const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
    expect(Object.keys(byId).sort()).toEqual(['cart->payment', 'frontend->cart']);
    expect(byId['frontend->cart'].data.style.label).toBe('2 calls');
    expect(byId['cart->payment'].data.style.label).toBe('1 call');
    expect(byId['frontend->cart'].data.style.animationType).toBe('flow');
  });

  it('marks an edge red when a call span errored', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart', status: { code: 2 } }),
    ];
    const edge = spansToServiceFlow(hits).map.root.edges[0];
    expect(edge.data.style.color).toContain('error');
  });

  it('resolves each service entry span (span receiving the cross-service call)', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'root', serviceName: 'frontend' }),
      hit({ spanId: 'cartEntry', parentSpanId: 'root', serviceName: 'cart' }),
      hit({ spanId: 'cartChild', parentSpanId: 'cartEntry', serviceName: 'cart' }),
    ];
    const { entrySpanByService } = spansToServiceFlow(hits);
    expect(entrySpanByService.frontend).toBe('root');
    // cart's entry is the span whose parent (frontend) is a different service.
    expect(entrySpanByService.cart).toBe('cartEntry');
  });
});
