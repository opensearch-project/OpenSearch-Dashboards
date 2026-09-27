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
});

describe('spansToServiceFlow dependency synthesis', () => {
  const nodeIds = (hits: ServiceFlowHit[]) =>
    spansToServiceFlow(hits)
      .map.root.nodes.map((n) => n.id)
      .sort();
  const edgesOf = (hits: ServiceFlowHit[]) =>
    spansToServiceFlow(hits)
      .map.root.edges.map((e) => `${e.source} => ${e.target}`)
      .sort();

  it('leaves a service-only trace unchanged (no synthetic nodes or edges)', () => {
    // Shaped like a live OTel-demo "ad" trace: CLIENT spans reach traced services
    // (a cross-service child exists), and SERVER spans carry their own listener address.
    const hits: ServiceFlowHit[] = [
      hit({
        spanId: 'lg',
        serviceName: 'load-generator',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'http.url': 'http://frontend-proxy:8080/api/data' },
      }),
      hit({
        spanId: 'fp',
        parentSpanId: 'lg',
        serviceName: 'frontend-proxy',
        kind: 'SPAN_KIND_SERVER',
        attributes: { 'http.url': 'http://frontend-proxy:8080/api/data' },
      }),
      hit({
        spanId: 'fpc',
        parentSpanId: 'fp',
        serviceName: 'frontend-proxy',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'peer.address': '172.18.0.25:8080' },
      }),
      hit({ spanId: 'fe', parentSpanId: 'fpc', serviceName: 'frontend', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'fec',
        parentSpanId: 'fe',
        serviceName: 'frontend',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'net.peer.name': 'ad', 'net.peer.port': 9555 },
      }),
      hit({
        spanId: 'ad',
        parentSpanId: 'fec',
        serviceName: 'ad',
        kind: 'SPAN_KIND_SERVER',
        attributes: { 'server.address': '172.18.0.9', 'server.port': 9555 },
      }),
      hit({ spanId: 'adi', parentSpanId: 'ad', serviceName: 'ad', kind: 'SPAN_KIND_INTERNAL' }),
    ];
    const { nodes, edges } = spansToServiceFlow(hits).map.root;
    expect(nodes.map((n) => n.id).sort()).toEqual([
      'ad',
      'frontend',
      'frontend-proxy',
      'load-generator',
    ]);
    nodes.forEach((n) => {
      expect(n.data.dependencyType).toBeUndefined();
      expect(n.data.subtitle).toBeUndefined();
    });
    expect(edges.map((e) => e.id).sort()).toEqual([
      'frontend->ad',
      'frontend-proxy->frontend',
      'load-generator->frontend-proxy',
    ]);
  });

  it('adds typed database nodes named like the backend ({system}:{host} > {system})', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'c', serviceName: 'cart', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'h1',
        parentSpanId: 'c',
        serviceName: 'cart',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { db_system: 'redis', 'server.address': 'valkey-cart', 'server.port': 6379 },
      }),
      hit({
        spanId: 'h2',
        parentSpanId: 'c',
        serviceName: 'cart',
        kind: 'SPAN_KIND_CLIENT',
        status: { code: 2 },
        attributes: { db_system: 'redis', 'server.address': 'valkey-cart', 'server.port': 6379 },
      }),
      hit({ spanId: 'pc', serviceName: 'product-catalog', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'q',
        parentSpanId: 'pc',
        serviceName: 'product-catalog',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { db_system_name: 'postgresql', 'db.query.text': 'SELECT 1' },
      }),
    ];
    const { nodes, edges } = spansToServiceFlow(hits).map.root;
    const redis = nodes.find((n) => n.id === 'dep::database::redis:valkey-cart')!;
    expect(redis.data.title).toBe('redis:valkey-cart');
    expect(redis.data.dependencyType).toBe('database');
    expect(redis.data.subtitle).toBe('Database');
    expect(redis.data.hasError).toBe(true);
    expect(redis.data.errorLabel).toBe('1 error (50%)');
    expect(metric(redis, 'Requests').value).toBe(2);
    expect(nodes.find((n) => n.id === 'dep::database::postgresql')).toBeDefined();

    const redisEdge = edges.find((e) => e.target === 'dep::database::redis:valkey-cart')!;
    expect(redisEdge.source).toBe('cart');
    expect(redisEdge.data).toEqual({ volume: 2, maxVolume: 2, hasError: true, label: '2 calls' });
  });

  it('points producer edges at the broker and consumer edges from it', () => {
    const msg = { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' };
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'p', serviceName: 'checkout', kind: 'SPAN_KIND_PRODUCER', attributes: msg }),
      hit({ spanId: 'r', serviceName: 'accounting', kind: 'SPAN_KIND_CONSUMER', attributes: msg }),
    ];
    expect(nodeIds(hits)).toEqual(['accounting', 'checkout', 'dep::messaging::kafka:orders']);
    expect(edgesOf(hits)).toEqual([
      'checkout => dep::messaging::kafka:orders',
      'dep::messaging::kafka:orders => accounting',
    ]);
  });

  it('adds an external node only for leaf CLIENT calls to an untraced, named peer', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'w', serviceName: 'weather-agent', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'o',
        parentSpanId: 'w',
        serviceName: 'weather-agent',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'server.address': 'api.openai.com', 'server.port': 443 },
      }),
      // Raw-IP and unnamed peers are suppressed, as in the backend.
      hit({
        spanId: 'ip',
        parentSpanId: 'w',
        serviceName: 'weather-agent',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'server.address': '172.18.0.4', 'server.port': 8003 },
      }),
      hit({
        spanId: 'anon',
        parentSpanId: 'w',
        serviceName: 'weather-agent',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'http.method': 'GET' },
      }),
    ];
    expect(nodeIds(hits)).toEqual(['dep::external::api.openai.com', 'weather-agent']);
    expect(edgesOf(hits)).toEqual(['weather-agent => dep::external::api.openai.com']);
  });

  it('does not synthesize an external for a CLIENT whose same-service transport span reaches a service', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'fe', serviceName: 'frontend', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'sdk',
        parentSpanId: 'fe',
        serviceName: 'frontend',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'peer.service': 'cart' },
      }),
      hit({
        spanId: 'http',
        parentSpanId: 'sdk',
        serviceName: 'frontend',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'http.url': 'http://cart:7070/GetCart' },
      }),
      hit({ spanId: 'cart', parentSpanId: 'http', serviceName: 'cart', kind: 'SPAN_KIND_SERVER' }),
    ];
    expect(nodeIds(hits)).toEqual(['cart', 'frontend']);
    expect(edgesOf(hits)).toEqual(['frontend => cart']);
  });

  it('terminates on a parent cycle between same-service CLIENT spans', () => {
    // Corrupt/colliding span ids: sdk and http name each other as parent.
    const hits: ServiceFlowHit[] = [
      hit({
        spanId: 'sdk',
        parentSpanId: 'http',
        serviceName: 'frontend',
        kind: 'SPAN_KIND_CLIENT',
      }),
      hit({
        spanId: 'http',
        parentSpanId: 'sdk',
        serviceName: 'frontend',
        kind: 'SPAN_KIND_CLIENT',
      }),
      hit({ spanId: 'cart', parentSpanId: 'http', serviceName: 'cart', kind: 'SPAN_KIND_SERVER' }),
    ];
    expect(nodeIds(hits)).toEqual(['cart', 'frontend']);
  });

  it('counts an SDK CLIENT span over its same-service transport CLIENT span once', () => {
    const hits: ServiceFlowHit[] = [
      hit({ spanId: 'w', serviceName: 'weather-agent', kind: 'SPAN_KIND_SERVER' }),
      hit({
        spanId: 'sdk',
        parentSpanId: 'w',
        serviceName: 'weather-agent',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'server.address': 'api.openai.com', 'server.port': 443 },
      }),
      hit({
        spanId: 'http',
        parentSpanId: 'sdk',
        serviceName: 'weather-agent',
        kind: 'SPAN_KIND_CLIENT',
        attributes: { 'url.full': 'https://api.openai.com/v1/chat/completions' },
      }),
    ];
    const { nodes, edges } = spansToServiceFlow(hits).map.root;
    const openai = nodes.find((n) => n.id === 'dep::external::api.openai.com')!;
    expect(metric(openai, 'Requests').value).toBe(1);
    expect(edges.find((e) => e.target === openai.id)!.data.volume).toBe(1);
  });

  it('keeps edge endpoints intact when a name contains "->"', () => {
    const hits: ServiceFlowHit[] = [
      hit({
        spanId: 'p',
        serviceName: 'a->b',
        kind: 'SPAN_KIND_PRODUCER',
        attributes: { 'messaging.system': 'kafka', 'messaging.destination.name': 'x->y' },
      }),
    ];
    const { nodes, edges } = spansToServiceFlow(hits).map.root;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('a->b');
    expect(edges[0].target).toBe('dep::messaging::kafka:x->y');
    const ids = new Set(nodes.map((n) => n.id));
    expect(ids.has(edges[0].source)).toBe(true);
    expect(ids.has(edges[0].target)).toBe(true);
  });
});
