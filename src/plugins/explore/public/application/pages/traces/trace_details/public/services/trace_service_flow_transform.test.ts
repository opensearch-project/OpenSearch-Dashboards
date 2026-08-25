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

const metric = (node: any, label: string) => node.data.metrics.find((m: any) => m.label === label);

describe('spansToServiceFlow', () => {
  it('returns an empty map for no hits', () => {
    expect(spansToServiceFlow([])).toEqual({
      map: { root: { nodes: [], edges: [] } },
      entrySpanByService: {},
    });
  });

  it('creates a metricsCard node per service with Requests/Errors/Duration metrics', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }),
      hit({ spanId: 'c', parentSpanId: 'b', serviceName: 'cart' }),
    ];

    const { nodes } = spansToServiceFlow(hits, { frontend: '#111', cart: '#222' }).map.root;
    expect(nodes).toHaveLength(2);
    const cart = nodes.find((n) => n.id === 'cart')!;
    expect(cart.type).toBe('metricsCard');
    expect(cart.data.color).toBe('#222');
    expect(cart.data.hasError).toBe(false);
    expect(metric(cart, 'Requests').value).toBe(2);
    expect(metric(cart, 'Requests').formattedValue).toBe('2');
    expect(metric(cart, 'Duration').formattedValue).toBe('2ms');
    expect(cart.data.metrics.map((m) => m.label)).toEqual(['Requests', 'Errors', 'Duration']);
  });

  it('flags error services and formats the Errors metric with a percentage', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'cart', status: { code: 2 } }),
      hit({ spanId: 'b', serviceName: 'cart', status: { code: 0 } }),
    ];
    const cart = spansToServiceFlow(hits).map.root.nodes.find((n) => n.id === 'cart')!;
    expect(cart.data.hasError).toBe(true);
    const errors = metric(cart, 'Errors');
    expect(errors.value).toBe(1);
    expect(errors.formattedValue).toBe('1 (50%)');
    // Healthy service has hasError false and "0" errors.
    const clean = spansToServiceFlow([hit({ spanId: 'x', serviceName: 'cart' })]).map.root.nodes[0];
    expect(clean.data.hasError).toBe(false);
    expect(metric(clean, 'Errors').formattedValue).toBe('0');
  });

  it('builds deduped volumeEdge edges with volume + error flag, skipping self-calls', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'a', serviceName: 'frontend' }),
      hit({ spanId: 'b', parentSpanId: 'a', serviceName: 'cart' }), // frontend -> cart
      hit({ spanId: 'c', parentSpanId: 'a', serviceName: 'cart', status: { code: 2 } }), // errored call
      hit({ spanId: 'd', parentSpanId: 'b', serviceName: 'cart' }), // self, skipped
      hit({ spanId: 'e', parentSpanId: 'b', serviceName: 'payment' }), // cart -> payment
    ];
    const { edges } = spansToServiceFlow(hits).map.root;
    const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
    expect(Object.keys(byId).sort()).toEqual(['cart->payment', 'frontend->cart']);
    expect(byId['frontend->cart'].type).toBe('volumeEdge');
    expect(byId['frontend->cart'].data).toEqual({
      volume: 2,
      maxVolume: 2,
      hasError: true,
      label: '2 calls',
    });
    expect(byId['cart->payment'].data).toEqual({
      volume: 1,
      maxVolume: 2,
      hasError: false,
      label: '1 call',
    });
  });

  it('resolves each service entry span (span receiving the cross-service call)', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'root', serviceName: 'frontend' }),
      hit({ spanId: 'cartEntry', parentSpanId: 'root', serviceName: 'cart' }),
      hit({ spanId: 'cartChild', parentSpanId: 'cartEntry', serviceName: 'cart' }),
    ];
    const { entrySpanByService } = spansToServiceFlow(hits);
    expect(entrySpanByService.frontend).toBe('root');
    expect(entrySpanByService.cart).toBe('cartEntry');
  });
});
