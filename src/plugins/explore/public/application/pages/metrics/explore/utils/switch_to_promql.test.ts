/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { switchToPromQL } from './switch_to_promql';

describe('switchToPromQL', () => {
  const dataset = { id: 'my-dataset', title: 'My dataset', type: 'MY_DATASET_TYPE' };
  let current: Record<string, unknown>;
  const setUserQueryLanguage = jest.fn();
  const setQuery = jest.fn((query: Record<string, unknown>) => {
    current = { ...current, ...query };
  });
  const services = {
    data: {
      query: {
        queryString: {
          getQuery: () => current,
          setQuery,
          getLanguageService: () => ({ setUserQueryLanguage }),
        },
      },
    },
  } as any;
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    current = {
      query: 'SELECT AVG(cpu) FROM my_metrics',
      language: 'MY_SQL',
      dataset,
      queryOptions: { maxDataPoints: 10 },
    };
  });

  it("switches another language's query to PromQL on the same dataset", () => {
    switchToPromQL(services, dispatch, 'MY_SQL', 'avg(cpu)');

    expect(current).toEqual({
      query: 'avg(cpu)',
      language: 'PROMQL',
      dataset,
      queryOptions: undefined,
    });
    expect(setUserQueryLanguage).toHaveBeenCalledWith('PROMQL');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setQueryWithHistory'),
        payload: expect.objectContaining({ query: 'avg(cpu)', language: 'PROMQL', dataset }),
      })
    );
  });

  it('leaves a PromQL query alone', () => {
    switchToPromQL(services, dispatch, 'PROMQL', 'avg(cpu)');

    expect(setQuery).not.toHaveBeenCalled();
    expect(setUserQueryLanguage).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
