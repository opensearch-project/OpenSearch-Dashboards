/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseConnectionManager } from './managers/base_connection_manager';

class ResourceManagerService {
  private readonly managers: { [key: string]: BaseConnectionManager };
  constructor() {
    this.managers = {};
  }

  register(dataConnectionType: string, manager: BaseConnectionManager) {
    if (this.managers[dataConnectionType] !== undefined) {
      throw new Error(
        `Manager for dataConnectionType ${dataConnectionType} is already registered. Unable to register another manager.`
      );
    }
    this.managers[dataConnectionType] = manager;
  }

  getManager(dataConnectionType: string): BaseConnectionManager | undefined {
    return this.managers[dataConnectionType];
  }
}

// export as singleton
export const resourceManagerService = new ResourceManagerService();
