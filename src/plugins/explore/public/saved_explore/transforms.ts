/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataView as Dataset, IndexPattern } from 'src/plugins/data/common';
import { InvalidJSONProperty } from '../../../opensearch_dashboards_utils/public';
import { LegacyState } from '../application/utils/state_management/slices';
import { SavedExplore, SavedExploreAttributes } from '../types/saved_explore_types';
import { TabDefinition } from '../services/tab_registry/tab_registry_service';
import {
  ChartType,
  StyleOptions,
} from '../components/visualizations/utils/use_visualization_types';

export interface ExploreState {
  legacy: LegacyState;
  ui: Record<string, unknown>; // UI state for panels, layout, etc.
  query: Record<string, unknown>; // Query state for filters, time range, etc.
}

interface VisState {
  chartType?: ChartType;
  styleOptions?: StyleOptions;
  axesMapping?: Record<string, string>;
}

export const saveStateToSavedObject = (
  obj: SavedExplore,
  flavorId: string,
  tabDefinition: TabDefinition,
  visState?: VisState,
  dataset?: IndexPattern | Dataset,
  activeTabId?: string
): SavedExplore => {
  // Serialize the state into the saved object
  obj.type = flavorId;
  obj.visualization = JSON.stringify({
    // TODO: Add title to saved object
    // Visualization has an independent title?
    title: '',
    chartType: visState?.chartType ?? 'line',
    params: visState?.styleOptions ?? {},
    axesMapping: visState?.axesMapping,
  });

  obj.uiState = JSON.stringify({
    activeTab: activeTabId || tabDefinition?.id,
  });
  obj.searchSourceFields = { index: dataset };

  obj.version = 1;

  return obj;
};

export interface ExploreSavedVis extends Pick<SavedExploreAttributes, 'title' | 'description'> {
  id?: string;
  state: ExploreState;
  searchSourceFields?: Record<string, unknown>;
}

export const getStateFromSavedObject = (obj: SavedExploreAttributes): ExploreSavedVis => {
  const { id, title, description, kibanaSavedObjectMeta } = obj;

  try {
    const legacyState = JSON.parse(obj.legacyState || '{}') as LegacyState;
    const uiState = JSON.parse(obj.uiState || '{}');
    const queryState = JSON.parse(obj.queryState || '{}');

    return {
      id,
      title,
      description,
      searchSourceFields: kibanaSavedObjectMeta,
      state: {
        legacy: legacyState,
        ui: uiState,
        query: queryState,
      },
    };
  } catch (error) {
    throw new InvalidJSONProperty(
      i18n.translate('explore.getStateFromSavedObject.genericJSONError', {
        defaultMessage:
          'Something went wrong while loading your saved object. The object may be corrupted or does not match the latest schema',
      })
    );
  }
};

// Helper function to extract legacy properties from serialized state
export const getLegacyPropertiesFromSavedObject = (savedExplore: SavedExplore) => {
  if (!savedExplore.legacyState) {
    return {
      columns: [],
      sort: [],
    };
  }

  try {
    const legacyState = JSON.parse(savedExplore.legacyState) as LegacyState;
    return {
      columns: legacyState.columns || [],
      sort: legacyState.sort || [],
    };
  } catch (error) {
    return {
      columns: [],
      sort: [],
    };
  }
};

// Helper function to update legacy properties in serialized state
export const updateLegacyPropertiesInSavedObject = (
  savedExplore: SavedExplore,
  updates: Partial<LegacyState>
): SavedExplore => {
  try {
    const currentLegacyState = savedExplore.legacyState
      ? (JSON.parse(savedExplore.legacyState) as LegacyState)
      : ({} as LegacyState);

    const updatedLegacyState = {
      ...currentLegacyState,
      ...updates,
    };

    savedExplore.legacyState = JSON.stringify(updatedLegacyState);
    return savedExplore;
  } catch (error) {
    return savedExplore;
  }
};
