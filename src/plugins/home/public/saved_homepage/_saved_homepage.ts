/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export interface SavedHomepage extends SavedObject {
  // TODO: add types for heros and sections
  heros: unknown[];
  sections: unknown[];
}

export function createSavedHomepageClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedHomepage extends SavedObjectClass {
    public static type: string = 'homepage';
    public static mapping: Record<string, string> = {
      heros: 'object',
      sections: 'object',
    };

    constructor(opts: Record<string, unknown> | string) {
      if (typeof opts !== 'object') {
        opts = { id: opts };
      }

      super({
        type: SavedHomepage.type,
        mapping: SavedHomepage.mapping,
        id: (opts.id as string) || '',
        defaults: {
          heros: [],
          sections: [],
        },
      });
    }
  }

  return SavedHomepage as new (opts: Record<string, unknown> | string) => SavedObject;
}
