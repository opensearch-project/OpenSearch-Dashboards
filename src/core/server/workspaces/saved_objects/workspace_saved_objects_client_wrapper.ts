/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import Boom from '@hapi/boom';

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
} from 'opensearch-dashboards/server';
import { SavedObjectsPermissionControlContract } from '../../saved_objects/permission_control/client';
import { WORKSPACE_TYPE } from '../constants';
import { PermissionMode } from '../../../utils';

// Can't throw unauthorized for now, the page will be refreshed if unauthorized
const generateWorkspacePermissionError = () =>
  Boom.illegal(
    i18n.translate('workspace.permission.invalidate', {
      defaultMessage: 'Invalid workspace permission',
    })
  );

const generateSavedObjectsPermissionError = () =>
  Boom.illegal(
    i18n.translate('saved_objects.permission.invalidate', {
      defaultMessage: 'Invalid saved objects permission',
    })
  );

interface AttributesWithWorkspaces {
  workspaces: string[];
}

const isWorkspacesLikeAttributes = (attributes: unknown): attributes is AttributesWithWorkspaces =>
  typeof attributes === 'object' &&
  !!attributes &&
  attributes.hasOwnProperty('workspaces') &&
  Array.isArray((attributes as { workspaces: unknown }).workspaces);

export class WorkspaceSavedObjectsClientWrapper {
  private formatPermissionModeToStringArray(
    permission: PermissionMode | PermissionMode[]
  ): string[] {
    if (Array.isArray(permission)) {
      return permission;
    }

    return [permission];
  }
  private async validateMultiWorkspacesPermissions(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: PermissionMode | PermissionMode[]
  ) {
    if (!workspaces) {
      return;
    }
    for (const workspaceId of workspaces) {
      if (
        !(await this.permissionControl.validate(
          request,
          {
            type: WORKSPACE_TYPE,
            id: workspaceId,
          },
          this.formatPermissionModeToStringArray(permissionMode)
        ))
      ) {
        throw generateWorkspacePermissionError();
      }
    }
  }

  private async validateAtLeastOnePermittedWorkspaces(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: PermissionMode | PermissionMode[]
  ) {
    if (!workspaces) {
      return;
    }
    let permitted = false;
    for (const workspaceId of workspaces) {
      if (
        await this.permissionControl.validate(
          request,
          {
            type: WORKSPACE_TYPE,
            id: workspaceId,
          },
          this.formatPermissionModeToStringArray(permissionMode)
        )
      ) {
        permitted = true;
        break;
      }
    }
    if (!permitted) {
      throw generateWorkspacePermissionError();
    }
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const deleteWithWorkspacePermissionControl = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      const objectToDeleted = await wrapperOptions.client.get(type, id, options);
      await this.validateMultiWorkspacesPermissions(
        objectToDeleted.workspaces,
        wrapperOptions.request,
        PermissionMode.Management
      );
      return await wrapperOptions.client.delete(type, id, options);
    };

    const bulkCreateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (options.workspaces) {
        await this.validateMultiWorkspacesPermissions(options.workspaces, wrapperOptions.request, [
          PermissionMode.Write,
          PermissionMode.Management,
        ]);
      }
      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const createWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (isWorkspacesLikeAttributes(attributes)) {
        await this.validateMultiWorkspacesPermissions(
          attributes.workspaces,
          wrapperOptions.request,
          PermissionMode.Management
        );
      }
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const getWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      const objectToGet = await wrapperOptions.client.get<T>(type, id, options);
      await this.validateAtLeastOnePermittedWorkspaces(
        objectToGet.workspaces,
        wrapperOptions.request,
        PermissionMode.Read
      );
      return objectToGet;
    };

    const bulkGetWithWorkspacePermissionControl = async <T = unknown>(
      objects: SavedObjectsBulkGetObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const objectToBulkGet = await wrapperOptions.client.bulkGet<T>(objects, options);
      for (const object of objectToBulkGet.saved_objects) {
        await this.validateAtLeastOnePermittedWorkspaces(
          object.workspaces,
          wrapperOptions.request,
          PermissionMode.Read
        );
      }
      return objectToBulkGet;
    };

    const findWithWorkspacePermissionControl = async <T = unknown>(
      options: SavedObjectsFindOptions
    ) => {
      if (options.workspaces) {
        options.workspaces = options.workspaces.filter(
          async (workspaceId) =>
            await this.permissionControl.validate(
              wrapperOptions.request,
              {
                type: WORKSPACE_TYPE,
                id: workspaceId,
              },
              [PermissionMode.Read]
            )
        );
      } else {
        options.workspaces = [
          'public',
          ...(await this.permissionControl.getPermittedWorkspaceIds(wrapperOptions.request, [
            PermissionMode.Read,
          ])),
        ];
      }
      return await wrapperOptions.client.find<T>(options);
    };

    const addToWorkspacesWithPermissionControl = async (
      objects: SavedObjectsShareObjects[],
      targetWorkspaces: string[],
      options: SavedObjectsAddToWorkspacesOptions = {}
    ) => {
      // target workspaces
      await this.validateMultiWorkspacesPermissions(targetWorkspaces, wrapperOptions.request, [
        PermissionMode.LibraryWrite,
        PermissionMode.Management,
      ]);

      // saved_objects
      const permitted = await this.permissionControl.batchValidate(
        wrapperOptions.request,
        objects.map((savedObj) => ({
          ...savedObj,
        })),
        [PermissionMode.Write]
      );

      if (!permitted) {
        throw generateSavedObjectsPermissionError();
      }

      return await wrapperOptions.client.addToWorkspaces(objects, targetWorkspaces, options);
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
      update: wrapperOptions.client.update,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      addToWorkspaces: addToWorkspacesWithPermissionControl,
    };
  };

  constructor(private readonly permissionControl: SavedObjectsPermissionControlContract) {}
}
