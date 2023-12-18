/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { getAugmentVisSavedObjs } from '../utils';
import { getSavedAugmentVisLoader } from '../services';
import { SavedObjectDeleteContext } from '../ui_actions_bootstrap';

export const SAVED_OBJECT_DELETE_ACTION = 'SAVED_OBJECT_DELETE_ACTION';

export class SavedObjectDeleteAction implements Action<SavedObjectDeleteContext> {
  public readonly type = SAVED_OBJECT_DELETE_ACTION;
  public readonly id = SAVED_OBJECT_DELETE_ACTION;
  public order = 1;

  public getIconType(): EuiIconType {
    return `trash`;
  }

  public getDisplayName() {
    return i18n.translate('dashboard.actions.deleteSavedObject.name', {
      defaultMessage: 'Clean up augment-vis saved objects associated to a deleted vis',
    });
  }

  public async isCompatible({ type, savedObjectId }: SavedObjectDeleteContext) {
    return type === 'visualization' && !!savedObjectId;
  }

  /**
   * If deletion of a vis saved object has been triggered, we want to clean up
   * any augment-vis saved objects that have a reference to this vis since it
   * is now stale.
   * TODO: this should be automatically handled by the saved objects plugin, instead
   * of this specific scenario in the vis_augmenter plugin. Tracking issue:
   * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4499
   */
  public async execute({ type, savedObjectId }: SavedObjectDeleteContext) {
    if (!(await this.isCompatible({ type, savedObjectId }))) {
      throw new IncompatibleActionError();
    }

    try {
      const loader = getSavedAugmentVisLoader();
      const augmentVisObjs = await getAugmentVisSavedObjs(savedObjectId, loader);
      const augmentVisIdsToDelete = augmentVisObjs.map(
        (augmentVisObj) => augmentVisObj.id as string
      );

      if (!isEmpty(augmentVisIdsToDelete)) loader.delete(augmentVisIdsToDelete);
      // silently fail. this is because this is doing extra cleanup on objects unrelated
      // to the user flow so we dont want to add confusing errors on UI.
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
}
