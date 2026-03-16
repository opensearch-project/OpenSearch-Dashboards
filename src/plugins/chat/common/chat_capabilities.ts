/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Chat configuration interface for enablement logic
 */
export interface ChatConfig {
  enabled: boolean;
  agUiUrl?: string;
}

/**
 * Context provider configuration interface
 */
export interface ContextProviderConfig {
  enabled: boolean;
}

/**
 * Check if investigation capabilities are enabled in the given capabilities
 * Returns true only when capabilities.investigation.agenticFeaturesEnabled is explicitly true
 * Returns false for open source environments or when features are disabled
 */
export function hasInvestigationCapabilities(capabilities?: any): boolean {
  return capabilities?.investigation?.agenticFeaturesEnabled === true;
}

/**
 * Unified chat enablement logic that works across all environments
 *
 * This function provides a single source of truth for determining whether
 * chat functionality should be enabled, handling both open source and
 * environments with investigation capabilities in a unified way.
 *
 * @param config Chat plugin configuration (includes enabled flag and agUiUrl)
 * @param contextProviderConfig Context provider configuration
 * @param capabilities Core application capabilities (may include investigation.agenticFeaturesEnabled)
 * @returns true if chat should be enabled, false otherwise
 */
export function isChatEnabled(
  config: ChatConfig,
  contextProviderConfig: ContextProviderConfig,
  capabilities?: any
): boolean {
  // Base requirement: both chat plugin and context provider must be enabled
  if (!config.enabled || !contextProviderConfig.enabled) {
    return false;
  }

  // Environment detection: if agUiUrl is configured, this means a setup for agent endpoint for chat
  if (config.agUiUrl) {
    return true;
  }

  // Environment detection: if no agUiUrl config, we allow feature flag to control
  return hasInvestigationCapabilities(capabilities);
}
