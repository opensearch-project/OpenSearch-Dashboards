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
  PUBLIC_WORKSPACE_ID,
  PUBLIC_WORKSPACE_NAME,
  Logger,
  ACL,
} from '../../../core/server';
import { WORKSPACE_TYPE } from '../../../core/server';
import {
  IWorkspaceClientImpl,
  WorkspaceFindOptions,
  IResponse,
  IRequestDetail,
  WorkspaceAttributeWithPermission,
} from './types';
import { workspace } from './saved_objects';
import { generateRandomId } from './utils';
import {
  WORKSPACE_ID_CONSUMER_WRAPPER_ID,
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
  WorkspacePermissionMode,
} from '../common/constants';

const WORKSPACE_ID_SIZE = 6;

const DUPLICATE_WORKSPACE_NAME_ERROR = i18n.translate('workspace.duplicate.name.error', {
  defaultMessage: 'workspace name has already been used, try with a different name',
});

export class WorkspaceClient implements IWorkspaceClientImpl {
  private setupDep: CoreSetup;
  private savedObjects?: SavedObjectsServiceStart;
  private logger: Logger;

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
  private async createGlobalWorkspace(requestDetail: IRequestDetail) {
    // Permission of global workspace defaults to read only for all users except OSD admins
    const globalWorkspaceACL = new ACL().addPermission(
      [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      {
        users: ['*'],
      }
    );
    const globalWorkspaceAttribute: Omit<WorkspaceAttribute, 'id' | 'permissions'> = {
      name: i18n.translate('workspaces.public.workspace.default.name', {
        defaultMessage: 'Global workspace',
      }),
      features: [
        'use-case-observability',
        'use-case-security-analytics',
        'use-case-analytics',
        'use-case-search',
        '*',
      ],
      // Global workspace cannot be deleted
      reserved: true,
    };
    const savedObjectClient = this.getScopedClientWithoutPermission(requestDetail);
    try {
      // The global workspace is created by the OSD admin who logged in for the first time.
      this.logger.info(`Creating ${PUBLIC_WORKSPACE_NAME} by login user`);
      const createResult = await savedObjectClient?.create(
        WORKSPACE_TYPE,
        globalWorkspaceAttribute,
        {
          id: PUBLIC_WORKSPACE_ID,
          permissions: globalWorkspaceACL.getPermissions(),
        }
      );
      if (createResult?.id) {
        this.logger.info(`Successfully created ${PUBLIC_WORKSPACE_NAME}.`);
      }
    } catch (e) {
      this.logger.error(`Create ${PUBLIC_WORKSPACE_NAME} error: ${e?.toString() || ''}`);
    }
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
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): ReturnType<IWorkspaceClientImpl['create']> {
    try {
      const { permissions, ...attributes } = payload;
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
      const result = await client.create<Omit<WorkspaceAttribute, 'id'>>(
        WORKSPACE_TYPE,
        attributes,
        {
          id,
          permissions,
        }
      );
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
      const { saved_objects: allSavedObjects } = await this.getScopedClientWithoutPermission(
        requestDetail
      )!.find<WorkspaceAttribute>({
        ...options,
        type: WORKSPACE_TYPE,
      });

      const hasGlobalWorkspace = allSavedObjects.some((item) => item.id === PUBLIC_WORKSPACE_ID);
      // Create global(public) workspace if public workspace id can not be found.
      if (!hasGlobalWorkspace) {
        await this.createGlobalWorkspace(requestDetail);
      }

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
    payload: Partial<Omit<WorkspaceAttributeWithPermission, 'id'>>
  ): Promise<IResponse<boolean>> {
    const { permissions, ...attributes } = payload;
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
  public async destroy(): Promise<IResponse<boolean>> {
    return {
      success: true,
      result: true,
    };
  }
}
