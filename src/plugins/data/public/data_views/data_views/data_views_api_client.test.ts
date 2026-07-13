/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { http } from './data_views_api_client.test.mock';
import { DataViewsApiClient } from './data_views_api_client';

describe('DataViewsApiClient', () => {
  let fetchSpy: jest.SpyInstance;
  let dataViewsApiClient: DataViewsApiClient;

  beforeEach(() => {
    fetchSpy = jest.spyOn(http, 'fetch').mockImplementation(() => Promise.resolve({}));
    dataViewsApiClient = new DataViewsApiClient(http);
  });

  test('uses the right URI to fetch fields for time patterns', async function () {
    const expectedPath = '/api/index_patterns/_fields_for_time_pattern';

    await dataViewsApiClient.getFieldsForTimePattern();

    expect(fetchSpy).toHaveBeenCalledWith(expectedPath, expect.any(Object));
  });

  test('uses the right URI to fetch fields for wildcard', async function () {
    const expectedPath = '/api/index_patterns/_fields_for_wildcard';

    await dataViewsApiClient.getFieldsForWildcard();

    expect(fetchSpy).toHaveBeenCalledWith(expectedPath, expect.any(Object));
  });

  test('uses the right URI to fetch fields for wildcard given a type', async function () {
    const expectedPath = '/api/index_patterns/_fields_for_wildcard';

    await dataViewsApiClient.getFieldsForWildcard({ type: 'rollup' });

    expect(fetchSpy).toHaveBeenCalledWith(expectedPath, expect.any(Object));
  });
});
