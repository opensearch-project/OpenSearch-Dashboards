/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../../../types';
import { createVisBuilderServicesMock } from '../mocks';
import { getPreloadedState } from './preload';
import { loadReduxState, saveReduxState } from './redux_persistence';

describe('test redux state persistence', () => {
  let mockServices: jest.Mocked<VisBuilderServices>;
  let reduxStateParams: any;

  beforeEach(() => {
    mockServices = createVisBuilderServicesMock();
    reduxStateParams = {
      style: 'style',
      visualization: 'visualization',
      metadata: 'metadata',
    };
  });

  test('test load redux state when url is empty', async () => {
    const defaultStates = {
      style: 'style default states',
      visualization: {
        searchField: '',
        activeVisualization: { name: 'viz', aggConfigParams: [] },
        indexPattern: 'id',
      },
      metadata: {
        editor: { validity: {}, state: 'loading' },
        originatingApp: undefined,
      },
    };

    const returnStates = await loadReduxState(mockServices);
    expect(returnStates).toStrictEqual(defaultStates);
  });

  test('test load redux state', async () => {
    mockServices.osdUrlStateStorage.set('_a', reduxStateParams, { replace: true });
    const returnStates = await loadReduxState(mockServices);
    expect(returnStates).toStrictEqual(reduxStateParams);
  });

  test('test save redux state', () => {
    saveReduxState(reduxStateParams, mockServices);
    const urlStates = mockServices.osdUrlStateStorage.get('_a');
    expect(urlStates).toStrictEqual(reduxStateParams);
  });
});
