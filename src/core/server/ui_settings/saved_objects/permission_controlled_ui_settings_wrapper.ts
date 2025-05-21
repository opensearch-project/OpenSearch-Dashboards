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
} from 'opensearch-dashboards/server';
import { getWorkspaceState } from 'opensearch-dashboards/server/utils';
import { DASHBOARD_ADMIN_SETTINGS_ID } from '../utils';

type AttributesObject = Record<string, unknown>;

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
        // Skip createPermissionUiSetting if attributes only contains buildNum
        const keys = Object.keys(attributes as AttributesObject);
        if (keys.length === 1 && keys[0] === 'buildNum') {
          return {
            id: DASHBOARD_ADMIN_SETTINGS_ID,
            type: 'config',
            attributes: {} as T,
            references: [],
          };
        }

        return (this.createPermissionUiSetting(
          attributes as AttributesObject,
          options,
          wrapperOptions
        ) as unknown) as SavedObject<T>;
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
        this.checkAdminPermission(wrapperOptions);

        try {
          const { buildNum, ...other } = attributes as AttributesObject;
          return ((await wrapperOptions.client.update<AttributesObject>(
            type,
            DASHBOARD_ADMIN_SETTINGS_ID,
            other,
            options
          )) as unknown) as SavedObjectsUpdateResponse<T>;
        } catch (error) {
          if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
            return (this.createPermissionUiSetting(
              attributes as AttributesObject,
              options,
              wrapperOptions
            ) as unknown) as SavedObjectsUpdateResponse<T>;
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

      // Check if any object is trying to create admin settings
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

  private checkAdminPermission(wrapperOptions: SavedObjectsClientWrapperOptions): void {
    // If saved object permission is disabled, everyone should be treated as admin here
    const isDashboardAdmin =
      getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false ||
      !this.isPermissionControlEnabled;

    if (!isDashboardAdmin) {
      throw new Error('No permission for admin UI settings operations');
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

  private async createPermissionUiSetting(
    attributes: AttributesObject,
    options: SavedObjectsBaseOptions,
    wrapperOptions: SavedObjectsClientWrapperOptions
  ): Promise<SavedObject<AttributesObject>> {
    this.checkAdminPermission(wrapperOptions);

    const aclInstance = this.getAclInstance();

    return wrapperOptions.client.create('config', attributes, {
      ...options,
      overwrite: true,
      id: DASHBOARD_ADMIN_SETTINGS_ID,
      ...(aclInstance ? { permissions: aclInstance.getPermissions() } : {}),
    });
  }
}
