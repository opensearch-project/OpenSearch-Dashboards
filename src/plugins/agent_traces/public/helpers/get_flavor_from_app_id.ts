/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { take } from 'rxjs/operators';
import {
  AgentTracesFlavor,
  PLUGIN_ID,
  AGENT_TRACES_NAV_ID,
  AGENT_SPANS_NAV_ID,
} from '../../common';
import { AgentTracesServices } from '../types';

/**
 * Extracts the flavor ID from an app ID string
 * App ID format: "agentTraces/{flavor}" -> returns the flavor part
 * For agentTraces without a flavor suffix, defaults to Traces
 */
export const getFlavorFromAppId = (appId: string | undefined): AgentTracesFlavor | null => {
  // The base plugin and both sidebar entry points (traces/spans) belong to the
  // Traces flavor — they mount the same app with different initial tab state.
  if (appId === PLUGIN_ID || appId === AGENT_TRACES_NAV_ID || appId === AGENT_SPANS_NAV_ID) {
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
