/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../data/public';
import { InvalidJSONProperty } from '../../../opensearch_dashboards_utils/public';
import {
  RenderState,
  VisBuilderRootState,
  VisualizationState,
  MetadataState,
} from '../application/utils/state_management';
import { validateVisBuilderState } from '../application/utils/validations';
import { VisBuilderSavedObject } from '../types';
import { VisBuilderSavedObjectAttributes } from '../../common';

export const saveStateToSavedObject = (
  obj: VisBuilderSavedObject,
  state: VisBuilderRootState,
  indexPattern: IndexPattern
): VisBuilderSavedObject => {
  if (state.metadata.indexPattern !== indexPattern.id)
    throw new Error('indexPattern id should match the value in redux state');

  obj.visualizationState = JSON.stringify(state.visualization);
  obj.styleState = JSON.stringify(state.style);
  obj.searchSourceFields = { index: indexPattern };
  obj.uiState = JSON.stringify(state.ui);

  return obj;
};

export interface VisBuilderSavedVis
  extends Pick<VisBuilderSavedObjectAttributes, 'id' | 'title' | 'description'> {
  state: RenderState;
}

export const getStateFromSavedObject = (
  obj: VisBuilderSavedObjectAttributes
): VisBuilderSavedVis => {
  const { id, title, description } = obj;
  const styleState = JSON.parse(obj.styleState || '{}');
  const uiState = JSON.parse(obj.uiState || '{}');
  const vizStateWithoutIndex = JSON.parse(obj.visualizationState || '');
  const visualizationState: VisualizationState = {
    searchField: '',
    ...vizStateWithoutIndex,
  };
  const metadataState: MetadataState = {
    indexPattern: obj.searchSourceFields?.index,
  };

  const validateResult = validateVisBuilderState({ styleState, visualizationState, uiState });

  if (!validateResult.valid) {
    throw new InvalidJSONProperty(
      validateResult.errorMsg ||
        i18n.translate('visBuilder.getStateFromSavedObject.genericJSONError', {
          defaultMessage:
            'Something went wrong while loading your saved object. The object may be corrupted or does not match the latest schema',
        })
    );
  }

  if (!metadataState.indexPattern) {
    throw new Error(
      i18n.translate('visBuilder.getStateFromSavedObject.missingIndexPattern', {
        defaultMessage: 'The saved object is missing an index pattern',
      })
    );
  }

  return {
    id,
    title,
    description,
    state: {
      visualization: visualizationState,
      style: styleState,
      ui: uiState,
      metadata: metadataState,
    },
  };
};
