/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchEmbeddable } from './search_embeddable';

// Exercises the isVisible fetch-gate logic (OSD PR #12809) directly on the
// prototype method with a minimal hand-built stub, avoiding a full embeddable
// construction (which needs saved-search/services/DOM wiring). The gate decision
// lives in pushContainerStateParamsToProps (the resume term in isFetchRequired)
// and in fetch() itself; fetch() is an instance arrow, so here it is a stubbed
// spy and we assert whether the container-state path decides to invoke it. The
// fetch() early-return is additionally covered by the live Playwright spec.
describe('SearchEmbeddable data-fetch pause', () => {
  const anyProto = SearchEmbeddable.prototype as any;
  const push = anyProto.pushContainerStateParamsToProps as (
    sp: any,
    force?: boolean
  ) => Promise<void>;

  const makeStub = (overrides: Record<string, unknown>) => {
    const stub: any = {
      node: {}, // panel mounted
      // prev* mirror input so the only live signal is pendingFetchOnResume.
      input: {
        isVisible: true,
        filters: [],
        query: { query: '', language: 'kuery' },
        timeRange: undefined,
        sort: undefined,
        columns: undefined,
      },
      prevFilters: [],
      prevQuery: { query: '', language: 'kuery' },
      prevTimeRange: undefined,
      savedSearch: { sort: [], columns: [] },
      panelTitle: '',
      pendingFetchOnResume: false,
      filtersSearchSource: { setField: jest.fn() },
      fetch: jest.fn().mockResolvedValue(undefined),
      renderComponent: jest.fn(),
      ...overrides,
    };
    return stub;
  };

  it('fetches once on resume when a fetch is owed and the panel is visible', async () => {
    const stub = makeStub({ pendingFetchOnResume: true });

    await push.call(stub, { sort: [] });

    expect(stub.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not fetch while still not visible even if one is owed', async () => {
    const stub = makeStub({
      pendingFetchOnResume: true,
      input: {
        isVisible: false,
        filters: [],
        query: { query: '', language: 'kuery' },
        timeRange: undefined,
        sort: undefined,
        columns: undefined,
      },
    });

    await push.call(stub, { sort: [] });

    expect(stub.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when nothing is owed and nothing changed', async () => {
    const stub = makeStub({ pendingFetchOnResume: false });

    await push.call(stub, { sort: [] });

    expect(stub.fetch).not.toHaveBeenCalled();
  });
});
