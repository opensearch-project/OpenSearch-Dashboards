/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { getAllAugmentVisSavedObjs } from '../utils';
import { getSavedAugmentVisLoader } from '../services';

export const SAVED_OBJECT_DELETE_ACTION = 'SAVED_OBJECT_DELETE_ACTION';

interface SavedObjectContext {
  type: string;
  savedObjectId: string;
}

export class SavedObjectDeleteAction implements Action<SavedObjectContext> {
  public readonly type = SAVED_OBJECT_DELETE_ACTION;
  public readonly id = SAVED_OBJECT_DELETE_ACTION;
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

  public async isCompatible({ type, savedObjectId }: SavedObjectContext) {
    return type === 'visualization' && savedObjectId;
  }

  /**
   * If deletion of a vis saved object has been triggered, we want to clean up
   * any augment-vis saved objects that have a reference to this vis since it
   * is now stale.
   */
  public async execute({ type, savedObjectId }: SavedObjectContext) {
    if (!(await this.isCompatible({ type, savedObjectId }))) {
      throw new IncompatibleActionError();
    }

    // console.log('deleting augment-vis saved objs from deleted vis id: ', savedObjectId);

    const loader = getSavedAugmentVisLoader();
    const allAugmentVisObjs = await getAllAugmentVisSavedObjs(loader);
    const augmentVisIdsToDelete = allAugmentVisObjs
      .filter((augmentVisObj) => augmentVisObj.visId === savedObjectId)
      .map((augmentVisObj) => augmentVisObj.id as string);

    if (!isEmpty(augmentVisIdsToDelete)) loader.delete(augmentVisIdsToDelete);
  }
}
