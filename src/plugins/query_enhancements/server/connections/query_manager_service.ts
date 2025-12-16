/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseConnectionManager } from './managers/base_connection_manager';

/**
 * Service for managing query managers.
 * Handles query execution for different data connection types.
 * @experimental this class is experimental and might change in future releases.
 */
class QueryManagerService {
  private readonly managers: Map<string, BaseConnectionManager>;
  constructor() {
    this.managers = new Map();
  }

  register(dataConnectionType: string, manager: BaseConnectionManager) {
    const existingManager = this.managers.get(dataConnectionType);
    if (existingManager !== undefined) {
      if (existingManager === manager) return;

      throw new Error(
        `Query manager for dataConnectionType ${dataConnectionType} is already registered. Unable to register another manager.`
      );
    }
    this.managers.set(dataConnectionType, manager);
  }

  getManager(dataConnectionType: string): BaseConnectionManager | undefined {
    return this.managers.get(dataConnectionType);
  }
}

// export as singleton
export const queryManagerService = new QueryManagerService();
