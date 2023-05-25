/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { getSavedAugmentVisLoader } from '../services';
import { VisLayerErrorTypes, isVisLayerWithError } from '../types';
import { PluginResourceDeleteContext } from '../ui_actions_bootstrap';

export const PLUGIN_RESOURCE_DELETE_ACTION = 'PLUGIN_RESOURCE_DELETE_ACTION';

export class PluginResourceDeleteAction implements Action<PluginResourceDeleteContext> {
  public readonly type = PLUGIN_RESOURCE_DELETE_ACTION;
  public readonly id = PLUGIN_RESOURCE_DELETE_ACTION;
  public order = 1;

  public getIconType() {
    return undefined;
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.deleteSavedObject.name', {
      defaultMessage: 'Clean up augment-vis saved objects associated to a deleted vis',
    });
  }

  public async isCompatible({ savedObjs, visLayers }: PluginResourceDeleteContext) {
    return !isEmpty(savedObjs) && !isEmpty(visLayers);
  }

  /**
   * If we have just collected all of the saved objects and generated vis layers,
   * sweep through them all and if any of the resources are deleted, delete those
   * corresponding saved objects
   */
  public async execute({ savedObjs, visLayers }: PluginResourceDeleteContext) {
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
