/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { getSavedAugmentVisLoader } from '../services';
import { PluginResourceDeleteContext } from '../ui_actions_bootstrap';
import { cleanupStaleObjects } from '../utils';

export const PLUGIN_RESOURCE_DELETE_ACTION = 'PLUGIN_RESOURCE_DELETE_ACTION';

export class PluginResourceDeleteAction implements Action<PluginResourceDeleteContext> {
  public readonly type = PLUGIN_RESOURCE_DELETE_ACTION;
  public readonly id = PLUGIN_RESOURCE_DELETE_ACTION;
  public order = 1;

  public getIconType(): EuiIconType {
    return `trash`;
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.deleteSavedObject.name', {
      defaultMessage:
        'Clean up all augment-vis saved objects associated to the deleted visualization',
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
    if (!(await this.isCompatible({ savedObjs, visLayers }))) {
      throw new IncompatibleActionError();
    }
    cleanupStaleObjects(savedObjs, visLayers, getSavedAugmentVisLoader());
  }
}
