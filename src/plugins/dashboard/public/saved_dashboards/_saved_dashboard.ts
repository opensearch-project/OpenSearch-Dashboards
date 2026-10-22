/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SerializedDashboard } from '../dashboard';
import { SavedObjectDashboard } from './saved_dashboard';
import { normalizePersistedVariables } from '../variables/variable_query_utils';

export const convertToSerializedDashboard = (
  savedDashboard: SavedObjectDashboard
): SerializedDashboard => {
  const {
    id,
    timeRestore,
    timeTo,
    timeFrom,
    description,
    refreshInterval,
    panelsJSON,
    optionsJSON,
    variablesJSON,
    layoutJSON,
    uiStateJSON,
    searchSource,
    lastSavedTitle,
  } = savedDashboard;

  return {
    id,
    timeRestore,
    timeTo,
    timeFrom,
    description,
    refreshInterval,
    panels: JSON.parse(panelsJSON || '{}'),
    options: JSON.parse(optionsJSON || '{}'),
    variables: variablesJSON
      ? normalizePersistedVariables(JSON.parse(variablesJSON).variables)
      : undefined,
    layout: layoutJSON ? JSON.parse(layoutJSON) : undefined,
    uiState: JSON.parse(uiStateJSON || '{}'),
    lastSavedTitle,
    searchSource,
    query: savedDashboard.getQuery(),
    filters: savedDashboard.getFilters(),
  };
};
