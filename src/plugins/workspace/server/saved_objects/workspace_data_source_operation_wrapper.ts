/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  SavedObjectsBulkCreateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsUpdateOptions,
  SavedObjectsFindOptions,
  SavedObjectsDeleteOptions,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateObject,
} from '../../../../core/server';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../../data_source/common';

// Data source type saved object could not be created/updated/deleted in workspace exclude dashboard admin assign/unassign.
// Assign would call update, unassign would call overwrite create or update.
export class WorkspaceDataSourceOperationWrapper {
  private isDataSourceType(type: SavedObjectsFindOptions['type']): boolean {
    if (Array.isArray(type)) {
      return type.every((item) => item === DATA_SOURCE_SAVED_OBJECT_TYPE);
    }

    return type === DATA_SOURCE_SAVED_OBJECT_TYPE;
  }

  private throwOperationError() {
    throw new Error(
      'You could not create/update/delete data source in workspace, please exit workspace and do it.'
    );
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const isDashboardAdmin = getWorkspaceState(wrapperOptions.request)?.isDashboardAdmin;
    const isInWorkspace = getWorkspaceState(wrapperOptions.request)?.requestWorkspaceId;

    return {
      ...wrapperOptions.client,
      create: <T>(type: string, attributes: T, options: SavedObjectsCreateOptions = {}) => {
        if (this.isDataSourceType(type) && isInWorkspace) {
          // Dashboard admin can unassign data source and would call overwrite create.
          if (isDashboardAdmin && options.overwrite) {
            return wrapperOptions.client.create(type, attributes, options);
          } else {
            this.throwOperationError();
          }
        }
        return wrapperOptions.client.create(type, attributes, options);
      },
      bulkCreate: <T>(
        objects: Array<SavedObjectsBulkCreateObject<T>>,
        options: SavedObjectsCreateOptions = {}
      ) => {
        // Unassign data source would only call singe create. BulkCreate is not allowed.
        if (isInWorkspace) {
          objects.forEach((obj) => {
            if (this.isDataSourceType(obj.type)) {
              this.throwOperationError();
            }
          });
        }

        return wrapperOptions.client.bulkCreate(objects, options);
      },
      delete: (type: string, id: string, options: SavedObjectsDeleteOptions = {}) => {
        if (this.isDataSourceType(type) && isInWorkspace) {
          this.throwOperationError();
        }
        return wrapperOptions.client.delete(type, id, options);
      },
      update: <T>(
        type: string,
        id: string,
        attributes: Partial<T>,
        options: SavedObjectsUpdateOptions = {}
      ) => {
        if (this.isDataSourceType(type) && isInWorkspace) {
          // Dashboard admin can assign/unassign data source and would update data source object.
          if (options.workspaces && isDashboardAdmin) {
            return wrapperOptions.client.update(type, id, attributes, options);
          } else {
            this.throwOperationError();
          }
        }
        return wrapperOptions.client.update(type, id, attributes, options);
      },
      bulkUpdate: <T>(
        objects: Array<SavedObjectsBulkUpdateObject<T>>,
        options?: SavedObjectsBulkUpdateOptions
      ) => {
        // Assign/unassign data source would only call singe update. BulkUpdate is not allowed.
        if (isInWorkspace) {
          objects.forEach((obj) => {
            if (this.isDataSourceType(obj.type)) {
              this.throwOperationError();
            }
          });
        }

        return wrapperOptions.client.bulkUpdate(objects, options);
      },
    };
  };

  constructor() {}
}
