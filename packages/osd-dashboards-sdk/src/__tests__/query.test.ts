/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../builders/query';

describe('Query Builder', () => {
  it('should create a PPL query', () => {
    const q = Query.ppl('source = metrics | stats avg(cpu) by host');
    const def = q.build();

    expect(def.language).toBe('PPL');
    expect(def.query).toBe('source = metrics | stats avg(cpu) by host');
  });

  it('should create a DQL query', () => {
    const q = Query.dql('cpu.usage > 80');
    const def = q.build();

    expect(def.language).toBe('DQL');
    expect(def.query).toBe('cpu.usage > 80');
  });

  it('should create a SQL query', () => {
    const q = Query.sql('SELECT avg(cpu) FROM metrics GROUP BY host');
    const def = q.build();

    expect(def.language).toBe('SQL');
    expect(def.query).toBe('SELECT avg(cpu) FROM metrics GROUP BY host');
  });

  it('should create a Lucene query', () => {
    const q = Query.lucene('status:200 AND response_time:>1000');
    const def = q.build();

    expect(def.language).toBe('Lucene');
    expect(def.query).toBe('status:200 AND response_time:>1000');
  });

  it('should reject empty query string for PPL', () => {
    expect(() => Query.ppl('')).toThrow('Query string must not be empty');
  });

  it('should reject empty query string for DQL', () => {
    expect(() => Query.dql('')).toThrow('Query string must not be empty');
  });

  it('should reject empty query string for SQL', () => {
    expect(() => Query.sql('')).toThrow('Query string must not be empty');
  });

  it('should reject empty query string for Lucene', () => {
    expect(() => Query.lucene('')).toThrow('Query string must not be empty');
  });

  it('should reject whitespace-only query string', () => {
    expect(() => Query.ppl('   ')).toThrow('Query string must not be empty');
  });

  it('should return independent copies on build', () => {
    const q = Query.ppl('source = logs');
    const def1 = q.build();
    const def2 = q.build();

    def1.query = 'modified';
    expect(def2.query).toBe('source = logs');
  });
});
