/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  IUiSettingsClient,
  NotificationsStart,
  SavedObjectsClientContract,
} from '../../../../core/public';
import { DataPublicPluginStart } from '../../../data/public';
import {
  EmbeddableFactory,
  EmbeddableFactoryDefinition,
  EmbeddableOutput,
  EmbeddableStart,
  ErrorEmbeddable,
  IContainer,
  SavedObjectEmbeddableInput,
} from '../../../embeddable/public';
import { ExpressionsStart } from '../../../expressions/public';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../../visualizations/public';
import { WizardSavedObjectAttributes } from '../../common';
import { TypeServiceStart } from '../services/type_service';
import { DisabledEmbeddable } from './disabled_embeddable';
import { WizardEmbeddable, WizardOutput, WIZARD_EMBEDDABLE } from './wizard_embeddable';
import wizardIcon from '../assets/wizard_icon.svg';

interface StartServices {
  data: DataPublicPluginStart;
  expressions: ExpressionsStart;
  getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'];
  savedObjectsClient: SavedObjectsClientContract;
  notifications: NotificationsStart;
  types: TypeServiceStart;
  uiSettings: IUiSettingsClient;
}

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
    name: 'Wizard',
    includeFields: ['visualizationState'],
    type: 'wizard',
    getIconForSavedObject: () => wizardIcon,
  };

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public async isEditable() {
    // TODO: Add proper access controls
    // return getCapabilities().visualize.save as boolean;
    return true;
  }

  public createFromSavedObject = (
    savedObjectId: string,
    input: Partial<SavedObjectEmbeddableInput> & { id: string },
    parent?: IContainer
  ): Promise<WizardEmbeddable | ErrorEmbeddable | DisabledEmbeddable> => {
    return this.create({ ...input, savedObjectId }, parent);
  };

  public async create(input: SavedObjectEmbeddableInput, parent?: IContainer) {
    // TODO: Use savedWizardLoader here instead
    const {
      data,
      expressions: { ReactExpressionRenderer },
      notifications: { toasts },
      savedObjectsClient,
      types,
      uiSettings,
    } = await this.getStartServices();

    const isLabsEnabled = uiSettings.get<boolean>(VISUALIZE_ENABLE_LABS_SETTING);

    if (!isLabsEnabled) {
      return new DisabledEmbeddable('Wizard', input);
    }

    return new WizardEmbeddable(input, {
      parent,
      data,
      savedObjectsClient,
      ReactExpressionRenderer,
      toasts,
      types,
    });
  }

  public getDisplayName() {
    return i18n.translate('wizard.displayName', {
      defaultMessage: 'Wizard',
    });
  }
}
