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
import { DASHBOARD_ADMIN_SETTINGS_ID, isGlobalScope } from '../utils';
import { ENABLE_GLOBAL_SETTING_CONTROL } from '../../../utils/constants';
import { InternalDynamicConfigServiceSetup } from '../../config';

/**
 * Wrapper for admin UI settings that enforces permission controls
 * Handles special cases for admin UI settings with appropriate access controls
 */
export class PermissionControlledUiSettingsWrapper {
  private aclInstance?: ACL;

  /**
   * @param dynamicConfig
   */
  constructor(private readonly dynamicConfig: InternalDynamicConfigServiceSetup) {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    // Reads the legacy `uiSettings.globalScopeEditable` dynamic config.
    const isGlobalScopeEditableViaDynamicConfig = async (): Promise<boolean> => {
      try {
        const dynamicConfigServiceStart = await this.dynamicConfig.getStartService();
        const store = dynamicConfigServiceStart.createStoreFromRequest(wrapperOptions.request);
        const client = dynamicConfigServiceStart.getClient();
        const dynamicConfig = await client.getConfig(
          { pluginConfigPath: 'uiSettings' },
          { asyncLocalStorageContext: store! }
        );
        return dynamicConfig.globalScopeEditable.enabled;
      } catch (error) {
        // In OSS, if the dynamic config can't be read, fall back to the permissive default.
        return true;
      }
    };

    // True when the GLOBAL scope config write should be blocked for the current
    // (non-admin) user. The admin-controlled toggle takes precedence: when an admin
    // has explicitly set ENABLE_GLOBAL_SETTING_CONTROL via the UI, that value wins.
    // When it was never set, fall back to the legacy dynamic config for backward
    // compatibility: restricted === !globalScopeEditable.enabled.
    const isGlobalConfigWriteForbidden = async (): Promise<boolean> => {
      const isDashboardAdmin = getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false;

      if (isDashboardAdmin) {
        return false;
      }

      let adminConfigAttributes: Record<string, unknown> | undefined;
      try {
        // The toggle lives in the admin-scoped config doc, which is readable by
        // all users (ACL grants read to '*'). `get` is unwrapped here, so no recursion.
        const adminConfig = await wrapperOptions.client.get<Record<string, unknown>>(
          'config',
          DASHBOARD_ADMIN_SETTINGS_ID
        );
        adminConfigAttributes = adminConfig.attributes;
      } catch (error) {
        // No admin config doc yet means the toggle has never been set by an admin.
        if (!SavedObjectsErrorHelpers.isNotFoundError(error)) {
          throw error;
        }
      }

      // Admin explicitly set the toggle through the UI → it is the source of truth.
      if (adminConfigAttributes && ENABLE_GLOBAL_SETTING_CONTROL in adminConfigAttributes) {
        return adminConfigAttributes[ENABLE_GLOBAL_SETTING_CONTROL] === true;
      }

      // Otherwise honour the legacy dynamic config (backward compatibility).
      return !(await isGlobalScopeEditableViaDynamicConfig());
    };

    // Enforce the admin-only gate on the GLOBAL scope config doc.
    const assertGlobalConfigWriteAllowed = async (type: string, id?: string): Promise<void> => {
      if (
        type === 'config' &&
        !!id &&
        isGlobalScope(id) &&
        (await isGlobalConfigWriteForbidden())
      ) {
        throw SavedObjectsErrorHelpers.decorateForbiddenError(
          new Error('No permission to update global settings')
        );
      }
    };

    const createUiSettingWithPermission = async <T = unknown>(
      type: string,
      attributes: T,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObject<T>> => {
      if (type === 'config' && options.id && options.id === DASHBOARD_ADMIN_SETTINGS_ID) {
        return this.createPermissionUiSetting(attributes, options, wrapperOptions);
      }

      await assertGlobalConfigWriteAllowed(type, options.id);

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
          return (await wrapperOptions.client.update<SavedObject<T>>(
            type,
            DASHBOARD_ADMIN_SETTINGS_ID,
            attributes,
            options
          )) as unknown as SavedObjectsUpdateResponse<T>;
        } catch (error) {
          if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
            return this.createPermissionUiSetting(attributes, options, wrapperOptions);
          } else {
            throw error;
          }
        }
      }

      await assertGlobalConfigWriteAllowed(type, id);

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

      const globalCreateObject = objects.find(
        (obj) => obj.type === 'config' && !!obj.id && isGlobalScope(obj.id)
      );
      if (globalCreateObject) {
        await assertGlobalConfigWriteAllowed('config', globalCreateObject.id);
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

      const globalUpdateObject = objects.find(
        (obj) => obj.type === 'config' && !!obj.id && isGlobalScope(obj.id)
      );
      if (globalUpdateObject) {
        await assertGlobalConfigWriteAllowed('config', globalUpdateObject.id);
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
    const isDashboardAdmin = getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false;

    if (!isDashboardAdmin) {
      throw SavedObjectsErrorHelpers.decorateForbiddenError(
        new Error('No permission for admin UI settings operations')
      );
    }
  }

  private getAclInstance(): ACL | undefined {
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
