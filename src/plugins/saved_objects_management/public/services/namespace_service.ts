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

// @ts-expect-error TS2305 TODO(ts-error): fixme
import { SavedObjectsManagementNamespace } from './types';

export interface SavedObjectsManagementNamespaceServiceSetup {
  /**
   * register given namespace in the registry.
   */
  register: (namespace: SavedObjectsManagementNamespace<unknown>) => void;
  registerAlias: (alias: string) => void;
}

export interface SavedObjectsManagementNamespaceServiceStart {
  /**
   * return all {@link SavedObjectsManagementNamespace | namespaces} currently registered.
   */
  getAll: () => Array<SavedObjectsManagementNamespace<unknown>>;
  getAlias: () => string;
}

export class SavedObjectsManagementNamespaceService {
  private readonly namespaces = new Map<string, SavedObjectsManagementNamespace<unknown>>();
  // @ts-expect-error TS7008 TODO(ts-error): fixme
  private readonly alias;

  setup(): SavedObjectsManagementNamespaceServiceSetup {
    return {
      register: (ns) => {
        if (this.namespaces.has(ns.id)) {
          throw new Error(`Saved Objects Management Namespace with id '${ns.id}' already exists`);
        }
        this.namespaces.set(ns.id, ns);
      },
      registerAlias: (alias) => {
        if (!!this.alias) {
          throw new Error(
            `An alias has already been registered. Cannot register more than one alias.`
          );
        }
        // @ts-expect-error TS2540 TODO(ts-error): fixme
        this.alias = alias;
      },
    };
  }

  start(): SavedObjectsManagementNamespaceServiceStart {
    return {
      getAll: () => [...this.namespaces.values()],
      getAlias: () => this.alias,
    };
  }
}
