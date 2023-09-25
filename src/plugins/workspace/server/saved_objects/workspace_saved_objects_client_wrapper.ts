/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { intersection } from 'lodash';

import {
  OpenSearchDashboardsRequest,
  SavedObject,
  SavedObjectsAddToWorkspacesOptions,
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkGetObject,
  SavedObjectsBulkResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsDeleteOptions,
  SavedObjectsFindOptions,
  SavedObjectsShareObjects,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsBulkUpdateOptions,
  WORKSPACE_TYPE,
  WorkspacePermissionMode,
  SavedObjectsDeleteByWorkspaceOptions,
  SavedObjectsErrorHelpers,
} from '../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';
import { getPrincipalsFromRequest } from '../utils';

const ALL_WORKSPACE_INNER_DATA_PERMISSION_MODES: string[] = [
  WorkspacePermissionMode.LibraryRead,
  WorkspacePermissionMode.LibraryWrite,
  WorkspacePermissionMode.Management,
];

// Can't throw unauthorized for now, the page will be refreshed if unauthorized
const generateWorkspacePermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('workspace.permission.invalidate', {
        defaultMessage: 'Invalid workspace permission',
      })
    )
  );

const generateSavedObjectsPermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('saved_objects.permission.invalidate', {
        defaultMessage: 'Invalid saved objects permission',
      })
    )
  );

export class WorkspaceSavedObjectsClientWrapper {
  private formatWorkspacePermissionModeToStringArray(
    permission: WorkspacePermissionMode | WorkspacePermissionMode[]
  ): string[] {
    if (Array.isArray(permission)) {
      return permission;
    }

    return [permission];
  }

  private async validateObjectsPermissions(
    objects: Array<Pick<SavedObject, 'id' | 'type'>>,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    // PermissionMode here is an array which is merged by workspace type required permission and other saved object required permission.
    // So we only need to do one permission check no matter its type.
    for (const { id, type } of objects) {
      const validateResult = await this.permissionControl.validate(
        request,
        {
          type,
          id,
        },
        this.formatWorkspacePermissionModeToStringArray(permissionMode)
      );
      if (!validateResult?.result) {
        return false;
      }
    }
    return true;
  }

  // validate if the `request` has the specified permission(`permissionMode`) to the given `workspaceIds`
  private validateMultiWorkspacesPermissions = async (
    workspacesIds: string[],
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) => {
    // for attributes and options passed in this function, the num of workspaces may be 0.This case should not be passed permission check.
    if (workspacesIds.length === 0) {
      return false;
    }
    const workspaces = workspacesIds.map((id) => ({ id, type: WORKSPACE_TYPE }));
    return await this.validateObjectsPermissions(workspaces, request, permissionMode);
  };

  private validateAtLeastOnePermittedWorkspaces = async (
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) => {
    // for attributes and options passed in this function, the num of workspaces attribute may be 0.This case should not be passed permission check.
    if (!workspaces || workspaces.length === 0) {
      return false;
    }
    for (const workspaceId of workspaces) {
      const validateResult = await this.permissionControl.validate(
        request,
        {
          type: WORKSPACE_TYPE,
          id: workspaceId,
        },
        this.formatWorkspacePermissionModeToStringArray(permissionMode)
      );
      if (validateResult?.result) {
        return true;
      }
    }
    return false;
  };

  /**
   * check if the type include workspace
   * Workspace permission check is totally different from object permission check.
   * @param type
   * @returns
   */
  private isRelatedToWorkspace(type: string | string[]): boolean {
    return type === WORKSPACE_TYPE || (Array.isArray(type) && type.includes(WORKSPACE_TYPE));
  }

