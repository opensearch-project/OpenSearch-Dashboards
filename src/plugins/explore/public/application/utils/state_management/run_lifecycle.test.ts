/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What happens to a query still running when what it was run for is replaced: a dataset change, a
 * new run of another query, a new search. Runs on the real reducers, the dataset change and overall
 * status middleware and the real query thunks; only the search itself is faked, one pending fetch
 * per query, which the test settles when it chooses.
 *
 * The queries use a source type language, whose cache key is the query text as typed: the same text
 * on another dataset has the same key.
 */

import { AnyAction, configureStore } from '@reduxjs/toolkit';
import { rootReducer, RootState } from './store';
import { createDatasetChangeMiddleware } from './middleware/dataset_change_middleware';
import { createOverallStatusMiddleware } from './middleware/overall_status_middleware';
import { runQueryActionCreator } from './actions/query_editor/run_query';
import { resetExploreStateActionCreator } from './actions/reset_explore_state';
import { setQueryState, setQueryWithHistory } from './slices';
import { QueryExecutionStatus } from './types';
import { getPreloadedState } from './utils/redux_persistence';
import { REFINE_SELECTION_META } from '../requires_explicit_run';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';
import { ExploreServices } from '../../../types';

jest.mock('../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn().mockResolvedValue(false),
}));
jest.mock('../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn().mockResolvedValue(false),
}));
jest.mock('./actions/reset_legacy_state', () => ({
  resetLegacyStateActionCreator: () => () => undefined,
}));
jest.mock('./utils/redux_persistence', () => ({
  getPreloadedState: jest.fn(),
  loadReduxState: jest.fn(),
}));
jest.mock('../../../helpers/get_flavor_from_app_id', () => ({
  getCurrentFlavor: jest.fn().mockResolvedValue('logs'),
}));
jest.mock('../../legacy/discover/opensearch_dashboards_services', () => ({
  getResponseInspectorStats: jest.fn(() => ({})),
}));

const LANGUAGE = 'FakeQL';
// The type that requires an explicit Run, and one that runs on its own (like OpenSearch's).
const EXPLICIT = 'EXPLICIT_RUN_TYPE';
const AUTO = 'AUTO_RUN_TYPE';
const QUERY = 'fields @message | limit 5';

const dataset = (id: string, type = EXPLICIT) => ({
  id,
  title: id,
  type,
  timeFieldName: undefined,
});
const GROUP_A = dataset('source::us-west-2::group-a');
const GROUP_B = dataset('source::us-west-2::group-b');
const OTHER_REGION = dataset('source::us-east-1::group-a');

const rows = (label: string) => ({
  hits: { hits: [{ _id: label, _source: { message: label } }], total: 1 },
  took: 1,
});

const abortError = () => {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
};

