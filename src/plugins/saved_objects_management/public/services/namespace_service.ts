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

import { SavedObjectsManagementNamespace } from './types';

export interface SavedObjectsManagementNamespaceServiceSetup {
  /**
   * register given namespace in the registry.
   */
  register: (namespace: SavedObjectsManagementNamespace<unknown>) => void;
}

export interface SavedObjectsManagementNamespaceServiceStart {
  /**
   * return all {@link SavedObjectsManagementNamespace | namespaces} currently registered.
   */
  getAll: () => Array<SavedObjectsManagementNamespace<unknown>>;
}

export class SavedObjectsManagementNamespaceService {
  private readonly namespaces = new Map<string, SavedObjectsManagementNamespace<unknown>>();

  setup(): SavedObjectsManagementNamespaceServiceSetup {
    return {
      register: (ns) => {
        if (this.namespaces.has(ns.id)) {
          throw new Error(`Saved Objects Management Namespace with id '${ns.id}' already exists`);
        }
        this.namespaces.set(ns.id, ns);
      },
    };
  }

  start(): SavedObjectsManagementNamespaceServiceStart {
    return {
      getAll: () => [...this.namespaces.values()],
    };
  }
}
