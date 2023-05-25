/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { getSavedAugmentVisLoader } from '../services';
import { AugmentVisSavedObject } from '../saved_augment_vis';
import { VisLayer, VisLayerErrorTypes, isVisLayerWithError } from '../types';

export const PLUGIN_RESOURCE_DELETE_ACTION = 'PLUGIN_RESOURCE_DELETE_ACTION';

interface PluginResourceContext {
  savedObjs: AugmentVisSavedObject[];
  visLayers: VisLayer[];
}

export class PluginResourceDeleteAction implements Action<PluginResourceContext> {
  public readonly type = PLUGIN_RESOURCE_DELETE_ACTION;
  public readonly id = PLUGIN_RESOURCE_DELETE_ACTION;
  public order = 1;

  constructor(private core: CoreStart) {}

  public getIconType() {
    return undefined;
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.deleteSavedObject.name', {
      defaultMessage: 'Clean up augment-vis saved objects associated to a deleted vis',
    });
  }

  public async isCompatible({ savedObjs, visLayers }: PluginResourceContext) {
    return !isEmpty(savedObjs) && !isEmpty(visLayers);
  }

  /**
   * If we have just collected all of the saved objects and generated vis layers,
   * sweep through them all and if any of the resources are deleted, delete those
   * corresponding saved objects
   */
  public async execute({ savedObjs, visLayers }: PluginResourceContext) {
    const staleVisLayers = visLayers
      .filter((visLayer) => isVisLayerWithError(visLayer))
      .filter(
        (visLayerWithError) => visLayerWithError.error?.type === VisLayerErrorTypes.RESOURCE_DELETED
      );

    if (!(await this.isCompatible({ savedObjs, visLayers: staleVisLayers }))) {
      throw new IncompatibleActionError();
    }

    const loader = getSavedAugmentVisLoader();
    const objIdsToDelete = [] as string[];
    staleVisLayers.forEach((staleVisLayer) => {
      // Match the VisLayer to its origin saved obj to extract the to-be-deleted saved obj ID
      const deletedPluginResourceId = staleVisLayer.pluginResource.id;
      const savedObjId = savedObjs.find(
        (savedObj) => savedObj.pluginResource.id === deletedPluginResourceId
      )?.id;
      if (savedObjId !== undefined) objIdsToDelete.push(savedObjId);
    });
    loader.delete(objIdsToDelete);
  }
}
