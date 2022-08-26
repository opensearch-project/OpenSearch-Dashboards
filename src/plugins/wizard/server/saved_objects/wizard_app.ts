/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectsType } from '../../../../core/server';
import {
  EDIT_PATH,
  PLUGIN_ID,
  WizardSavedObjectAttributes,
  WIZARD_SAVED_OBJECT,
} from '../../common';

export const wizardSavedObjectType: SavedObjectsType = {
  name: WIZARD_SAVED_OBJECT,
  hidden: false,
  namespaceType: 'single',
  management: {
    // icon: '', // TODO: Need a custom icon here - unfortunately a custom SVG won't work without changes to the SavedObjectsManagement plugin
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle: ({ attributes: { title } }: SavedObject<WizardSavedObjectAttributes>) => title,
    getEditUrl: ({ id }: SavedObject) =>
      `/management/opensearch-dashboards/objects/savedWizard/${encodeURIComponent(id)}`,
    getInAppUrl({ id }: SavedObject) {
      return {
        path: `/app/${PLUGIN_ID}${EDIT_PATH}/${encodeURIComponent(id)}`,
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
      visualizationState: {
        type: 'text',
        index: false,
      },
      styleState: {
        type: 'text',
        index: false,
      },
      version: { type: 'integer' },
      kibanaSavedObjectMeta: {
        properties: { searchSourceJSON: { type: 'text', index: false } },
      },
    },
  },
};
