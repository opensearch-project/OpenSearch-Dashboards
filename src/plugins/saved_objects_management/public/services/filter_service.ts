/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectsManagementFilter } from './types';

export interface SavedObjectsManagementFilterServiceSetup {
  /**
   * register given filter in the registry.
   */
  register: (filter: SavedObjectsManagementFilter<unknown>) => void;
}

export interface SavedObjectsManagementFilterServiceStart {
  /**
   * return all {@link SavedObjectsManagementFilter | filters} currently registered.
   */
  getAll: () => Array<SavedObjectsManagementFilter<unknown>>;
}

export class SavedObjectsManagementFilterService {
  private readonly filters = new Map<string, SavedObjectsManagementFilter<unknown>>();

  setup(): SavedObjectsManagementFilterServiceSetup {
    return {
      register: (filter) => {
        if (this.filters.has(filter.id)) {
          throw new Error(`Saved Objects Management Filter with id '${filter.id}' already exists`);
        }
        this.filters.set(filter.id, filter);
      },
    };
  }

  start(): SavedObjectsManagementFilterServiceStart {
    return {
      getAll: () => [...this.filters.values()],
    };
  }
}
