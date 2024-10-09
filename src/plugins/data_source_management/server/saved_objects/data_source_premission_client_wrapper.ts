/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
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
    // If isDashboardAdmin is undefined / true, the user will be dashboard admin
    const isDashboardAdminRequest = isDashboardAdmin !== false;
    if (
      isDataSourceAdmin ||
      this.manageableBy === ManageableBy.All ||
      (this.manageableBy === ManageableBy.DashboardAdmin && isDashboardAdminRequest)
    ) {
      return wrapperOptions.client;
    }

    const createWithManageableBy = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const bulkCreateWithManageableBy = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const disallowedSavedObjects: Array<SavedObjectsBulkCreateObject<T>> = [];
      const allowedSavedObjects: Array<SavedObjectsBulkCreateObject<T>> = [];

      objects.forEach((item) => {
        if (DATA_SOURCE_SAVED_OBJECT_TYPE === item.type) {
          disallowedSavedObjects.push(item);
        } else {
          allowedSavedObjects.push(item);
        }
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

    const updateWithManageableBy = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkUpdateWithManageableBy = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      const disallowedSavedObjects: Array<SavedObjectsBulkUpdateObject<T>> = [];
      const allowedSavedObjects: Array<SavedObjectsBulkUpdateObject<T>> = [];

      objects.forEach((item) => {
        if (DATA_SOURCE_SAVED_OBJECT_TYPE === item.type) {
          disallowedSavedObjects.push(item);
        } else {
          allowedSavedObjects.push(item);
        }
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
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    return {
      ...wrapperOptions.client,
      create: createWithManageableBy,
      bulkCreate: bulkCreateWithManageableBy,
      delete: deleteWithManageableBy,
      update: updateWithManageableBy,
      bulkUpdate: bulkUpdateWithManageableBy,
      get: wrapperOptions.client.get,
      checkConflicts: wrapperOptions.client.checkConflicts,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
    };
  };

  private generatePermissionError = () =>
    SavedObjectsErrorHelpers.decorateForbiddenError(
      new Error(
        i18n.translate('dataSourcesManagement.admin.permission.invalid', {
          defaultMessage: 'You have no permission to perform this operation',
        })
      )
    );
}
