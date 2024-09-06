/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  OpenSearchDashboardsRequest,
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkGetObject,
  SavedObjectsBulkResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsDeleteOptions,
  SavedObjectsFindOptions,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsBulkUpdateOptions,
  WORKSPACE_TYPE,
  SavedObjectsErrorHelpers,
  SavedObjectsServiceStart,
  SavedObjectsClientContract,
  SavedObjectsDeleteByWorkspaceOptions,
} from '../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';
import {
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
  WorkspacePermissionMode,
} from '../../common/constants';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../../../data_source/common';

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

const generateDataSourcePermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('saved_objects.data_source.invalidate', {
        defaultMessage: 'Invalid data source permission, please associate it to current workspace',
      })
    )
  );

const generateOSDAdminPermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('dashboard.admin.permission.invalidate', {
        defaultMessage: 'Invalid permission, please contact OSD admin',
      })
    )
  );

const getWorkspacesFromSavedObjects = (savedObjects: SavedObject[]) => {
  return savedObjects
    .reduce<string[]>(
      (previous, { workspaces }) => Array.from(new Set([...previous, ...(workspaces ?? [])])),
      []
    )
    .map((id) => ({
      type: WORKSPACE_TYPE,
      id,
    }));
};

const getDefaultValuesForEmpty = <T>(values: T[] | undefined, defaultValues: T[]) => {
  return !values || values.length === 0 ? defaultValues : values;
};

export class WorkspaceSavedObjectsClientWrapper {
  private getScopedClient?: SavedObjectsServiceStart['getScopedClient'];

