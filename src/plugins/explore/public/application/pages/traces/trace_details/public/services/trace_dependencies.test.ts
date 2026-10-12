/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildTraceDependencies } from './trace_dependencies';

const span = (
  spanId: string,
  serviceName: string,
  kind: string,
  parentSpanId = '',
  attributes: Record<string, unknown> = {}
) => ({ spanId, parentSpanId, serviceName, kind: `SPAN_KIND_${kind}`, attributes });

const names = (spans: Array<ReturnType<typeof span>>, options = {}) =>
  Object.fromEntries(
    Array.from(buildTraceDependencies(spans, options)).map(([id, dep]) => [id, dep.name])
  );

describe('buildTraceDependencies', () => {
  const traced = [
    span('f', 'frontend', 'SERVER'),
    span('call', 'frontend', 'CLIENT', 'f', { 'http.url': 'http://cart:8080/api/cart' }),
    span('c', 'cart', 'SERVER', 'call'),
  ];

  it('treats a CLIENT call answered by a SERVER span as a service edge', () => {
    expect(names(traced)).toEqual({});
  });

  it('classifies against the whole trace, so a filter cannot invent an external node', () => {
    // A serviceName=frontend filter leaves only frontend spans in view; the index built from
    // the unfiltered trace still knows the call reached cart.
    const index = buildTraceDependencies(traced);
    expect(index.has('call')).toBe(false);
    // Built from the filtered spans alone, the call would look external.
    expect(names(traced.filter((s) => s.serviceName === 'frontend'))).toEqual({
      call: 'cart:8080',
    });
  });

  it('treats a call answered by a SERVER span of the same service as a service edge', () => {
    expect(
      names([
        span('f', 'frontend', 'SERVER'),
        span('call', 'frontend', 'CLIENT', 'f', { 'http.url': 'http://frontend-proxy:8080/x' }),
        span('self', 'frontend', 'SERVER', 'call'),
      ])
    ).toEqual({});
  });

  it('follows same-service CLIENT spans to the SERVER span (SDK over transport)', () => {
    expect(
      names([
        span('sdk', 'frontend', 'CLIENT', '', { 'peer.service': 'billing' }),
        span('http', 'frontend', 'CLIENT', 'sdk', { 'http.url': 'http://billing:80/pay' }),
        span('b', 'billing', 'SERVER', 'http'),
      ])
    ).toEqual({});
  });

  it('infers no external dependency for a truncated trace, but keeps databases', () => {
    const spans = [
      span('f', 'frontend', 'SERVER'),
      span('ext', 'frontend', 'CLIENT', 'f', { 'server.address': 'api.openai.com' }),
      span('db', 'frontend', 'CLIENT', 'f', { db_system: 'redis', 'server.address': 'cache' }),
    ];
    expect(names(spans)).toEqual({ ext: 'api.openai.com', db: 'redis:cache' });
    expect(names(spans, { complete: false })).toEqual({ db: 'redis:cache' });
  });

  it('does not count the transport span of a publish or receive again', () => {
    const mq = { 'messaging.system': 'aws_sqs', 'messaging.destination.name': 'jobs' };
    expect(
      names([
        span('p', 'svc', 'PRODUCER', '', mq),
        span('p-http', 'svc', 'CLIENT', 'p', { 'http.url': 'https://sqs.amazonaws.com/q' }),
        span('r', 'worker', 'CONSUMER', 'p', { ...mq, 'messaging.operation': 'receive' }),
        span('r-http', 'worker', 'CLIENT', 'r', { 'http.url': 'https://sqs.amazonaws.com/q' }),
      ])
    ).toEqual({ p: 'aws_sqs:jobs', r: 'aws_sqs:jobs' });
  });

  it('keeps CLIENT calls under a CONSUMER that processes the message (business logic)', () => {
    const mq = { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' };
    expect(
      names([
        span('proc', 'accounting', 'CONSUMER', 'p', { ...mq, 'messaging.operation': 'Process' }),
        span('q', 'accounting', 'CLIENT', 'proc', {
          db_system: 'postgresql',
          'server.address': 'pg',
        }),
      ])
    ).toEqual({ proc: 'kafka:orders', q: 'postgresql:pg' });
  });

  it('counts a message once per consumer: no receive next to its process, no nested consumer', () => {
    const mq = { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders' };
    expect(
      names([
        span('p', 'checkout', 'PRODUCER', '', mq),
        span('recv', 'shipping', 'CONSUMER', 'p', { ...mq, 'messaging.operation': 'receive' }),
        // messaging.operation is read before messaging.operation.type, case-insensitively.
        span('proc', 'shipping', 'CONSUMER', 'p', {
          ...mq,
          'messaging.operation': 'PROCESS',
          'messaging.operation.type': 'receive',
        }),
        span('nested', 'shipping', 'CONSUMER', 'proc', mq),
      ])
    ).toEqual({ p: 'kafka:orders', proc: 'kafka:orders' });
  });
});
