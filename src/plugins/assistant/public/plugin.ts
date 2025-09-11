/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../core/public';
import {
  AssistantPluginSetup,
  AssistantPluginStart,
  AppPluginStartDependencies,
  AssistantPluginSetupDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';
import { ClientConfig } from '../common/types';
import { AssistantConfig } from '../common/config';
import { ContextService } from './services/context_service';
import { ActionExecutor } from './services/action_executor';

export class AssistantPlugin implements Plugin<AssistantPluginSetup, AssistantPluginStart> {
  private config?: ClientConfig;
  private contextService?: ContextService;
  private actionExecutor?: ActionExecutor;

  constructor(private readonly initializerContext: PluginInitializerContext<AssistantConfig>) {}

  public setup(core: CoreSetup, deps: AssistantPluginSetupDependencies): AssistantPluginSetup {
    // Get configuration from initializer context
    const config = this.initializerContext.config.get();
    this.config = {
      agent: {
        enabled: config.agent.enabled,
        endpoint: config.agent.endpoint || '',
        apiKey: '', // This will be handled by server-side auth
        timeout: config.agent.timeout || 30000,
      },
      ui: {
        enabled: config.agent.enabled, // UI is enabled when agent is enabled
        theme: 'light', // Default theme
      },
    };

    // Only register application if agent is enabled
    if (this.config.agent.enabled) {
      core.application.register({
        id: 'assistant',
        title: PLUGIN_NAME,
        async mount(params: AppMountParameters) {
          // Load application bundle
          const { renderApp } = await import('./application');
          // Get start services as specified in opensearch_dashboards.json
          const [coreStart, depsStart] = await core.getStartServices();
          // Render the application
          return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
        },
      });
    }

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('assistant.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
      getConfig: () => this.config!,
      isEnabled: () => this.config!.agent.enabled,
    };
  }

  public start(core: CoreStart, deps: AppPluginStartDependencies): AssistantPluginStart {
    // Initialize context service with the context provider
    this.contextService = new ContextService(deps.contextProvider);

    // Initialize action executor with the context service
    this.actionExecutor = new ActionExecutor(this.contextService);

    return {
      getConfig: () => this.config!,
      isEnabled: () => this.config!.agent.enabled,
      getContextService: () => this.contextService!,
      getActionExecutor: () => this.actionExecutor!,
    };
  }

  public stop() {}
}
