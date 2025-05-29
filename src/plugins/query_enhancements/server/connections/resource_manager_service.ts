/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseConnectionManager } from './managers/base_connection_manager';

/**
 * @experimental this class is experimental and might change in future releases.
 */
class ResourceManagerService {
  private readonly managers: Map<string, BaseConnectionManager>;
  constructor() {
    this.managers = new Map();
  }

  register(dataConnectionType: string, manager: BaseConnectionManager) {
    if (this.managers.get(dataConnectionType) !== undefined) {
      throw new Error(
        `Manager for dataConnectionType ${dataConnectionType} is already registered. Unable to register another manager.`
      );
    }
    this.managers.set(dataConnectionType, manager);
  }

  getManager(dataConnectionType: string): BaseConnectionManager | undefined {
    return this.managers.get(dataConnectionType);
  }
}

// export as singleton
export const resourceManagerService = new ResourceManagerService();
