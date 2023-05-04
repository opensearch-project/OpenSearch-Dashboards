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
      originPlugin: 'text',
      pluginResource: 'text',
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
          originPlugin: get(opts, 'originPlugin', ''),
          pluginResource: get(opts, 'pluginResource', {}),
          visId: get(opts, 'visId', ''),
          visLayerExpressionFn: get(opts, 'visLayerExpressionFn', {}),
          version: 1,
        },
      });
      this.showInRecentlyAccessed = false;
    }
  }

  return SavedAugmentVis as new (opts: Record<string, unknown> | string) => SavedObject;
}
