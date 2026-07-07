/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';

// Mock use_search to avoid pulling in its heavy dependency graph. Only the
// ResultStatus enum is used at runtime by the action module; the rest are
// type-only imports and are erased at compile time.
jest.mock('../utils/use_search', () => ({
  ResultStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
}));

import {
  EXECUTE_QUERY_TOOL_DEFINITION,
  registerDisabledExecuteQueryAction,
  useExecuteQueryAction,
} from './execute_query_action';

const READY = 'ready';
const NO_RESULTS = 'none';
const ERROR = 'error';

interface Harness {
  registered: any[];
  registerAssistantAction: jest.Mock;
  setQuery: jest.Mock;
  setTime: jest.Mock;
  data$: BehaviorSubject<any>;
  refetch$: Subject<any>;
  queryComplete$: Subject<any>;
  refetchSpy: jest.SpyInstance;
  unmount: () => void;
}

const CURRENT_QUERY = { query: 'old query', language: 'kuery', dataset: { id: 'logs-*' } };

function setup(options: { withContextProvider?: boolean } = {}): Harness {
  const { withContextProvider = true } = options;
  const registered: any[] = [];
  const registerAssistantAction = jest.fn((action: any) => registered.push(action));
  const setQuery = jest.fn();
  const setTime = jest.fn();
  const getQuery = jest.fn(() => CURRENT_QUERY);

  const services: any = {
    contextProvider: withContextProvider
      ? { actions: { registerAssistantAction, unregisterAssistantAction: jest.fn() } }
      : undefined,
    data: {
      query: {
        queryString: { getQuery, setQuery },
        timefilter: { timefilter: { setTime } },
      },
    },
  };

  const data$ = new BehaviorSubject<any>({ status: 'uninitialized' });
  const refetch$ = new Subject<any>();
  const queryComplete$ = new Subject<any>();
  const refetchSpy = jest.spyOn(refetch$, 'next');

  const HarnessComponent = () => {
    useExecuteQueryAction(services, data$, refetch$, queryComplete$);
    return null;
  };

  const { unmount } = render(<HarnessComponent />);

  return {
    registered,
    registerAssistantAction,
    setQuery,
    setTime,
    data$,
    refetch$,
    queryComplete$,
    refetchSpy,
    unmount,
  };
}

// The real (enabled) action is the one registered without `available: 'disabled'`.
const getRealAction = (registered: any[]) => registered.find((a) => a.available !== 'disabled');

describe('EXECUTE_QUERY_TOOL_DEFINITION', () => {
  it('exposes the expected tool name and required params', () => {
    expect(EXECUTE_QUERY_TOOL_DEFINITION.name).toBe('execute_dsl_ppl_query');
    expect(EXECUTE_QUERY_TOOL_DEFINITION.parameters.required).toEqual(['query']);
  });

  it('declares query, language, from and to parameters', () => {
    const props = EXECUTE_QUERY_TOOL_DEFINITION.parameters.properties;
    expect(Object.keys(props)).toEqual(expect.arrayContaining(['query', 'language', 'from', 'to']));
  });
});

describe('registerDisabledExecuteQueryAction', () => {
  it('does nothing when registerAction is undefined', () => {
    expect(() => registerDisabledExecuteQueryAction(undefined as any)).not.toThrow();
  });

  it('registers a disabled action whose handler signals context loss', async () => {
    const registerAction = jest.fn();
    registerDisabledExecuteQueryAction(registerAction);

    expect(registerAction).toHaveBeenCalledTimes(1);
    const action = registerAction.mock.calls[0][0];
    expect(action.name).toBe('execute_dsl_ppl_query');
    expect(action.available).toBe('disabled');

    const result = await action.handler();
    expect(result.success).toBe(false);
    expect(result.stop_tool_execution).toBe(true);
    expect(result.context_lost).toBe(true);
  });
});

