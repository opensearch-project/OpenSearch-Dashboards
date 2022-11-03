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
  VisBuilderSavedObjectAttributes,
  VISBUILDER_SAVED_OBJECT,
} from '../../common';
import { DisabledEmbeddable } from './disabled_embeddable';
import {
  VisBuilderEmbeddable,
  VisBuilderOutput,
  VISBUILDER_EMBEDDABLE,
} from './vis_builder_embeddable';
import visBuilderIcon from '../assets/vis_builder_icon.svg';
import {
  getHttp,
  getSavedVisBuilderLoader,
  getTimeFilter,
  getUISettings,
} from '../plugin_services';

// TODO: use or remove?
export type VisBuilderEmbeddableFactory = EmbeddableFactory<
  SavedObjectEmbeddableInput,
  VisBuilderOutput | EmbeddableOutput,
  VisBuilderEmbeddable | DisabledEmbeddable,
  VisBuilderSavedObjectAttributes
>;

export class VisBuilderEmbeddableFactoryDefinition
  implements
    EmbeddableFactoryDefinition<
      SavedObjectEmbeddableInput,
      VisBuilderOutput | EmbeddableOutput,
      VisBuilderEmbeddable | DisabledEmbeddable,
      VisBuilderSavedObjectAttributes
    > {
  public readonly type = VISBUILDER_EMBEDDABLE;
  public readonly savedObjectMetaData = {
    // TODO: Update to include most vis functionality
    name: PLUGIN_NAME,
    includeFields: ['visualizationState'],
    type: VISBUILDER_SAVED_OBJECT,
    getIconForSavedObject: () => visBuilderIcon,
  };

  // TODO: Would it be better to explicitly declare start service dependencies?
  constructor() {}

  public canCreateNew() {
    // Because VisBuilder creation starts with the visualization modal, no need to have a separate entry for VisBuilder until it's separate
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
  ): Promise<VisBuilderEmbeddable | ErrorEmbeddable | DisabledEmbeddable> {
    try {
      const savedVisBuilder = await getSavedVisBuilderLoader().get(savedObjectId);
      const editPath = `${EDIT_PATH}/${savedObjectId}`;
      const editUrl = getHttp().basePath.prepend(`/app/${PLUGIN_ID}${editPath}`);
      const isLabsEnabled = getUISettings().get<boolean>(VISUALIZE_ENABLE_LABS_SETTING);

      if (!isLabsEnabled) {
        return new DisabledEmbeddable(PLUGIN_NAME, input);
      }

      return new VisBuilderEmbeddable(
        getTimeFilter(),
        {
          savedVisBuilder,
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
    return i18n.translate('visBuilder.displayName', {
      defaultMessage: PLUGIN_ID,
    });
  }
}
