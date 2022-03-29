/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'src/core/server';
import { WIZARD_SAVED_OBJECT } from '../../common';

export const wizardApp: SavedObjectsType = {
  name: WIZARD_SAVED_OBJECT,
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'visVisualBuilder', // TODO: Need a custom icon here
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle: (obj: { attributes: { title: string } }) => obj.attributes.title,
    //   getInAppUrl: TODO: Enable once editing is supported
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
