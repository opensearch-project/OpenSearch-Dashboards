/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { get } from 'lodash';
import html2canvas from 'html2canvas';
import { EmbeddableContext, IEmbeddable } from '../../../embeddable/public';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { CoreStart } from '../../../../core/public';
import { ContextProviderStart } from '../../../context_provider/public';
import { SavedExplore } from '../saved_explore';

interface DiscoverVisualizationEmbeddable extends IEmbeddable {
  savedExplore: SavedExplore;
  node: HTMLElement;
}

export const ASK_AI_EMBEDDABLE_ACTION = 'ASK_AI_EMBEDDABLE_ACTION';

// Extend the ActionContextMapping to include our action
declare module '../../../ui_actions/public' {
  export interface ActionContextMapping {
    [ASK_AI_EMBEDDABLE_ACTION]: EmbeddableContext;
  }
}

export class AskAIEmbeddableAction implements Action<EmbeddableContext> {
  public readonly type = ASK_AI_EMBEDDABLE_ACTION;
  public readonly id = ASK_AI_EMBEDDABLE_ACTION;
  public order = 20;

  public grouping: Action['grouping'] = [
    {
      id: ASK_AI_EMBEDDABLE_ACTION,
      getDisplayName: () => this.getDisplayName(),
      getIconType: () => this.getIconType(),
      category: 'investigation',
      order: 20,
    },
  ];

  constructor(
    private readonly core: CoreStart,
    private readonly contextProvider?: ContextProviderStart
  ) {}

  public getIconType(): EuiIconType {
    return 'editorComment';
  }

  public getDisplayName() {
    return i18n.translate('explore.actions.askAIEmbeddable.displayName', {
      defaultMessage: 'Ask AI',
    });
  }

  public async isCompatible({ embeddable }: EmbeddableContext) {
    // Check if this is an explore embeddable and if context provider is available
    const hasContextProvider = this.contextProvider !== undefined;
    return embeddable.type === 'explore' && hasContextProvider && this.core.chat.isAvailable();
  }

  public async execute({ embeddable }: EmbeddableContext) {
    if (!(await this.isCompatible({ embeddable }))) {
      throw new IncompatibleActionError();
    }

    const visEmbeddable = embeddable as DiscoverVisualizationEmbeddable;

    // Extract visualization context
    const savedObjectId = get(visEmbeddable.getInput(), 'savedObjectId', '');
    const title = visEmbeddable.getTitle() || 'Untitled Visualization';
    const visType = visEmbeddable.type;

    // Get current filters, query, and time range
    const input = visEmbeddable.getInput();
    const timeRange = input.timeRange;
    const query = visEmbeddable.savedExplore.searchSource.getFields().query;
    const filters = input.filters;

    try {
      // Capture visualization as base64 image
      let visualizationBase64 = '';

      const canvas = await html2canvas(visEmbeddable.node, {
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      // Use JPEG format with low quality to save tokens
      visualizationBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

      // Create context for the assistant with summary
      const visualizationContext = {
        title,
        visType,
        savedObjectId,
        timeRange,
        query: query?.query,
        filters,
        index: query?.dataset?.title,
      };

      // Add context to the context provider
      if (this.contextProvider) {
        const contextStore = this.contextProvider.getAssistantContextStore();
        await contextStore.addContext({
          id: `visualization-${savedObjectId || embeddable.id}`,
          description: `Visualization: ${title}`,
          value: visualizationContext,
          label: `Visualization: ${title}`,
          categories: ['visualization', 'dashboard', 'chat'],
        });
      }

      // Send visualization screenshot to chat
      if (this.core.chat) {
        // Create a message with the visualization image following AG-UI protocol
        const imageMessage = {
          role: 'user' as const,
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          content: [
            {
              type: 'binary' as const,
              mimeType: 'image/jpeg',
              data: visualizationBase64,
            },
          ],
        };

        // sendMessageWithWindow will open the chat window and send the message
        await this.core.chat.sendMessageWithWindow(
          'Give me a summary for the selected visualization',
          [imageMessage]
        );
      }
    } catch (error) {
      this.core.notifications.toasts.addDanger({
        title: i18n.translate('explore.actions.askAIEmbeddable.errorTitle', {
          defaultMessage: 'Failed to add visualization context',
        }),
        text: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
