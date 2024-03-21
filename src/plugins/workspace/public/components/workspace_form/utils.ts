/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_SELECTED_FEATURES_IDS } from '../../../common/constants';

import { WorkspaceFeature, WorkspaceFeatureGroup, WorkspaceFormErrors } from './types';

export const isWorkspaceFeatureGroup = (
  featureOrGroup: WorkspaceFeature | WorkspaceFeatureGroup
): featureOrGroup is WorkspaceFeatureGroup => 'features' in featureOrGroup;

export const isDefaultSelectedFeatureId = (id: string) => {
  return DEFAULT_SELECTED_FEATURES_IDS.indexOf(id) > -1;
};

export const appendDefaultFeatureIds = (ids: string[]) => {
  // concat default checked ids and unique the result
  return Array.from(new Set(ids.concat(DEFAULT_SELECTED_FEATURES_IDS)));
};

// Validate name and description fields according related field UI description
export const isValidNameOrDescription = (input?: string) => {
  const regex = /^[0-9a-zA-Z()_\[\]\-\s]+$/;
  return typeof input === 'string' && regex.test(input);
};

export const getNumberOfErrors = (formErrors: WorkspaceFormErrors) => {
  let numberOfErrors = 0;
  if (formErrors.name) {
    numberOfErrors += 1;
  }
  if (formErrors.description) {
    numberOfErrors += 1;
  }
  return numberOfErrors;
};
