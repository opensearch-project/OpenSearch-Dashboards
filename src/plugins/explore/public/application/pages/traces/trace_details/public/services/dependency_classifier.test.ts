/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  classifySpanDependency,
  classifyDependencyByAttributes,
  dependencyIconType,
  dependencyTypeLabel,
  getSpanAttr,
  normalizeSpanKind,
  resolveExternalName,
} from './dependency_classifier';

const span = (attributes: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
  spanId: 's1',
  kind: 'SPAN_KIND_CLIENT',
  attributes,
  ...over,
});

describe('getSpanAttr', () => {
  it('reads flat dotted keys, nested objects, _source and flattened hit keys', () => {
    expect(getSpanAttr(span({ 'db.system': 'redis' }), 'db.system')).toBe('redis');
    expect(getSpanAttr(span({ db: { system: { name: 'postgresql' } } }), 'db.system.name')).toBe(
      'postgresql'
    );
    expect(getSpanAttr({ _source: { attributes: { 'server.port': 443 } } }, 'server.port')).toBe(
      443
    );
    expect(getSpanAttr({ 'attributes.peer.service': 'billing' }, 'peer.service')).toBe('billing');
  });

  it('resolves partially nested keys', () => {
    expect(
      getSpanAttr(
        span({ messaging: { 'destination.name': 'orders' } }),
        'messaging.destination.name'
      )
    ).toBe('orders');
    expect(getSpanAttr(span({ 'server.address': 'valkey-cart' }), 'server.address')).toBe(
      'valkey-cart'
    );
  });

  it('never returns an intermediate object for a prefix key', () => {
    // "messaging.destination" is only an object here (it has .name / .partition.id children).
    const s = span({ messaging: { destination: { name: 'orders', partition: { id: '0' } } } });
    expect(getSpanAttr(s, 'messaging.destination')).toBeUndefined();
    expect(getSpanAttr(s, 'messaging.destination.name')).toBe('orders');
  });

  it('returns undefined for missing spans and keys', () => {
    expect(getSpanAttr(undefined, 'db.system')).toBeUndefined();
    expect(getSpanAttr(span({}), 'db.system')).toBeUndefined();
    expect(getSpanAttr({}, 'db.system')).toBeUndefined();
  });
});

describe('normalizeSpanKind', () => {
  it.each([
    ['SPAN_KIND_CLIENT', 'CLIENT'],
    ['client', 'CLIENT'],
    ['CONSUMER', 'CONSUMER'],
    [undefined, ''],
  ])('%s -> %s', (kind, expected) => {
    expect(normalizeSpanKind(kind)).toBe(expected);
  });
});

