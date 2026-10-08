/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataExplorerServices } from '../../types';
import { createDataExplorerServicesMock } from '../mocks';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../components/constants';
import { loadReduxState, persistReduxState } from './redux_persistence';

describe('test redux state persistence', () => {
  let mockServices: jest.Mocked<DataExplorerServices>;
  let reduxStateParams: any;

  beforeEach(() => {
    mockServices = createDataExplorerServicesMock();
    reduxStateParams = {
      discover: 'visualization',
      metadata: 'metadata',
    };
  });

  test('test load default redux state when url is empty', async () => {
    const returnStates = await loadReduxState(mockServices);
    expect(mockServices.data.query.getDefaultDataset).not.toHaveBeenCalled();
    expect(returnStates).toMatchInlineSnapshot(`
      Object {
        "metadata": Object {
          "indexPattern": "id",
          "originatingApp": undefined,
        },
      }
    `);
  });

  test('initializes the default dataset query when query enhancements are enabled', async () => {
    const defaultDataset = {
      id: 'default-dataset',
      title: 'Default Dataset',
      type: 'INDEXES',
    };
    const defaultQuery = {
      dataset: defaultDataset,
      language: 'PPL',
      query: 'source = Default Dataset',
    };
    mockServices.uiSettings.get.mockImplementation(
      (key) => key === QUERY_ENHANCEMENT_ENABLED_SETTING
    );
    mockServices.data.query.getDefaultDataset.mockResolvedValue(defaultDataset);
    mockServices.data.query.queryString.getDefaultQuery.mockReturnValue(defaultQuery);

    await loadReduxState(mockServices);

    expect(mockServices.data.query.getDefaultDataset).toHaveBeenCalledTimes(1);
    expect(mockServices.data.query.queryString.getDefaultQuery).toHaveBeenCalledWith(
      defaultDataset
    );
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalledWith(
      defaultQuery,
      false,
      false
    );
  });

  test('preserves an explicit empty query when query enhancements are enabled', async () => {
    mockServices.uiSettings.get.mockImplementation(
      (key) => key === QUERY_ENHANCEMENT_ENABLED_SETTING
    );
    mockServices.osdUrlStateStorage.set(
      '_q',
      {
        query: {
          language: 'kuery',
          query: '',
        },
      },
      { replace: true }
    );

    await loadReduxState(mockServices);

    expect(mockServices.data.query.getDefaultDataset).not.toHaveBeenCalled();
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
  });

  test('test load redux state', async () => {
    mockServices.osdUrlStateStorage.set('_a', reduxStateParams, { replace: true });
    const returnStates = await loadReduxState(mockServices);
    expect(returnStates).toStrictEqual(reduxStateParams);
  });

  test('test persist redux state', () => {
    persistReduxState(reduxStateParams, mockServices);
    const urlStates = mockServices.osdUrlStateStorage.get('_a');
    expect(urlStates).toStrictEqual(reduxStateParams);
  });
});
