/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { EuiLoadingSpinner, EuiText, EuiSpacer } from '@elastic/eui';
import { get } from 'lodash';
import html2canvas from 'html2canvas';
import { EmbeddableContext, IEmbeddable } from '../../../embeddable/public';
import { Action, IncompatibleActionError } from '../../../ui_actions/public';
import { CoreStart } from '../../../../core/public';
import { ContextProviderStart } from '../../../context_provider/public';
import { ChatPluginStart } from '../../../chat/public';
import { SavedExplore } from '../saved_explore';
import './ask_ai_embeddable_action.scss';

interface DiscoverVisualizationEmbeddable extends IEmbeddable {
  savedExplore: SavedExplore;
  node: HTMLElement;
}

// Loading overlay component
const LoadingOverlay: React.FC = () => (
  <div className="askAiEmbeddableLoadingOverlay">
    <div className="eui-textCenter">
      <EuiLoadingSpinner size="xl" />
      <EuiSpacer size="m" />
      <EuiText size="s">
        <strong>
          {i18n.translate('explore.actions.askAIEmbeddable.generatingSummary', {
            defaultMessage: 'Generating visualization summary...',
          })}
        </strong>
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiText size="xs" color="subdued">
        {i18n.translate('explore.actions.askAIEmbeddable.pleaseWait', {
          defaultMessage: 'This may take a few moments',
        })}
      </EuiText>
    </div>
  </div>
);

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
    private readonly contextProvider?: ContextProviderStart,
    private readonly chat?: ChatPluginStart
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
    return embeddable.type === 'explore' && hasContextProvider;
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

    // Create loading overlay container
    const overlayContainer = document.createElement('div');
    const embeddableContainer = visEmbeddable.node.parentElement;
    if (embeddableContainer) {
      embeddableContainer.style.position = 'relative';
      embeddableContainer.appendChild(overlayContainer);
      ReactDOM.render(<LoadingOverlay />, overlayContainer);
    }

    try {
      // Capture visualization as base64 image
      let visualizationBase64 = '';
      let visualizationSummary = '';

      try {
        const canvas = await html2canvas(visEmbeddable.node, {
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
        });
        // Use JPEG format with low quality to save tokens
        visualizationBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

        // Call backend API to get visualization summary
        const response = await this.core.http.post('/api/visualizations/summary', {
          body: JSON.stringify({
            visualization: visualizationBase64,
          }),
          query: {
            dataSourceId: query?.dataset?.dataSource?.id,
          },
        });

        visualizationSummary = response.summary || '';
      } catch (captureError) {
        // Log error for debugging but continue with empty summary
        // eslint-disable-next-line no-console
        console.warn('Failed to capture visualization or get summary:', captureError);
      } finally {
        // Remove loading overlay
        if (overlayContainer && embeddableContainer) {
          ReactDOM.unmountComponentAtNode(overlayContainer);
          embeddableContainer.removeChild(overlayContainer);
        }
      }

      // Create context for the assistant with summary
      const visualizationContext = {
        title,
        visType,
        savedObjectId,
        timeRange,
        query: query?.query,
        filters,
        index: query?.dataset?.title,
        summary: visualizationSummary,
      };

      // Add context to the context provider
      if (this.contextProvider) {
        this.chat?.chatService?.updateCurrentMessages([]);
        const contextStore = this.contextProvider.getAssistantContextStore();
        await contextStore.addContext({
          id: `visualization-${savedObjectId || embeddable.id}`,
          description: `Visualization: ${title}`,
          value: visualizationContext,
          label: `Visualization: ${title}`,
          categories: ['visualization', 'dashboard', 'chat'],
        });
      }

      // Try to open the chat if available
      if (this.chat?.chatService) {
        // Open the chat panel
        await this.chat.chatService.sendMessageWithWindow(
          'Give me a summary for the selected visualization',
          []
        );
        await this.chat.chatService.openWindow();
      }
    } catch (error) {
      // Remove loading overlay on error
      if (overlayContainer && embeddableContainer) {
        ReactDOM.unmountComponentAtNode(overlayContainer);
        embeddableContainer.removeChild(overlayContainer);
      }

      this.core.notifications.toasts.addDanger({
        title: i18n.translate('explore.actions.askAIEmbeddable.errorTitle', {
          defaultMessage: 'Failed to add visualization context',
        }),
        text: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
