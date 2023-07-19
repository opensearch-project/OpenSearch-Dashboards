/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SerializedDashboard } from '../dashboard';
import { SavedObjectDashboard } from './saved_dashboard';

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
    uiState: JSON.parse(uiStateJSON || '{}'),
    lastSavedTitle,
    searchSource,
    query: savedDashboard.getQuery(),
    filters: savedDashboard.getFilters(),
  };
};
