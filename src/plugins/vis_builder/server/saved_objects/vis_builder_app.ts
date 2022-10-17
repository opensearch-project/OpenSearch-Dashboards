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
import { wizardSavedObjectTypeMigrations } from './vis_builder_migration';

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
  migrations: wizardSavedObjectTypeMigrations,
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
      // Need to add a kibanaSavedObjectMeta attribute here to follow the current saved object flow
      // When we save a saved object, the saved object plugin will extract the search source into two parts
      // Some information will be put into kibanaSavedObjectMeta while others will be created as a reference object and pushed to the reference array
      kibanaSavedObjectMeta: {
        properties: { searchSourceJSON: { type: 'text', index: false } },
      },
    },
  },
};
