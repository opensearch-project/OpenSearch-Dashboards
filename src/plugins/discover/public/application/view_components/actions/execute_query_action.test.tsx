/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';

// Mock use_search to avoid pulling in its heavy dependency graph. Only the ResultStatus enum is
// used at runtime by the action module; the rest are type-only imports erased at compile time.
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
  LANGUAGE_TOOLS,
  buildToolDefinition,
  EXECUTE_QUERY_TOOL_DEFINITIONS,
  registerAllDisabledExecuteQueryActions,
  useExecuteQueryAction,
} from './execute_query_action';

const READY = 'ready';
const NO_RESULTS = 'none';
const ERROR = 'error';

describe('LANGUAGE_TOOLS / buildToolDefinition', () => {
  it('defines the four expected language tools', () => {
    expect(LANGUAGE_TOOLS.map((c) => c.toolName)).toEqual([
      'execute_dql_query',
      'execute_lucene_query',
      'execute_ppl_query',
      'execute_sql_query',
    ]);
  });

  it('builds a definition with the tool name, query as required param, and from/to params', () => {
    const def = buildToolDefinition({
      languageKey: 'PPL',
      displayName: 'PPL',
      toolName: 'execute_ppl_query',
    });
    expect(def.name).toBe('execute_ppl_query');
    expect(def.parameters.required).toEqual(['query']);
    expect(Object.keys(def.parameters.properties)).toEqual(
      expect.arrayContaining(['query', 'from', 'to'])
    );
  });

  it('includes the display name and a language-only clause in the description', () => {
    const def = buildToolDefinition({
      languageKey: 'kuery',
      displayName: 'DQL',
      toolName: 'execute_dql_query',
    });
    expect(def.description).toContain('LANGUAGE FOR DQL ONLY');
    expect(def.description).toContain('PROHIBITED');
  });

  it('adds the aggregation limitation only for kuery/lucene', () => {
    const dql = buildToolDefinition({
      languageKey: 'kuery',
      displayName: 'DQL',
      toolName: 'execute_dql_query',
    });
    const ppl = buildToolDefinition({
      languageKey: 'PPL',
      displayName: 'PPL',
      toolName: 'execute_ppl_query',
    });
    expect(dql.description).toContain('cannot aggregate or sort');
    expect(ppl.description).not.toContain('cannot aggregate or sort');
  });

  it('exposes one definition per language tool', () => {
    expect(EXECUTE_QUERY_TOOL_DEFINITIONS).toHaveLength(LANGUAGE_TOOLS.length);
  });
});

describe('registerAllDisabledExecuteQueryActions', () => {
  it('does nothing when registerAction is undefined', () => {
    expect(() => registerAllDisabledExecuteQueryActions(undefined as any)).not.toThrow();
  });

  it('registers every language tool as disabled with a context-lost handler', async () => {
    const registered: any[] = [];
    registerAllDisabledExecuteQueryActions((a) => registered.push(a));

    expect(registered).toHaveLength(LANGUAGE_TOOLS.length);
    expect(registered.every((a) => a.available === 'disabled')).toBe(true);

    const result = await registered[0].handler();
    expect(result.success).toBe(false);
    expect(result.stop_tool_execution).toBe(true);
    expect(result.context_lost).toBe(true);
  });
});

interface Harness {
  registered: any[];
  registerAssistantAction: jest.Mock;
  setQuery: jest.Mock;
  setTime: jest.Mock;
  updates$: Subject<any>;
  data$: BehaviorSubject<any>;
  refetch$: Subject<any>;
  queryComplete$: Subject<any>;
  refetchSpy: jest.SpyInstance;
  unmount: () => void;
}

