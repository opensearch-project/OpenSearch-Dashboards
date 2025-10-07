/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import {
  ContextProviderSetup,
  ContextProviderStart,
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
} from './types';
import { ContextCaptureService } from './services/context_capture_service';
import { usePageContext } from './hooks/use_page_context';
import { useDynamicContext } from './hooks/use_dynamic_context';
import { useAssistantAction } from './hooks/use_assistant_action';

/**
 * @experimental
 * Context Provider plugin for React hooks-based context capture system. This plugin is experimental and will change in future releases.
 */
export class ContextProviderPlugin
  implements
    Plugin<
      ContextProviderSetup,
      ContextProviderStart,
      ContextProviderSetupDeps,
      ContextProviderStartDeps
    > {
  private contextCaptureService?: ContextCaptureService;

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup, plugins: ContextProviderSetupDeps): ContextProviderSetup {
    // Check if context provider is enabled
    const config = this.initializerContext.config.get<{ enabled: boolean }>();
    if (!config.enabled) {
      return {};
    }

    this.contextCaptureService = new ContextCaptureService(core, plugins);
    this.contextCaptureService.setup();

    return {};
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): ContextProviderStart {
    // Check if context provider is enabled
    const config = this.initializerContext.config.get<{ enabled: boolean }>();
    if (!config.enabled || !this.contextCaptureService) {
      return {
        getAssistantContextStore: () => undefined as any,
        hooks: {
          usePageContext: () => '',
          useDynamicContext: () => '',
          useAssistantAction: () => undefined,
        },
      };
    }

    this.contextCaptureService.start(core, plugins);

    return {
      getAssistantContextStore: () => this.contextCaptureService!.getAssistantContextStore(),
      hooks: {
        usePageContext,
        useDynamicContext,
        useAssistantAction,
      },
    };
  }

  public stop() {
    if (this.contextCaptureService) {
      this.contextCaptureService.stop();
    }
  }
}
