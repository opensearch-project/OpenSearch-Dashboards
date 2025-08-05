/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subscription } from 'rxjs';
import { createBrowserHistory, History } from 'history';
import { FilterManager } from '../filter_manager';
import { getFilter } from '../filter_manager/test_helpers/get_stub_filter';
import {
  DataStorage,
  Filter,
  FilterStateStore,
  IndexPatternsService,
  UI_SETTINGS,
} from '../../../common';
import { coreMock } from '../../../../../core/public/mocks';
import {
  createOsdUrlStateStorage,
  IOsdUrlStateStorage,
} from '../../../../opensearch_dashboards_utils/public';
import { QueryService, QueryStart } from '../query_service';
import { TimefilterContract } from '../timefilter';
import { ISearchInterceptor } from '../../search';
import { act, renderHook } from '@testing-library/react-hooks';
import { useSyncQueryStateWithUrl } from './use_sync_state_with_url';
import * as SyncQueryStateWithUrl from './sync_state_with_url';

const mockStopSync = jest.fn();
const mockSyncQueryStateWithUrl = jest.fn().mockReturnValue({
  stop: mockStopSync,
});

const setupMock = coreMock.createSetup();
const startMock = coreMock.createStart();

setupMock.uiSettings.get.mockImplementation((key: string) => {
  switch (key) {
    case 'defaultIndex':
      return 'logstash-*';
    case UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT:
      return true;
    case 'timepicker:timeDefaults':
      return { from: 'now-15m', to: 'now' };
    case 'search:queryLanguage':
      return 'kuery';
    case UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS:
      return { pause: false, value: 0 };
    case UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED:
      return false;
    case UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS:
      return 4;
    default:
      throw new Error(`sync_query test: not mocked uiSetting: ${key}`);
  }
});

describe('use_sync_query_state_with_url', () => {
  let queryServiceStart: QueryStart;
  let filterManager: FilterManager;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  let timefilter: TimefilterContract;
  let osdUrlStateStorage: IOsdUrlStateStorage;
  let history: History;
  let indexPatternsMock: IndexPatternsService;

  beforeEach(() => {
    indexPatternsMock = ({
      get: jest.fn(),
    } as unknown) as IndexPatternsService;
  });

  let filterManagerChangeSub: Subscription;
  let filterManagerChangeTriggered = jest.fn();
  let mockSearchInterceptor: jest.Mocked<ISearchInterceptor>;

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  let gF: Filter;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  let aF: Filter;

  beforeEach(() => {
    const queryService = new QueryService();
    queryService.setup({
      uiSettings: setupMock.uiSettings,
      storage: new DataStorage(window.localStorage, 'opensearch_dashboards.'),
      sessionStorage: new DataStorage(window.sessionStorage, 'opensearch_dashboards.'),
      defaultSearchInterceptor: mockSearchInterceptor,
      application: setupMock.application,
      notifications: setupMock.notifications,
    });
    queryServiceStart = queryService.start({
      indexPatterns: indexPatternsMock,
      uiSettings: startMock.uiSettings,
      storage: new DataStorage(window.localStorage, 'opensearch_dashboards.'),
      savedObjectsClient: startMock.savedObjects.client,
      application: startMock.application,
      notifications: startMock.notifications,
    });
    filterManager = queryServiceStart.filterManager;
    timefilter = queryServiceStart.timefilter.timefilter;

    filterManagerChangeTriggered = jest.fn();
    filterManagerChangeSub = filterManager.getUpdates$().subscribe(filterManagerChangeTriggered);

    window.location.href = '/';
    history = createBrowserHistory();
    osdUrlStateStorage = createOsdUrlStateStorage({ useHash: false, history });

    gF = getFilter(FilterStateStore.GLOBAL_STATE, true, true, 'key1', 'value1');
    aF = getFilter(FilterStateStore.APP_STATE, true, true, 'key3', 'value3');

    jest
      .spyOn(SyncQueryStateWithUrl, 'syncQueryStateWithUrl')
      .mockImplementation(mockSyncQueryStateWithUrl);
  });
  afterEach(() => {
    filterManagerChangeSub.unsubscribe();
  });

  it('Should invoke connectStorageToQueryState', () => {
    const { result } = renderHook(() =>
      useSyncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage)
    );

    act(() => {
      result.current.startSyncingQueryStateWithUrl();
    });

    expect(mockSyncQueryStateWithUrl).toHaveBeenCalledTimes(1);
  });

  it('Should call stop callback when hook unmount', () => {
    const { unmount } = renderHook(() =>
      useSyncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage)
    );

    unmount();

    expect(mockStopSync).toHaveBeenCalledTimes(1);
  });
});
