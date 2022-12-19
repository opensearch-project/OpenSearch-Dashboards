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

export function createSavedAugmentVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedAugmentVis extends SavedObjectClass {
    public static type: string = 'augment-vis';
    public static mapping: Record<string, string> = {
      description: 'text',
      pluginResourceId: 'text',
      visId: 'keyword',
      visLayerExpressionFn: 'object',
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
      // probably set to false since this saved obj should be hidden by default
      this.showInRecentlyAccessed = false;

      // we probably don't need this below field. we aren't going to need a full path
      // since we aren't going to allow editing by default
      //   this.getFullPath = () => {
      //     return `/app/visualize#/edit/${this.id}`;
      //   };
    }
  }

  return SavedAugmentVis as new (opts: Record<string, unknown> | string) => SavedObject;
}
