/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { interpolateLegendFormat } from './prom_legend';

describe('interpolateLegendFormat', () => {
  const metric = {
    __name__: 'http_requests_total',
    instance: 'node-1',
    job: 'api',
  };

  it('substitutes a single {{label}} token', () => {
    expect(interpolateLegendFormat('{{instance}}', metric)).toBe('node-1');
  });

  it('combines multiple tokens with literal text', () => {
    expect(interpolateLegendFormat('{{job}}-{{instance}}', metric)).toBe('api-node-1');
  });

  it('resolves {{__name__}} to the metric name', () => {
    expect(interpolateLegendFormat('{{__name__}}', metric)).toBe('http_requests_total');
  });

  it('tolerates surrounding whitespace in tokens', () => {
    expect(interpolateLegendFormat('{{ job }} / {{ instance }}', metric)).toBe('api / node-1');
  });

  it('resolves absent labels to an empty string', () => {
    expect(interpolateLegendFormat('{{missing}}', metric)).toBe('');
    expect(interpolateLegendFormat('{{job}}/{{missing}}', metric)).toBe('api/');
  });

  it('leaves text without tokens untouched', () => {
    expect(interpolateLegendFormat('static name', metric)).toBe('static name');
  });
});
