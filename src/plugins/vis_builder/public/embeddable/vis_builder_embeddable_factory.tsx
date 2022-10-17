/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EmbeddableFactory,
  EmbeddableFactoryDefinition,
  EmbeddableOutput,
  ErrorEmbeddable,
  IContainer,
  SavedObjectEmbeddableInput,
} from '../../../embeddable/public';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../../visualizations/public';
import {
  EDIT_PATH,
  PLUGIN_ID,
  PLUGIN_NAME,
  WizardSavedObjectAttributes,
  WIZARD_SAVED_OBJECT,
} from '../../common';
import { DisabledEmbeddable } from './disabled_embeddable';
import { WizardEmbeddable, WizardOutput, WIZARD_EMBEDDABLE } from './vis_builder_embeddable';
import wizardIcon from '../assets/wizard_icon.svg';
import { getHttp, getSavedWizardLoader, getTimeFilter, getUISettings } from '../plugin_services';

// TODO: use or remove?
export type WizardEmbeddableFactory = EmbeddableFactory<
  SavedObjectEmbeddableInput,
  WizardOutput | EmbeddableOutput,
  WizardEmbeddable | DisabledEmbeddable,
  WizardSavedObjectAttributes
>;

export class WizardEmbeddableFactoryDefinition
  implements
    EmbeddableFactoryDefinition<
      SavedObjectEmbeddableInput,
      WizardOutput | EmbeddableOutput,
      WizardEmbeddable | DisabledEmbeddable,
      WizardSavedObjectAttributes
    > {
  public readonly type = WIZARD_EMBEDDABLE;
  public readonly savedObjectMetaData = {
    // TODO: Update to include most vis functionality
    name: PLUGIN_NAME,
    includeFields: ['visualizationState'],
    type: WIZARD_SAVED_OBJECT,
    getIconForSavedObject: () => wizardIcon,
  };

  // TODO: Would it be better to explicitly declare start service dependencies?
  constructor() {}

  public canCreateNew() {
    // Because wizard creation starts with the visualization modal, no need to have a separate entry for wizard until it's separate
    return false;
  }

  public async isEditable() {
    // TODO: Add proper access controls
    // return getCapabilities().visualize.save as boolean;
    return true;
  }

  public async createFromSavedObject(
    savedObjectId: string,
    input: Partial<SavedObjectEmbeddableInput> & { id: string },
    parent?: IContainer
  ): Promise<WizardEmbeddable | ErrorEmbeddable | DisabledEmbeddable> {
    try {
      const savedWizard = await getSavedWizardLoader().get(savedObjectId);

      const editPath = `${EDIT_PATH}/${savedObjectId}`;

      const editUrl = getHttp().basePath.prepend(`/app/${PLUGIN_ID}${editPath}`);

      const isLabsEnabled = getUISettings().get<boolean>(VISUALIZE_ENABLE_LABS_SETTING);

      if (!isLabsEnabled) {
        return new DisabledEmbeddable(PLUGIN_NAME, input);
      }

      return new WizardEmbeddable(
        getTimeFilter(),
        {
          savedWizard,
          editUrl,
          editPath,
          editable: true,
        },
        {
          ...input,
          savedObjectId: input.savedObjectId ?? '',
        },
        {
          parent,
        }
      );
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e as Error, input, parent);
    }
  }

  public async create(_input: SavedObjectEmbeddableInput, _parent?: IContainer) {
    return undefined;
  }

  public getDisplayName() {
    return i18n.translate('wizard.displayName', {
      defaultMessage: PLUGIN_ID,
    });
  }
}
