/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { ActionByType, IncompatibleActionError } from '../../../ui_actions/public';
import { IEmbeddable, isErrorEmbeddable } from '../../../embeddable/public';
import { CoreStart } from '../../../../core/public';

export const ACTION_ASK_AI = 'askAI';

export interface AskAIActionContext {
  embeddable: IEmbeddable;
}

/**
 * Captures a screenshot of the visualization element
 */
async function captureVisualizationScreenshot(embeddable: IEmbeddable): Promise<string | null> {
  try {
    let targetElement: HTMLElement | null = null;
    let strategyUsed = '';

    // Strategy 1: Look for embeddable by data-embeddable-id (most reliable)
    targetElement = document.querySelector(
      `[data-embeddable-id="${embeddable.id}"]`
    ) as HTMLElement;
    if (targetElement) {
      strategyUsed = 'data-embeddable-id';
    }

    // Strategy 2: Look for embeddable panel by test subject
    if (!targetElement) {
      const headingElement = document.querySelector(
        `[data-test-subj="embeddablePanelHeading-${embeddable.id}"]`
      ) as HTMLElement;
      if (headingElement) {
        targetElement = headingElement.closest('.embPanel') as HTMLElement;
        if (targetElement) {
          strategyUsed = 'embeddablePanelHeading';
        }
      }
    }

    // Strategy 3: Look for embeddable by panel action button (more specific)
    if (!targetElement) {
      // Look for any Ask AI action button that might have been clicked
      const actionButtons = document.querySelectorAll(
        `[data-test-subj*="embeddablePanelAction-${ACTION_ASK_AI}"]`
      );

      for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        const panel = button.closest('.embPanel') as HTMLElement;
        if (panel) {
          // Check if this panel contains our embeddable ID
          const panelEmbeddableId = panel
            .querySelector('[data-embeddable-id]')
            ?.getAttribute('data-embeddable-id');
          if (panelEmbeddableId === embeddable.id) {
            targetElement = panel;
            strategyUsed = 'actionButton';
            break;
          }
        }
      }
    }

    // Strategy 4: Use embeddable's DOM node if available
    if (!targetElement && (embeddable as any).getRoot) {
      try {
        const root = (embeddable as any).getRoot();
        if (root && root.domNode) {
          targetElement = root.domNode as HTMLElement;
          strategyUsed = 'embeddable.root.domNode';
        } else if (root && (root as any).getContainer && (root as any).getContainer().node) {
          const containerNode = (root as any).getContainer().node;
          targetElement =
            (containerNode.querySelector(
              `[data-embeddable-id="${embeddable.id}"]`
            ) as HTMLElement) || containerNode;
          strategyUsed = 'embeddable.root.container';
        }
      } catch (error) {
        // Ignore errors accessing embeddable root
      }
    }

    // Strategy 5: Direct DOM node access
    if (!targetElement && (embeddable as any).domNode) {
      targetElement = (embeddable as any).domNode as HTMLElement;
      strategyUsed = 'embeddable.domNode';
    }

    // Strategy 6: Search by embeddable ID in HTML content (less reliable)
    if (!targetElement) {
      const embeddablePanels = document.querySelectorAll(
        '.embPanel, .embeddable, [class*="embeddable"]'
      );

      for (let i = 0; i < embeddablePanels.length; i++) {
        const panel = embeddablePanels[i];
        const panelHtml = panel.outerHTML;
        if (panelHtml.includes(embeddable.id)) {
          targetElement = panel as HTMLElement;
          strategyUsed = 'htmlContent';
          break;
        }
      }
    }

    // Strategy 7: Find by title (least reliable, may match wrong visualization)
    if (!targetElement) {
      const title = embeddable.getTitle();
      if (title) {
        const titleElements = document.querySelectorAll(
          `[title*="${title}"], [aria-label*="${title}"]`
        );

        for (let i = 0; i < titleElements.length; i++) {
          const titleEl = titleElements[i];
          const panel = titleEl.closest(
            '.embPanel, .embeddable, [class*="embeddable"]'
          ) as HTMLElement;
          if (panel) {
            targetElement = panel;
            strategyUsed = 'title';
            break;
          }
        }
      }
    }

    if (!targetElement) {
      return null;
    }

    // Find the visualization content within the target element
    const visualizationSelectors = [
      '.visualization',
      '.visChart',
      '.vis-container',
      '.lnsVisualizationContainer',
      '.vgaVis',
      '.mapContainer',
      '.embPanel__content .visualization',
      '.embPanel__content',
      'canvas',
      'svg',
      '.chart-container',
      '.vis-wrapper',
    ];

    let visualizationElement: HTMLElement | null = null;
    let selectorUsed = '';

    for (const selector of visualizationSelectors) {
      visualizationElement = targetElement.querySelector(selector) as HTMLElement;
      if (visualizationElement) {
        selectorUsed = selector;
        break;
      }
    }

    // If no specific visualization element found, use the target element itself
    if (!visualizationElement) {
      visualizationElement = targetElement;
      selectorUsed = 'targetElement';
    }

    // Use html2canvas to capture the visualization
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(visualizationElement, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
      useCORS: true,
      allowTaint: true,
      height: visualizationElement.offsetHeight || 400,
      width: visualizationElement.offsetWidth || 600,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    return null;
  }
}

