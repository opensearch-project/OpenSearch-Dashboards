/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer';
import { IndexPattern } from '../../../data/public';
import { RootState, VisualizationState } from '../application/utils/state_management';
import { VisBuilderVisSavedObject } from '../types';

export const saveStateToSavedObject = (
  obj: VisBuilderVisSavedObject,
  state: RootState,
  indexPattern: IndexPattern
): VisBuilderVisSavedObject => {
  if (state.visualization.indexPattern !== indexPattern.id)
    throw new Error('indexPattern id should match the value in redux state');

  obj.visualizationState = JSON.stringify(
    produce(state.visualization, (draft: VisualizationState) => {
      delete draft.indexPattern;
    })
  );
  obj.styleState = JSON.stringify(state.style);
  obj.searchSourceFields = { index: indexPattern };

  return obj;
};
