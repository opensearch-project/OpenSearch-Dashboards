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

import { CoreService } from '../../types';
import {
  TelemetryServiceSetup,
  TelemetryServiceStart,
  TelemetryProvider,
  TelemetryEvent,
  TelemetryMetric,
  TelemetryError,
  PluginTelemetryRecorder,
} from './types';

/**
 * Factory function to create a PluginTelemetryRecorder that wraps the provider
 * and automatically adds the plugin ID as the source.
 */
function createPluginTelemetryRecorder(
  pluginId: string,
  provider?: TelemetryProvider
): PluginTelemetryRecorder {
  return {
    recordEvent: (event: Omit<TelemetryEvent, 'source'>): void => {
      provider?.recordEvent({ ...event, source: pluginId });
    },
    recordMetric: (metric: Omit<TelemetryMetric, 'source'>): void => {
      provider?.recordMetric({ ...metric, source: pluginId });
    },
    recordError: (error: Omit<TelemetryError, 'source'>): void => {
      provider?.recordError({ ...error, source: pluginId });
    },
  };
}

/**
 * Core telemetry service - manages telemetry provider registration.
 *
 * This service follows the same pattern as ChatService:
 * - During setup, plugins can register a telemetry provider
 * - During start, the service exposes telemetry APIs that delegate to the provider
 * - If no provider is registered, telemetry calls are no-ops
 */
export class TelemetryCoreService
  implements CoreService<TelemetryServiceSetup, TelemetryServiceStart> {
  private provider?: TelemetryProvider;

  public setup(): TelemetryServiceSetup {
    return {
      registerProvider: (provider: TelemetryProvider) => {
        if (this.provider) {
          // eslint-disable-next-line no-console
          console.warn(
            'TelemetryProvider already registered. Only the first registration is used.'
          );
          return;
        }
        this.provider = provider;
      },
    };
  }

  public start(): TelemetryServiceStart {
    return {
      isEnabled: (): boolean => {
        return this.provider?.isEnabled() ?? false;
      },

      getPluginRecorder: (pluginId: string): PluginTelemetryRecorder => {
        return createPluginTelemetryRecorder(pluginId, this.provider);
      },
    };
  }

  public async stop() {
    this.provider = undefined;
  }
}
