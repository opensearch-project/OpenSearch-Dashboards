/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @name SavedAugmentVis
 *
 * @extends SavedObject.
 */
import { get } from 'lodash';
import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { IIndexPattern } from '../../../data/public';
import { extractReferences, injectReferences } from './saved_augment_vis_references';

const name = 'augment-vis';

export function createSavedAugmentVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedAugmentVis extends SavedObjectClass {
    public static type: string = name;
    public static mapping: Record<string, string> = {
      description: 'text',
      pluginResourceId: 'text',
      visId: 'keyword',
      visLayerExpressionFn: 'text',
      version: 'integer',
    };

    constructor(opts: Record<string, unknown> | string = {}) {
      if (typeof opts !== 'object') {
        opts = { id: opts };
      }
      super({
        type: SavedAugmentVis.type,
        mapping: SavedAugmentVis.mapping,
        extractReferences,
        injectReferences,
        id: (opts.id as string) || '',
        indexPattern: opts.indexPattern as IIndexPattern,
        defaults: {
          description: get(opts, 'description', ''),
          pluginResourceId: get(opts, 'pluginResourceId', ''),
          visId: get(opts, 'visId', ''),
          visLayerExpressionFn: get(opts, 'visLayerExpressionFn', {}),
          version: 1,
        },
      });
      // TODO: determine if this saved obj should be visible in saved_obj_management plugin.
      // if not, we can set showInRecentlyAccessed to false and not persist any edit URL
      // if yes, we will need to revisit this, and possibly provide an edit url if editing
      // via saved objects management plugin.
      this.showInRecentlyAccessed = false;
      //   this.getFullPath = () => {
      //     return `/app/visualize#/edit/${this.id}`;
      //   };
    }
  }

  return SavedAugmentVis as new (opts: Record<string, unknown> | string) => SavedObject;
}
