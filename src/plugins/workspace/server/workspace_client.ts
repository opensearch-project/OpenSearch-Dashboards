/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { omit } from 'lodash';
import type {
  SavedObject,
  SavedObjectsClientContract,
  CoreSetup,
  WorkspaceAttribute,
  SavedObjectsServiceStart,
  Logger,
  Permissions,
  OpenSearchDashboardsRequest,
} from '../../../core/server';
import {
  ACL,
  DEFAULT_APP_CATEGORIES,
  MANAGEMENT_WORKSPACE_ID,
  PUBLIC_WORKSPACE_ID,
  WORKSPACE_TYPE,
  WorkspacePermissionMode,
  PERSONAL_WORKSPACE_ID_PREFIX,
} from '../../../core/server';
import {
  IWorkspaceDBImpl,
  WorkspaceFindOptions,
  IResponse,
  IRequestDetail,
  WorkspaceAttributeWithPermission,
} from './types';
import { workspace } from './saved_objects';
import { generateRandomId, getPrincipalsFromRequest } from './utils';
import {
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
  WORKSPACE_UPDATE_APP_ID,
} from '../common/constants';

const WORKSPACE_ID_SIZE = 6;

const DUPLICATE_WORKSPACE_NAME_ERROR = i18n.translate('workspace.duplicate.name.error', {
  defaultMessage: 'workspace name has already been used, try with a different name',
});

const RESERVED_WORKSPACE_NAME_ERROR = i18n.translate('workspace.reserved.name.error', {
  defaultMessage: 'reserved workspace name cannot be changed',
});

export class WorkspaceClientWithSavedObject implements IWorkspaceDBImpl {
  private setupDep: CoreSetup;
  private logger: Logger;

  private savedObjects?: SavedObjectsServiceStart;

  constructor(core: CoreSetup, logger: Logger) {
    this.setupDep = core;
    this.logger = logger;
  }

