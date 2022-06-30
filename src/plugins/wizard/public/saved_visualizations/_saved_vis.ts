/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export function createSavedWizardVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedWizardVis extends SavedObjectClass {
    public static type = 'wizard';

    // if type:wizard has no mapping, we push this mapping into OpenSearch
    public static mapping = {
      title: 'text',
      description: 'text',
      state: 'text',
      //   savedSearchId: 'keyword',
      //   version: 'integer',
    };

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title', 'description'];

    // ID is optional, without it one will be generated on save.
    constructor(id: string) {
      super({
        type: SavedWizardVis.type,
        mapping: SavedWizardVis.mapping,

        // if this is null/undefined then the SavedObject will be assigned the defaults
        id,

        // default values that will get assigned if the doc is new
        defaults: {
          title: '',
          description: '',
          state: '{}',
          //   savedSearchId,
          //   version: 1,
        },
      });
      this.showInRecentlyAccessed = true;
      this.getFullPath = () => `/app/wizard#/edit/${this.id}`;
    }
  }

  return SavedWizardVis;
}
