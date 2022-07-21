/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { NotificationsStart, SavedObjectsClientContract } from '../../../../core/public';
import { DataPublicPluginStart } from '../../../data/public';
import {
  EmbeddableFactory,
  EmbeddableFactoryDefinition,
  EmbeddableStart,
  ErrorEmbeddable,
  IContainer,
} from '../../../embeddable/public';
import { ExpressionsStart } from '../../../expressions/public';
import { WizardSavedObjectAttributes } from '../../common';
import { TypeServiceStart } from '../services/type_service';
import {
  WizardEmbeddable,
  WizardInput,
  WizardOutput,
  WIZARD_EMBEDDABLE,
} from './wizard_embeddable';

interface StartServices {
  data: DataPublicPluginStart;
  expressions: ExpressionsStart;
  getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'];
  savedObjectsClient: SavedObjectsClientContract;
  notifications: NotificationsStart;
  types: TypeServiceStart;
}

// TODO: use or remove?
export type WizardEmbeddableFactory = EmbeddableFactory<
  WizardInput,
  WizardOutput,
  WizardEmbeddable,
  WizardSavedObjectAttributes
>;

export class WizardEmbeddableFactoryDefinition
  implements
    EmbeddableFactoryDefinition<
      WizardInput,
      WizardOutput,
      WizardEmbeddable,
      WizardSavedObjectAttributes
    > {
  public readonly type = WIZARD_EMBEDDABLE;
  public readonly savedObjectMetaData = {
    // TODO: Update to include most vis functionality
    name: 'Wizard',
    includeFields: ['visualizationState'],
    type: 'wizard',
    getIconForSavedObject: () => 'pencil',
  };

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public async isEditable() {
    // TODO: Add proper access controls
    // return getCapabilities().visualize.save as boolean;
    return true;
  }

  public createFromSavedObject = (
    savedObjectId: string,
    input: Partial<WizardInput> & { id: string },
    parent?: IContainer
  ): Promise<WizardEmbeddable | ErrorEmbeddable> => {
    return this.create({ ...input, savedObjectId }, parent);
  };

  public async create(input: WizardInput, parent?: IContainer) {
    // TODO: Use savedWizardLoader here instead
    const {
      data,
      expressions: { ReactExpressionRenderer },
      notifications: { toasts },
      savedObjectsClient,
      types,
    } = await this.getStartServices();
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