describe('useExecuteQueryAction', () => {
  afterEach(() => jest.clearAllMocks());

  it('does not register anything when the contextProvider is unavailable', () => {
    const { registerAssistantAction } = setup({ withContextProvider: false });
    expect(registerAssistantAction).not.toHaveBeenCalled();
  });

  it('registers an enabled action on mount', () => {
    const { registered } = setup();
    const real = getRealAction(registered);
    expect(real).toBeDefined();
    expect(real.name).toBe('execute_dsl_ppl_query');
    expect(typeof real.handler).toBe('function');
  });

  it('restores the disabled action on unmount', () => {
    const { registered, unmount } = setup();
    unmount();
    const last = registered[registered.length - 1];
    expect(last.available).toBe('disabled');
  });

  it('sets query + time range, forces a refetch, and reports success on READY', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'response >= 400', from: 'now-1h', to: 'now' });

    // Handler subscribes synchronously before awaiting, so we can emit now.
    expect(h.setTime).toHaveBeenCalledWith({ from: 'now-1h', to: 'now' });
    expect(h.setQuery).toHaveBeenCalledWith({
      ...CURRENT_QUERY,
      query: 'response >= 400',
      language: 'kuery',
    });
    expect(h.refetchSpy).toHaveBeenCalled();

    h.queryComplete$.next({
      data: { status: READY },
      query: { query: 'response >= 400', language: 'kuery' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.executed).toBe(true);
    expect(result.language).toBe('kuery');
    expect(result.message).toContain('Time range set to now-1h - now');
  });

  it('uses the language provided in args when switching languages', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'source=logs', language: 'PPL' });

    expect(h.setQuery).toHaveBeenCalledWith({
      ...CURRENT_QUERY,
      query: 'source=logs',
      language: 'PPL',
    });

    h.queryComplete$.next({
      data: { status: READY },
      query: { query: 'source=logs', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.language).toBe('PPL');
  });

  it('reports failure with the reason when the query errors', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'bad', language: 'PPL' });
    h.queryComplete$.next({
      data: {
        status: ERROR,
        queryStatus: { body: { error: { message: { error: { reason: 'boom reason' } } } } },
      },
      query: { query: 'bad', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('boom reason');
    expect(result.message).toContain('boom reason');
  });

  it('treats a NO_RESULTS with actualError (DQL/Lucene) as a failure', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: '(response: 400', language: 'kuery' });
    h.queryComplete$.next({
      data: { status: NO_RESULTS },
      query: { query: '(response: 400', language: 'kuery' },
      actualError: 'Expected ")" but end of input found.',
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Expected ")" but end of input found.');
  });

  it('reports a genuine empty result set as success with zero results', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'level: "ERROR"', language: 'kuery' });
    h.queryComplete$.next({
      data: { status: NO_RESULTS },
      query: { query: 'level: "ERROR"', language: 'kuery' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(0);
    expect(result.message).toContain('no results');
  });

  it('reports the total hit count on READY', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'response >= 400', language: 'kuery' });
    h.queryComplete$.next({
      data: { status: READY, hits: 8041, rows: [{}, {}] },
      query: { query: 'response >= 400', language: 'kuery' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(8041);
    expect(result.message).toContain('8041');
  });

  it('falls back to the returned row count when the total is unavailable', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'source=logs', language: 'PPL' });
    h.queryComplete$.next({
      data: { status: READY, rows: [{}, {}, {}] },
      query: { query: 'source=logs', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(3);
  });

  it('prefers the error details over the reason', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: 'bad', language: 'PPL' });
    h.queryComplete$.next({
      data: {
        status: ERROR,
        queryStatus: {
          body: {
            error: { message: { error: { reason: 'boom reason', details: 'boom details' } } },
          },
        },
      },
      query: { query: 'bad', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('boom details');
  });

  it('extracts the root cause reason from the error attributes', async () => {
    const h = setup();
    const action = getRealAction(h.registered);

    const promise = action.handler({ query: '()', language: 'PPL' });
    h.queryComplete$.next({
      data: {
        status: ERROR,
        queryStatus: {
          body: {
            error: {
              statusCode: 400,
              error: 'Bad Request',
              attributes: {
                error: {
                  root_cause: [
                    { type: 'query_shard_exception', reason: 'Failed to parse query [()]' },
                  ],
                  type: 'search_phase_execution_exception',
                  reason: 'all shards failed',
                },
              },
            },
          },
        },
      },
      query: { query: '()', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to parse query [()]');
  });
});
