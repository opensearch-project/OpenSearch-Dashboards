/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { getStubIndexPattern } from '../../../data/public/test_utils';
import { IndexPattern } from '../../../data/public';
import { RootState } from '../application/utils/state_management';
import { VisBuilderSavedObject } from '../types';
import { getStateFromSavedObject, saveStateToSavedObject } from './transforms';
import { VisBuilderSavedObjectAttributes } from '../../common';

const getConfig = (cfg: any) => cfg;

describe('transforms', () => {
  describe('saveStateToSavedObject', () => {
    let TEST_INDEX_PATTERN_ID;
    let savedObject;
    let rootState: RootState;
    let indexPattern: IndexPattern;

    beforeEach(() => {
      TEST_INDEX_PATTERN_ID = 'test-pattern';
      savedObject = {} as VisBuilderSavedObject;
      rootState = {
        metadata: { editor: { state: 'loading', errors: {} } },
        style: {},
        visualization: {
          searchField: '',
          indexPattern: TEST_INDEX_PATTERN_ID,
          activeVisualization: {
            name: 'bar',
            aggConfigParams: [],
          },
        },
        ui: {},
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
      expect(savedObject.uiState).toEqual(JSON.stringify(rootState.ui));
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

  describe('getStateFromSavedObject', () => {
    const defaultVBSaveObj = {
      styleState: '{}',
      visualizationState: JSON.stringify({
        searchField: '',
      }),
      uiState: '{}',
      searchSourceFields: {
        index: 'test-index',
      },
    } as VisBuilderSavedObjectAttributes;

    test('should return saved object with state', () => {
      const { state } = getStateFromSavedObject(defaultVBSaveObj);

      expect(state).toMatchInlineSnapshot(`
        Object {
          "style": Object {},
          "ui": Object {},
          "visualization": Object {
            "indexPattern": "test-index",
            "searchField": "",
          },
        }
      `);
    });

    test('should throw error if state is invalid', () => {
      const mockVBSaveObj = {
        ...defaultVBSaveObj,
      };
      delete mockVBSaveObj.visualizationState;

      expect(() => getStateFromSavedObject(mockVBSaveObj)).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected end of JSON input"`
      );
    });

    test('should throw error if index pattern is missing', () => {
      const mockVBSaveObj = {
        ...defaultVBSaveObj,
      };
      delete mockVBSaveObj.searchSourceFields;

      expect(() => getStateFromSavedObject(mockVBSaveObj)).toThrowErrorMatchingInlineSnapshot(
        `"The saved object is missing an index pattern"`
      );
    });
  });
});