export class AskAIAction implements ActionByType<typeof ACTION_ASK_AI> {
  public readonly type = ACTION_ASK_AI;
  public readonly id = ACTION_ASK_AI;
  public order = 100;

  constructor(private core: CoreStart) {}

  public getDisplayName({ embeddable }: AskAIActionContext) {
    if (!embeddable || isErrorEmbeddable(embeddable)) {
      throw new IncompatibleActionError();
    }
    return i18n.translate('visualizations.actions.askAI.displayName', {
      defaultMessage: 'Ask AI',
    });
  }

  public getIconType({ embeddable }: AskAIActionContext): EuiIconType {
    if (!embeddable || isErrorEmbeddable(embeddable)) {
      throw new IncompatibleActionError();
    }
    return 'discuss' as EuiIconType;
  }

  public async isCompatible({ embeddable }: AskAIActionContext) {
    // Check if embeddable is valid and chat service is available
    if (!embeddable || isErrorEmbeddable(embeddable)) {
      return false;
    }

    // Check if chat service is available
    const chatService = this.core.chat;
    if (!chatService || !chatService.isAvailable()) {
      return false;
    }

    // Only show for visualization embeddables
    const embeddableType = embeddable.type;
    const visualizationTypes = [
      'visualization',
      'lens',
      'map',
      'vega',
      'timelion',
      'input_control_vis',
      'metrics',
      'tagcloud',
      'region_map',
      'tile_map',
      'histogram',
      'line',
      'area',
      'bar',
      'pie',
      'metric',
      'table',
      'gauge',
      'goal',
      'heatmap',
    ];

    return visualizationTypes.includes(embeddableType);
  }

  public async execute({ embeddable }: AskAIActionContext) {
    if (!embeddable || isErrorEmbeddable(embeddable)) {
      throw new IncompatibleActionError();
    }

    const chatService = this.core.chat;
    if (!chatService || !chatService.isAvailable()) {
      this.core.notifications.toasts.addWarning({
        title: i18n.translate('visualizations.actions.askAI.chatUnavailable.title', {
          defaultMessage: 'Chat service unavailable',
        }),
        text: i18n.translate('visualizations.actions.askAI.chatUnavailable.text', {
          defaultMessage: 'The AI chat service is not available. Please check your configuration.',
        }),
      });
      return;
    }

    try {
      // Open chat window first
      await chatService.openWindow();

      // Wait a bit for the chat window to be fully rendered and ref to be established
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Show loading indicator
      if (chatService.setCapturingImage) {
        chatService.setCapturingImage(true);
      }

      // Capture screenshot of the visualization
      const screenshot = await captureVisualizationScreenshot(embeddable);

      // Hide loading indicator
      if (chatService.setCapturingImage) {
        chatService.setCapturingImage(false);
      }

      if (!screenshot) {
        this.core.notifications.toasts.addWarning({
          title: i18n.translate('visualizations.actions.askAI.screenshotFailed.title', {
            defaultMessage: 'Screenshot capture failed',
          }),
          text: i18n.translate('visualizations.actions.askAI.screenshotFailed.text', {
            defaultMessage:
              'Could not capture visualization screenshot. You can still ask questions in the chat.',
          }),
        });
        return;
      }

      // Set the screenshot as pending image in the chat input
      if (screenshot && chatService.setPendingImage) {
        // Retry mechanism in case the chat window ref isn't ready yet
        let retries = 0;
        const maxRetries = 5;
        const setImageWithRetry = async () => {
          try {
            chatService.setPendingImage!(screenshot);
          } catch (error) {
            if (retries < maxRetries) {
              retries++;
              await new Promise((resolve) => setTimeout(resolve, 200));
              await setImageWithRetry();
            }
          }
        };

        await setImageWithRetry();
      }
    } catch (error) {
      // Make sure to hide loading indicator on error
      if (chatService.setCapturingImage) {
        chatService.setCapturingImage(false);
      }

      this.core.notifications.toasts.addError(error, {
        title: i18n.translate('visualizations.actions.askAI.error.title', {
          defaultMessage: 'Failed to open chat',
        }),
      });
    }
  }
}
