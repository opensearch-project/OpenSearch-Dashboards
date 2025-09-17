/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */
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

    // 🔑 INJECT UI Actions into Global Interaction Interceptor
    if ((window as any).injectUIActionsToGlobalInterceptor) {
      console.log(
        '💉 Injecting UI Actions into Global Interaction Interceptor from Context Provider'
      );
      (window as any).injectUIActionsToGlobalInterceptor(plugins.uiActions);
    } else {
      console.warn('⚠️ Global Interaction Interceptor UI Actions injection method not available');
    }

    // Subscribe to context updates
    this.contextCaptureService.getStaticContext$().subscribe((context) => {
      this.currentContext = context;
      // Reduced logging - only show essential info
      console.log('📊 Static Context Updated:', {
        appId: context?.appId,
        timestamp: context?.timestamp,
        expandedDocs: context?.data?.expandedDocuments?.length || 0
      });
    });

    this.contextCaptureService.getDynamicContext$().subscribe((context) => {
      console.log('⚡ Dynamic Context Captured:', context);
      console.log('🔥 DEBUG: Dynamic context appId:', context?.appId);
      console.log('🔥 DEBUG: Dynamic context trigger:', context?.trigger);

      // 🔧 FIX: Refresh static context after dynamic events to ensure AI assistant sees updates
      if (context && context.appId) {
        console.log('🔄 Refreshing static context after dynamic event');
        console.log('🔥 DEBUG: Current URL pathname:', window.location.pathname);

        setTimeout(() => {
          // Force a fresh static context capture to include the dynamic changes
          const currentAppId = window.location.pathname.split('/app/')[1]?.split('/')[0];
          console.log('🔥 DEBUG: Extracted currentAppId:', currentAppId);
          console.log('🔥 DEBUG: contextCaptureService exists:', !!this.contextCaptureService);

          if (currentAppId && this.contextCaptureService) {
            console.log('🔥 DEBUG: Calling captureStaticContext for:', currentAppId);
            (this.contextCaptureService as any).captureStaticContext(currentAppId);
            console.log('🔥 DEBUG: captureStaticContext called');
          } else {
            console.error('🔥 DEBUG: Cannot refresh static context - missing appId or service');
          }
        }, 100); // Small delay to ensure dynamic context is processed
      } else {
        console.log('🔥 DEBUG: Not refreshing static context - no appId in dynamic context');
      }
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
      // NEW: Global interaction capture
      captureGlobalInteraction: this.captureGlobalInteraction.bind(this),
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
      // Expose Observable methods for real-time context updates
      getStaticContext$: () => this.contextCaptureService!.getStaticContext$(),
      getDynamicContext$: () => this.contextCaptureService!.getDynamicContext$(),
      captureGlobalInteraction: this.captureGlobalInteraction.bind(this),
      // Assistant Context System
      getAssistantContextStore: () => this.contextCaptureService!.getAssistantContextStore(),
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
    console.log(
      '🔥 DEBUG: uiActionsIntegrationService exists:',
      !!this.uiActionsIntegrationService
    );

    if (this.uiActionsIntegrationService) {
      console.log('🔥 DEBUG: Calling uiActionsIntegrationService.triggerContextCapture');
      this.uiActionsIntegrationService.triggerContextCapture(triggerType, data);
      console.log('🔥 DEBUG: uiActionsIntegrationService.triggerContextCapture called');
    } else {
      console.error('🔥 DEBUG: uiActionsIntegrationService is not available!');
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

  private captureGlobalInteraction(interaction: any): void {
    console.log('🎯 Context Provider Plugin received global interaction:', interaction);
    if (this.contextCaptureService) {
      this.contextCaptureService.captureGlobalInteraction(interaction);
    } else {
      console.warn('⚠️ Context Capture Service not available for global interaction');
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
