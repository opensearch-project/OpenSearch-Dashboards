/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parsePromQL } from './promql_parser';

describe('parsePromQL', () => {
  it('returns canBuild=true for empty string', () => {
    const result = parsePromQL('');
    expect(result.canBuild).toBe(true);
    expect(result.state.metric).toBe('');
  });

  it('parses simple metric', () => {
    const result = parsePromQL('up');
    expect(result.canBuild).toBe(true);
    expect(result.state.metric).toBe('up');
    expect(result.state.operations).toHaveLength(0);
  });

  it('parses metric with label filters', () => {
    const result = parsePromQL('http_requests_total{job="api", status="200"}');
    expect(result.canBuild).toBe(true);
    expect(result.state.metric).toBe('http_requests_total');
    expect(result.state.labelFilters).toHaveLength(2);
    expect(result.state.labelFilters[0]).toMatchObject({ label: 'job', op: '=', value: 'api' });
    expect(result.state.labelFilters[1]).toMatchObject({
      label: 'status',
      op: '=',
      value: '200',
    });
  });

  it('parses rate with range', () => {
    const result = parsePromQL('rate(http_requests_total[5m])');
    expect(result.canBuild).toBe(true);
    expect(result.state.metric).toBe('http_requests_total');
    expect(result.state.operations).toHaveLength(1);
    expect(result.state.operations[0].id).toBe('rate');
  });

  it('parses aggregation', () => {
    const result = parsePromQL('sum(http_requests_total)');
    expect(result.canBuild).toBe(true);
    expect(result.state.operations).toHaveLength(1);
    expect(result.state.operations[0].id).toBe('sum');
  });

  it('parses aggregation with by clause', () => {
    const result = parsePromQL('sum by (job)(http_requests_total)');
    expect(result.canBuild).toBe(true);
    expect(result.state.operations[0].grouping).toEqual({ mode: 'by', labels: ['job'] });
  });

  it('parses aggregation with without clause', () => {
    const result = parsePromQL('avg without (instance)(up)');
    expect(result.canBuild).toBe(true);
    expect(result.state.operations[0].grouping).toEqual({
      mode: 'without',
      labels: ['instance'],
    });
  });

  it('parses chained operations', () => {
    const result = parsePromQL('sum by (job)(rate(http_requests_total[5m]))');
    expect(result.canBuild).toBe(true);
    expect(result.state.metric).toBe('http_requests_total');
    expect(result.state.operations).toHaveLength(2);
    expect(result.state.operations[0].id).toBe('rate');
    expect(result.state.operations[1].id).toBe('sum');
  });

  it('parses binary op with scalar', () => {
    const result = parsePromQL('http_requests_total * 100');
    expect(result.canBuild).toBe(true);
    expect(result.state.operations).toHaveLength(1);
    expect(result.state.operations[0].id).toBe('mul');
    expect(result.state.operations[0].params).toEqual(['100']);
  });

  it('returns canBuild=false for binary op between two vector selectors with labels', () => {
    const result = parsePromQL('http_requests_total{job="api"} / http_errors_total{job="api"}');
    expect(result.canBuild).toBe(false);
  });

  it('parses topk', () => {
    const result = parsePromQL('topk(5, http_requests_total)');
    expect(result.canBuild).toBe(true);
    expect(result.state.operations[0].id).toBe('topk');
    expect(result.state.operations[0].params).toEqual(['5']);
  });

  it('parses regex label matcher', () => {
    const result = parsePromQL('up{job=~"api.*"}');
    expect(result.canBuild).toBe(true);
    expect(result.state.labelFilters[0]).toMatchObject({ label: 'job', op: '=~', value: 'api.*' });
  });

  it('parses standalone range vector', () => {
    const result = parsePromQL('http_requests_total[5m]');
    expect(result.canBuild).toBe(true);
    expect(result.state.range).toBe('5m');
  });

  it('caches results', () => {
    const r1 = parsePromQL('up');
    const r2 = parsePromQL('up');
    expect(r1).toBe(r2);
  });

  it('returns canBuild=false for bare number literal', () => {
    const result = parsePromQL('123');
    expect(result.canBuild).toBe(false);
  });

  it('returns canBuild=false for syntax errors', () => {
    const result = parsePromQL('sum(');
    expect(result.canBuild).toBe(false);
  });
});
