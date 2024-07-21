/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SECURITY_DASHBOARDS_LOGOUT_URL } from '../../../../framework/constants';
import {
  ASYNC_QUERY_ACCELERATIONS_CACHE,
  ASYNC_QUERY_DATASOURCE_CACHE,
} from '../../../../framework/utils/shared';
import { catalogRequestIntercept } from '../../../../framework/catalog_cache/cache_intercept';

interface LooseObject {
  [key: string]: any;
}

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {} as LooseObject;
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('Intercept logout handler', () => {
  beforeEach(() => {
    jest.spyOn(window.sessionStorage, 'removeItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const logoutPath = {
    path: SECURITY_DASHBOARDS_LOGOUT_URL,
  };

  it('Intercept logout handler should clear the cache session', () => {
    const logoutInterceptFn = catalogRequestIntercept();
    logoutInterceptFn(logoutPath, null);
    expect(sessionStorage.removeItem).toBeCalledWith(ASYNC_QUERY_DATASOURCE_CACHE);
    expect(sessionStorage.removeItem).toBeCalledWith(ASYNC_QUERY_ACCELERATIONS_CACHE);
  });
});
