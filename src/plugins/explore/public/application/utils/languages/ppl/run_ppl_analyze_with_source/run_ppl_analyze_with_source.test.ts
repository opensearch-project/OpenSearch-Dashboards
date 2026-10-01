/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runPPLAnalyzeWithSource } from './run_ppl_analyze_with_source';
import { runPPLAnalyzeInBackground } from '../../../../../../../data/public';

jest.mock('../../../../../../../data/public', () => ({
  runPPLAnalyzeInBackground: jest.fn(),
}));

const mockRunPPLAnalyze = runPPLAnalyzeInBackground as jest.MockedFunction<
  typeof runPPLAnalyzeInBackground
>;

describe('runPPLAnalyzeWithSource', () => {
  const http = { fetch: jest.fn() } as any;
  const timefilter = { getTime: jest.fn() } as any;
  const indexPatternDataset = {
    id: '123',
    title: 'logs-*',
    type: 'INDEX_PATTERN',
    timeFieldName: '@timestamp',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const analyzedQuery = () => mockRunPPLAnalyze.mock.calls[0][0].query;

  it('adds the dataset source to a query that starts with a pipe', () => {
    runPPLAnalyzeWithSource({
      query: {
        query: '| where severityText = "ERROR"',
        language: 'PPL',
        dataset: indexPatternDataset,
      },
      http,
      timefilter,
    });

    expect(analyzedQuery().query).toBe('source = `logs-*` | where severityText = "ERROR"');
  });

  it('adds the dataset source to an empty query, matching what Run executes', () => {
    runPPLAnalyzeWithSource({
      query: { query: '', language: 'PPL', dataset: indexPatternDataset },
      http,
      timefilter,
    });

    expect(analyzedQuery().query).toBe('source = `logs-*`');
  });

  it('keeps an explicit source clause', () => {
    runPPLAnalyzeWithSource({
      query: {
        query: 'source = other-index | head 10',
        language: 'PPL',
        dataset: { id: '1', title: 'logs', type: 'INDEX' },
      },
      http,
      timefilter,
    });

    expect(analyzedQuery().query).toBe('source = other-index | head 10');
  });

  it('keeps the rest of the query object, including the dataset', () => {
    runPPLAnalyzeWithSource({
      query: { query: '| head 5', language: 'PPL', dataset: indexPatternDataset },
      http,
      timefilter,
    });

    expect(analyzedQuery()).toEqual(
      expect.objectContaining({ language: 'PPL', dataset: indexPatternDataset })
    );
  });

  it('passes the query through unchanged when there is no dataset', () => {
    const query = { query: '| where a = 1', language: 'PPL' };

    runPPLAnalyzeWithSource({ query, http, timefilter });

    expect(analyzedQuery()).toBe(query);
  });

  it('passes non-PPL queries through unchanged', () => {
    const query = { query: 'SELECT * FROM logs', language: 'SQL', dataset: indexPatternDataset };

    runPPLAnalyzeWithSource({ query, http, timefilter });

    expect(analyzedQuery()).toBe(query);
  });

  it('sends a parseable query with the time filter to the analyze endpoint', () => {
    // Run the real helper once so the assertion is on the request body the backend sees.
    const { runPPLAnalyzeInBackground: realRunPPLAnalyze } = jest.requireActual(
      '../../../../../../../data/public/ui/ppl_analyze/run_ppl_analyze'
    );
    mockRunPPLAnalyze.mockImplementationOnce(realRunPPLAnalyze);
    const fetch = jest.fn(() => new Promise(() => {}));
    timefilter.getTime.mockReturnValue({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-01T00:15:00.000Z',
    });

    runPPLAnalyzeWithSource({
      query: {
        query: '| where severityText = "ERROR"',
        language: 'PPL',
        dataset: indexPatternDataset,
      },
      http: { fetch } as any,
      timefilter,
    });

    const { query } = JSON.parse((fetch.mock.calls[0] as any)[0].body);
    expect(query).toBe(
      "source = `logs-*` | WHERE `@timestamp` >= '2026-01-01 00:00:00.000' AND " +
        '`@timestamp` <= \'2026-01-01 00:15:00.000\' | where severityText = "ERROR"'
    );
  });

  it('forwards http, timefilter and onlyIfOpen', () => {
    runPPLAnalyzeWithSource({
      query: { query: '| head 1', language: 'PPL', dataset: indexPatternDataset },
      http,
      timefilter,
      onlyIfOpen: true,
    });

    expect(mockRunPPLAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({ http, timefilter, onlyIfOpen: true })
    );
  });
});
