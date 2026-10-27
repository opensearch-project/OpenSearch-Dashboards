/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * The automatic entry points that run a query on their own must honor
 * DatasetTypeConfig meta.requiresExplicitRun (see requires_explicit_run.ts). This drives the
 * thunk entry points with one opted-in dataset type and one ordinary type. The React hooks and
 * the dataset change middleware have the same pair of tests next to them.
 */

import { loadQueryActionCreator } from './state_management/actions/query_editor/load_query/load_query';
import { resetExploreStateActionCreator } from './state_management/actions/reset_explore_state/reset_explore_state';
import { runQueryActionCreator } from './state_management/actions/query_editor/run_query';
import { executeQueries } from './state_management/actions/query_actions';
import { getPreloadedState } from './state_management/utils/redux_persistence';

jest.mock('./state_management/actions/query_editor/run_query', () => ({
  runQueryActionCreator: jest.fn(() => ({ type: 'RUN_QUERY' })),
}));
jest.mock('./state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'EXECUTE_QUERIES' })),
}));
jest.mock('./state_management/actions/detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn(() => ({ type: 'DETECT_OPTIMAL_TAB' })),
}));
jest.mock('./state_management/utils/redux_persistence', () => ({
  getPreloadedState: jest.fn(),
}));

const EXPLICIT = { id: 'explicit', title: 'explicit', type: 'EXPLICIT_RUN_TYPE' };
const ORDINARY = { id: 'ordinary', title: 'ordinary', type: 'ORDINARY_TYPE' };

const services = {
  data: {
    query: {
      queryString: {
        getQuery: () => ({ query: '', dataset: undefined }),
        getDatasetService: () => ({
          getType: (type: string) =>
            type === EXPLICIT.type ? { meta: { requiresExplicitRun: true } } : { meta: {} },
        }),
      },
    },
  },
} as any;

const dispatch = jest.fn((action: unknown) => action) as any;

describe.each([
  ['an opted-in type', EXPLICIT, false],
  ['an ordinary type', ORDINARY, true],
])('automatic query runs for %s', (_label, dataset, runs) => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`${runs ? 'runs' : 'does not run'} a loaded query`, async () => {
    await loadQueryActionCreator(
      services,
      jest.fn(),
      'q'
    )(
      dispatch,
      () =>
        ({
          query: { dataset },
        }) as any
    );
    expect((runQueryActionCreator as jest.Mock).mock.calls.length > 0).toBe(runs);
  });

  it(`${runs ? 'runs' : 'does not run'} the query of a new search`, async () => {
    (getPreloadedState as jest.Mock).mockResolvedValue({
      ui: {},
      tab: {},
      legacy: {},
      queryEditor: {},
      query: { query: '', dataset },
    });
    await resetExploreStateActionCreator(services, jest.fn())(dispatch);
    expect((executeQueries as unknown as jest.Mock).mock.calls.length > 0).toBe(runs);
  });
});
