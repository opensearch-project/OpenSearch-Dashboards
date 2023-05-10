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
import { extractReferences, injectReferences } from './saved_augment_vis_references';
import { AugmentVisSavedObjectAttributes } from '../../common';

const name = 'augment-vis';

export function createSavedAugmentVisClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedAugmentVis extends SavedObjectClass {
    public static type: string = name;
    public static mapping: AugmentVisSavedObjectAttributes;

    constructor(opts: AugmentVisSavedObjectAttributes) {
      super({
        type: SavedAugmentVis.type,
        mapping: SavedAugmentVis.mapping,
        extractReferences,
        injectReferences,
        id: (opts.id as string) || '',
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

  return SavedAugmentVis as new (opts: AugmentVisSavedObjectAttributes) => SavedObject;
}
