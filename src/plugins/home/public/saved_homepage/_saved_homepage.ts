/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export interface SerializedHeroSection {
  id: string;
}

export interface SerializedSection {
  id: string;
}

export interface SavedHomepage extends SavedObject {
  // NOTE: this type allows both an object and an array of objects. As of now, we only support a single hero, but in the future we'll allow for a carousel of heroes.
  heroes: SerializedHeroSection[] | SerializedHeroSection;
  sections: SerializedSection[] | SerializedSection;
}

export function createSavedHomepageClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedHomepage extends SavedObjectClass {
    public static type: string = 'homepage';
    public static mapping: Record<string, string> = {
      heroes: 'object',
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
          heroes: [],
          sections: [
            { id: 'home:workWithData' },
            { id: 'home:recentWork' },
            { id: 'home:learnBasics' },
          ],
        },
      });
    }
  }

  return SavedHomepage as new (opts: Record<string, unknown> | string) => SavedObject;
}