interface PendingFetch {
  signal: AbortSignal;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  onPartialResults?: (partial: unknown, frame: unknown) => void;
}

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('queries still running when what they were run for is replaced', () => {
  let fetches: PendingFetch[];
  let services: ExploreServices;

  const createServices = () => {
    const searchSource = {
      setParent: jest.fn(),
      setField: jest.fn(),
      setFields: jest.fn(),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn(() => ({ schema: [] })),
      fetch: jest.fn(
        (options: {
          abortSignal: AbortSignal;
          onPartialResults?: PendingFetch['onPartialResults'];
        }) =>
          new Promise((resolve, reject) => {
            fetches.push({
              signal: options.abortSignal,
              resolve,
              reject,
              onPartialResults: options.onPartialResults,
            });
          })
      ),
    };
    const inspectorRequest = {
      stats: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      ok: jest.fn().mockReturnThis(),
      getTime: jest.fn(() => 1),
    };
    return {
      data: {
        dataViews: {
          ensureDefaultDataView: jest.fn(),
          get: jest.fn(async (id: string) => ({
            id,
            title: id,
            fields: { filter: () => [], getByName: () => undefined },
            flattenHit: (hit: any) => hit._source,
          })),
          getDefault: jest.fn(),
          convertToDataset: jest.fn(async (dataView: { id: string }) => ({
            id: dataView.id,
            title: dataView.id,
          })),
        },
        search: { searchSource: { create: jest.fn(async () => searchSource) } },
        query: {
          filterManager: { getFilters: () => [] },
          timefilter: {
            timefilter: {
              getTime: () => ({ from: 'now-15m', to: 'now' }),
              createFilter: jest.fn(),
            },
          },
          queryString: {
            getQuery: () => ({ query: QUERY, language: LANGUAGE }),
            getLanguageService: () => ({ getLanguage: () => ({}) }),
            getDatasetService: () => ({
              getType: (type: string) => ({ meta: { requiresExplicitRun: type === EXPLICIT } }),
              cacheDataset: jest.fn(),
            }),
          },
        },
      },
      uiSettings: { get: jest.fn(() => undefined) },
      inspectorAdapters: { requests: { reset: jest.fn(), start: () => inspectorRequest } },
      tabRegistry: { getTab: () => undefined },
      notifications: { toasts: { addError: jest.fn() } },
      capabilities: {},
    } as unknown as ExploreServices;
  };

  const createStore = (query: { query: string; dataset: ReturnType<typeof dataset> }) => {
    const initial = rootReducer(undefined, { type: '@@init' });
    return configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...initial,
        query: { ...initial.query, language: LANGUAGE, ...query },
      } as RootState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
          createDatasetChangeMiddleware(services),
          createOverallStatusMiddleware()
        ),
    });
  };
  type Store = ReturnType<typeof createStore>;

  const run = (store: Store, query?: string) =>
    store.dispatch(runQueryActionCreator(services, query) as unknown as AnyAction);

  // The picker's change: a refinement within the type, as `DatasetSelect` dispatches it.
  const pick = (store: Store, next: ReturnType<typeof dataset>) =>
    store.dispatch({
      ...setQueryState({ ...store.getState().query, dataset: next } as any),
      meta: REFINE_SELECTION_META,
    });

  // Any other dataset change, e.g. opening a saved search on other log groups.
  const open = (store: Store, next: ReturnType<typeof dataset>) =>
    store.dispatch(setQueryState({ ...store.getState().query, dataset: next } as any));

  const resultsFor = (store: Store) => store.getState().results[QUERY];
  const statusFor = (store: Store) => store.getState().queryEditor.queryStatusMap[QUERY]?.status;
  const overallStatus = (store: Store) => store.getState().queryEditor.overallQueryStatus.status;

  beforeEach(() => {
    fetches = [];
    services = createServices();
    const registry = new SourceTypeRegistryService();
    registry.register({
      id: 'fake',
      label: 'Fake',
      datasetTypes: [EXPLICIT, AUTO],
      flavors: [ExploreFlavor.Logs],
      resolveDefaultDataset: async () => undefined,
      languageSettings: { [LANGUAGE]: {} },
    });
    setSourceTypeRegistry(registry);
  });

  afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  describe('a dataset change', () => {
    it.each([
      ['opening other log groups (a saved search)', open, GROUP_B],
      ['picking other log groups', pick, GROUP_B],
      ['picking another region', pick, OTHER_REGION],
    ])(
      'stops the running query, and its rows never land under the new selection: %s',
      async (_label, change, next) => {
        const store = createStore({ query: QUERY, dataset: GROUP_A });
        run(store);
        await flush();
        expect(fetches).toHaveLength(1);

        change(store, next);
        expect(fetches[0].signal.aborted).toBe(true);

        // The worst case: the source returns the old run's rows anyway.
        fetches[0].resolve(rows('group-a'));
        await flush();

        expect(store.getState().query.dataset).toEqual(next);
        expect(resultsFor(store)).toBeUndefined();
        expect(statusFor(store)).not.toBe(QueryExecutionStatus.READY);
        expect(overallStatus(store)).not.toBe(QueryExecutionStatus.READY);
      }
    );

    // Once the page has had a dataset change, picking other log groups keeps finished results as
    // stale; a query still running is stopped as Stop stops it.
    it('stops the running query on a refined selection, which settles as stopped', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      open(store, GROUP_A);
      run(store);
      await flush();

      pick(store, GROUP_B);
      expect(fetches[0].signal.aborted).toBe(true);
      fetches[0].reject(abortError());
      await flush();

      expect(resultsFor(store)).toBeUndefined();
      expect(store.getState().queryEditor.isSelectionStale).toBe(true);
      expect(statusFor(store)).toBe(QueryExecutionStatus.UNINITIALIZED);
      expect(overallStatus(store)).toBe(QueryExecutionStatus.UNINITIALIZED);
    });

    // A run stopped while it was still being built must not reach the source at all: an
    // interceptor that starts a server-side job may do so before it looks at the aborted signal.
    it('sends no query for a run stopped while its data view was still loading', async () => {
      let releaseDataView: () => void = () => undefined;
      const dataViewLoaded = new Promise<void>((resolve) => {
        releaseDataView = () => resolve();
      });
      const dataViews = services.data.dataViews as any;
      const loadDataView = dataViews.get;
      dataViews.get = jest.fn(async (...args: unknown[]) => {
        await dataViewLoaded;
        return loadDataView(...args);
      });

      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();
      expect(fetches).toHaveLength(0);

      open(store, GROUP_B);
      releaseDataView();
      await flush();

      expect(fetches).toHaveLength(0);
      expect(statusFor(store)).not.toBe(QueryExecutionStatus.LOADING);
      expect(resultsFor(store)).toBeUndefined();
    });

    it('leaves no status behind for the stopped run when it settles as aborted', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();

      open(store, GROUP_B);
      fetches[0].reject(abortError());
      await flush();

      expect(store.getState().queryEditor.queryStatusMap).toEqual({});
      expect(store.getState().queryEditor.hasUserInitiatedQuery).toBe(false);
    });

    it('drops the partial rows the stopped run reports after the change', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      // An earlier change, so the pick below refines: the statuses, and so the key, stay.
      open(store, GROUP_A);
      run(store);
      await flush();

      pick(store, GROUP_B);
      fetches[0].onPartialResults?.(rows('group-a'), { schema: [], meta: {} });

      expect(resultsFor(store)).toBeUndefined();
    });

    // A source that runs on its own (OpenSearch's): the change stops the old run and runs the query
    // on the new dataset, whose rows are the only ones that land.
    it('for a dataset that runs on its own, stops the old run and shows only the new one', async () => {
      const store = createStore({ query: QUERY, dataset: dataset('index-a', AUTO) });
      run(store);
      await flush();

      open(store, dataset('index-b', AUTO));
      expect(fetches[0].signal.aborted).toBe(true);
      await flush();
      expect(fetches).toHaveLength(2);

      fetches[1].resolve(rows('index-b'));
      fetches[0].resolve(rows('index-a'));
      await flush();

      expect(store.getState().results[QUERY]?.hasResults).toBe(true);
      expect(statusFor(store)).toBe(QueryExecutionStatus.READY);
      expect(overallStatus(store)).toBe(QueryExecutionStatus.READY);
      expect(services.data.search.searchSource.create).toHaveBeenCalled();
    });

    // A source switch (to a source that runs on its own) starts the new source's run at once.
    it("switching the source stops the old source's queries", async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();

      store.dispatch(
        setQueryWithHistory({ query: QUERY, language: LANGUAGE, dataset: dataset('index', AUTO) })
      );
      expect(fetches[0].signal.aborted).toBe(true);
      await flush();
      fetches[0].resolve(rows('group-a'));
      await flush();
      expect(resultsFor(store)).toBeUndefined();

      fetches[1].resolve(rows('index'));
      await flush();
      expect(overallStatus(store)).toBe(QueryExecutionStatus.READY);
    });

    // Browser back/forward replaces the state without a dataset change action.
    it("drops a run's rows when the state is replaced with another dataset's", async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();

      const state = store.getState();
      store.dispatch({
        type: 'app/hydrateState',
        payload: {
          ...state,
          query: { ...state.query, dataset: GROUP_B },
          queryEditor: { ...state.queryEditor, queryStatusMap: {} },
        },
      });
      fetches[0].resolve(rows('group-a'));
      await flush();

      expect(resultsFor(store)).toBeUndefined();
      expect(store.getState().queryEditor.queryStatusMap).toEqual({});
    });

    // A run whose dataset the page no longer shows, which nothing stopped (here: back to A after a
    // change to B, a Run on A, then B picked again while it runs, which the middleware takes for
    // no change): its rows are dropped, and its key must settle instead of staying LOADING for
    // good, which also kept auto-refresh from ever refreshing.
    it('a run for a dataset the page no longer shows settles instead of staying loading', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      open(store, GROUP_B);
      await flush();
      const state = store.getState();
      store.dispatch({
        type: 'app/hydrateState',
        payload: {
          ...state,
          query: { ...state.query, dataset: GROUP_A },
          queryEditor: { ...state.queryEditor, queryStatusMap: {} },
        },
      });
      run(store);
      await flush();
      expect(fetches).toHaveLength(1);

      pick(store, GROUP_B);

      fetches[0].resolve(rows('group-a'));
      await flush();
      expect(resultsFor(store)).toBeUndefined();
      expect(statusFor(store)).not.toBe(QueryExecutionStatus.LOADING);
      expect(overallStatus(store)).not.toBe(QueryExecutionStatus.LOADING);
    });
  });

  describe('a new run or a new search', () => {
    it('stops the queries of the query it replaces', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();

      const edited = 'fields @message | filter @message like "none" | limit 5';
      run(store, edited);
      await flush();
      expect(fetches).toHaveLength(2);
      expect(fetches[0].signal.aborted).toBe(true);
      expect(fetches[1].signal.aborted).toBe(false);

      fetches[0].reject(abortError());
      fetches[1].resolve(rows('edited'));
      await flush();

      // The stopped run leaves no UNINITIALIZED status to hold the overall status back.
      expect(Object.keys(store.getState().queryEditor.queryStatusMap)).toEqual([edited]);
      expect(overallStatus(store)).toBe(QueryExecutionStatus.READY);
    });

    it('New search stops the running queries', async () => {
      const store = createStore({ query: QUERY, dataset: GROUP_A });
      run(store);
      await flush();
      const initial = store.getState();
      (getPreloadedState as jest.Mock).mockResolvedValue({
        ...initial,
        query: { ...initial.query, query: '' },
        queryEditor: { ...initial.queryEditor, queryStatusMap: {} },
      });

      await store.dispatch(
        resetExploreStateActionCreator(services, jest.fn()) as unknown as AnyAction
      );
      expect(fetches[0].signal.aborted).toBe(true);

      fetches[0].resolve(rows('old'));
      await flush();
      expect(resultsFor(store)).toBeUndefined();
      expect(store.getState().queryEditor.queryStatusMap).toEqual({});
    });
  });
});
