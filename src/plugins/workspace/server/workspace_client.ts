/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  SavedObject,
  SavedObjectsClientContract,
  CoreSetup,
  WorkspaceAttribute,
  SavedObjectsServiceStart,
  UiSettingsServiceStart,
  WORKSPACE_TYPE,
  Logger,
  WorkspaceFindOptions,
  SavedObjectsErrorHelpers,
} from '../../../core/server';
import { updateWorkspaceState, getWorkspaceState } from '../../../core/server/utils';
import {
  IWorkspaceClientImpl,
  IResponse,
  IRequestDetail,
  WorkspaceAttributeWithPermission,
} from './types';
import { workspace } from './saved_objects';
import { generateRandomId, getDataSourcesList, checkAndSetDefaultDataSource } from './utils';
import {
  WORKSPACE_ID_CONSUMER_WRAPPER_ID,
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
} from '../common/constants';
import {
  DATA_SOURCE_SAVED_OBJECT_TYPE,
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
} from '../../data_source/common';
import { ConfigSchema } from '../config';

const WORKSPACE_ID_SIZE = 6;

const DUPLICATE_WORKSPACE_NAME_ERROR = i18n.translate('workspace.duplicate.name.error', {
  defaultMessage: 'workspace name has already been used, try with a different name',
});

const WORKSPACE_NOT_FOUND_ERROR = i18n.translate('workspace.notFound.error', {
  defaultMessage: 'workspace not found',
});

interface ConfigType {
  maximum_workspaces?: ConfigSchema['maximum_workspaces'];
}

export class WorkspaceClient implements IWorkspaceClientImpl {
  private setupDep: CoreSetup;
  private logger: Logger;
  private savedObjects?: SavedObjectsServiceStart;
  private uiSettings?: UiSettingsServiceStart;
  private config?: ConfigType;

  constructor(core: CoreSetup, logger: Logger, config?: ConfigType) {
    this.setupDep = core;
    this.logger = logger;
    this.config = config;
  }

