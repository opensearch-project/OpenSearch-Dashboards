/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectsType } from '../../../../core/server';
import { WizardSavedObjectAttributes, WIZARD_SAVED_OBJECT } from '../../common';

export const wizardSavedObjectType: SavedObjectsType = {
  name: WIZARD_SAVED_OBJECT,
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'visVisualBuilder', // TODO: Need a custom icon here
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle: ({ attributes: { title } }: SavedObject<WizardSavedObjectAttributes>) => title,
    getEditUrl: ({ id }: SavedObject) =>
      `/management/opensearch-dashboards/objects/savedWizard/${encodeURIComponent(id)}`,
    getInAppUrl({ id }: SavedObject) {
      return {
        path: `/app/wizard#/edit/${encodeURIComponent(id)}`,
        uiCapabilitiesPath: 'wizard.show',
      };
    },
  },
  migrations: {},
  mappings: {
    properties: {
      title: {
        type: 'text',
      },
      description: {
        type: 'text',
      },
      //   TODO: Determine what needs to be pulled out of state and added directly into the mapping
      state: {
        type: 'text',
        index: false,
      },
    },
  },
};
