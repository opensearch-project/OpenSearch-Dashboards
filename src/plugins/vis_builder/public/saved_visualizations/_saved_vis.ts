/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { EDIT_PATH, PLUGIN_ID, VISBUILDER_SAVED_OBJECT } from '../../common';
import { injectReferences } from './saved_visualization_references';

export function createSavedVisBuilderVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedVisBuilderVis extends SavedObjectClass {
    public static type = VISBUILDER_SAVED_OBJECT;

    // if type:visBuilder has no mapping, we push this mapping into OpenSearch
    public static mapping = {
      title: 'text',
      description: 'text',
      visualizationState: 'text',
      styleState: 'text',
      uiState: 'text',
      version: 'integer',
    };

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title', 'description'];

    // ID is optional, without it one will be generated on save.
    constructor(id: string) {
      super({
        type: SavedVisBuilderVis.type,
        mapping: SavedVisBuilderVis.mapping,
        injectReferences,

        // if this is null/undefined then the SavedObject will be assigned the defaults
        id,

        // default values that will get assigned if the doc is new
        defaults: {
          title: '',
          description: '',
          visualizationState: '{}',
          styleState: '{}',
          uiState: '{}',
          version: 3,
        },
      });
      this.showInRecentlyAccessed = true;
      this.getFullPath = () => `/app/${PLUGIN_ID}${EDIT_PATH}/${this.id}`;
    }
  }

  return SavedVisBuilderVis;
}
