/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import _ from 'lodash';
import {
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsDeleteOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from '../../../../core/server';
import { getWorkspaceState } from '../../../../core/server/utils';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../../data_source/common';
import { ManageableBy } from '../../common';

/**
 * Determine whether the user has the permissions to create, delete, and update data source based on manageableBy/dataSourceAdmin.
 * DataSourceAdmin user has all permissions.
 * If manageableBy is all, any user has permissions.
 * If manageableBy is none, any user has no permissions.
 * If manageableBy is dashboard_admin, only OSD admin has permissions.
 */
export class DataSourcePermissionClientWrapper {
  constructor(private manageableBy: string) {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const { isDashboardAdmin, isDataSourceAdmin } = getWorkspaceState(wrapperOptions.request) || {};
    if (isDataSourceAdmin) {
      return wrapperOptions.client;
    }
    // If isDashboardAdmin is undefined / true, the user will be dashboard admin
    const isDashboardAdminRequest = isDashboardAdmin !== false;

    const canSkipWrapper =
      this.manageableBy === ManageableBy.All ||
      (this.manageableBy === ManageableBy.DashboardAdmin && isDashboardAdminRequest);

    const createWithManageableBy = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type && !canSkipWrapper) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const bulkCreateWithManageableBy = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (canSkipWrapper) {
        return await wrapperOptions.client.bulkCreate(objects, options);
      }
      const disallowedSavedObjects: Array<SavedObjectsBulkCreateObject<T>> = [];
      const allowedSavedObjects: Array<SavedObjectsBulkCreateObject<T>> = [];

      objects.forEach((item) => {
        if (DATA_SOURCE_SAVED_OBJECT_TYPE === item.type) {
          disallowedSavedObjects.push(item);
          return;
        }

        allowedSavedObjects.push(item);
        return;
      });

      const bulkCreateResult = await wrapperOptions.client.bulkCreate(allowedSavedObjects, options);

      // Merge the data source saved objects and real client bulkCreate result.
      return {
        saved_objects: [
          ...(bulkCreateResult?.saved_objects || []),
          ...disallowedSavedObjects.map((item) => ({
            ...item,
            error: {
              ...this.generatePermissionError().output.payload,
              metadata: { isNotOverwritable: true },
            },
          })),
        ],
      } as SavedObjectsBulkResponse<T>;
    };

    /**
     *  Updating a single data source can happen in 2 scenarios:
     *  1. Update data source's attribute, which can only be done by data source admin when managedBy is `none`
     *  2. Assign/Unassign data source to workspaces, which under the hood will update the `workspaces` field of the data source,
     *  and can be done by dashboard admin even when the managedBy is `none`.
     *  3. When the managedBy is `all` and the user is not dashboard admin,
     *  need to determine whether the operation is assign/unassign.
     */
    const updateWithManageableBy = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (
        DATA_SOURCE_SAVED_OBJECT_TYPE !== type ||
        (this.manageableBy === ManageableBy.DashboardAdmin && isDashboardAdminRequest)
      ) {
        return await wrapperOptions.client.update(type, id, attributes, options);
      }

      if (options.workspaces) {
        if (isDashboardAdminRequest) {
          const originalDataSource = await wrapperOptions.client.get(type, id);
          const originalDataSourceSubset = _.pick(
            originalDataSource.attributes,
            Object.keys(attributes)
          );
          if (_.isEqual(originalDataSourceSubset, attributes)) {
            return await wrapperOptions.client.update(type, id, attributes, options);
          }
        }
        throw this.generatePermissionError();
      }

      if (this.manageableBy === ManageableBy.All) {
        return await wrapperOptions.client.update(type, id, attributes, options);
      }
      throw this.generatePermissionError();
    };

    const bulkUpdateWithManageableBy = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      if (canSkipWrapper) {
        return await wrapperOptions.client.bulkUpdate(objects, options);
      }
      const disallowedSavedObjects: Array<SavedObjectsBulkUpdateObject<T>> = [];
      const allowedSavedObjects: Array<SavedObjectsBulkUpdateObject<T>> = [];

      objects.forEach((item) => {
        if (DATA_SOURCE_SAVED_OBJECT_TYPE === item.type) {
          disallowedSavedObjects.push(item);
          return;
        }

        allowedSavedObjects.push(item);
        return;
      });

      const bulkUpdateResult = await wrapperOptions.client.bulkUpdate(allowedSavedObjects, options);

      // Merge the data source saved objects and real client bulkUpdate result.
      return {
        saved_objects: [
          ...(bulkUpdateResult?.saved_objects || []),
          ...disallowedSavedObjects.map((item) => ({
            ...item,
            error: {
              ...this.generatePermissionError().output.payload,
              metadata: { isNotOverwritable: true },
            },
          })),
        ],
      } as SavedObjectsBulkUpdateResponse<T>;
    };

    const deleteWithManageableBy = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type && !canSkipWrapper) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    const addToWorkspacesWithManageableBy = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Dashboard admin can assign data source to workspace
      if (type === DATA_SOURCE_SAVED_OBJECT_TYPE && !isDashboardAdminRequest) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.addToWorkspaces(type, id, targetWorkspaces, options);
    };

    const deleteFromWorkspacesWithManageableBy = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Dashboard admin can unassign data source to workspace
      if (type === DATA_SOURCE_SAVED_OBJECT_TYPE && !isDashboardAdminRequest) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.deleteFromWorkspaces(type, id, targetWorkspaces, options);
    };

    return {
      ...wrapperOptions.client,
      create: createWithManageableBy,
      bulkCreate: bulkCreateWithManageableBy,
      checkConflicts: wrapperOptions.client.checkConflicts,
      delete: deleteWithManageableBy,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: updateWithManageableBy,
      bulkUpdate: bulkUpdateWithManageableBy,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      addToWorkspaces: addToWorkspacesWithManageableBy,
      deleteFromWorkspaces: deleteFromWorkspacesWithManageableBy,
    };
  };

  private generatePermissionError = () =>
    SavedObjectsErrorHelpers.decorateForbiddenError(
      new Error(
        i18n.translate('dashboard.admin.permission.invalidate', {
          defaultMessage: 'You have no permission to perform this operation',
        })
      )
    );
}
