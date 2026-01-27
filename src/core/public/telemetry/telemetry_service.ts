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
      try {
        provider?.recordEvent({ ...event, source: pluginId });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Telemetry] Error recording event:', e);
      }
    },
    recordMetric: (metric: Omit<TelemetryMetric, 'source'>): void => {
      try {
        provider?.recordMetric({ ...metric, source: pluginId });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Telemetry] Error recording metric:', e);
      }
    },
    recordError: (error: Omit<TelemetryError, 'source'>): void => {
      try {
        provider?.recordError({ ...error, source: pluginId });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Telemetry] Error recording error:', e);
      }
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
  private recorderCache = new Map<string, PluginTelemetryRecorder>();

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
        let recorder = this.recorderCache.get(pluginId);
        if (!recorder) {
          recorder = createPluginTelemetryRecorder(pluginId, this.provider);
          this.recorderCache.set(pluginId, recorder);
        }
        return recorder;
      },
    };
  }

  public async stop() {
    this.provider = undefined;
    this.recorderCache.clear();
  }
}
