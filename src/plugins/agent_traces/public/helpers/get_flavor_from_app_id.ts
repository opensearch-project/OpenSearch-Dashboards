/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { take } from 'rxjs/operators';
import { AgentTracesFlavor, PLUGIN_ID } from '../../common';
import { AgentTracesServices } from '../types';

/**
 * Extracts the flavor ID from an app ID string
 * App ID format: "agentTraces/{flavor}" -> returns the flavor part
 * For agentTraces without a flavor suffix, defaults to Traces
 */
export const getFlavorFromAppId = (appId: string | undefined): AgentTracesFlavor | null => {
  // For agentTraces plugin, default to Traces flavor
  if (appId === PLUGIN_ID) {
    return AgentTracesFlavor.Traces;
  }
  const flavorFromAppId = appId?.split('/')?.[1];
  return flavorFromAppId ? (flavorFromAppId as AgentTracesFlavor) : null;
};

export const getCurrentAppId = async (
  services: AgentTracesServices
): Promise<string | undefined> => {
  return services.core.application.currentAppId$.pipe(take(1)).toPromise();
};

export const getCurrentFlavor = async (
  services: AgentTracesServices
): Promise<AgentTracesFlavor | null> => {
  const currentAppId = await getCurrentAppId(services);
  return getFlavorFromAppId(currentAppId);
};
