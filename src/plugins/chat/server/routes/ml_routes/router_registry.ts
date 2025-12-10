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
   * This should be called once during plugin setup with current capabilities
   */
  static initialize(capabilities?: Capabilities): void {
    if (this.initialized) {
      return;
    }

    // Environment detection: register router based on capabilities
    if (hasInvestigationCapabilities(capabilities)) {
      MLAgentRouterFactory.registerRouter(new GenericMLRouter());
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
