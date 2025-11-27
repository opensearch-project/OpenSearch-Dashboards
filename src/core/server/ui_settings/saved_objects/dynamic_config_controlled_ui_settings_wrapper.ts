/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  SavedObjectsClientWrapperFactory,
  SavedObjectsClientWrapperOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from '../../../server';
import { getWorkspaceState } from '../../../server/utils';
import { isGlobalScope } from '../utils';
import { InternalDynamicConfigServiceSetup } from '../../config';

/**
 * Wrapper for reading dynamic feature flag to decide if global UI settings
 * are editable or not for non-admin users
 * @param dynamicConfig
 */
export class DynamicConfigControlledUiSettingsWrapper {
  constructor(private readonly dynamicConfig: InternalDynamicConfigServiceSetup) {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const updateUiSettingsWithPermission = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (type === 'config' && isGlobalScope(id)) {
        const hasPermission = await this.checkPermission(wrapperOptions);
        if (!hasPermission) throw this.generatePermissionError();
      }

      return wrapperOptions.client.update<T>(type, id, attributes, options);
    };

    return {
      ...wrapperOptions.client,
      create: wrapperOptions.client.create,
      bulkCreate: wrapperOptions.client.bulkCreate,
      delete: wrapperOptions.client.delete,
      update: updateUiSettingsWithPermission,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
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

  private async checkPermission(
    wrapperOptions: SavedObjectsClientWrapperOptions
  ): Promise<boolean> {
    //  If saved object permission is disabled, getWorkspaceState will return undefined,everyone should be treated as admin here
    if (getWorkspaceState(wrapperOptions.request).isDashboardAdmin !== false) return true;

    try {
      const dynamicConfigServiceStart = await this.dynamicConfig.getStartService();
      const store = dynamicConfigServiceStart.getAsyncLocalStore();
      const client = dynamicConfigServiceStart.getClient();

      const dynamicConfig = await client.getConfig(
        { pluginConfigPath: 'uiSettings' },
        { asyncLocalStorageContext: store! }
      );

      // 1. when globalScopeEditable is false, only dashboard admin can edit global settings
      // 2. when globalScopeEditable is true(default), both dashboard admin and non-admin users can edit global settings
      return dynamicConfig.globalScopeEditable.enabled;
    } catch (e) {
      throw new Error(
        i18n.translate('core.dynamic.config.controlled.ui.settings.read.invalidate', {
          defaultMessage: 'Unable to read dynamic config',
        })
      );
    }
  }

  private generatePermissionError = () =>
    SavedObjectsErrorHelpers.decorateForbiddenError(
      new Error(
        i18n.translate('core.dynamic.config.controlled.ui.settings.permission.invalidate', {
          defaultMessage: 'No permission for UI settings operations',
        })
      )
    );
}