  private getScopedClientWithoutPermission(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract | undefined {
    return this.savedObjects?.getScopedClient(requestDetail.request, {
      excludedWrappers: [WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID],
    });
  }

  private getSavedObjectClientsFromRequestDetail(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract {
    return requestDetail.context.core.savedObjects.client;
  }
  private getFlattenedResultWithSavedObject(
    savedObject: SavedObject<WorkspaceAttribute>
  ): WorkspaceAttributeWithPermission {
    return {
      ...savedObject.attributes,
      permissions: savedObject.permissions || {},
      id: savedObject.id,
    };
  }
  private formatError(error: Error | any): string {
    return error.message || error.error || 'Error';
  }
  private async checkAndCreateWorkspace(
    savedObjectClient: SavedObjectsClientContract | undefined,
    workspaceId: string,
    workspaceAttribute: Omit<WorkspaceAttribute, 'id' | 'permissions'>,
    permissions?: Permissions
  ) {
    try {
      await savedObjectClient?.get(WORKSPACE_TYPE, workspaceId);
    } catch (error) {
      this.logger.debug(error?.toString() || '');
      this.logger.info(`Workspace ${workspaceId} is not found, create it by using internal user`);
      try {
        const createResult = await savedObjectClient?.create(WORKSPACE_TYPE, workspaceAttribute, {
          id: workspaceId,
          permissions,
        });
        if (createResult?.id) {
          this.logger.info(`Created workspace ${createResult.id}.`);
        }
      } catch (e) {
        this.logger.error(`Create ${workspaceId} workspace error: ${e?.toString() || ''}`);
      }
    }
  }
  private async setupPublicWorkspace(savedObjectClient?: SavedObjectsClientContract) {
    const publicWorkspaceACL = new ACL().addPermission(
      [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      {
        users: ['*'],
      }
    );
    return this.checkAndCreateWorkspace(
      savedObjectClient,
      PUBLIC_WORKSPACE_ID,
      {
        name: i18n.translate('workspaces.public.workspace.default.name', {
          defaultMessage: 'Global workspace',
        }),
        features: ['*', `!@${DEFAULT_APP_CATEGORIES.management.id}`],
        reserved: true,
      },
      publicWorkspaceACL.getPermissions()
    );
  }
  private async setupManagementWorkspace(savedObjectClient?: SavedObjectsClientContract) {
    const managementWorkspaceACL = new ACL().addPermission(
      [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      {
        users: ['*'],
      }
    );
    const DSM_APP_ID = 'dataSources';
    const DEV_TOOLS_APP_ID = 'dev_tools';

    return this.checkAndCreateWorkspace(
      savedObjectClient,
      MANAGEMENT_WORKSPACE_ID,
      {
        name: i18n.translate('workspaces.management.workspace.default.name', {
          defaultMessage: 'Management',
        }),
        features: [
          `@${DEFAULT_APP_CATEGORIES.management.id}`,
          WORKSPACE_OVERVIEW_APP_ID,
          WORKSPACE_UPDATE_APP_ID,
          DSM_APP_ID,
          DEV_TOOLS_APP_ID,
        ],
        reserved: true,
      },
      managementWorkspaceACL.getPermissions()
    );
  }
  private async setupPersonalWorkspace(
    request: OpenSearchDashboardsRequest,
    savedObjectClient?: SavedObjectsClientContract
  ) {
    const principals = getPrincipalsFromRequest(request);
    const personalWorkspaceACL = new ACL().addPermission(
      [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      {
        users: principals.users,
      }
    );
    return this.checkAndCreateWorkspace(
      savedObjectClient,
      `${PERSONAL_WORKSPACE_ID_PREFIX}-${principals.users?.[0] || ''}`,
      {
        name: i18n.translate('workspaces.personal.workspace.default.name', {
          defaultMessage: 'Personal workspace',
        }),
        features: ['*', `!@${DEFAULT_APP_CATEGORIES.management.id}`],
        reserved: true,
      },
      personalWorkspaceACL.getPermissions()
    );
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
  ): ReturnType<IWorkspaceDBImpl['create']> {
    try {
      const { permissions, ...attributes } = payload;
      const id = generateRandomId(WORKSPACE_ID_SIZE);
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const existingWorkspaceRes = await this.getScopedClientWithoutPermission(requestDetail)?.find(
        {
          type: WORKSPACE_TYPE,
          search: attributes.name,
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
  ): ReturnType<IWorkspaceDBImpl['list']> {
    try {
      const { permissionModes, ...restOptions } = options;
      const resultResp = await this.getSavedObjectClientsFromRequestDetail(requestDetail).find<
        WorkspaceAttribute
      >({
        ...restOptions,
        type: WORKSPACE_TYPE,
        ...(permissionModes ? { ACLSearchParams: { permissionModes } } : {}),
      });
      const others = omit(resultResp, 'saved_objects');
      let savedObjects = resultResp.saved_objects;
      const scopedClientWithoutPermissionCheck = this.getScopedClientWithoutPermission(
        requestDetail
      );
      const tasks: Array<Promise<unknown>> = [];

      /**
       * Setup public workspace if public workspace can not be found
       */
      const hasPublicWorkspace = savedObjects.some((item) => item.id === PUBLIC_WORKSPACE_ID);

      if (!hasPublicWorkspace) {
        tasks.push(this.setupPublicWorkspace(scopedClientWithoutPermissionCheck));
      }

      /**
       * Setup management workspace if management workspace can not be found
       */
      const hasManagementWorkspace = savedObjects.some(
        (item) => item.id === MANAGEMENT_WORKSPACE_ID
      );
      if (!hasManagementWorkspace) {
        tasks.push(this.setupManagementWorkspace(scopedClientWithoutPermissionCheck));
      }

      /**
       * Setup personal workspace
       */
      const principals = getPrincipalsFromRequest(requestDetail.request);
      /**
       * Only when authentication is enabled will personal workspace be created.
       * and the personal workspace id will be like "personal-{userId}"
       */
      if (principals.users && principals.users?.[0]) {
        const hasPersonalWorkspace = savedObjects.find(
          (item) => `${PERSONAL_WORKSPACE_ID_PREFIX}-${principals.users?.[0] || ''}` === item.id
        );
        if (!hasPersonalWorkspace) {
          tasks.push(
            this.setupPersonalWorkspace(requestDetail.request, scopedClientWithoutPermissionCheck)
          );
        }
      }
      try {
        await Promise.all(tasks);
        if (tasks.length) {
          const retryFindResp = await this.getSavedObjectClientsFromRequestDetail(
            requestDetail
          ).find<WorkspaceAttribute>({
            ...restOptions,
            type: WORKSPACE_TYPE,
            ...(permissionModes ? { ACLSearchParams: { permissionModes } } : {}),
          });
          savedObjects = retryFindResp.saved_objects;
        }
      } catch (e) {
        this.logger.error(`Some error happened when initializing reserved workspace: ${e}`);
      }
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
  ): Promise<IResponse<WorkspaceAttributeWithPermission>> {
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
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): Promise<IResponse<boolean>> {
    const { permissions, ...attributes } = payload;
    try {
      const client = this.getSavedObjectClientsFromRequestDetail(requestDetail);
      const workspaceInDB: SavedObject<WorkspaceAttribute> = await client.get(WORKSPACE_TYPE, id);
      if (workspaceInDB.attributes.name !== attributes.name) {
        if (workspaceInDB.attributes.reserved) {
          throw new Error(RESERVED_WORKSPACE_NAME_ERROR);
        }
        const existingWorkspaceRes = await this.getScopedClientWithoutPermission(
          requestDetail
        )?.find({
          type: WORKSPACE_TYPE,
          search: attributes.name,
          searchFields: ['name'],
          fields: ['_id'],
        });
        if (existingWorkspaceRes && existingWorkspaceRes.total > 0) {
          throw new Error(DUPLICATE_WORKSPACE_NAME_ERROR);
        }
      }

      await client.create<Omit<WorkspaceAttribute, 'id'>>(WORKSPACE_TYPE, attributes, {
        id,
        permissions,
        overwrite: true,
        version: workspaceInDB.version,
      });

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
            defaultMessage: 'Reserved workspace {id} is not allowed to delete: ',
            values: { id: workspaceInDB.id },
          }),
        };
      }
      await savedObjectClient.delete(WORKSPACE_TYPE, id);
      await savedObjectClient.deleteByWorkspace(id);
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
