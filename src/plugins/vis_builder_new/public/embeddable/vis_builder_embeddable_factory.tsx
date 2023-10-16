/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
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
  VisBuilderInput,
  VisBuilderOutput,
  VISBUILDER_EMBEDDABLE,
} from './vis_builder_embeddable';
import { getStateFromSavedObject } from '../saved_visualizations/transforms';
import {
  getHttp,
  getSavedVisBuilderLoader,
  getTimeFilter,
  getUISettings,
} from '../plugin_services';
import { StartServicesGetter } from '../../../opensearch_dashboards_utils/public';
import { VisBuilderPluginStartDependencies } from '../types';

export interface VisBuilderEmbeddableFactoryDeps {
  start: StartServicesGetter<VisBuilderPluginStartDependencies>;
}

export class VisBuilderEmbeddableFactory
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
    getIconForSavedObject: () => 'visBuilder',
  };

  // TODO: Would it be better to explicitly declare start service dependencies?
  constructor(private readonly deps: VisBuilderEmbeddableFactoryDeps) {}

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
    input: VisBuilderInput,
    parent?: IContainer
  ): Promise<VisBuilderEmbeddable | ErrorEmbeddable | DisabledEmbeddable> {
    try {
      const savedObject = await getSavedVisBuilderLoader().get(savedObjectId);
      const editPath = `${EDIT_PATH}/${savedObjectId}`;
      const editUrl = getHttp().basePath.prepend(`/app/${PLUGIN_ID}${editPath}`);
      const isLabsEnabled = getUISettings().get<boolean>(VISUALIZE_ENABLE_LABS_SETTING);

      if (!isLabsEnabled) {
        return new DisabledEmbeddable(PLUGIN_NAME, input);
      }

      const savedVis = getStateFromSavedObject(savedObject);
      const indexPatternService = this.deps.start().plugins.data.indexPatterns;
      const indexPattern = await indexPatternService.get(
        savedVis.state.visualization.indexPattern || ''
      );
      const indexPatterns = indexPattern ? [indexPattern] : [];

      return new VisBuilderEmbeddable(
        getTimeFilter(),
        {
          savedVis,
          editUrl,
          editPath,
          editable: true,
          deps: this.deps,
          indexPatterns,
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
