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

/* export const convertFromSerializedDashboard = (
    serializedDashboard: SerializedDashboard
  ): ISavedDashboard => {
    const {
      id,
      timeRestore,
      timeTo,
      timeFrom,
      refreshInterval,
      description,
      panels,
      options,
      uiState,
      lastSavedTitle,
      searchSource,
      query,
      filters,
    } = serializedDashboard;
  
    return {
      id,
      timeRestore,
      timeTo,
      timeFrom,
      description,
      panelsJSON: JSON.stringify(panels),
      optionsJSON: JSON.stringify(options),
      uiStateJSON: JSON.stringify(uiState),
      lastSavedTitle,
      refreshInterval,
      searchSource,
      getQuery: () => query,
      getFilters: () => filters,
    };
  };
  
  export function createSavedDashboardClass(
    services: SavedObjectOpenSearchDashboardsServices
  ): new (id: string) => SavedObjectDashboard {
    const SavedObjectClass = createSavedObjectClass(services);
    class SavedDashboard extends SavedObjectClass {
      public static type = 'dashboard';
      public static mapping: Record<string, any> = {
        title: 'text',
        hits: 'integer',
        description: 'text',
        panelsJSON: 'text',
        optionsJSON: 'text',
        version: 'integer',
        timeRestore: 'boolean',
        timeTo: 'keyword',
        timeFrom: 'keyword',
        refreshInterval: {
          type: 'object',
          properties: {
            display: { type: 'keyword' },
            pause: { type: 'boolean' },
            section: { type: 'integer' },
            value: { type: 'integer' },
          },
        },
      };
      // Order these fields to the top, the rest are alphabetical
      public static fieldOrder = ['title', 'description'];
      public static searchSource = true;
      public showInRecentlyAccessed = true;
  
      constructor(id: string) {
        super({
          type: SavedDashboard.type,
          mapping: SavedDashboard.mapping,
          searchSource: SavedDashboard.searchSource,
          extractReferences,
          injectReferences,
  
          // if this is null/undefined then the SavedObject will be assigned the defaults
          id,
  
          // default values that will get assigned if the doc is new
          defaults: {
            title: '',
            hits: 0,
            description: '',
            panelsJSON: '[]',
            optionsJSON: JSON.stringify({
              // for BWC reasons we can't default dashboards that already exist without this setting to true.
              useMargins: !id,
              hidePanelTitles: false,
            }),
            version: 1,
            timeRestore: false,
            timeTo: undefined,
            timeFrom: undefined,
            refreshInterval: undefined,
          },
        });
        this.getFullPath = () => `/app/dashboardsNew#${createDashboardEditUrl(String(this.id))}`;
      }
  
      getQuery() {
        return this.searchSource!.getOwnField('query') || { query: '', language: 'kuery' };
      }
  
      getFilters() {
        return this.searchSource!.getOwnField('filter') || [];
      }
    }
  
    return (SavedDashboard as unknown) as new (id: string) => SavedObjectDashboard;
  }*/