  private async validateWorkspacesAndSavedObjectsPermissions(
    savedObject: Pick<SavedObject, 'id' | 'type' | 'workspaces' | 'permissions'>,
    request: OpenSearchDashboardsRequest,
    workspacePermissionModes: WorkspacePermissionMode[],
    objectPermissionModes: WorkspacePermissionMode[],
    validateAllWorkspaces = true
  ) {
    const { id, type } = savedObject;

    // Advanced settings have no permissions and workspaces, so we need to skip it.
    if (!savedObject.workspaces && !savedObject.permissions) {
      return true;
    }

    let hasPermission = false;
    // Check permission based on object's workspaces
    if (savedObject.workspaces) {
      const workspacePermissionValidator = validateAllWorkspaces
        ? this.validateMultiWorkspacesPermissions
        : this.validateAtLeastOnePermittedWorkspaces;
      hasPermission = await workspacePermissionValidator(
        savedObject.workspaces,
        request,
        workspacePermissionModes
      );
    }
    // If already has permissions based on workspaces, we don't need to check object's ACL(defined by permissions attribute)
    // So return true immediately
    if (hasPermission) {
      return true;
    }
    // Check permission based on object's ACL(defined by permissions attribute)
    if (savedObject.permissions) {
      hasPermission = await this.validateObjectsPermissions(
        [{ type, id }],
        request,
        objectPermissionModes
      );
    }
    return hasPermission;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const deleteWithWorkspacePermissionControl = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      const objectToDeleted = await wrapperOptions.client.get(type, id, options);
      if (
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          objectToDeleted,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management],
          [WorkspacePermissionMode.Management, WorkspacePermissionMode.Write]
        ))
      ) {
        throw generateSavedObjectsPermissionError();
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    // validate `objectToUpdate` if can update with workspace permission, which is used for update and bulkUpdate
    const validateUpdateWithWorkspacePermission = async <T = unknown>(
      objectToUpdate: SavedObject<T>
    ): Promise<boolean> => {
      return await this.validateWorkspacesAndSavedObjectsPermissions(
        objectToUpdate,
        wrapperOptions.request,
        [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management],
        [WorkspacePermissionMode.Management, WorkspacePermissionMode.Write],
        false
      );
    };

    const updateWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      const objectToUpdate = await wrapperOptions.client.get<T>(type, id, options);
      const permitted = await validateUpdateWithWorkspacePermission(objectToUpdate);
      if (!permitted) {
        throw generateSavedObjectsPermissionError();
      }
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkUpdateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      const objectsToUpdate = await wrapperOptions.client.bulkGet<T>(objects, options);

      for (const object of objectsToUpdate.saved_objects) {
        const permitted = await validateUpdateWithWorkspacePermission(object);
        if (!permitted) {
          throw generateSavedObjectsPermissionError();
        }
      }

      return await wrapperOptions.client.bulkUpdate(objects, options);
    };

    const bulkCreateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (options?.workspaces && options.workspaces.length > 0) {
        const permitted = await this.validateMultiWorkspacesPermissions(
          options.workspaces,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
        );
        if (!permitted) {
          throw generateSavedObjectsPermissionError();
        }
      }
      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const createWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (
        options?.workspaces &&
        options.workspaces.length > 0 &&
        !(await this.validateMultiWorkspacesPermissions(
          options.workspaces,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
        ))
      ) {
        throw generateWorkspacePermissionError();
      }

      if (
        options?.overwrite &&
        options.id &&
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          await wrapperOptions.client.get(type, options.id),
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management],
          [WorkspacePermissionMode.Write, WorkspacePermissionMode.Management],
          false
        ))
      ) {
        throw generateWorkspacePermissionError();
      }

      return await wrapperOptions.client.create(type, attributes, options);
    };

    const getWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      const objectToGet = await wrapperOptions.client.get<T>(type, id, options);

      if (
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          objectToGet,
          wrapperOptions.request,
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
          ],
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.Management,
            WorkspacePermissionMode.Read,
            WorkspacePermissionMode.Write,
          ],
          false
        ))
      ) {
        throw generateSavedObjectsPermissionError();
      }
      return objectToGet;
    };

    const bulkGetWithWorkspacePermissionControl = async <T = unknown>(
      objects: SavedObjectsBulkGetObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const objectToBulkGet = await wrapperOptions.client.bulkGet<T>(objects, options);

      for (const object of objectToBulkGet.saved_objects) {
        if (
          !(await this.validateWorkspacesAndSavedObjectsPermissions(
            object,
            wrapperOptions.request,
            [
              WorkspacePermissionMode.LibraryRead,
              WorkspacePermissionMode.LibraryWrite,
              WorkspacePermissionMode.Management,
            ],
            [
              WorkspacePermissionMode.LibraryRead,
              WorkspacePermissionMode.Management,
              WorkspacePermissionMode.Write,
              WorkspacePermissionMode.Read,
            ],
            false
          ))
        ) {
          throw generateSavedObjectsPermissionError();
        }
      }

      return objectToBulkGet;
    };

    const findWithWorkspacePermissionControl = async <T = unknown>(
      options: SavedObjectsFindOptions
    ) => {
      const principals = getPrincipalsFromRequest(wrapperOptions.request);
      if (!options.ACLSearchParams) {
        options.ACLSearchParams = {};
      }
      const workspaceInnerPermissionModes = options.ACLSearchParams.permissionModes
        ? intersection(
            options.ACLSearchParams.permissionModes,
            ALL_WORKSPACE_INNER_DATA_PERMISSION_MODES
          )
        : ALL_WORKSPACE_INNER_DATA_PERMISSION_MODES;

      if (this.isRelatedToWorkspace(options.type)) {
        options.ACLSearchParams.permissionModes = workspaceInnerPermissionModes;
        options.ACLSearchParams.principals = principals;
      } else {
        const permittedWorkspaceIds = (
          await wrapperOptions.client.find({
            type: WORKSPACE_TYPE,
            perPage: 999,
            ACLSearchParams: {
              principals,
              permissionModes: workspaceInnerPermissionModes,
            },
          })
        ).saved_objects.map((item) => item.id);

        if (options.workspaces) {
          const permittedWorkspaces = options.workspaces.filter((item) =>
            (permittedWorkspaceIds || []).includes(item)
          );
          if (!permittedWorkspaces.length) {
            /**
             * If user does not have any one workspace access
             * deny the request
             */
            throw SavedObjectsErrorHelpers.decorateNotAuthorizedError(
              new Error(
                i18n.translate('workspace.permission.invalidate', {
                  defaultMessage: 'Invalid workspace permission',
                })
              )
            );
          }

          /**
           * Overwrite the options.workspaces when user has access on partial workspaces.
           */
          options.workspaces = permittedWorkspaces;
        } else {
          /**
           * Select all the docs that
           * 1. ACL matches read or write permission OR
           * 2. workspaces matches library_read or library_write or management OR
           * 3. Advanced settings
           */
          options.workspaces = undefined;
          options.ACLSearchParams.workspaces = permittedWorkspaceIds;
          options.ACLSearchParams.permissionModes = options.ACLSearchParams.permissionModes
            ? intersection(options.ACLSearchParams.permissionModes, [
                WorkspacePermissionMode.Read,
                WorkspacePermissionMode.Write,
              ])
            : [WorkspacePermissionMode.Read, WorkspacePermissionMode.Write];
          options.ACLSearchParams.principals = principals;
        }
      }

      return await wrapperOptions.client.find<T>(options);
    };

    const addToWorkspacesWithPermissionControl = async (
      objects: SavedObjectsShareObjects[],
      targetWorkspaces: string[],
      options: SavedObjectsAddToWorkspacesOptions = {}
    ) => {
      // target workspaces
      const workspacePermitted = await this.validateMultiWorkspacesPermissions(
        targetWorkspaces,
        wrapperOptions.request,
        [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
      );
      if (!workspacePermitted) {
        throw generateWorkspacePermissionError();
      }

      // saved_objects
      const permitted = await this.permissionControl.batchValidate(
        wrapperOptions.request,
        objects.map((savedObj) => ({
          ...savedObj,
        })),
        [WorkspacePermissionMode.Write]
      );

      if (!permitted) {
        throw generateSavedObjectsPermissionError();
      }

      return await wrapperOptions.client.addToWorkspaces(objects, targetWorkspaces, options);
    };

    const deleteByWorkspaceWithPermissionControl = async (
      workspace: string,
      options: SavedObjectsDeleteByWorkspaceOptions = {}
    ) => {
      await this.validateMultiWorkspacesPermissions([workspace], wrapperOptions.request, [
        WorkspacePermissionMode.LibraryWrite,
        WorkspacePermissionMode.Management,
      ]);

      return await wrapperOptions.client.deleteByWorkspace(workspace, options);
    };

    return {
      ...wrapperOptions.client,
      get: getWithWorkspacePermissionControl,
      checkConflicts: wrapperOptions.client.checkConflicts,
      find: findWithWorkspacePermissionControl,
      bulkGet: bulkGetWithWorkspacePermissionControl,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      create: createWithWorkspacePermissionControl,
      bulkCreate: bulkCreateWithWorkspacePermissionControl,
      delete: deleteWithWorkspacePermissionControl,
      update: updateWithWorkspacePermissionControl,
      bulkUpdate: bulkUpdateWithWorkspacePermissionControl,
      addToWorkspaces: addToWorkspacesWithPermissionControl,
      deleteByWorkspace: deleteByWorkspaceWithPermissionControl,
    };
  };

  constructor(private readonly permissionControl: SavedObjectsPermissionControlContract) {}
}
