/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SavedObjectAttributes, SimpleSavedObject } from 'opensearch-dashboards/public';
import { CoreStart } from 'opensearch-dashboards/public';
import { UiActionsStart } from '../../../ui_actions/public';
import {
  EmbeddableFactoryDefinition,
  Container,
  ErrorEmbeddable,
  EmbeddableInput,
} from '../../../embeddable/public';
import { TimeRange } from '../../../data/public';
import { AiVisEmbeddable } from './ai_vis_embeddable';
import { AiVisInput, AiVisOutput } from './types';

export const AI_VIS_EMBEDDABLE_TYPE = 'ai_vis';

interface StartServices {
  executeTriggerActions: UiActionsStart['executeTriggerActions'];
  isEditable: () => boolean;
  core: CoreStart;
}

export class AiVisEmbeddableFactory
  implements EmbeddableFactoryDefinition<AiVisInput, AiVisOutput, AiVisEmbeddable> {
  public readonly type = AI_VIS_EMBEDDABLE_TYPE;
  public readonly isContainerType = false;

  public readonly savedObjectMetaData = {
    name: i18n.translate('chat.aiVis.savedObjectName', {
      defaultMessage: 'AI Visualization',
    }),
    type: 'ai_vis',
    getIconForSavedObject: ({ attributes }: SimpleSavedObject<SavedObjectAttributes>) => {
      return 'visLine';
    },
    includeFields: ['visualizationData', 'params'],
  };

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public canCreateNew() {
    return false;
  }

  public isEditable = async () => {
    return (await this.getStartServices()).isEditable();
  };

  public getDisplayName() {
    return i18n.translate('chat.aiVis.displayName', {
      defaultMessage: 'AI Visualization',
    });
  }

  public createFromSavedObject = async (
    savedObjectId: string,
    input: Partial<AiVisInput> & { id: string; timeRange: TimeRange },
    parent?: Container
  ): Promise<AiVisEmbeddable | ErrorEmbeddable> => {
    try {
      const { executeTriggerActions, core } = await this.getStartServices();

      // Fetch the saved object
      const savedObject = await core.savedObjects.client.get<{
        title: string;
        description: string;
        visualizationType: string;
        visualizationData: string;
        chartType: string;
        params: string;
      }>('ai_vis', savedObjectId);

      if (!savedObject) {
        throw new Error('Saved object not found');
      }

      // Parse the visualization data
      let visualizationData;
      try {
        visualizationData = JSON.parse(savedObject.attributes.visualizationData);
      } catch (e) {
        throw new Error('Invalid visualization data');
      }

      // Create the embeddable
      return new AiVisEmbeddable(
        {
          savedObjectId,
          title: savedObject.attributes.title || 'AI Visualization',
          visualizationData,
        },
        input,
        executeTriggerActions,
        parent
      );
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      return new ErrorEmbeddable(e, input, parent);
    }
  };

  public async create(input: AiVisInput) {
    return new ErrorEmbeddable('AI visualizations can only be created from a saved object', input);
  }
}
