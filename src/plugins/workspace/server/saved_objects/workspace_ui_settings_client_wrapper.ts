/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsClientWrapperFactory,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
  SavedObjectsServiceStart,
  WORKSPACE_TYPE,
  WorkspaceAttribute,
  OpenSearchDashboardsRequest,
  SavedObjectsClientContract,
  CURRENT_USER_PLACEHOLDER,
} from '../../../../core/server';
import { WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID } from '../../common/constants';
import { Logger } from '../../../../core/server';
import {
  DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
  DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID,
} from '../../../data_source_management/common';

/**
 * This saved object client wrapper offers methods to get and update UI settings considering
 * the context of the current workspace.
 */
export class WorkspaceUiSettingsClientWrapper {
  constructor(private readonly logger: Logger) {}
  private getScopedClient?: SavedObjectsServiceStart['getScopedClient'];

  /**
   * WORKSPACE_TYPE is a hidden type, regular saved object client won't return hidden types.
   * To access workspace uiSettings which is defined as a property of workspace object, the
   * WORKSPACE_TYPE needs to be excluded.
   */
  private getWorkspaceTypeEnabledClient(request: OpenSearchDashboardsRequest) {
    return this.getScopedClient?.(request, {
      includedHiddenTypes: [WORKSPACE_TYPE],
      excludedWrappers: [WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID],
    }) as SavedObjectsClientContract;
  }

  public setScopedClient(getScopedClient: SavedObjectsServiceStart['getScopedClient']) {
    this.getScopedClient = getScopedClient;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const getUiSettingsWithWorkspace = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      const { requestWorkspaceId } = getWorkspaceState(wrapperOptions.request);

      /**
       * When getting ui settings within a workspace, it will combine the workspace ui settings with
       * the global ui settings and workspace ui settings have higher priority if the same setting
       * was defined in both places
       */
      if (type === 'config' && requestWorkspaceId) {
        const configObject = await wrapperOptions.client.get<Record<string, any>>(
          'config',
          id,
          options
        );

        let workspaceObject: SavedObject<WorkspaceAttribute> | null = null;

        try {
          workspaceObject = await this.getWorkspaceTypeEnabledClient(wrapperOptions.request).get<
            WorkspaceAttribute
          >(WORKSPACE_TYPE, requestWorkspaceId);
        } catch (e) {
          this.logger.error(`Unable to get workspaceObject with id: ${requestWorkspaceId}`);
        }

        const workspaceLevelDefaultDS =
          workspaceObject?.attributes?.uiSettings?.[DEFAULT_DATA_SOURCE_UI_SETTINGS_ID];

        const workspaceLevelDefaultIndex =
          workspaceObject?.attributes?.uiSettings?.[DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID];

        configObject.attributes = {
          ...configObject.attributes,
          ...(workspaceObject ? workspaceObject.attributes.uiSettings : {}),
          // Workspace level default data source value should not extend global UIsettings value.
          [DEFAULT_DATA_SOURCE_UI_SETTINGS_ID]: workspaceLevelDefaultDS,
          // Workspace level default index pattern value should not extend global UIsettings value.
          [DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID]: workspaceLevelDefaultIndex,
        };

        return configObject as SavedObject<T>;
      }

      return wrapperOptions.client.get(type, id, options);
    };

    const updateUiSettingsWithWorkspace = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      const { requestWorkspaceId } = getWorkspaceState(wrapperOptions.request);

      /**
       * When updating ui settings within a workspace, it will update the workspace ui settings,
       * the global ui settings will remain unchanged.
       * Skip updating workspace level setting if the request is updating user level setting specifically.
       */
      if (type === 'config' && requestWorkspaceId && !id.startsWith(CURRENT_USER_PLACEHOLDER)) {
        const configObject = await wrapperOptions.client.get<Record<string, any>>(
          'config',
          id,
          options
        );
        const savedObjectsClient = this.getWorkspaceTypeEnabledClient(wrapperOptions.request);

        const workspaceObject = await savedObjectsClient.get<WorkspaceAttribute>(
          WORKSPACE_TYPE,
          requestWorkspaceId
        );

        const workspaceUpdateResult = await savedObjectsClient.update<WorkspaceAttribute>(
          WORKSPACE_TYPE,
          requestWorkspaceId,
          {
            ...workspaceObject.attributes,
            uiSettings: { ...workspaceObject.attributes.uiSettings, ...attributes },
          },
          options
        );

        if (workspaceUpdateResult.attributes.uiSettings) {
          configObject.attributes = workspaceUpdateResult.attributes.uiSettings;
        }

        return configObject as SavedObjectsUpdateResponse<T>;
      }
      return wrapperOptions.client.update(type, id, attributes, options);
    };

    return {
      ...wrapperOptions.client,
      checkConflicts: wrapperOptions.client.checkConflicts,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      create: wrapperOptions.client.create,
      bulkCreate: wrapperOptions.client.bulkCreate,
      delete: wrapperOptions.client.delete,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
      get: getUiSettingsWithWorkspace,
      update: updateUiSettingsWithWorkspace,
    };
  };
}
