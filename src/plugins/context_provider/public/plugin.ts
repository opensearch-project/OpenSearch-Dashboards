/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  ContextProviderSetup,
  ContextProviderStart,
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
} from './types';
import { ContextCaptureService } from './services/context_capture_service';
import { UIActionsIntegrationService } from './services/ui_actions_integration_service';

export class ContextProviderPlugin
  implements
    Plugin<
      ContextProviderSetup,
      ContextProviderStart,
      ContextProviderSetupDeps,
      ContextProviderStartDeps
    > {
  private contextCaptureService?: ContextCaptureService;
  private uiActionsIntegrationService?: UIActionsIntegrationService;

  public setup(core: CoreSetup, plugins: ContextProviderSetupDeps): ContextProviderSetup {
    this.contextCaptureService = new ContextCaptureService(core, plugins);
    this.uiActionsIntegrationService = new UIActionsIntegrationService(plugins.uiActions);

    this.contextCaptureService.setup();
    this.uiActionsIntegrationService.setup();

    return {};
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): ContextProviderStart {
    if (!this.contextCaptureService || !this.uiActionsIntegrationService) {
      throw new Error('Context Provider services not initialized');
    }

    this.contextCaptureService.start(core, plugins);
    this.uiActionsIntegrationService.start(plugins.uiActions);

    // Make service globally available for testing and integration
    (window as any).contextProvider = {
      executeAction: this.executeAction.bind(this),
      getAvailableActions: this.getAvailableActions.bind(this),
    };

    return {
      executeAction: this.executeAction.bind(this),
      getAvailableActions: this.getAvailableActions.bind(this),
      getAssistantContextStore: () => this.contextCaptureService!.getAssistantContextStore(),
    };
  }

  private async executeAction(actionType: string, params: any): Promise<any> {
    if (!this.contextCaptureService) {
      throw new Error('Context capture service not available');
    }

    return this.contextCaptureService.executeAction(actionType, params);
  }

  private getAvailableActions(): string[] {
    return [
      'ADD_FILTER',
      'REMOVE_FILTER',
      'CHANGE_TIME_RANGE',
      'REFRESH_DATA',
      'NAVIGATE_TO_DISCOVER',
      'NAVIGATE_TO_DASHBOARD',
    ];
  }

  public stop() {
    if (this.contextCaptureService) {
      this.contextCaptureService.stop();
    }

    delete (window as any).contextProvider;
  }
}
