/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';
import { capabilitiesProvider } from './capabilities_provider';
import { agentTracesSavedObjectType } from './saved_objects';

import { AgentTracesPluginSetup, AgentTracesPluginStart } from './types';

export class AgentTracesPlugin implements Plugin<AgentTracesPluginSetup, AgentTracesPluginStart> {
  private readonly logger: Logger;

  // @ts-ignore
  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('agentTraces: Setup');

    core.capabilities.registerProvider(capabilitiesProvider);

    // Register default agent traces capability (disabled by default)
    core.capabilities.registerProvider(() => ({
      agentTraces: {
        agentTracesEnabled: false,
      },
    }));

    // Register dynamic capabilities switcher for feature flags
    // Reuses the 'explore' dynamic config prefix: explore.agentTraces.enabled
    core.capabilities.registerSwitcher(async (request, capabilities) => {
      try {
        const dynamicConfigServiceStart = await core.dynamicConfigService.getStartService();
        const client = dynamicConfigServiceStart.getClient();
        const store = dynamicConfigServiceStart.createStoreFromRequest(request);

        const config = await client.getConfig(
          { pluginConfigPath: 'explore' },
          store ? { asyncLocalStorageContext: store } : undefined
        );

        const updatedCapabilities = {
          ...capabilities,
          agentTraces: {
            ...(capabilities.agentTraces || {}),
            agentTracesEnabled: config.agentTraces?.enabled ?? false,
          },
        };
        this.logger.info(
          `Applied capabilities - agentTracesEnabled: ${updatedCapabilities.agentTraces.agentTracesEnabled}`
        );

        // Apply security restrictions
        const finalCapabilities = await core.security
          .readonlyService()
          .hideForReadonly(request, updatedCapabilities, {
            explore: {
              createShortUrl: false,
              save: false,
              saveQuery: false,
            },
          });

        return finalCapabilities;
      } catch (error) {
        this.logger.error('Failed to load agentTraces dynamic config, using defaults', error);
        return capabilities;
      }
    });

    core.capabilities.registerSwitcher(async (request, capabilities) => {
      return await core.security.readonlyService().hideForReadonly(request, capabilities, {
        agentTraces: {
          createShortUrl: false,
          save: false,
          saveQuery: false,
        },
      });
    });
    core.savedObjects.registerType(agentTracesSavedObjectType);

    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
