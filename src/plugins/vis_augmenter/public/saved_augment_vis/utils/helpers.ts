/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { ISavedAugmentVis } from '../types';
import {
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
  PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING,
} from '../../../common/constants';
import { SavedAugmentVisLoader } from '../saved_augment_vis';
import { getSavedAugmentVisLoader, getUISettings } from '../../services';
import { IUiSettingsClient } from '../../../../../core/public';

/**
 * Create an augment vis saved object given an object that
 * implements the ISavedAugmentVis interface
 */
export const createAugmentVisSavedObject = async (
  AugmentVis: ISavedAugmentVis,
  savedObjLoader?: SavedAugmentVisLoader,
  uiSettings?: IUiSettingsClient
): Promise<any> => {
  // Using optional services provided, or the built-in services from this plugin
  const loader = savedObjLoader !== undefined ? savedObjLoader : getSavedAugmentVisLoader();
  const config = uiSettings !== undefined ? uiSettings : getUISettings();
  const isAugmentationEnabled = config.get(PLUGIN_AUGMENTATION_ENABLE_SETTING);
  if (!isAugmentationEnabled) {
    throw new Error(
      'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
    );
  }
  const maxAssociatedCount = config.get(PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING);

  await loader
    .findAll('', 100, [], {
      type: 'visualization',
      id: AugmentVis.visId as string,
    })
    .then(async (resp) => {
      if (resp !== undefined) {
        const savedObjectsForThisVisualization = get(resp, 'hits', []);

        if (maxAssociatedCount <= savedObjectsForThisVisualization.length) {
          throw new Error(
            `Cannot associate the plugin resource to the visualization due to the limit of the max
          amount of associated plugin resources (${maxAssociatedCount}) with
          ${savedObjectsForThisVisualization.length} associated to the visualization`
          );
        }
      }
    });

  return await loader.get((AugmentVis as any) as Record<string, unknown>);
};
