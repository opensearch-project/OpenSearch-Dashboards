/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { getSavedAugmentVisLoader, getUISettings } from '../../services';
import { ISavedAugmentVis } from '../types';

/**
 * Create an augment vis saved object given an object that
 * implements the ISavedAugmentVis interface
 */
export const createAugmentVisSavedObject = async (AugmentVis: ISavedAugmentVis): Promise<any> => {
  const loader = getSavedAugmentVisLoader();
  const config = getUISettings();

  const isAugmentationEnabled = config.get('visualization:enablePluginAugmentation');
  if (!isAugmentationEnabled) {
    // eslint-disable-next-line no-throw-literal
    throw 'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.';
  }
  const maxAssociatedCount = config.get('visualization:enablePluginAugmentation.maxPluginObjects');

  await loader.findAll().then(async (resp) => {
    if (resp !== undefined) {
      const savedAugmentObjects = get(resp, 'hits', []);
      // gets all the saved object for this visualization
      const savedObjectsForThisVisualization = savedAugmentObjects.filter(
        (savedObj) => get(savedObj, 'visId', '') === AugmentVis.visId
      );

      if (maxAssociatedCount <= savedObjectsForThisVisualization.length) {
        // eslint-disable-next-line no-throw-literal
        throw (
          'Cannot associate the plugin resource to the visualization due to the limit of the' +
          'max amount of associated plugin resources (' +
          maxAssociatedCount +
          ') with ' +
          savedObjectsForThisVisualization.length +
          ' associated to the visualization'
        );
      }
    }
  });

  return await loader.get((AugmentVis as any) as Record<string, unknown>);
};