describe('classifyDependencyByAttributes', () => {
  it('names a messaging dependency {system}:{destination}', () => {
    expect(
      classifyDependencyByAttributes(
        span(
          { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' },
          { kind: 'SPAN_KIND_PRODUCER' }
        )
      )
    ).toMatchObject({ type: 'messaging', name: 'kafka:orders', system: 'kafka' });
    // Legacy pre-1.17 destination key.
    expect(
      classifyDependencyByAttributes(
        span({ 'messaging.system': 'rabbitmq', 'messaging.destination': 'jobs' })
      )?.name
    ).toBe('rabbitmq:jobs');
  });

  it('names a database {system}:{host} when the host is a name (OTel demo cart -> valkey)', () => {
    expect(
      classifyDependencyByAttributes(
        span({
          db_system: 'redis',
          'server.address': 'valkey-cart',
          'server.port': 6379,
          'db.statement': 'HGET x',
        })
      )
    ).toMatchObject({ type: 'database', name: 'redis:valkey-cart', system: 'redis' });
    // product-reviews: legacy net.peer.name + db.name; host wins over namespace.
    expect(
      classifyDependencyByAttributes(
        span({
          db_system: 'postgresql',
          'net.peer.name': 'postgresql',
          'net.peer.port': 5432,
          'db.name': 'otel',
        })
      )?.name
    ).toBe('postgresql:postgresql');
  });

  it('falls back to {system}:{namespace}, then {system}', () => {
    expect(
      classifyDependencyByAttributes(span({ 'db.system.name': 'mysql', 'db.namespace': 'shop' }))
        ?.name
    ).toBe('mysql:shop');
    // product-catalog: flattened db_system_name only.
    expect(
      classifyDependencyByAttributes(
        span({ db_system_name: 'postgresql', 'db.query.text': 'SELECT 1' })
      )
    ).toMatchObject({ type: 'database', name: 'postgresql', system: 'postgresql' });
  });

  it('does not name a database after an IP-literal, loopback or per-instance host', () => {
    ['10.0.0.5', '::1', '[::1]', 'localhost', 'ip-10-0-0-5.ec2.internal'].forEach((host) => {
      expect(
        classifyDependencyByAttributes(span({ 'db.system': 'redis', 'server.address': host }))?.name
      ).toBe('redis');
    });
  });

  it('names a system-less database by host[:port], namespace, else "database"', () => {
    expect(
      classifyDependencyByAttributes(
        span({ 'db.statement': 'SELECT 1', 'server.address': 'db1', 'server.port': 5432 })
      )
    ).toMatchObject({ type: 'database', name: 'db1:5432', system: undefined });
    expect(
      classifyDependencyByAttributes(span({ 'db.statement': 'SELECT 1', 'db.name': 'otel' }))?.name
    ).toBe('otel');
    expect(
      classifyDependencyByAttributes(
        span({ 'db.statement': 'SELECT 1', 'server.address': '172.18.0.4' })
      )?.name
    ).toBe('database');
  });

  it('prefers a caller-assigned peer.service name for a database', () => {
    expect(
      classifyDependencyByAttributes(
        span({ 'db.system': 'postgresql', 'server.address': 'pg-1', 'peer.service': 'orders-db' })
      )?.name
    ).toBe('orders-db');
  });

  it('applies the backend publishability rule to a database peer.service', () => {
    const name = (peer: string) =>
      classifyDependencyByAttributes(
        span({ 'db.system': 'postgresql', 'server.address': 'pg-1', 'peer.service': peer })
      );
    // Kept as-is, port included (the backend only drops default ports for externals).
    expect(name('orders-db:5432')?.name).toBe('orders-db:5432');
    // IP-literal / loopback peers name no node at all.
    ['10.0.0.5', '10.0.0.5:5432', 'localhost:5432', '[::1]', '::1'].forEach((peer) =>
      expect(name(peer)).toBeNull()
    );
  });

  it('keeps the system casing in the name (as the backend does) and lowercases `system`', () => {
    expect(
      classifyDependencyByAttributes(span({ 'db.system': 'PostgreSQL', 'server.address': 'pg-1' }))
    ).toMatchObject({ type: 'database', name: 'PostgreSQL:pg-1', system: 'postgresql' });
  });

  it('does not fall through to a later host key when the first one is an IP (backend parity)', () => {
    expect(
      classifyDependencyByAttributes(
        span({
          db_system: 'postgresql',
          'server.address': '172.18.0.4',
          'net.peer.name': 'postgresql',
          'db.name': 'otel',
        })
      )?.name
    ).toBe('postgresql:otel');
  });

  it('returns null for spans with no db/messaging signal', () => {
    expect(classifyDependencyByAttributes(span({ 'http.url': 'http://x/y' }))).toBeNull();
    expect(classifyDependencyByAttributes(span({}))).toBeNull();
    expect(classifyDependencyByAttributes({ spanId: 'x' })).toBeNull();
  });
});

describe('resolveExternalName', () => {
  it('prefers peer.service, then the address/port pairs, then the url host (backend order)', () => {
    expect(
      resolveExternalName(span({ 'peer.service': 'billing', 'url.full': 'https://a.com/x' }))
    ).toBe('billing');
    expect(resolveExternalName(span({ 'url.full': 'https://api.example.com:8443/v1' }))).toBe(
      'api.example.com:8443'
    );
    expect(resolveExternalName(span({ 'server.address': 'svc', 'server.port': 9000 }))).toBe(
      'svc:9000'
    );
    // The address wins over the URL, as in the backend.
    expect(
      resolveExternalName(
        span({ 'server.address': 'gateway', 'url.full': 'https://api.example.com/v1' })
      )
    ).toBe('gateway');
    // Every address/port pair the backend reads, in its order.
    expect(
      resolveExternalName(span({ 'network.peer.address': 'mesh', 'network.peer.port': 81 }))
    ).toBe('mesh:81');
    expect(resolveExternalName(span({ 'net.sock.peer.addr': 'sock-peer' }))).toBe('sock-peer');
  });

  it('names AWS SDK, GraphQL and FaaS calls like the backend', () => {
    expect(
      resolveExternalName(
        span({ 'rpc.system': 'aws-api', 'rpc.service': 'S3', 'server.address': 's3.amazonaws.com' })
      )
    ).toBe('AWS::S3');
    expect(resolveExternalName(span({ 'rpc.system': 'aws-api', 'rpc.service': 'Lambda' }))).toBe(
      'AWS::Lambda'
    );
    expect(resolveExternalName(span({ 'graphql.operation.type': 'query' }))).toBe('graphql');
    expect(resolveExternalName(span({ 'faas.invoked_name': 'resize-image' }))).toBe('resize-image');
    // A non-AWS RPC falls back to the network peer.
    expect(
      resolveExternalName(
        span({ 'rpc.system': 'grpc', 'rpc.service': 'Cart', 'server.address': 'cart-svc' })
      )
    ).toBe('cart-svc');
  });

  it('drops scheme-default ports (api.openai.com, not api.openai.com:443)', () => {
    expect(
      resolveExternalName(span({ 'server.address': 'api.openai.com', 'server.port': 443 }))
    ).toBe('api.openai.com');
    expect(resolveExternalName(span({ 'net.peer.name': 'example.org', 'net.peer.port': 80 }))).toBe(
      'example.org'
    );
    expect(resolveExternalName(span({ 'http.url': 'https://api.openai.com:443/v1/chat' }))).toBe(
      'api.openai.com'
    );
    expect(resolveExternalName(span({ 'peer.service': 'api.openai.com:443' }))).toBe(
      'api.openai.com'
    );
  });

  it('suppresses raw-IP, loopback and per-instance peers', () => {
    [
      { 'server.address': '172.18.0.25', 'server.port': 8080 },
      { 'url.full': 'http://10.0.0.1:9000/x' },
      { 'url.full': 'http://[::1]:3500/x' },
      { 'server.address': '2001:db8::1' },
      { 'server.address': 'localhost', 'server.port': 3500 },
      { 'url.full': 'http://localhost:3500/v1.0/invoke' },
      { 'server.address': 'ip-10-0-0-5.ec2.internal' },
      { 'server.address': 'ec2-1-2-3-4.compute-1.amazonaws.com' },
      { 'server.address': '10-0-0-5.default.pod.cluster.local' },
      { 'peer.service': '10.1.2.3:443' },
    ].forEach((attrs) => expect(resolveExternalName(span(attrs))).toBeNull());
  });

  it('returns null when nothing names the peer (no "external" placeholder node)', () => {
    expect(resolveExternalName(span({ 'http.method': 'GET' }))).toBeNull();
    expect(resolveExternalName(span({}))).toBeNull();
    expect(resolveExternalName(span({ 'url.full': 'not a url' }))).toBeNull();
  });
});

describe('dependencyIconType / dependencyTypeLabel', () => {
  it('maps categories and search-engine systems to EUI glyphs', () => {
    expect(dependencyIconType('database', 'postgresql')).toBe('database');
    expect(dependencyIconType('database', 'OpenSearch')).toBe('search');
    expect(dependencyIconType('database', 'elasticsearch')).toBe('search');
    expect(dependencyIconType('messaging', 'kafka')).toBe('logstashQueue');
    expect(dependencyIconType('external')).toBe('globe');
  });

  it('labels each dependency type', () => {
    expect(dependencyTypeLabel('database')).toBe('Database');
    expect(dependencyTypeLabel('messaging')).toBe('Messaging');
    expect(dependencyTypeLabel('external')).toBe('External');
  });
});

describe('classifySpanDependency (backend naming specification)', () => {
  const NOT_REACHING = { reachesTracedService: false };

  it('names dependencies only from CLIENT, PRODUCER and CONSUMER spans', () => {
    const db = { db_system: 'redis', 'server.address': 'valkey-cart' };
    expect(classifySpanDependency(span(db), NOT_REACHING)?.name).toBe('redis:valkey-cart');
    ['SPAN_KIND_SERVER', 'SPAN_KIND_INTERNAL', 'INTERNAL', undefined].forEach((kind) =>
      expect(classifySpanDependency(span(db, { kind }), NOT_REACHING)).toBeNull()
    );
  });

  it('lets PRODUCER / CONSUMER spans name brokers only', () => {
    const mq = { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' };
    expect(
      classifySpanDependency(span(mq, { kind: 'SPAN_KIND_CONSUMER' }), NOT_REACHING)?.name
    ).toBe('kafka:orders');
    expect(
      classifySpanDependency(
        span({ 'server.address': 'api.openai.com' }, { kind: 'SPAN_KIND_PRODUCER' }),
        NOT_REACHING
      )
    ).toBeNull();
  });

  it('names no broker without a destination (metadata fetch, ack)', () => {
    expect(classifyDependencyByAttributes(span({ 'messaging.system': 'kafka' }))).toBeNull();
    expect(
      classifySpanDependency(
        span({ 'messaging.system': 'kafka' }, { kind: 'SPAN_KIND_PRODUCER' }),
        NOT_REACHING
      )
    ).toBeNull();
  });

  it('names an AWS SDK database call after the service, unless peer.service is set', () => {
    const dynamo = {
      'db.system': 'dynamodb',
      'rpc.system': 'aws-api',
      'rpc.service': 'DynamoDBv2',
      'server.address': 'dynamodb.us-east-1.amazonaws.com',
    };
    expect(classifySpanDependency(span(dynamo), NOT_REACHING)?.name).toBe('AWS::DynamoDB');
    expect(
      classifySpanDependency(span({ ...dynamo, 'peer.service': 'orders-table' }), NOT_REACHING)
        ?.name
    ).toBe('orders-table');
  });

  it('is not a dependency when a CLIENT call reaches a traced service', () => {
    expect(
      classifySpanDependency(span({ db_system: 'redis', 'server.address': 'proxy' }), {
        reachesTracedService: true,
      })
    ).toBeNull();
    // Messaging spans are not CLIENT calls, so the rule does not apply to them.
    expect(
      classifySpanDependency(
        span(
          { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' },
          { kind: 'SPAN_KIND_PRODUCER' }
        ),
        { reachesTracedService: true }
      )?.name
    ).toBe('kafka:orders');
  });

  it('suppresses an external peer named like a service traced in the trace', () => {
    const known = new Set(['checkout']);
    const ctx = { reachesTracedService: false, knownServerServices: known };
    expect(classifySpanDependency(span({ 'peer.service': 'Checkout' }), ctx)).toBeNull();
    expect(
      classifySpanDependency(span({ 'server.address': 'checkout', 'server.port': 8080 }), ctx)
    ).toBeNull();
    // Kubernetes service DNS of a traced service.
    expect(
      classifySpanDependency(span({ 'server.address': 'checkout.shop.svc.cluster.local' }), ctx)
    ).toBeNull();
    expect(classifySpanDependency(span({ 'server.address': 'api.openai.com' }), ctx)?.name).toBe(
      'api.openai.com'
    );
  });

  it('needs an external signal key before naming an external peer', () => {
    // network.peer.address alone is not an external signal (backend computeNodeType).
    expect(
      classifySpanDependency(span({ 'network.peer.address': 'mesh' }), NOT_REACHING)
    ).toBeNull();
    expect(
      classifySpanDependency(
        span({ 'http.request.method': 'GET', 'network.peer.address': 'mesh' }),
        NOT_REACHING
      )?.name
    ).toBe('mesh');
  });

  it('reports the attribute that identifies the dependency, to filter its spans', () => {
    const filterOf = (attrs: Record<string, unknown>, kind?: string) =>
      classifySpanDependency(span(attrs, kind ? { kind } : {}), NOT_REACHING)?.filter;
    expect(filterOf({ db_system: 'redis', 'server.address': 'valkey-cart' })).toEqual({
      key: 'server.address',
      value: 'valkey-cart',
    });
    expect(filterOf({ 'db.system.name': 'postgresql', 'db.namespace': 'otel' })).toEqual({
      key: 'db.namespace',
      value: 'otel',
    });
    expect(filterOf({ db_system_name: 'postgresql' })).toEqual({
      key: 'db_system_name',
      value: 'postgresql',
    });
    expect(
      filterOf(
        { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' },
        'SPAN_KIND_PRODUCER'
      )
    ).toEqual({ key: 'messaging.destination.name', value: 'orders' });
    expect(filterOf({ 'url.full': 'https://api.openai.com/v1', 'peer.service': 'openai' })).toEqual(
      { key: 'peer.service', value: 'openai' }
    );
    // Named from the URL only: no single attribute holds the name.
    expect(filterOf({ 'url.full': 'https://api.openai.com/v1' })).toBeUndefined();
  });
});
