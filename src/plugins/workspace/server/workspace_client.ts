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
} from '../../../core/server';
import { updateWorkspaceState, getWorkspaceState } from '../../../core/server/utils';
import {
  IWorkspaceClientImpl,
  WorkspaceFindOptions,
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
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../data_source/common';

const WORKSPACE_ID_SIZE = 6;

const DUPLICATE_WORKSPACE_NAME_ERROR = i18n.translate('workspace.duplicate.name.error', {
  defaultMessage: 'workspace name has already been used, try with a different name',
});

export class WorkspaceClient implements IWorkspaceClientImpl {
  private setupDep: CoreSetup;
  private logger: Logger;
  private savedObjects?: SavedObjectsServiceStart;
  private uiSettings?: UiSettingsServiceStart;

  constructor(core: CoreSetup, logger: Logger) {
    this.setupDep = core;
    this.logger = logger;
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
      id: savedObject.id,
      permissions: savedObject.permissions,
    };
  }
  private formatError(error: Error | any): string {
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
    }
  ): ReturnType<IWorkspaceClientImpl['create']> {
    try {
      const { permissions, dataSources, ...attributes } = payload;
      const id = generateRandomId(WORKSPACE_ID_SIZE);
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const existingWorkspaceRes = await this.getScopedClientWithoutPermission(requestDetail)?.find(
        {
          type: WORKSPACE_TYPE,
          search: `"${attributes.name}"`,
          searchFields: ['name'],
        }
      );
      if (existingWorkspaceRes && existingWorkspaceRes.total > 0) {
        throw new Error(DUPLICATE_WORKSPACE_NAME_ERROR);
      }

      if (dataSources) {
        const promises = [];
        for (const dataSourceId of dataSources) {
          promises.push(client.addToWorkspaces(DATA_SOURCE_SAVED_OBJECT_TYPE, dataSourceId, [id]));
        }
        await Promise.all(promises);
      }

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
    }
  ): Promise<IResponse<boolean>> {
    const { permissions, dataSources: newDataSources, ...attributes } = payload;
    try {
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const workspaceInDB: SavedObject<WorkspaceAttribute> = await client.get(WORKSPACE_TYPE, id);
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

      if (newDataSources) {
        const originalSelectedDataSources = await getDataSourcesList(client, [id]);
        const originalSelectedDataSourceIds = originalSelectedDataSources.map((ds) => ds.id);
        const dataSourcesToBeRemoved = originalSelectedDataSourceIds.filter(
          (ds) => !newDataSources.find((item) => item === ds)
        );
        const dataSourcesToBeAdded = newDataSources.filter(
          (ds) => !originalSelectedDataSourceIds.find((item) => item === ds)
        );

        const promises = [];
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
        if (promises.length > 0) {
          await Promise.all(promises);
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

      if (newDataSources && this.uiSettings && client) {
        const uiSettingsClient = this.uiSettings.asScopedToClient(client);
        checkAndSetDefaultDataSource(uiSettingsClient, newDataSources, true);
      }

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
