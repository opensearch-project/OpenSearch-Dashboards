/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import _ from 'lodash';
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
import { EditMode } from '../../common/data_sources/types';
import { getWorkspaceState } from '../../../../core/server/utils';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../common';

/**
 * Determine whether the user has the permission to create, delete, and update data source based on edit mode.
 * Edit mode is read_only, any user has no permission.
 * Edit mode is admin_only, only OSD admin has permission.
 */
export class DataSourcePermissionClientWrapper {
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createWithEditMode = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const bulkCreateWithEditMode = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
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

    const updateWithEditMode = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE !== type) {
        return await wrapperOptions.client.update(type, id, attributes, options);
      }

      // If the editMode is read only, the OSD admin can assign workspaces to the data source.
      if (this.editMode === EditMode.ReadOnly && options.workspaces) {
        const originalDataSource = await wrapperOptions.client.get(type, id);
        const attributesToCompare = ['title', 'description', 'auth'];
        const originalAttributes = _.pick(originalDataSource.attributes, attributesToCompare);
        const updateAttributes = _.pick(attributes, attributesToCompare);

        if (_.isEqual(originalAttributes, updateAttributes)) {
          return await wrapperOptions.client.update(type, id, attributes, options);
        }
      }

      throw this.generatePermissionError();
    };

    const bulkUpdateWithEditMode = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
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

    const deleteWithEditMode = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      if (DATA_SOURCE_SAVED_OBJECT_TYPE === type) {
        throw this.generatePermissionError();
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    const isDashboardAdmin = getWorkspaceState(wrapperOptions.request)?.isDashboardAdmin;
    if (this.editMode === EditMode.AdminOnly && isDashboardAdmin) {
      return wrapperOptions.client;
    }

    return {
      ...wrapperOptions.client,
      create: createWithEditMode,
      bulkCreate: bulkCreateWithEditMode,
      checkConflicts: wrapperOptions.client.checkConflicts,
      delete: deleteWithEditMode,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: updateWithEditMode,
      bulkUpdate: bulkUpdateWithEditMode,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
    };
  };

  constructor(private editMode: string) {}

  private generatePermissionError = () =>
    SavedObjectsErrorHelpers.decorateForbiddenError(
      new Error(
        i18n.translate('dashboard.admin.permission.invalidate', {
          defaultMessage: 'You have no permission to perform this operation',
        })
      )
    );
}
