/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../../../types';
import { createVisBuilderServicesMock } from '../mocks';
import { loadReduxState, persistReduxState } from './redux_persistence';
import { RootState } from './store';

describe('test redux state persistence', () => {
  let mockServices: jest.Mocked<VisBuilderServices>;
  let reduxStateParams: any;

  beforeEach(() => {
    mockServices = createVisBuilderServicesMock();
    reduxStateParams = {
      style: 'style',
      visualization: 'visualization',
      metadata: 'metadata',
      ui: 'ui',
    };
  });

  test('test load redux state when url is empty', async () => {
    const defaultStates: RootState = {
      style: 'style default states',
      visualization: {
        searchField: '',
        activeVisualization: { name: 'viz', aggConfigParams: [] },
        indexPattern: 'id',
      },
      metadata: {
        editor: { errors: {}, state: 'loading' },
        originatingApp: undefined,
      },
      ui: {},
    };

    const returnStates = await loadReduxState(mockServices);
    expect(returnStates).toStrictEqual(defaultStates);
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
