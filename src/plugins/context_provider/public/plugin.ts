/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  ContextProviderSetup,
  ContextProviderStart,
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
  StaticContext,
  DynamicContext,
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
  private currentContext: StaticContext | null = null;

  public setup(core: CoreSetup, plugins: ContextProviderSetupDeps): ContextProviderSetup {
    console.log('🔧 Context Provider Plugin Setup');

    // Initialize services
    this.contextCaptureService = new ContextCaptureService(core, plugins);
    this.uiActionsIntegrationService = new UIActionsIntegrationService(plugins.uiActions);

    // Setup context capture
    this.contextCaptureService.setup();
    this.uiActionsIntegrationService.setup();

    return {};
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): ContextProviderStart {
    console.log('🚀 Context Provider Plugin Start');

    if (!this.contextCaptureService || !this.uiActionsIntegrationService) {
      throw new Error('Context Provider services not initialized');
    }

    // Start services
    this.contextCaptureService.start(core, plugins);
    this.uiActionsIntegrationService.start(plugins.uiActions);

    // Connect UI Actions to Context Capture
    this.uiActionsIntegrationService.setContextCaptureCallback((trigger: string, data: any) => {
      this.contextCaptureService!.captureDynamicContext(trigger, data);
    });

    // Subscribe to context updates
    this.contextCaptureService.getStaticContext$().subscribe((context) => {
      this.currentContext = context;
      console.log('📊 Static Context Updated:', context);
    });

    this.contextCaptureService.getDynamicContext$().subscribe((context) => {
      console.log('⚡ Dynamic Context Captured:', context);
    });

    // Make service globally available for testing and chatbot/OSD agent integration
    (window as any).contextProvider = {
      getCurrentContext: this.getCurrentContext.bind(this),
      refreshCurrentContext: this.refreshCurrentContext.bind(this),
      executeAction: this.executeAction.bind(this),
      getAvailableActions: this.getAvailableActions.bind(this),
      triggerTestCapture: this.triggerTestCapture.bind(this),
      // Plugin registration methods
      registerContextContributor: this.registerContextContributor.bind(this),
      unregisterContextContributor: this.unregisterContextContributor.bind(this),
      // Additional testing methods
      testTableRowClick: () => this.testTableRowClick(),
      testEmbeddableHover: () => this.testEmbeddableHover(),
      testFilterApplication: () => this.testFilterApplication(),
    };

    console.log('🌐 Context Provider API available at window.contextProvider');
    console.log('📖 Available methods:', Object.keys((window as any).contextProvider));

    return {
      getCurrentContext: this.getCurrentContext.bind(this),
      refreshCurrentContext: this.refreshCurrentContext.bind(this),
      executeAction: this.executeAction.bind(this),
      getAvailableActions: this.getAvailableActions.bind(this),
      registerContextContributor: this.registerContextContributor.bind(this),
      unregisterContextContributor: this.unregisterContextContributor.bind(this),
    };
  }

  private async getCurrentContext(): Promise<StaticContext | null> {
    console.log('🔍 Getting current context:', this.currentContext);
    return this.currentContext;
  }

  private async refreshCurrentContext(): Promise<StaticContext | null> {
    console.log('🔄 Forcing fresh context capture...');
    
    if (!this.contextCaptureService) {
      console.warn('Context capture service not available');
      return this.currentContext;
    }

    // Get current app ID and force a fresh capture
    const currentAppId = window.location.pathname.split('/app/')[1]?.split('/')[0];
    if (currentAppId) {
      console.log(`🎯 Forcing context refresh for app: ${currentAppId}`);
      // Force the context capture service to capture fresh context
      await (this.contextCaptureService as any).captureStaticContext(currentAppId);
    }
    
    return this.currentContext;
  }

  private async executeAction(actionType: string, params: any): Promise<any> {
    console.log('🎯 Executing action:', actionType, params);

    if (!this.contextCaptureService) {
      throw new Error('Context capture service not available');
    }

    return this.contextCaptureService.executeAction(actionType, params);
  }

  private getAvailableActions(): string[] {
    const actions = [
      'ADD_FILTER',
      'REMOVE_FILTER',
      'CHANGE_TIME_RANGE',
      'REFRESH_DATA',
      'NAVIGATE_TO_DISCOVER',
      'NAVIGATE_TO_DASHBOARD',
    ];
    console.log('📋 Available actions:', actions);
    return actions;
  }

  private triggerTestCapture(triggerType: string, data: any): void {
    console.log('🧪 Triggering test context capture:', triggerType, data);
    if (this.uiActionsIntegrationService) {
      this.uiActionsIntegrationService.triggerContextCapture(triggerType, data);
    }
  }

  // Test methods for manual verification
  private testTableRowClick(): void {
    console.log('🧪 Testing table row click capture');
    this.triggerTestCapture('TABLE_ROW_SELECT_TRIGGER', {
      rowData: { field1: 'test_value_1', field2: 'test_value_2' },
      rowIndex: 0,
      tableState: { totalRows: 10, selectedRow: 0 },
      timestamp: Date.now(),
    });
  }

  private testEmbeddableHover(): void {
    console.log('🧪 Testing embeddable hover capture');
    this.triggerTestCapture('EMBEDDABLE_PANEL_HOVER_TRIGGER', {
      embeddableId: 'test-embeddable-123',
      panelTitle: 'Test Visualization',
      embeddableType: 'visualization',
      timestamp: Date.now(),
    });
  }

  private testFilterApplication(): void {
    console.log('🧪 Testing filter application capture');
    this.triggerTestCapture('FILTER_APPLIED_TRIGGER', {
      filter: { field: 'status', value: 'active' },
      filterType: 'phrase',
      timestamp: Date.now(),
    });
  }

  private registerContextContributor(contributor: any): void {
    console.log('📝 Registering context contributor via plugin API:', contributor);
    if (this.contextCaptureService) {
      this.contextCaptureService.registerContextContributor(contributor);
    }
  }

  private unregisterContextContributor(appId: string): void {
    console.log('🗑️ Unregistering context contributor via plugin API:', appId);
    if (this.contextCaptureService) {
      this.contextCaptureService.unregisterContextContributor(appId);
    }
  }

  public stop() {
    console.log('🛑 Context Provider Plugin Stop');
    
    // Cleanup services
    if (this.contextCaptureService) {
      this.contextCaptureService.stop();
    }
    
    // Cleanup global API
    delete (window as any).contextProvider;
  }
}
