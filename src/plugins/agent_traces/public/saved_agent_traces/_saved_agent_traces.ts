/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export const SAVED_OBJECT_TYPE = 'agentTraces';

export function createSavedAgentTracesClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedAgentTraces extends SavedObjectClass {
    public static type: string = 'agentTraces';
    public static mapping = {
      title: 'text',
      description: 'text',
      hits: 'integer',
      columns: 'keyword',
      sort: 'keyword',
      version: 'integer',
      type: 'text',
      visualization: 'text',
      uiState: 'text',
    };
    // Order these fields to the top, the rest are alphabetical
    public static fieldOrder = ['title', 'description'];
    public static searchSource = true;

    public id: string;
    public showInRecentlyAccessed: boolean;

    constructor(id: string) {
      super({
        id,
        type: SavedAgentTraces.type,
        mapping: SavedAgentTraces.mapping,
        searchSource: true,
        defaults: {
          title: '',
          description: '',
          columns: [],
          hits: 0,
          sort: [],
          version: 1,
          type: '',
          visualization: '',
          uiState: '',
        },
      });
      this.showInRecentlyAccessed = true;
      this.id = id;
      this.getFullPath = () => `/app/agentTraces#/view/${String(this.id)}`;
    }
  }

  return SavedAgentTraces as new (id: string) => SavedObject;
}
