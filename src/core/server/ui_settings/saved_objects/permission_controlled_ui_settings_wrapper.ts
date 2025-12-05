/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ACL,
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsCreateOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from '../../../server';
import { getWorkspaceState } from '../../../server/utils';
import { DASHBOARD_ADMIN_SETTINGS_ID } from '../utils';

/**
 * Wrapper for admin UI settings that enforces permission controls
 * Handles special cases for admin UI settings with appropriate access controls
 */
export class PermissionControlledUiSettingsWrapper {
  private aclInstance?: ACL;

  /**
   * @param isPermissionControlEnabled
   */
  constructor(private readonly isPermissionControlEnabled: boolean) {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createUiSettingWithPermission = async <T = unknown>(
      type: string,
      attributes: T,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObject<T>> => {
      if (type === 'config' && options.id && options.id === DASHBOARD_ADMIN_SETTINGS_ID) {
        return this.createPermissionUiSetting(attributes, options, wrapperOptions);
      }

      return wrapperOptions.client.create<T>(type, attributes, options);
    };

    const updateUiSettingsWithPermission = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (type === 'config' && id === DASHBOARD_ADMIN_SETTINGS_ID) {
        try {
          return ((await wrapperOptions.client.update<SavedObject<T>>(
            type,
            DASHBOARD_ADMIN_SETTINGS_ID,
            attributes,
            options
          )) as unknown) as SavedObjectsUpdateResponse<T>;
        } catch (error) {
          if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
            return this.createPermissionUiSetting(attributes, options, wrapperOptions);
          } else {
            throw error;
          }
        }
      }

      return wrapperOptions.client.update<T>(type, id, attributes, options);
    };

    const bulkCreateWithPermission = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ) => {
      if (options?.id === DASHBOARD_ADMIN_SETTINGS_ID) {
        throw new Error('Bulk create is not supported for admin settings');
      }

      // Prevent bulk creation if any object targets admin settings
      const adminSettingObject = objects.find(
        (obj) => obj.type === 'config' && obj.id === DASHBOARD_ADMIN_SETTINGS_ID
      );

      if (adminSettingObject) {
        throw new Error('Bulk create is not supported for admin settings');
      }

      return wrapperOptions.client.bulkCreate<T>(objects, options);
    };

    const bulkUpdateWithPermission = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ) => {
      const adminSettingObject = objects.find(
        (obj) => obj.type === 'config' && obj.id === DASHBOARD_ADMIN_SETTINGS_ID
      );

      if (adminSettingObject) {
        throw new Error('Bulk update is not supported for admin settings');
      }

      return wrapperOptions.client.bulkUpdate<T>(objects, options);
    };

    return {
      ...wrapperOptions.client,
      create: createUiSettingWithPermission,
      bulkCreate: bulkCreateWithPermission,
      delete: wrapperOptions.client.delete,
      update: updateUiSettingsWithPermission,
      bulkUpdate: bulkUpdateWithPermission,
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

  private checkUiSettingsWritePermission(wrapperOptions: SavedObjectsClientWrapperOptions): void {
    // If saved object permission is disabled, everyone should be treated as admin here
    const isDashboardAdmin =
      getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false ||
      !this.isPermissionControlEnabled;

    if (!isDashboardAdmin) {
      throw SavedObjectsErrorHelpers.decorateForbiddenError(
        new Error('No permission for admin UI settings operations')
      );
    }
  }

  private getAclInstance(): ACL | undefined {
    if (!this.isPermissionControlEnabled) {
      return undefined;
    }

    if (!this.aclInstance) {
      // Allow read for all users but no write for any users
      // This means only dashboard admin would have permission to bypass ACL
      this.aclInstance = new ACL().addPermission(['read'], {
        users: ['*'],
      });
    }

    return this.aclInstance;
  }

  private async createPermissionUiSetting<T>(
    attributes: T,
    options: SavedObjectsBaseOptions,
    wrapperOptions: SavedObjectsClientWrapperOptions
  ): Promise<SavedObject<T>> {
    this.checkUiSettingsWritePermission(wrapperOptions);

    const aclInstance = this.getAclInstance();

    return wrapperOptions.client.create('config', attributes, {
      ...options,
      overwrite: true,
      id: DASHBOARD_ADMIN_SETTINGS_ID,
      ...(aclInstance ? { permissions: aclInstance.getPermissions() } : {}),
    });
  }
}
