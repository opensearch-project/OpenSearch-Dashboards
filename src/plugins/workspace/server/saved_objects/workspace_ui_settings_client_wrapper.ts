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
  SavedObjectsErrorHelpers,
  CURRENT_WORKSPACE_PLACEHOLDER,
  PluginInitializerContext,
  UiSettingsServiceStart,
  IUiSettingsClient,
  UiSettingScope,
} from '../../../../core/server';
import { WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID } from '../../common/constants';
import { Logger } from '../../../../core/server';

/**
 * This saved object client wrapper offers methods to get and update UI settings considering
 * the context of the current workspace.
 */
export class WorkspaceUiSettingsClientWrapper {
  constructor(
    private readonly logger: Logger,
    private readonly env: PluginInitializerContext['env']
  ) {}
  private getScopedClient?: SavedObjectsServiceStart['getScopedClient'];
  private asScopedUISettingsClient?: UiSettingsServiceStart['asScopedToClient'];

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

  private getUISettingsClient(savedObjectClient: SavedObjectsClientContract) {
    return this.asScopedUISettingsClient?.(savedObjectClient) as IUiSettingsClient;
  }

  public setScopedClient(getScopedClient: SavedObjectsServiceStart['getScopedClient']) {
    this.getScopedClient = getScopedClient;
  }

  public setAsScopedUISettingsClient(asScopedToClient: UiSettingsServiceStart['asScopedToClient']) {
    this.asScopedUISettingsClient = asScopedToClient;
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
       * the global ui settings and workspace ui settings will override global settings attribute
       */
      if (type === 'config' && id.startsWith(CURRENT_WORKSPACE_PLACEHOLDER)) {
        // if not in a workspace and try to get workspace level settings
        // it should return NotFoundError
        if (!requestWorkspaceId) {
          throw SavedObjectsErrorHelpers.createGenericNotFoundError();
        }

        const normalizeDocId = id.replace(`${CURRENT_WORKSPACE_PLACEHOLDER}_`, '');

        const configObject = await wrapperOptions.client.get<Record<string, any>>(
          'config',
          normalizeDocId,
          options
        );

        let workspaceObject: SavedObject<WorkspaceAttribute> | null = null;
        const workspaceTypeEnabledClient = this.getWorkspaceTypeEnabledClient(
          wrapperOptions.request
        );

        try {
          workspaceObject = await workspaceTypeEnabledClient.get<WorkspaceAttribute>(
            WORKSPACE_TYPE,
            requestWorkspaceId
          );
        } catch (e) {
          this.logger.error(`Unable to get workspaceObject with id: ${requestWorkspaceId}`);
        }

        const UISettingsClient = this.getUISettingsClient(workspaceTypeEnabledClient);
        const registeredConfigs = UISettingsClient.getRegistered();
        const workspaceScopeKeys = Object.entries(registeredConfigs)
          .filter(([, config]) =>
            Array<UiSettingScope>()
              .concat(config.scope || [])
              .includes(UiSettingScope.WORKSPACE)
          )
          .map(([key]) => key);

        const workspaceSettings = workspaceObject?.attributes?.uiSettings || {};
        workspaceScopeKeys.forEach((key) => {
          workspaceSettings[key] = workspaceSettings[key];
        });

        configObject.attributes = workspaceSettings;

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
      const updateWorkspaceSettings = async (
        configDocId: string,
        workspaceId: string,
        workspaceAttributes: Partial<T>
      ) => {
        const savedObjectsClient = this.getWorkspaceTypeEnabledClient(wrapperOptions.request);
        const configObject = await wrapperOptions.client.get<Record<string, any>>(
          'config',
          configDocId,
          options
        );

        const workspaceObject = await savedObjectsClient.get<WorkspaceAttribute>(
          WORKSPACE_TYPE,
          workspaceId
        );

        const workspaceUpdateResult = await savedObjectsClient.update<WorkspaceAttribute>(
          WORKSPACE_TYPE,
          workspaceId,
          {
            ...workspaceObject.attributes,
            uiSettings: { ...workspaceObject.attributes.uiSettings, ...workspaceAttributes },
          },
          options
        );

        configObject.attributes = workspaceUpdateResult.attributes.uiSettings || {};

        return configObject as SavedObjectsUpdateResponse<T>;
      };

      /**
       * When updating ui settings within a workspace, it will update the workspace ui settings,
       * the global ui settings will remain unchanged.
       * Skip updating workspace level setting if the request is updating user level setting specifically or global workspace level setting.
       */
      if (type === 'config') {
        if (id.startsWith(CURRENT_WORKSPACE_PLACEHOLDER)) {
          // if not in a workspace and try to update workspace level settings
          // it should return 400 BadRequestError
          if (!requestWorkspaceId) {
            throw SavedObjectsErrorHelpers.createBadRequestError();
          }

          const normalizeDocId = id.replace(`${CURRENT_WORKSPACE_PLACEHOLDER}_`, '');

          return updateWorkspaceSettings(normalizeDocId, requestWorkspaceId, attributes);
        } else if (requestWorkspaceId && id === this.env.packageInfo.version) {
          // The code below maintains backward compatibility for UI setting updates in version 3.0.0.
          // Remove if no external code is modifying these settings through the global scope.
          this.logger.warn(
            'Deprecation warning: updating workspace settings through global scope will no longer be supported.'
          );
          return updateWorkspaceSettings(id, requestWorkspaceId, attributes);
        }
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
