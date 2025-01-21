/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subscription } from 'rxjs';
import { FilterManager } from '../filter_manager';
import { getFilter } from '../filter_manager/test_helpers/get_stub_filter';
import {
  DataStorage,
  Filter,
  FilterStateStore,
  IndexPatternsService,
  Query,
} from '../../../common';
import { coreMock } from '../../../../../core/public/mocks';
import {
  IOsdUrlStateStorage,
  createOsdUrlStateStorage,
} from '../../../../opensearch_dashboards_utils/public';
import { QueryService, QueryStart } from '../query_service';
import { connectStorageToQueryState } from './connect_to_query_state';
import { createBrowserHistory, History } from 'history';
import { QueryStringContract } from '../query_string';
import { ISearchInterceptor } from '../../search';
import { renderHook } from '@testing-library/react-hooks';
import { useConnectStorageToQueryState } from './use_connect_to_query_state';

jest.mock('./connect_to_query_state');

const setupMock = coreMock.createSetup();
const startMock = coreMock.createStart();

describe('use_connect_storage_to_query_state', () => {
  let queryServiceStart: QueryStart;
  let queryString: QueryStringContract;
  let queryChangeSub: Subscription;
  let queryChangeTriggered = jest.fn();
  let filterManager: FilterManager;
  let filterManagerChangeSub: Subscription;
  let filterManagerChangeTriggered = jest.fn();
  let osdUrlStateStorage: IOsdUrlStateStorage;
  let indexPatternsMock: IndexPatternsService;
  let history: History;
  let gF1: Filter;
  let gF2: Filter;
  let aF1: Filter;
  let aF2: Filter;
  let q1: Query;
  let mockSearchInterceptor: jest.Mocked<ISearchInterceptor>;

  beforeEach(() => {
    const queryService = new QueryService();
    mockSearchInterceptor = {} as jest.Mocked<ISearchInterceptor>;
    queryService.setup({
      uiSettings: setupMock.uiSettings,
      storage: new DataStorage(window.localStorage, 'opensearch_dashboards.'),
      sessionStorage: new DataStorage(window.sessionStorage, 'opensearch_dashboards.'),
      defaultSearchInterceptor: mockSearchInterceptor,
      application: setupMock.application,
      notifications: setupMock.notifications,
    });
    queryServiceStart = queryService.start({
      uiSettings: startMock.uiSettings,
      storage: new DataStorage(window.localStorage, 'opensearch_dashboards.'),
      savedObjectsClient: startMock.savedObjects.client,
      indexPatterns: indexPatternsMock,
      application: startMock.application,
      notifications: startMock.notifications,
    });
    indexPatternsMock = ({
      get: jest.fn(),
    } as unknown) as IndexPatternsService;

    queryString = queryServiceStart.queryString;
    queryChangeTriggered = jest.fn();
    queryChangeSub = queryString.getUpdates$().subscribe(queryChangeTriggered);

    filterManager = queryServiceStart.filterManager;
    filterManagerChangeTriggered = jest.fn();
    filterManagerChangeSub = filterManager.getUpdates$().subscribe(filterManagerChangeTriggered);

    window.location.href = '/';
    history = createBrowserHistory();
    osdUrlStateStorage = createOsdUrlStateStorage({ useHash: false, history });

    gF1 = getFilter(FilterStateStore.GLOBAL_STATE, true, true, 'key1', 'value1');
    gF2 = getFilter(FilterStateStore.GLOBAL_STATE, false, false, 'key2', 'value2');
    aF1 = getFilter(FilterStateStore.APP_STATE, true, true, 'key3', 'value3');
    aF2 = getFilter(FilterStateStore.APP_STATE, false, false, 'key4', 'value4');

    q1 = {
      query: 'count is less than 100',
      language: 'kuery',
    };
  });

  afterEach(() => {
    filterManagerChangeSub.unsubscribe();
    queryChangeSub.unsubscribe();
  });

  it('Should invoke connectStorageToQueryState', () => {
    const { result } = renderHook(() =>
      useConnectStorageToQueryState(queryServiceStart, osdUrlStateStorage, {
        filters: FilterStateStore.APP_STATE,
        query: true,
      })
    );
    expect(connectStorageToQueryState).toHaveBeenCalledTimes(1);
    expect(result.current).toBeUndefined();
  });
});
