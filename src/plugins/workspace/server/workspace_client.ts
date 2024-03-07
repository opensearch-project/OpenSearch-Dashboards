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
  ACL,
  Permissions,
} from '../../../core/server';
import { WORKSPACE_TYPE } from '../../../core/server';
import {
  IWorkspaceClientImpl,
  WorkspaceFindOptions,
  IResponse,
  IRequestDetail,
  WorkspaceAttributeWithPermission,
  WorkspacePermissionItem,
} from './types';
import { workspace } from './saved_objects';
import { generateRandomId } from './utils';
import {
  WorkspacePermissionMode,
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
} from '../common/constants';

const convertToACL = (
  workspacePermissions: WorkspacePermissionItem | WorkspacePermissionItem[]
) => {
  workspacePermissions = Array.isArray(workspacePermissions)
    ? workspacePermissions
    : [workspacePermissions];

  const acl = new ACL();

  workspacePermissions.forEach((permission) => {
    switch (permission.type) {
      case 'user':
        acl.addPermission(permission.modes, { users: [permission.userId] });
        return;
      case 'group':
        acl.addPermission(permission.modes, { groups: [permission.group] });
        return;
    }
  });

  return acl.getPermissions() || {};
};

const isValidWorkspacePermissionMode = (mode: string): mode is WorkspacePermissionMode =>
  Object.values(WorkspacePermissionMode).some((modeValue) => modeValue === mode);

const isWorkspacePermissionItem = (
  test: WorkspacePermissionItem | null
): test is WorkspacePermissionItem => test !== null;

const convertFromACL = (permissions: Permissions) => {
  const acl = new ACL(permissions);

  return acl
    .toFlatList()
    .map(({ name, permissions: modes, type }) => {
      const validModes = modes.filter(isValidWorkspacePermissionMode);
      switch (type) {
        case 'users':
          return {
            type: 'user',
            modes: validModes,
            userId: name,
          } as const;
        case 'groups':
          return {
            type: 'group',
            modes: validModes,
            group: name,
          } as const;
        default:
          return null;
      }
    })
    .filter(isWorkspacePermissionItem);
};

const WORKSPACE_ID_SIZE = 6;

const DUPLICATE_WORKSPACE_NAME_ERROR = i18n.translate('workspace.duplicate.name.error', {
  defaultMessage: 'workspace name has already been used, try with a different name',
});

export class WorkspaceClient implements IWorkspaceClientImpl {
  private setupDep: CoreSetup;
  private savedObjects?: SavedObjectsServiceStart;

  constructor(core: CoreSetup) {
    this.setupDep = core;
  }

  private getScopedClientWithoutPermission(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract | undefined {
    return this.savedObjects?.getScopedClient(requestDetail.request, {
      excludedWrappers: [WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID],
      includedHiddenTypes: [WORKSPACE_TYPE],
    });
  }

  private getSavedObjectClientsFromRequestDetail(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract {
    return this.savedObjects?.getScopedClient(requestDetail.request, {
      includedHiddenTypes: [WORKSPACE_TYPE],
    }) as SavedObjectsClientContract;
  }
  private getFlattenedResultWithSavedObject(
    savedObject: SavedObject<WorkspaceAttribute>
  ): WorkspaceAttribute {
    return {
      ...savedObject.attributes,
      id: savedObject.id,
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
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): ReturnType<IWorkspaceClientImpl['create']> {
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
          permissions: permissions ? convertToACL(permissions) : undefined,
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
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
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
        permissions: permissions ? convertToACL(permissions) : undefined,
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
      await this.getSavedObjectClientsFromRequestDetail(requestDetail).delete(WORKSPACE_TYPE, id);
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
