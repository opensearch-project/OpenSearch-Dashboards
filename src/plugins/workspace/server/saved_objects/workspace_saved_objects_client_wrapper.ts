/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

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
  SavedObjectsPermissionControlContract,
  WORKSPACE_TYPE,
  WorkspacePermissionMode,
  SavedObjectsDeleteByWorkspaceOptions,
  SavedObjectsErrorHelpers,
} from '../../../../core/server';
import { ConfigSchema } from '../../config';
import { WorkspaceFindOptions } from '../types';

// Can't throw unauthorized for now, the page will be refreshed if unauthorized
const generateWorkspacePermissionError = () => {
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('workspace.permission.invalidate', {
        defaultMessage: 'Invalid workspace permission',
      })
    )
  );
};

const generateSavedObjectsPermissionError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('saved_objects.permission.invalidate', {
        defaultMessage: 'Invalid saved objects permission',
      })
    )
  );

export class WorkspaceSavedObjectsClientWrapper {
  private config?: ConfigSchema;
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
  private async validateMultiWorkspacesPermissions(
    workspacesIds: string[],
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    // for attributes and options passed in this function, the num of workspaces may be 0.This case should not be passed permission check.
    if (workspacesIds.length === 0) {
      return false;
    }
    const workspaces = workspacesIds.map((id) => ({ id, type: WORKSPACE_TYPE }));
    return await this.validateObjectsPermissions(workspaces, request, permissionMode);
  }

  private async validateAtLeastOnePermittedWorkspaces(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
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
  }

  private isDashboardAdmin(request: OpenSearchDashboardsRequest): boolean {
    const config = this.config || ({} as ConfigSchema);
    const principals = this.permissionControl.getPrincipalsFromRequest(request);
    const adminBackendRoles = config?.dashboardAdmin?.backendRoles || [];
    const matchAny = principals?.groups?.some((item) => adminBackendRoles.includes(item)) || false;
    return matchAny;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const deleteWithWorkspacePermissionControl = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      const objectToDeleted = await wrapperOptions.client.get(type, id, options);
      const workspacePermitted = await this.validateMultiWorkspacesPermissions(
        objectToDeleted.workspaces ?? [],
        wrapperOptions.request,
        [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
      );

      if (!workspacePermitted) {
        const objectsPermitted = await this.validateObjectsPermissions(
          [{ type, id }],
          wrapperOptions.request,
          [
            WorkspacePermissionMode.Management,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Write,
          ]
        );
        if (!objectsPermitted) {
          throw generateSavedObjectsPermissionError();
        }
      }
      return await wrapperOptions.client.delete(type, id, options);
    };

    // validate `objectToUpdate` if can update with workspace permission, which is used for update and bulkUpdate
    const validateUpdateWithWorkspacePermission = async <T = unknown>(
      objectToUpdate: SavedObject<T>
    ): Promise<boolean> => {
      let workspacePermitted = false;
      if (objectToUpdate.workspaces && objectToUpdate.workspaces.length > 0) {
        workspacePermitted =
          (await this.validateAtLeastOnePermittedWorkspaces(
            objectToUpdate.workspaces,
            wrapperOptions.request,
            [WorkspacePermissionMode.Management, WorkspacePermissionMode.LibraryWrite]
          )) ?? false;
      }

      if (workspacePermitted) {
        return true;
      } else {
        const { id, type } = objectToUpdate;
        const objectsPermitted = await this.validateObjectsPermissions(
          [{ id, type }],
          wrapperOptions.request,
          [
            WorkspacePermissionMode.Management,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Write,
          ]
        );
        return objectsPermitted ?? false;
      }
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
      let workspacePermitted;
      if (options?.workspaces && options.workspaces.length > 0) {
        workspacePermitted = await this.validateMultiWorkspacesPermissions(
          options.workspaces,
          wrapperOptions.request,
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
        );
      } else {
        workspacePermitted = true;
      }

      if (!workspacePermitted) {
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
      const workspacePermitted = await this.validateAtLeastOnePermittedWorkspaces(
        objectToGet.workspaces,
        wrapperOptions.request,
        [
          WorkspacePermissionMode.LibraryRead,
          WorkspacePermissionMode.LibraryWrite,
          WorkspacePermissionMode.Management,
        ]
      );

      if (!workspacePermitted) {
        const objectsPermitted = await this.validateObjectsPermissions(
          [{ id, type }],
          wrapperOptions.request,
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
            WorkspacePermissionMode.Read,
            WorkspacePermissionMode.Write,
          ]
        );
        if (!objectsPermitted) {
          throw generateSavedObjectsPermissionError();
        }
      }
      return objectToGet;
    };

    const bulkGetWithWorkspacePermissionControl = async <T = unknown>(
      objects: SavedObjectsBulkGetObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const nonWorkspacePermittedObjects = [];
      const objectToBulkGet = await wrapperOptions.client.bulkGet<T>(objects, options);

      for (const object of objectToBulkGet.saved_objects) {
        const workspacePermitted = await this.validateAtLeastOnePermittedWorkspaces(
          object.workspaces,
          wrapperOptions.request,
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
          ]
        );
        if (!workspacePermitted) {
          nonWorkspacePermittedObjects.push(object);
        }
      }

      if (nonWorkspacePermittedObjects.length > 0) {
        const objectsPermitted = this.permissionControl.batchValidate(
          wrapperOptions.request,
          nonWorkspacePermittedObjects,
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
            WorkspacePermissionMode.Write,
            WorkspacePermissionMode.Read,
          ]
        );
        if (!objectsPermitted) {
          throw generateSavedObjectsPermissionError();
        }
      }

      return objectToBulkGet;
    };

    const findWithWorkspacePermissionControl = async <T = unknown>(
      options: SavedObjectsFindOptions & Pick<WorkspaceFindOptions, 'permissionModes'>
    ) => {
      const principals = this.permissionControl.getPrincipalsFromRequest(wrapperOptions.request);
      const processedOptions = await wrapperOptions.client.processFindOptions({
        options,
        principals,
      });
      return await wrapperOptions.client.find<T>(processedOptions);
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

    const isDashboardAdmin = this.isDashboardAdmin(wrapperOptions.request);

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
      addToWorkspaces: addToWorkspacesWithPermissionControl,
      deleteByWorkspace: deleteByWorkspaceWithPermissionControl,
    };
  };

  constructor(
    private readonly permissionControl: SavedObjectsPermissionControlContract,
    private readonly options: {
      config$: Observable<ConfigSchema>;
    }
  ) {
    this.options.config$.subscribe((config) => {
      this.config = config;
    });
    this.options.config$
      .pipe(first())
      .toPromise()
      .then((config) => {
        this.config = config;
      });
  }
}
