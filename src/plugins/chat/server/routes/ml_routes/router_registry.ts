/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities } from '../../../../../core/server';
import { MLAgentRouterFactory } from './ml_agent_router';
import { hasInvestigationCapabilities } from '../../../common/chat_capabilities';
import { GenericMLRouter } from './generic_ml_router';

/**
 * Registry for ML agent routers
 * This handles the initialization and registration of available routers
 * based on the current environment capabilities
 */
export class MLAgentRouterRegistry {
  private static initialized = false;

  /**
   * Initialize and register ML agent routers based on environment capabilities
   * or configured agent IDs. This should be called once during plugin setup.
   * @param capabilities Core application capabilities
   * @param observabilityAgentId Configured observability agent ID
   */
  static initialize(capabilities?: Capabilities, observabilityAgentId?: string): void {
    if (this.initialized) {
      return;
    }

    // Register router if investigation capabilities are enabled OR if any agent ID is configured
    if (hasInvestigationCapabilities(capabilities) || observabilityAgentId) {
      const router = new GenericMLRouter();
      MLAgentRouterFactory.registerRouter(router);
    }

    this.initialized = true;
  }

  /**
   * Reset the registry (primarily for testing)
   */
  static reset(): void {
    MLAgentRouterFactory.clearRouters();
    this.initialized = false;
  }

  /**
   * Check if the registry has been initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}