function setup(options: { withContextProvider?: boolean; currentLanguage?: string } = {}): Harness {
  const { withContextProvider = true, currentLanguage = 'PPL' } = options;
  const registered: any[] = [];
  const registerAssistantAction = jest.fn((a: any) => registered.push(a));
  const setQuery = jest.fn();
  const setTime = jest.fn();
  const updates$ = new Subject<any>();
  const currentQuery = { query: 'old query', language: currentLanguage, dataset: { id: 'logs-*' } };
  const getQuery = jest.fn(() => currentQuery);

  const services: any = {
    contextProvider: withContextProvider ? { actions: { registerAssistantAction } } : undefined,
    data: {
      query: {
        queryString: { getQuery, setQuery, getUpdates$: () => updates$ },
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
    updates$,
    data$,
    refetch$,
    queryComplete$,
    refetchSpy,
    unmount,
  };
}

const enabledActions = (registered: any[]) => registered.filter((a) => a.available === 'enabled');
const lastEnabled = (registered: any[]) => enabledActions(registered).slice(-1)[0];

describe('useExecuteQueryAction', () => {
  afterEach(() => jest.clearAllMocks());

  it('registers nothing when the contextProvider is unavailable', () => {
    const { registerAssistantAction } = setup({ withContextProvider: false });
    expect(registerAssistantAction).not.toHaveBeenCalled();
  });

  it('enables only the tool matching the current page language', () => {
    const { registered } = setup({ currentLanguage: 'PPL' });
    const enabled = enabledActions(registered);
    expect(enabled).toHaveLength(1);
    expect(enabled[0].name).toBe('execute_ppl_query');
    expect(typeof enabled[0].handler).toBe('function');
  });

  it('swaps tools on a language switch: disables the previous, enables the new', () => {
    const h = setup({ currentLanguage: 'kuery' });
    // Initially DQL is enabled.
    expect(lastEnabled(h.registered).name).toBe('execute_dql_query');

    // Simulate the user switching the page language to PPL.
    h.updates$.next({ query: 'x', language: 'PPL' });

    const ppl = h.registered.filter((a) => a.name === 'execute_ppl_query').slice(-1)[0];
    const dql = h.registered.filter((a) => a.name === 'execute_dql_query').slice(-1)[0];
    expect(ppl.available).toBe('enabled');
    expect(dql.available).toBe('disabled');
  });

  it('ignores query updates that do not change the language', () => {
    const h = setup({ currentLanguage: 'PPL' });
    const countBefore = h.registered.length;
    h.updates$.next({ query: 'new text', language: 'PPL' });
    expect(h.registered.length).toBe(countBefore);
  });

  it('restores all tools to disabled on unmount', () => {
    const h = setup({ currentLanguage: 'PPL' });
    h.unmount();
    const lastFour = h.registered.slice(-LANGUAGE_TOOLS.length);
    expect(lastFour).toHaveLength(LANGUAGE_TOOLS.length);
    expect(lastFour.every((a) => a.available === 'disabled')).toBe(true);
  });

  it('sets query + time range, forces a refetch, and reports success on READY', async () => {
    const h = setup({ currentLanguage: 'PPL' });
    const action = lastEnabled(h.registered);

    const promise = action.handler({ query: 'source=logs', from: 'now-1h', to: 'now' });

    expect(h.setTime).toHaveBeenCalledWith({ from: 'now-1h', to: 'now' });
    expect(h.setQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'source=logs', language: 'PPL' })
    );
    expect(h.refetchSpy).toHaveBeenCalled();

    h.queryComplete$.next({
      data: { status: READY, hits: 42 },
      query: { query: 'source=logs', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.executed).toBe(true);
    expect(result.resultsCount).toBe(42);
    expect(result.message).toContain('Time range set to now-1h - now');
  });

  it('falls back to the returned row count when the total is unavailable', async () => {
    const h = setup({ currentLanguage: 'PPL' });
    const action = lastEnabled(h.registered);

    const promise = action.handler({ query: 'source=logs' });
    h.queryComplete$.next({
      data: { status: READY, rows: [{}, {}, {}] },
      query: { query: 'source=logs', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(3);
  });

  it('reports a genuine empty result set as success with zero results', async () => {
    const h = setup({ currentLanguage: 'PPL' });
    const action = lastEnabled(h.registered);

    const promise = action.handler({ query: 'source=logs' });
    h.queryComplete$.next({
      data: { status: NO_RESULTS },
      query: { query: 'source=logs', language: 'PPL' },
    });

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(0);
    expect(result.message).toContain('no results');
  });

  it('treats a NO_RESULTS with actualError (DQL parse error) as a failure', async () => {
    const h = setup({ currentLanguage: 'kuery' });
    const action = lastEnabled(h.registered);

    const promise = action.handler({ query: '(response: 400' });
    h.queryComplete$.next({
      data: { status: NO_RESULTS },
      query: { query: '(response: 400', language: 'kuery' },
      actualError: 'Expected ")" but end of input found.',
    });

    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Expected ")" but end of input found.');
  });

  it('reports failure with the extracted reason when the query errors', async () => {
    const h = setup({ currentLanguage: 'PPL' });
    const action = lastEnabled(h.registered);

    const promise = action.handler({ query: 'bad' });
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
});
