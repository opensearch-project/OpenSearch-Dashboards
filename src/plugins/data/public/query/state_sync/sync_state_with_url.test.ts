/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Subscription } from 'rxjs';
import { createBrowserHistory, History } from 'history';
import { FilterManager } from '../filter_manager';
import { getFilter } from '../filter_manager/test_helpers/get_stub_filter';
import { Filter, FilterStateStore, UI_SETTINGS } from '../../../common';
import { coreMock } from '../../../../../core/public/mocks';
import {
  createOsdUrlStateStorage,
  IOsdUrlStateStorage,
  Storage,
} from '../../../../opensearch_dashboards_utils/public';
import { QueryService, QueryStart } from '../query_service';
import { StubBrowserStorage } from 'test_utils/stub_browser_storage';
import { TimefilterContract } from '../timefilter';
import { syncQueryStateWithUrl } from './sync_state_with_url';
import { QueryState } from './types';

const setupMock = coreMock.createSetup();
const startMock = coreMock.createStart();

setupMock.uiSettings.get.mockImplementation((key: string) => {
  switch (key) {
    case UI_SETTINGS.FILTERS_PINNED_BY_DEFAULT:
      return true;
    case 'timepicker:timeDefaults':
      return { from: 'now-15m', to: 'now' };
    case 'search:queryLanguage':
      return 'kuery';
    case UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS:
      return { pause: false, value: 0 };
    default:
      throw new Error(`sync_query test: not mocked uiSetting: ${key}`);
  }
});

describe('sync_query_state_with_url', () => {
  let queryServiceStart: QueryStart;
  let filterManager: FilterManager;
  let timefilter: TimefilterContract;
  let osdUrlStateStorage: IOsdUrlStateStorage;
  let history: History;

  let filterManagerChangeSub: Subscription;
  let filterManagerChangeTriggered = jest.fn();

  let gF: Filter;
  let aF: Filter;

  const pathWithFilter =
    "/#?_g=(filters:!(('$state':(store:globalState),meta:(alias:!n,disabled:!t,index:'logstash-*',key:query,negate:!t,type:custom,value:'%7B%22match%22:%7B%22key1%22:%22value1%22%7D%7D'),query:(match:(key1:value1)))),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))";

  beforeEach(() => {
    const queryService = new QueryService();
    queryService.setup({
      uiSettings: setupMock.uiSettings,
      storage: new Storage(new StubBrowserStorage()),
    });
    queryServiceStart = queryService.start({
      uiSettings: startMock.uiSettings,
      storage: new Storage(new StubBrowserStorage()),
      savedObjectsClient: startMock.savedObjects.client,
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
  });
  afterEach(() => {
    filterManagerChangeSub.unsubscribe();
  });

  test('url is actually changed when data in services changes', () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    filterManager.setFilters([gF, aF]);
    osdUrlStateStorage.flush(); // sync force location change
    expect(history.location.hash).toMatchInlineSnapshot(
      `"#?_g=(filters:!(('$state':(store:globalState),meta:(alias:!n,disabled:!t,index:'logstash-*',key:query,negate:!t,type:custom,value:'%7B%22match%22:%7B%22key1%22:%22value1%22%7D%7D'),query:(match:(key1:value1)))),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))"`
    );
    stop();
  });

  test('when filters change, global filters synced to urlStorage', () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    filterManager.setFilters([gF, aF]);
    expect(osdUrlStateStorage.get<QueryState>('_g')?.filters).toHaveLength(1);
    stop();
  });

  test('when time range changes, time synced to urlStorage', () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    timefilter.setTime({ from: 'now-30m', to: 'now' });
    expect(osdUrlStateStorage.get<QueryState>('_g')?.time).toEqual({
      from: 'now-30m',
      to: 'now',
    });
    stop();
  });

  test('when refresh interval changes, refresh interval is synced to urlStorage', () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    timefilter.setRefreshInterval({ pause: true, value: 100 });
    expect(osdUrlStateStorage.get<QueryState>('_g')?.refreshInterval).toEqual({
      pause: true,
      value: 100,
    });
    stop();
  });

  test('when url is changed, filters synced back to filterManager', () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    osdUrlStateStorage.cancel(); // stop initial syncing pending update
    history.push(pathWithFilter);
    expect(filterManager.getGlobalFilters()).toHaveLength(1);
    stop();
  });

  test('initial url should be synced with services', () => {
    history.push(pathWithFilter);

    const { stop, hasInheritedQueryFromUrl } = syncQueryStateWithUrl(
      queryServiceStart,
      osdUrlStateStorage
    );
    expect(hasInheritedQueryFromUrl).toBe(true);
    expect(filterManager.getGlobalFilters()).toHaveLength(1);
    stop();
  });

  test("url changes shouldn't trigger services updates if data didn't change", () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    filterManagerChangeTriggered.mockClear();

    history.push(pathWithFilter);
    history.push(pathWithFilter);
    history.push(pathWithFilter);

    expect(filterManagerChangeTriggered).not.toBeCalled();
    stop();
  });

  test("if data didn't change, osdUrlStateStorage.set shouldn't be called", () => {
    const { stop } = syncQueryStateWithUrl(queryServiceStart, osdUrlStateStorage);
    filterManager.setFilters([gF, aF]);
    const spy = jest.spyOn(osdUrlStateStorage, 'set');
    filterManager.setFilters([gF]); // global filters didn't change
    expect(spy).not.toBeCalled();
    stop();
  });
});