  private getScopedClientWithoutPermission(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract | undefined {
    return this.savedObjects?.getScopedClient(requestDetail.request, {
      excludedWrappers: [
        WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
        /**
         * workspace object does not have workspaces field
         * so need to bypass workspace id consumer wrapper
         * for any kind of operation to saved objects client.
         */
        WORKSPACE_ID_CONSUMER_WRAPPER_ID,
      ],
      includedHiddenTypes: [WORKSPACE_TYPE],
    });
  }

  private getSavedObjectClientsFromRequestDetail(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract {
    return this.savedObjects?.getScopedClient(requestDetail.request, {
      excludedWrappers: [WORKSPACE_ID_CONSUMER_WRAPPER_ID],
      includedHiddenTypes: [WORKSPACE_TYPE],
    }) as SavedObjectsClientContract;
  }
  private getFlattenedResultWithSavedObject(
    savedObject: SavedObject<WorkspaceAttribute>
  ): WorkspaceAttributeWithPermission {
    return {
      ...savedObject.attributes,
      lastUpdatedTime: savedObject.updated_at,
      id: savedObject.id,
      permissions: savedObject.permissions,
    };
  }
  private formatError(error: Error | any): string {
    if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
      return WORKSPACE_NOT_FOUND_ERROR;
    }

    return error.message || error.error || 'Error';
  }
  public async setup(core: CoreSetup): Promise<IResponse<boolean>> {
    this.setupDep.savedObjects.registerType(workspace);
    return {
      success: true,
      result: true,
    };
  }
  public async create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'> & {
      dataSources?: string[];
      dataConnections?: string[];
    }
  ): ReturnType<IWorkspaceClientImpl['create']> {
    try {
      const { permissions, dataSources, dataConnections, ...attributes } = payload;
      const id = generateRandomId(WORKSPACE_ID_SIZE);
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const clientWithoutPermission = this.getScopedClientWithoutPermission(requestDetail);
      const existingWorkspaceRes = await clientWithoutPermission?.find({
        type: WORKSPACE_TYPE,
        search: `"${attributes.name}"`,
        searchFields: ['name'],
      });
      if (existingWorkspaceRes && existingWorkspaceRes.total > 0) {
        throw new Error(DUPLICATE_WORKSPACE_NAME_ERROR);
      }

      if (this.config?.maximum_workspaces) {
        const workspaces = await clientWithoutPermission?.find({
          type: WORKSPACE_TYPE,
        });
        if (workspaces && workspaces.total >= this.config.maximum_workspaces) {
          throw new Error(
            i18n.translate('workspace.maximum.error', {
              defaultMessage: 'Maximum number of workspaces ({length}) reached',
              values: {
                length: this.config.maximum_workspaces,
              },
            })
          );
        }
      }

      const promises = [];

      if (dataSources) {
        for (const dataSourceId of dataSources) {
          promises.push(client.addToWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, dataSourceId, [id]));
        }
      }
      if (dataConnections) {
        for (const connectionId of dataConnections) {
          promises.push(
            client.addToWorkspaces(DATA_CONNECTION_SAVED_OBJECT_TYPE, connectionId, [id])
          );
        }
      }
      await Promise.all(promises);

      const result = await client.create<Omit<WorkspaceAttribute, 'id'>>(
        WORKSPACE_TYPE,
        attributes,
        {
          id,
          permissions,
        }
      );
      if (dataSources && this.uiSettings && client) {
        const rawState = getWorkspaceState(requestDetail.request);
        // This is for setting in workspace environment, otherwise uiSettings can't set workspace level value.
        updateWorkspaceState(requestDetail.request, {
          requestWorkspaceId: id,
        });
        // Set first data source as default after creating workspace
        const uiSettingsClient = this.uiSettings.asScopedToClient(client);
        try {
          await checkAndSetDefaultDataSource(uiSettingsClient, dataSources, false);
        } catch (e) {
          this.logger.error('Set default data source error');
        } finally {
          // Reset workspace state
          updateWorkspaceState(requestDetail.request, {
            requestWorkspaceId: rawState.requestWorkspaceId,
          });
        }
      }

      return {
        success: true,
        result: {
          id: result.id,
        },
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async list(
    requestDetail: IRequestDetail,
    options: WorkspaceFindOptions
  ): ReturnType<IWorkspaceClientImpl['list']> {
    try {
      const {
        saved_objects: savedObjects,
        ...others
      } = await this.getSavedObjectClientsFromRequestDetail(requestDetail).find<WorkspaceAttribute>(
        {
          ...options,
          type: WORKSPACE_TYPE,
          ACLSearchParams: { permissionModes: options.permissionModes },
        }
      );
      return {
        success: true,
        result: {
          ...others,
          workspaces: savedObjects.map((item) => this.getFlattenedResultWithSavedObject(item)),
        },
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async get(
    requestDetail: IRequestDetail,
    id: string
  ): Promise<IResponse<WorkspaceAttribute>> {
    try {
      const result = await this.getSavedObjectClientsFromRequestDetail(requestDetail).get<
        WorkspaceAttribute
      >(WORKSPACE_TYPE, id);
      return {
        success: true,
        result: this.getFlattenedResultWithSavedObject(result),
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Partial<Omit<WorkspaceAttributeWithPermission, 'id'>> & {
      dataSources?: string[];
      dataConnections?: string[];
    }
  ): Promise<IResponse<boolean>> {
    const {
      permissions,
      dataSources: newDataSources,
      dataConnections: newDataConnections,
      ...attributes
    } = payload;
    try {
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      let workspaceInDB: SavedObject<WorkspaceAttribute> = await client.get(WORKSPACE_TYPE, id);
      if (workspaceInDB.attributes.name !== attributes.name) {
        const existingWorkspaceRes = await this.getScopedClientWithoutPermission(
          requestDetail
        )?.find({
          type: WORKSPACE_TYPE,
          search: `"${attributes.name}"`,
          searchFields: ['name'],
          fields: ['_id'],
        });
        if (existingWorkspaceRes && existingWorkspaceRes.total > 0) {
          throw new Error(DUPLICATE_WORKSPACE_NAME_ERROR);
        }
      }

      const originalSelectedDataSourcesAndConnections = await getDataSourcesList(client, [id]);
      const promises = [];

      if (newDataSources) {
        const originalSelectedDataSourceIds = originalSelectedDataSourcesAndConnections
          .filter((item) => item.type === DATA_SOURCE_SAVED_OBJECT_TYPE)
          .map((ds) => ds.id);
        const dataSourcesToBeRemoved = originalSelectedDataSourceIds.filter(
          (ds) => !newDataSources.find((item) => item === ds)
        );
        const dataSourcesToBeAdded = newDataSources.filter(
          (ds) => !originalSelectedDataSourceIds.find((item) => item === ds)
        );
        if (dataSourcesToBeRemoved.length > 0) {
          for (const dataSourceId of dataSourcesToBeRemoved) {
            promises.push(
              client.deleteFromWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, dataSourceId, [id])
            );
          }
        }
        if (dataSourcesToBeAdded.length > 0) {
          for (const dataSourceId of dataSourcesToBeAdded) {
            promises.push(
              client.addToWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, dataSourceId, [id])
            );
          }
        }
      }

      if (newDataConnections) {
        const originalSelectedDataConnectionIds = originalSelectedDataSourcesAndConnections
          .filter((item) => item.type === DATA_CONNECTION_SAVED_OBJECT_TYPE)
          .map((ds) => ds.id);
        const dataConnectionsToBeRemoved = originalSelectedDataConnectionIds.filter(
          (ds) => !newDataConnections.find((item) => item === ds)
        );
        const dataConnectionsToBeAdded = newDataConnections.filter(
          (ds) => !originalSelectedDataConnectionIds.find((item) => item === ds)
        );
        if (dataConnectionsToBeRemoved.length > 0) {
          for (const dataConnectionId of dataConnectionsToBeRemoved) {
            promises.push(
              client.deleteFromWorkspaces(DATA_CONNECTION_SAVED_OBJECT_TYPE, dataConnectionId, [id])
            );
          }
        }
        if (dataConnectionsToBeAdded.length > 0) {
          for (const dataConnectionId of dataConnectionsToBeAdded) {
            promises.push(
              client.addToWorkspaces(DATA_CONNECTION_SAVED_OBJECT_TYPE, dataConnectionId, [id])
            );
          }
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
      /**
       * When the workspace owner unassign themselves, ensure the default data source is set before
       * updating the workspace permissions. This prevents a lack of write permission on saved objects
       * after the user is removed from the workspace.
       **/
      if (newDataSources && this.uiSettings && client) {
        const uiSettingsClient = this.uiSettings.asScopedToClient(client);
        try {
          await checkAndSetDefaultDataSource(uiSettingsClient, newDataSources, true);
          // Doc version may changed after default data source updated.
          workspaceInDB = await client.get(WORKSPACE_TYPE, id);
        } catch (error) {
          this.logger.error('Set default data source error during workspace updating');
        }
      }

      await client.create<Omit<WorkspaceAttribute, 'id'>>(
        WORKSPACE_TYPE,
        { ...workspaceInDB.attributes, ...attributes },
        {
          id,
          permissions,
          overwrite: true,
          version: workspaceInDB.version,
        }
      );

      return {
        success: true,
        result: true,
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async delete(requestDetail: IRequestDetail, id: string): Promise<IResponse<boolean>> {
    try {
      const savedObjectClient = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const workspaceInDB: SavedObject<WorkspaceAttribute> = await savedObjectClient.get(
        WORKSPACE_TYPE,
        id
      );
      if (workspaceInDB.attributes.reserved) {
        return {
          success: false,
          error: i18n.translate('workspace.deleteReservedWorkspace.errorMessage', {
            defaultMessage: 'Reserved workspace {id} is not allowed to delete.',
            values: { id: workspaceInDB.id },
          }),
        };
      }

      // When workspace is to be deleted, unassign all assigned data source before deleting saved object by workspace.
      const selectedDataSources = await getDataSourcesList(savedObjectClient, [id]);
      if (selectedDataSources.length > 0) {
        const promises = [];
        for (const dataSource of selectedDataSources) {
          promises.push(
            savedObjectClient.deleteFromWorkspaces(dataSource.type, dataSource.id, [id])
          );
        }
        await Promise.all(promises);
      }

      await savedObjectClient.deleteByWorkspace(id);
      // delete workspace itself at last, deleteByWorkspace depends on the workspace to do permission check
      await savedObjectClient.delete(WORKSPACE_TYPE, id);
      return {
        success: true,
        result: true,
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }

  public async associate(
    requestDetail: IRequestDetail,
    workspaceId: string,
    objects: Array<{ id: string; type: string }>
  ): Promise<IResponse<Array<{ id: string; error?: string }>>> {
    const savedObjectClient = this.getSavedObjectClientsFromRequestDetail(requestDetail);
    const promises = objects.map(async (obj) => {
      try {
        await savedObjectClient.addToWorkspaces(obj.type, obj.id, [workspaceId]);
        return {
          id: obj.id,
        };
      } catch (e) {
        return {
          id: obj.id,
          error: this.formatError(e),
        };
      }
    });
    const result = await Promise.all(promises);
    return {
      success: true,
      result,
    };
  }

  public async dissociate(
    requestDetail: IRequestDetail,
    workspaceId: string,
    objects: Array<{ id: string; type: string }>
  ): Promise<IResponse<Array<{ id: string; error?: string }>>> {
    const savedObjectClient = this.getSavedObjectClientsFromRequestDetail(requestDetail);
    const promises = objects.map(async (obj) => {
      try {
        await savedObjectClient.deleteFromWorkspaces(obj.type, obj.id, [workspaceId]);
        return {
          id: obj.id,
        };
      } catch (e) {
        return {
          id: obj.id,
          error: this.formatError(e),
        };
      }
    });
    const result = await Promise.all(promises);
    return {
      success: true,
      result,
    };
  }

  public setSavedObjects(savedObjects: SavedObjectsServiceStart) {
    this.savedObjects = savedObjects;
  }

  public setUiSettings(uiSettings: UiSettingsServiceStart) {
    this.uiSettings = uiSettings;
  }

  public async destroy(): Promise<IResponse<boolean>> {
    return {
      success: true,
      result: true,
    };
  }
}
