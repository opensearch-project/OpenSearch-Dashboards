/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { EDIT_PATH, PLUGIN_ID, WIZARD_SAVED_OBJECT } from '../../common';
import { injectReferences } from './saved_visualization_references';

export function createSavedWizardVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedWizardVis extends SavedObjectClass {
    public static type = WIZARD_SAVED_OBJECT;

    // if type:wizard has no mapping, we push this mapping into OpenSearch
    public static mapping = {
      title: 'text',
      description: 'text',
      visualizationState: 'text',
      styleState: 'text',
      version: 'integer',
    };

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title', 'description'];

    // ID is optional, without it one will be generated on save.
    constructor(id: string) {
      super({
        type: SavedWizardVis.type,
        mapping: SavedWizardVis.mapping,
        injectReferences,

        // if this is null/undefined then the SavedObject will be assigned the defaults
        id,

        // default values that will get assigned if the doc is new
        defaults: {
          title: '',
          description: '',
          visualizationState: '{}',
          styleState: '{}',
          version: 1,
        },
      });
      this.showInRecentlyAccessed = true;
      this.getFullPath = () => `/app/${PLUGIN_ID}${EDIT_PATH}/${this.id}`;
    }
  }

  return SavedWizardVis;
}
