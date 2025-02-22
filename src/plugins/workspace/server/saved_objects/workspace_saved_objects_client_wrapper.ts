/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  ACLAuditorStateKey,
  CLIENT_CALL_AUDITOR_KEY,
  getACLAuditor,
  getClientCallAuditor,
  getWorkspaceState,
} from '../../../../core/server/utils';
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
  SavedObjectsFindResult,
  WorkspacePermissionMode,
} from '../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';
import { WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../../common/constants';
import { validateIsWorkspaceDataSourceAndConnectionObjectType } from '../../common/utils';

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
      i18n.translate('workspace.saved_objects.permission.invalidate', {
        defaultMessage: 'Invalid saved objects permission',
      })
    )
  );

const generateOSDAdminPermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('workspace.admin.permission.invalidate', {
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
    const ACLAuditor = getACLAuditor(wrapperOptions.request);
    const clientCallAuditor = getClientCallAuditor(wrapperOptions.request);
    const deleteWithWorkspacePermissionControl = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      const objectToDeleted = await wrapperOptions.client.get(type, id, options);
      // System request, -1 for compensation.
      ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1);
      if (
        !(await this.validateWorkspacesAndSavedObjectsPermissions(
          objectToDeleted,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite],
          [WorkspacePermissionMode.Write]
        ))
      ) {
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateSavedObjectsPermissionError();
      }
      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
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
      // System request, -1 for compensation.
      ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1);
      const permitted = await validateUpdateWithWorkspacePermission(objectToUpdate);
      if (!permitted) {
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateSavedObjectsPermissionError();
      }
      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkUpdateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      const objectsToUpdate = await wrapperOptions.client.bulkGet<T>(objects, options);
      // System request, -1 * objects.length for compensation.
      ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1 * objects.length);
      this.permissionControl.addToCacheAllowlist(
        wrapperOptions.request,
        getWorkspacesFromSavedObjects(objectsToUpdate.saved_objects)
      );

      for (const object of objectsToUpdate.saved_objects) {
        const permitted = await validateUpdateWithWorkspacePermission(object);
        if (!permitted) {
          ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
          throw generateSavedObjectsPermissionError();
        }
      }

      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, objects.length);
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
              // System request, -1 for compensation.
              ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1);
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
              ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
              throw generateWorkspacePermissionError();
            }
          }
        }
      }

      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, objects.length);

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
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, options.workspaces?.length ?? 0);
        throw generateWorkspacePermissionError();
      }

      /**
       *
       * If target workspaces parameter doesn't exists, `options.id` was exists and `overwrite` is true,
       * we need to check if it has permission to the object itself(defined by the object ACL) or
       * it has permission to any of the workspaces that the object associates with.
       *
       */
      if (options?.overwrite && options.id && !hasTargetWorkspaces) {
        const object = await wrapperOptions.client.get(type, options.id);
        // System request, -1 for compensation.
        ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1);
        if (
          !(await this.validateWorkspacesAndSavedObjectsPermissions(
            object,
            wrapperOptions.request,
            [WorkspacePermissionMode.LibraryWrite],
            [WorkspacePermissionMode.Write],
            false
          ))
        ) {
          ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
          throw generateWorkspacePermissionError();
        }
      }

      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
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
          [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.LibraryWrite],
          [WorkspacePermissionMode.Read, WorkspacePermissionMode.Write],
          false
        ))
      ) {
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateSavedObjectsPermissionError();
      }
      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
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
      const processedObjects = await Promise.all(
        objectToBulkGet.saved_objects.map(async (object) => {
          try {
            const hasPermission = await this.validateWorkspacesAndSavedObjectsPermissions(
              object,
              wrapperOptions.request,
              [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.LibraryWrite],
              [WorkspacePermissionMode.Write, WorkspacePermissionMode.Read],
              false
            );
            if (hasPermission) {
              ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
              return object;
            } else {
              ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
              return {
                ...object,
                workspaces: [],
                attributes: {} as T,
                error: {
                  ...generateSavedObjectsPermissionError().output.payload,
                  statusCode: 403,
                },
              };
            }
          } catch (error) {
            ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
            return {
              ...object,
              workspaces: [],
              attributes: {} as T,
              error: {
                ...generateWorkspacePermissionError().output.payload,
                statusCode: error.statusCode,
                message: error.message,
              },
            };
          }
        })
      );

      return { saved_objects: processedObjects };
    };

    const findWithWorkspacePermissionControl = async <T = unknown>(
      options: SavedObjectsFindOptions
    ) => {
      if (
        isDataSourceAdmin &&
        options?.type &&
        ((!Array.isArray(options.type) &&
          validateIsWorkspaceDataSourceAndConnectionObjectType(options.type)) ||
          (Array.isArray(options.type) &&
            options.type.length === 1 &&
            validateIsWorkspaceDataSourceAndConnectionObjectType(options.type[0])))
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

      // Based on https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/ui_settings/create_or_upgrade_saved_config/get_upgradeable_config.ts#L49
      // we need to make sure the find call for upgrade config should be able to find all the global configs as it was before.
      // It is a workaround for 2.17, should be optimized in the upcoming 2.18 release.
      if (options.type === 'config' && options.sortField === 'buildNum') {
        const findResult = await wrapperOptions.client.find<{ buildNum?: number }>(options);

        // There maybe user settings inside the find result,
        // so that we need to filter out user configs(user configs are the configs without buildNum attribute).
        const finalSavedObjects = findResult.saved_objects.filter(
          (savedObject) => !!savedObject.attributes?.buildNum
        );

        return {
          ...findResult,
          total: finalSavedObjects.length,
          saved_objects: finalSavedObjects as Array<SavedObjectsFindResult<T>>,
        };
      } else if (!options.workspaces && !options.ACLSearchParams) {
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
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateWorkspacePermissionError();
      }

      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
      return await wrapperOptions.client.deleteByWorkspace(workspace, options);
    };

    const addToWorkspacesWithPermissionControl = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Only dashboard admin can assign data source to workspace
      if (validateIsWorkspaceDataSourceAndConnectionObjectType(type)) {
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateOSDAdminPermissionError();
      }
      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
      // In current version, only the type is data-source and data-connection that will call addToWorkspaces
      return await wrapperOptions.client.addToWorkspaces(type, id, targetWorkspaces, options);
    };

    const deleteFromWorkspacesWithPermissionControl = async (
      type: string,
      id: string,
      targetWorkspaces: string[],
      options: SavedObjectsBaseOptions = {}
    ) => {
      // Only dashboard admin can unassign data source and data-connection to workspace
      if (validateIsWorkspaceDataSourceAndConnectionObjectType(type)) {
        ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_FAILURE, 1);
        throw generateOSDAdminPermissionError();
      }
      ACLAuditor?.increment(ACLAuditorStateKey.VALIDATE_SUCCESS, 1);
      // In current version, only the type is data-source and data-connection will that call deleteFromWorkspaces
      return await wrapperOptions.client.deleteFromWorkspaces(type, id, targetWorkspaces, options);
    };

    const { isDashboardAdmin, isDataSourceAdmin } = getWorkspaceState(wrapperOptions.request) || {};
    if (isDashboardAdmin) {
      return wrapperOptions.client;
    }

    const ACLAuditDecorator = function <T extends (...args: any[]) => any>(fn: T): T {
      return function (...args: Parameters<T>): ReturnType<T> {
        clientCallAuditor?.increment(CLIENT_CALL_AUDITOR_KEY.incoming);
        const result = fn.apply(wrapperOptions.client, args);
        if (result instanceof Promise) {
          result.then(
            () => {
              clientCallAuditor?.increment(CLIENT_CALL_AUDITOR_KEY.outgoing);
              try {
                const checkoutInfo = JSON.stringify([fn.name, ...args]);
                if (clientCallAuditor?.isAsyncClientCallsBalanced()) {
                  ACLAuditor?.checkout(checkoutInfo);
                }
              } catch (e) {
                if (clientCallAuditor?.isAsyncClientCallsBalanced()) {
                  ACLAuditor?.checkout();
                }
              }
            },
            /**
             * The catch here is required because unhandled promise will make server crashed,
             * and we will reset the auditor state when catch an error.
             */
            () => {
              clientCallAuditor?.increment(CLIENT_CALL_AUDITOR_KEY.outgoing);
              if (clientCallAuditor?.isAsyncClientCallsBalanced()) {
                ACLAuditor?.reset();
              }
            }
          );
        } else {
          // The decorator is used to decorate async functions so the branch here won't be picked.
          // But we still need to keep it in case there are sync calls in the future.
          clientCallAuditor?.increment(CLIENT_CALL_AUDITOR_KEY.outgoing);
          if (clientCallAuditor?.isAsyncClientCallsBalanced()) {
            ACLAuditor?.checkout();
          }
        }
        return result;
      } as T;
    };

    return {
      ...wrapperOptions.client,
      get: ACLAuditDecorator(getWithWorkspacePermissionControl),
      checkConflicts: wrapperOptions.client.checkConflicts,
      find: findWithWorkspacePermissionControl,
      bulkGet: ACLAuditDecorator(bulkGetWithWorkspacePermissionControl),
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      create: ACLAuditDecorator(createWithWorkspacePermissionControl),
      bulkCreate: ACLAuditDecorator(bulkCreateWithWorkspacePermissionControl),
      delete: ACLAuditDecorator(deleteWithWorkspacePermissionControl),
      update: ACLAuditDecorator(updateWithWorkspacePermissionControl),
      bulkUpdate: ACLAuditDecorator(bulkUpdateWithWorkspacePermissionControl),
      deleteByWorkspace: ACLAuditDecorator(deleteByWorkspaceWithPermissionControl),
      addToWorkspaces: ACLAuditDecorator(addToWorkspacesWithPermissionControl),
      deleteFromWorkspaces: ACLAuditDecorator(deleteFromWorkspacesWithPermissionControl),
    };
  };

  constructor(private readonly permissionControl: SavedObjectsPermissionControlContract) {}
}
