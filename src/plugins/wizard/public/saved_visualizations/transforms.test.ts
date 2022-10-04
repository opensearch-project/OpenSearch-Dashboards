/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { getStubIndexPattern } from '../../../../plugins/data/public/test_utils';
import { IndexPattern } from '../../../data/public';
import { RootState } from '../application/utils/state_management';
import { WizardVisSavedObject } from '../types';
import { saveStateToSavedObject } from './transforms';

const getConfig = (cfg: any) => cfg;

describe('transforms', () => {
  describe('saveStateToSavedObject', () => {
    let TEST_INDEX_PATTERN_ID;
    let savedObject;
    let rootState: RootState;
    let indexPattern: IndexPattern;

    beforeEach(() => {
      TEST_INDEX_PATTERN_ID = 'test-pattern';
      savedObject = {} as WizardVisSavedObject;
      rootState = {
        metadata: { editor: { state: 'loading', validity: {} } },
        style: '',
        visualization: {
          searchField: '',
          indexPattern: TEST_INDEX_PATTERN_ID,
          activeVisualization: {
            name: 'bar',
            aggConfigParams: [],
          },
        },
      };
      indexPattern = getStubIndexPattern(
        TEST_INDEX_PATTERN_ID,
        getConfig,
        null,
        [],
        coreMock.createSetup()
      );
    });

    test('should save root state information into saved object', async () => {
      saveStateToSavedObject(savedObject, rootState, indexPattern);

      expect(savedObject.visualizationState).not.toContain(TEST_INDEX_PATTERN_ID);
      expect(savedObject.styleState).toEqual(JSON.stringify(rootState.style));
      expect(savedObject.searchSourceFields?.index?.id).toEqual(TEST_INDEX_PATTERN_ID);
    });

    test('should fail if the index pattern does not match the value on state', () => {
      rootState.visualization.indexPattern = 'Some-other-pattern';

      expect(() =>
        saveStateToSavedObject(savedObject, rootState, indexPattern)
      ).toThrowErrorMatchingInlineSnapshot(
        `"indexPattern id should match the value in redux state"`
      );
    });
  });
});
