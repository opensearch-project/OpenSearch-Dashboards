/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readQueryOutcome, readResultsCount } from './read_query_outcome';
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

describe('readQueryOutcome', () => {
  describe('result count', () => {
    it('uses hits.total when the strategy reports one', () => {
      expect(readQueryOutcome(searchData({ hits: 1204, rows: rows(500) }))).toMatchObject({
        resultsCount: 1204,
      });
    });

    it('falls back to the fetched rows when hits.total is 0', () => {
      // PPL and SQL leave hits.total at 0 unless a histogram aggregation ran.
      expect(readQueryOutcome(searchData({ hits: 0, rows: rows(37) }))).toMatchObject({
        resultsCount: 37,
      });
    });

    it('falls back to the fetched rows when hits.total is absent', () => {
      expect(readQueryOutcome(searchData({ rows: rows(12) }))).toMatchObject({
        resultsCount: 12,
      });
    });

    it('reports zero when nothing came back at all', () => {
      expect(readQueryOutcome(searchData({ hits: 0, rows: [] }))).toMatchObject({
        resultsCount: 0,
      });
    });

    it('reports zero for a settled result with no rows field at all', () => {
      expect(readQueryOutcome(searchData({ hits: 0 }))).toMatchObject({ resultsCount: 0 });
    });

    it.each([[ResultStatus.LOADING], [ResultStatus.UNINITIALIZED], [ResultStatus.ERROR]])(
      'omits the count while the status is %s',
      (status) => {
        expect(readQueryOutcome(searchData({ status }))).not.toHaveProperty('resultsCount');
      }
    );

    it.each([[ResultStatus.LOADING], [ResultStatus.UNINITIALIZED], [ResultStatus.ERROR]])(
      'does not report rows left over from the previous fetch while %s',
      (status) => {
        // use_search spreads the previous value when it only flips status, so
        // the last fetch's rows can outlive the result they belong to.
        expect(
          readQueryOutcome(searchData({ status, hits: 12, rows: rows(37) }))
        ).not.toHaveProperty('resultsCount');
      }
    );

    it('reports no count for a query that never parsed', () => {
      expect(
        readQueryOutcome(
          searchData({ status: ResultStatus.NO_RESULTS, actualError: 'parse failed', rows: [] })
        )
      ).not.toHaveProperty('resultsCount');
    });
  });

  describe('status and error', () => {
    it('passes a plain status through', () => {
      expect(readQueryOutcome(searchData({ status: ResultStatus.LOADING })).status).toBe(
        ResultStatus.LOADING
      );
    });

    it('extracts the reason on error', () => {
      const outcome = readQueryOutcome(
        searchData({
          status: ResultStatus.ERROR,
          queryStatus: {
            body: { error: { message: { error: { reason: 'bad field', details: '' } } } },
          },
        })
      );

      expect(outcome).toMatchObject({ status: ResultStatus.ERROR, error: 'bad field' });
    });

    it('normalises a parse failure reported as no results into an error', () => {
      const outcome = readQueryOutcome(
        searchData({ status: ResultStatus.NO_RESULTS, actualError: 'parse failed', rows: [] })
      );

      expect(outcome).toMatchObject({ status: ResultStatus.ERROR, error: 'parse failed' });
    });

    it('leaves a genuine empty result alone', () => {
      const outcome = readQueryOutcome(
        searchData({ status: ResultStatus.NO_RESULTS, hits: 0, rows: [] })
      );

      expect(outcome).toMatchObject({ status: ResultStatus.NO_RESULTS, resultsCount: 0 });
      expect(outcome).not.toHaveProperty('error');
    });

    it('reports no error for a successful search', () => {
      expect(readQueryOutcome(searchData({ hits: 5, rows: rows(5) }))).not.toHaveProperty('error');
    });
  });
});
