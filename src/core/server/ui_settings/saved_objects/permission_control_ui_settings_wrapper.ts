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
} from 'opensearch-dashboards/server';
import { getWorkspaceState } from 'opensearch-dashboards/server/utils';
import { uiSettingWithPermission } from './ui_settings_permissions';

const DASHBOARD_ADMIN_SETTINGS_ID = '_dashboard_admin';

type AttributesObject = Record<string, unknown>;

interface UiSettingWithPermission {
  value: unknown;
  isPermissionControlled: boolean;
}

interface ProcessedAttributes {
  permissionAttributes: AttributesObject;
  regularAttributes: AttributesObject;
}

export class PermissionControlUiSettingsWrapper {
  private aclInstance?: ACL;

  constructor(private readonly isPermissionControlEnabled: boolean) {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const getUiSettingsWithPermission = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      if (type === 'config') {
        if (id === DASHBOARD_ADMIN_SETTINGS_ID) {
          // Get admin UI only, return the saved object directly
          // if not found, automatically throw the error
          return wrapperOptions.client.get<T>('config', id, options);
        }

        let adminSettings: SavedObject<T> | undefined;
        try {
          adminSettings = await wrapperOptions.client.get<T>(
            'config',
            DASHBOARD_ADMIN_SETTINGS_ID,
            options
          );
        } catch (error) {
          // If no admin config, ignore this because no admin settings is being set previously
          if (!SavedObjectsErrorHelpers.isNotFoundError(error)) {
            throw error;
          }
        }

        const hasPermission = this.isPermissionControlEnabled
          ? this.isDashboardAdmin(wrapperOptions)
          : true;

        const adminUiSettingAttributes: Record<string, UiSettingWithPermission> = adminSettings
          ? Object.fromEntries(
              Object.entries(
                (adminSettings.attributes as unknown) as UiSettingWithPermission
              ).map(([key, value]) => [key, { value, isPermissionControlled: !hasPermission }])
            )
          : {};

        const uiSettings = await wrapperOptions.client.get<T>(type, id, options);

        return {
          ...uiSettings,
          attributes: {
            ...uiSettings.attributes,
            ...((adminUiSettingAttributes as unknown) as T),
          },
        };
      }

      return wrapperOptions.client.get<T>(type, id, options);
    };

    const createUiSettingWithPermission = async <T = unknown>(
      type: string,
      attributes: T,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObject<T>> => {
      if (type === 'config') {
        const isCreatingAdminSettings = options.id && options.id === DASHBOARD_ADMIN_SETTINGS_ID;
        if (isCreatingAdminSettings) {
          return this.createPermissionUiSetting(
            attributes as AttributesObject,
            options,
            wrapperOptions
          ) as Promise<SavedObject<T>>;
        }

        const { permissionAttributes, regularAttributes } = this.processAttributes(
          attributes as AttributesObject
        );
        if (Object.keys(permissionAttributes).length > 0 && this.isDashboardAdmin(wrapperOptions)) {
          await this.createPermissionUiSetting(permissionAttributes, options, wrapperOptions);
        }
        return wrapperOptions.client.create<T>(type, regularAttributes as T, options);
      }

      return wrapperOptions.client.create<T>(type, attributes, options);
    };

    const updateUiSettingsWithPermission = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ) => {
      if (type === 'config') {
        if (id.includes(DASHBOARD_ADMIN_SETTINGS_ID)) {
          // Update admin UI only, do the update and return the saved object directly
          return wrapperOptions.client.update<T>('config', id, attributes, options);
        }

        const { permissionAttributes, regularAttributes } = this.processAttributes(
          attributes as AttributesObject
        );

        if (Object.keys(permissionAttributes).length > 0) {
          try {
            await wrapperOptions.client.update<AttributesObject>(
              type,
              DASHBOARD_ADMIN_SETTINGS_ID,
              permissionAttributes,
              options
            );
          } catch (error) {
            if (
              SavedObjectsErrorHelpers.isNotFoundError(error) &&
              this.isDashboardAdmin(wrapperOptions)
            ) {
              await this.createPermissionUiSetting(permissionAttributes, options, wrapperOptions);
            } else {
              throw error;
            }
          }
        }

        return wrapperOptions.client.update<Partial<T>>(
          type,
          id,
          regularAttributes as Partial<T>,
          options
        );
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
      return wrapperOptions.client.bulkCreate<T>(objects, options);
    };

    const bulkUpdateWithPermission = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ) => {
      const adminSettingObject = objects.find((obj) => obj.id === DASHBOARD_ADMIN_SETTINGS_ID);
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
      get: getUiSettingsWithPermission,
      checkConflicts: wrapperOptions.client.checkConflicts,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
    };
  };

  private isDashboardAdmin(wrapperOptions: SavedObjectsClientWrapperOptions): boolean {
    // If saved object permission is disabled, everyone should be treated as admin here
    return (
      getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false ||
      !this.isPermissionControlEnabled
    );
  }

  private processAttributes(attributes: AttributesObject): ProcessedAttributes {
    const permissionAttributes: AttributesObject = {};
    const regularAttributes: AttributesObject = {};

    Object.entries(attributes).forEach(([key, value]) => {
      if (key in uiSettingWithPermission) {
        // TODO: check if this manual set back to default is necessary
        permissionAttributes[key] = value !== null ? value : uiSettingWithPermission[key].value;
      } else {
        regularAttributes[key] = value;
      }
    });
    return { permissionAttributes, regularAttributes };
  }

  private async createPermissionUiSetting(
    attributes: AttributesObject,
    options: SavedObjectsBaseOptions,
    wrapperOptions: SavedObjectsClientWrapperOptions
  ): Promise<SavedObject<AttributesObject>> {
    // Verify that attributes only contains keys from uiSettingWithPermission
    const invalidKeys = Object.keys(attributes).filter(
      (key) => !uiSettingWithPermission.hasOwnProperty(key)
    );
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid admin settings keys: ${invalidKeys.join(', ')}.`);
    }

    if (this.isPermissionControlEnabled && !this.aclInstance) {
      // Allow read for all users but no write for any users
      // This means only dashboard admin would have permission to bypass ACL
      this.aclInstance = new ACL().addPermission(['read'], {
        users: ['*'],
      });
    }

    return wrapperOptions.client.create('config', attributes, {
      ...options,
      overwrite: true,
      id: DASHBOARD_ADMIN_SETTINGS_ID,
      ...(this.isPermissionControlEnabled && this.aclInstance
        ? { permissions: this.aclInstance.getPermissions() }
        : {}),
    });
  }
}