  private async validateObjectsPermissions(
    objects: Array<Pick<SavedObject, 'id' | 'type'>>,
    request: OpenSearchDashboardsRequest,
    permissionModes: WorkspacePermissionMode[]
  ) {
    // PermissionModes here is an array which is merged by workspace type required permission and other saved object required permission.
    // So we only need to do one permission check no matter its type.
    for (const { id, type } of objects) {
      const validateResult = await this.permissionControl.validate(
        request,
        {
          type,
          id,
        },
        permissionModes
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
    permissionModes: WorkspacePermissionMode[]
  ) => {
    // for attributes and options passed in this function, the num of workspaces may be 0.This case should not be passed permission check.
    if (workspacesIds.length === 0) {
      return false;
    }
    const workspaces = workspacesIds.map((id) => ({ id, type: WORKSPACE_TYPE }));
    return await this.validateObjectsPermissions(workspaces, request, permissionModes);
  };

  private validateAtLeastOnePermittedWorkspaces = async (
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionModes: WorkspacePermissionMode[]
  ) => {
    // for attributes and options passed in this function, the num of workspaces attribute may be 0.This case should not be passed permission check.
    if (!workspaces || workspaces.length === 0) {
      return false;
    }
    for (const workspaceId of workspaces) {
      const validateResult = await this.validateMultiWorkspacesPermissions(
        [workspaceId],
        request,
        permissionModes
      );
      if (validateResult) {
        return true;
      }
    }
    return false;
  };

  private async validateWorkspacesAndSavedObjectsPermissions(
    savedObject: Pick<SavedObject, 'id' | 'type' | 'workspaces' | 'permissions'>,
    request: OpenSearchDashboardsRequest,
    workspacePermissionModes: WorkspacePermissionMode[],
    objectPermissionModes: WorkspacePermissionMode[],
    validateAllWorkspaces = true
  ) {
    /**
     *
     * Checks if the provided saved object lacks both workspaces and permissions.
     * If a saved object lacks both attributes, it implies that the object is neither associated
     * with any workspaces nor has permissions defined by itself. Such objects are considered "public"
     * and will be excluded from permission checks.
     *
     **/
    if (!savedObject.workspaces && !savedObject.permissions) {
      return true;
    }

    let hasPermission = false;
    // Check permission based on object's workspaces.
    // If workspacePermissionModes is passed with an empty array, we need to skip this validation and continue to validate object ACL.
    if (savedObject.workspaces && workspacePermissionModes.length > 0) {
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
      hasPermission = await this.permissionControl.validateSavedObjectsACL(
        [savedObject],
        this.permissionControl.getPrincipalsFromRequest(request),
        objectPermissionModes
      );
    }
    return hasPermission;
  }

  // Data source is a workspace level object, validate if the request has access to the data source within the requested workspace.
  private validateDataSourcePermissions = (
    object: SavedObject,
    request: OpenSearchDashboardsRequest
  ) => {
    const requestWorkspaceId = getWorkspaceState(request).requestWorkspaceId;
    // Deny access if the object is a global data source (no workspaces assigned)
    if (!object.workspaces || object.workspaces.length === 0) {
      return false;
    }
    /**
     * Allow access if no specific workspace is requested.
     * This typically occurs when retrieving data sources or performing operations
     * that don't require a specific workspace, such as pages within the
     * Data Administration navigation group that include a data source picker.
     */
    if (!requestWorkspaceId) {
      return true;
    }
    /*
     * Allow access if the requested workspace matches one of the object's assigned workspaces
     * This ensures that the user can only access data sources within their current workspace
     */
    return object.workspaces.includes(requestWorkspaceId);
  };

  private getWorkspaceTypeEnabledClient(request: OpenSearchDashboardsRequest) {
    return this.getScopedClient?.(request, {
      includedHiddenTypes: [WORKSPACE_TYPE],
      excludedWrappers: [WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID],
    }) as SavedObjectsClientContract;
  }

  public setScopedClient(getScopedClient: SavedObjectsServiceStart['getScopedClient']) {
    this.getScopedClient = getScopedClient;
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
          [WorkspacePermissionMode.LibraryWrite],
          [WorkspacePermissionMode.Write]
        ))
      ) {
        throw generateSavedObjectsPermissionError();
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    /**
     * validate if can update`objectToUpdate`, means a user should either
     * have `Write` permission on the `objectToUpdate` itself or `LibraryWrite` permission
     * to any of the workspaces the `objectToUpdate` associated with.
     **/
    const validateUpdateWithWorkspacePermission = async <T = unknown>(
      objectToUpdate: SavedObject<T>
    ): Promise<boolean> => {
      return await this.validateWorkspacesAndSavedObjectsPermissions(
        objectToUpdate,
        wrapperOptions.request,
        [WorkspacePermissionMode.LibraryWrite],
        [WorkspacePermissionMode.Write],
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
      this.permissionControl.addToCacheAllowlist(
        wrapperOptions.request,
        getWorkspacesFromSavedObjects(objectsToUpdate.saved_objects)
      );

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
      // Objects with id in overwrite mode will be regarded as update
      const objectsToCreate = options.overwrite ? objects.filter((obj) => !obj.id) : objects;
      // Only OSD admin can bulkCreate workspace.
      if (objectsToCreate.some((obj) => obj.type === WORKSPACE_TYPE)) {
        throw generateOSDAdminPermissionError();
      }

      const hasTargetWorkspaces = options?.workspaces && options.workspaces.length > 0;

      if (
        hasTargetWorkspaces &&
        !(await this.validateMultiWorkspacesPermissions(
          options.workspaces ?? [],
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite]
        ))
      ) {
        throw generateWorkspacePermissionError();
      }

      /**
       *
       * If target workspaces parameter doesn't exists and `overwrite` is true, we need to check
       * if it has permission to the object itself(defined by the object ACL) or it has permission
       * to any of the workspaces that the object associates with.
       *
       */
      if (!hasTargetWorkspaces && options.overwrite) {
        for (const object of objects) {
          const { type, id } = object;
          if (id) {
            let rawObject;
            try {
              rawObject = await wrapperOptions.client.get(type, id);
            } catch (error) {
              // If object is not found, we will skip the validation of this object.
              if (SavedObjectsErrorHelpers.isNotFoundError(error as Error)) {
                continue;
              } else {
                throw error;
              }
            }
            this.permissionControl.addToCacheAllowlist(
              wrapperOptions.request,
              getWorkspacesFromSavedObjects([rawObject])
            );
            if (
              !(await this.validateWorkspacesAndSavedObjectsPermissions(
                rawObject,
                wrapperOptions.request,
                [WorkspacePermissionMode.LibraryWrite],
                [WorkspacePermissionMode.Write],
                false
              ))
            ) {
              throw generateWorkspacePermissionError();
            }
          }
        }
      }

      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const createWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      // If options contains id and overwrite, it is an update action.
      const isUpdateMode = options?.id && options?.overwrite;
      // Only OSD admin can create workspace.
      if (type === WORKSPACE_TYPE && !isUpdateMode) {
        throw generateOSDAdminPermissionError();
      }

      const hasTargetWorkspaces = options?.workspaces && options.workspaces.length > 0;

      if (
        hasTargetWorkspaces &&
        !(await this.validateMultiWorkspacesPermissions(
          options?.workspaces ?? [],
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite]
        ))
      ) {
        throw generateWorkspacePermissionError();
      }

      /**
       *
       * If target workspaces parameter doesn't exists, `options.id` was exists and `overwrite` is true,
       * we need to check if it has permission to the object itself(defined by the object ACL) or
       * it has permission to any of the workspaces that the object associates with.
       *
       */
      if (
        options?.overwrite &&
        options.id &&
        !hasTargetWorkspaces &&
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          await wrapperOptions.client.get(type, options.id),
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite],
          [WorkspacePermissionMode.Write],
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

      if (objectToGet.type === DATA_SOURCE_SAVED_OBJECT_TYPE) {
        if (isDataSourceAdmin) {
          return objectToGet;
        }
        const hasPermission = this.validateDataSourcePermissions(
          objectToGet,
          wrapperOptions.request
        );
        if (!hasPermission) {
          throw generateDataSourcePermissionError();
        }
      }

      if (
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          objectToGet,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.LibraryWrite],
          [WorkspacePermissionMode.Read, WorkspacePermissionMode.Write],
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
      this.permissionControl.addToCacheAllowlist(
        wrapperOptions.request,
        getWorkspacesFromSavedObjects(objectToBulkGet.saved_objects)
      );

      for (const object of objectToBulkGet.saved_objects) {
        if (object.type === DATA_SOURCE_SAVED_OBJECT_TYPE) {
          const hasPermission = this.validateDataSourcePermissions(object, wrapperOptions.request);
          if (!hasPermission) {
            throw generateDataSourcePermissionError();
          }
        }

        if (
          !(await this.validateWorkspacesAndSavedObjectsPermissions(
            object,
            wrapperOptions.request,
            [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.LibraryWrite],
            [WorkspacePermissionMode.Write, WorkspacePermissionMode.Read],
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
      if (
        isDataSourceAdmin &&
        options?.type &&
        (options.type === DATA_SOURCE_SAVED_OBJECT_TYPE ||
          (Array.isArray(options.type) &&
            options.type.length === 1 &&
            options.type[0] === DATA_SOURCE_SAVED_OBJECT_TYPE))
      ) {
        return await wrapperOptions.client.find<T>(options);
      }
      const principals = this.permissionControl.getPrincipalsFromRequest(wrapperOptions.request);
      const permittedWorkspaceIds = (
        await this.getWorkspaceTypeEnabledClient(wrapperOptions.request).find({
          type: WORKSPACE_TYPE,
          perPage: 999,
          ACLSearchParams: {
            principals,
            permissionModes: [
              WorkspacePermissionMode.LibraryRead,
              WorkspacePermissionMode.LibraryWrite,
            ],
          },
          // By declaring workspaces as null,
          // workspaces won't be appended automatically into the options.
          // or workspaces can not be found because workspace object do not have `workspaces` field.
          workspaces: null,
        })
      ).saved_objects.map((item) => item.id);

      if (!options.workspaces && !options.ACLSearchParams) {
        options.workspaces = permittedWorkspaceIds;
        options.ACLSearchParams = {
          permissionModes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.Write],
          principals,
        };
        options.workspacesSearchOperator = 'OR';
      } else {
        if (options.workspaces) {
          options.workspaces = options.workspaces.filter((workspaceId) =>
            permittedWorkspaceIds.includes(workspaceId)
          );
        }
        if (options.ACLSearchParams) {
          options.ACLSearchParams = {
            permissionModes: getDefaultValuesForEmpty(options.ACLSearchParams.permissionModes, [
              WorkspacePermissionMode.Read,
              WorkspacePermissionMode.Write,
            ]),
            principals,
          };
        }
      }
      return await wrapperOptions.client.find<T>(options);
    };

    const deleteByWorkspaceWithPermissionControl = async (
      workspace: string,
      options: SavedObjectsDeleteByWorkspaceOptions = {}
    ) => {
      if (
        !(await this.validateMultiWorkspacesPermissions([workspace], wrapperOptions.request, [
          WorkspacePermissionMode.LibraryWrite,
        ]))
      ) {
        throw generateWorkspacePermissionError();
      }

      return await wrapperOptions.client.deleteByWorkspace(workspace, options);
    };

    const addToWorkspacesWithPermissionControl = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Only dashboard admin can assign data source to workspace
      if (type === DATA_SOURCE_SAVED_OBJECT_TYPE) {
        throw generateOSDAdminPermissionError();
      }
      // In current version, only the type is data-source that will call addToWorkspaces
      return await wrapperOptions.client.addToWorkspaces(type, id, targetWorkspaces, options);
    };

    const deleteFromWorkspacesWithPermissionControl = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Only dashboard admin can unassign data source to workspace
      if (type === DATA_SOURCE_SAVED_OBJECT_TYPE) {
        throw generateOSDAdminPermissionError();
      }
      // In current version, only the type is data-source will that call deleteFromWorkspaces
      return await wrapperOptions.client.deleteFromWorkspaces(type, id, targetWorkspaces, options);
    };

    const { isDashboardAdmin, isDataSourceAdmin } = getWorkspaceState(wrapperOptions.request) || {};
    if (isDashboardAdmin) {
      return wrapperOptions.client;
    }

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
      deleteByWorkspace: deleteByWorkspaceWithPermissionControl,
      addToWorkspaces: addToWorkspacesWithPermissionControl,
      deleteFromWorkspaces: deleteFromWorkspacesWithPermissionControl,
    };
  };

  constructor(private readonly permissionControl: SavedObjectsPermissionControlContract) {}
}
