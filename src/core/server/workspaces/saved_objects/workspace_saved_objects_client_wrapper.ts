/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import Boom from '@hapi/boom';

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
} from 'opensearch-dashboards/server';
import {
  WorkspacePermissionControl,
  WorkspacePermissionMode,
} from '../workspace_permission_control';

// Can't throw unauthorized for now, the page will be refreshed if unauthorized
const generateWorkspacePermissionError = () =>
  Boom.illegal(
    i18n.translate('workspace.permission.invalidate', {
      defaultMessage: 'Invalidate workspace permission',
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
  private async validateMultiWorkspacesPermissions(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    if (!workspaces) {
      return;
    }
    for (const workspaceId of workspaces) {
      if (!(await this.permissionControl.validate(workspaceId, permissionMode, request))) {
        throw generateWorkspacePermissionError();
      }
    }
  }

  private async validateAtLeastOnePermittedWorkspaces(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    if (!workspaces) {
      return;
    }
    let permitted = false;
    for (const workspaceId of workspaces) {
      if (await this.permissionControl.validate(workspaceId, permissionMode, request)) {
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
        WorkspacePermissionMode.Admin
      );
      return await wrapperOptions.client.delete(type, id, options);
    };

    const bulkCreateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
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
          WorkspacePermissionMode.Admin
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
        WorkspacePermissionMode.Read
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
          WorkspacePermissionMode.Read
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
              workspaceId,
              WorkspacePermissionMode.Read,
              wrapperOptions.request
            )
        );
      } else {
        options.workspaces = [
          'public',
          ...(await this.permissionControl.getPermittedWorkspaceIds(
            WorkspacePermissionMode.Read,
            wrapperOptions.request
          )),
        ];
      }
      return await wrapperOptions.client.find<T>(options);
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
    };
  };

  constructor(private readonly permissionControl: WorkspacePermissionControl) {}
}
