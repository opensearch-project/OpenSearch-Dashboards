/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readResultsCount } from './read_query_outcome';
import { ResultStatus, SearchData } from './use_search';

const searchData = (overrides: Partial<SearchData>): SearchData => ({
  status: ResultStatus.READY,
  ...overrides,
});

const rows = (count: number) => new Array(count).fill({}) as SearchData['rows'];

describe('readResultsCount', () => {
  it('uses the reported total when it exceeds the sampled rows', () => {
    expect(readResultsCount(searchData({ hits: 1204, rows: rows(500) }))).toBe(1204);
  });

  it('uses the fetched rows when they exceed the reported total', () => {
    expect(readResultsCount(searchData({ hits: 300, rows: rows(500) }))).toBe(500);
  });

  it('counts the fetched rows when the total is 0', () => {
    // PPL and SQL leave hits.total at 0 unless a histogram aggregation ran.
    expect(readResultsCount(searchData({ hits: 0, rows: rows(37) }))).toBe(37);
  });

  it('counts the fetched rows when there is no total at all', () => {
    expect(readResultsCount(searchData({ rows: rows(12) }))).toBe(12);
  });

  it('keeps the reported total when no rows came back', () => {
    expect(readResultsCount(searchData({ hits: 8, rows: [] }))).toBe(8);
  });

  it('keeps the reported total when there is no rows field', () => {
    expect(readResultsCount(searchData({ hits: 42 }))).toBe(42);
  });

  it('reports 0 when both sides are empty', () => {
    expect(readResultsCount(searchData({ hits: 0, rows: [] }))).toBe(0);
  });

  it('reports 0 for an empty total with no rows field', () => {
    expect(readResultsCount(searchData({ hits: 0 }))).toBe(0);
  });

  it('reports 0 for an empty row set with no total', () => {
    expect(readResultsCount(searchData({ rows: [] }))).toBe(0);
  });

  it('reports no count when neither is present', () => {
    expect(readResultsCount(searchData({}))).toBeUndefined();
  });
});
