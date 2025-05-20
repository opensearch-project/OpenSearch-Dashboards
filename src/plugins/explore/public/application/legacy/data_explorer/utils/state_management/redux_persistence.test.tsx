/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataExplorerServices } from '../../types';
import { createDataExplorerServicesMock } from '../mocks';
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
    expect(returnStates).toMatchInlineSnapshot(`
      Object {
        "metadata": Object {
          "indexPattern": "id",
          "originatingApp": undefined,
        },
      }
    `);
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
