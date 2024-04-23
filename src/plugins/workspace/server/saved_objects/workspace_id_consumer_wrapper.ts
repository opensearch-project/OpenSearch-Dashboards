/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsCheckConflictsObject,
  OpenSearchDashboardsRequest,
  SavedObjectsFindOptions,
  PUBLIC_WORKSPACE_ID,
  WORKSPACE_TYPE,
} from '../../../../core/server';

type WorkspaceOptions = Pick<SavedObjectsBaseOptions, 'workspaces'> | undefined;

export class WorkspaceIdConsumerWrapper {
  private formatWorkspaceIdParams<T extends WorkspaceOptions>(
    request: OpenSearchDashboardsRequest,
    options?: T
  ): T {
    const { workspaces, ...others } = options || {};
    const workspaceState = getWorkspaceState(request);
    const workspaceIdParsedFromRequest = workspaceState?.requestWorkspaceId;
    const workspaceIdsInUserOptions = options?.workspaces;
    let finalWorkspaces: string[] = [];
    if (options?.hasOwnProperty('workspaces')) {
      finalWorkspaces = workspaceIdsInUserOptions || [];
    } else if (workspaceIdParsedFromRequest) {
      finalWorkspaces = [workspaceIdParsedFromRequest];
    }

    return {
      ...(others as T),
      ...(finalWorkspaces.length ? { workspaces: finalWorkspaces } : {}),
    };
  }

  private isWorkspaceType(type: SavedObjectsFindOptions['type']): boolean {
    if (Array.isArray(type)) {
      return type.every((item) => item === WORKSPACE_TYPE);
    }

    return type === WORKSPACE_TYPE;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    return {
      ...wrapperOptions.client,
      create: <T>(type: string, attributes: T, options: SavedObjectsCreateOptions = {}) =>
        wrapperOptions.client.create(
          type,
          attributes,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      bulkCreate: <T = unknown>(
        objects: Array<SavedObjectsBulkCreateObject<T>>,
        options: SavedObjectsCreateOptions = {}
      ) =>
        wrapperOptions.client.bulkCreate(
          objects,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      checkConflicts: (
        objects: SavedObjectsCheckConflictsObject[] = [],
        options: SavedObjectsBaseOptions = {}
      ) =>
        wrapperOptions.client.checkConflicts(
          objects,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      delete: wrapperOptions.client.delete,
      find: (options: SavedObjectsFindOptions) => {
        const findOptions = this.formatWorkspaceIdParams(wrapperOptions.request, options);
        if (this.isWorkspaceType(findOptions.type)) {
          return wrapperOptions.client.find(findOptions);
        }

        // if workspace is enabled, we always find by workspace
        if (!findOptions.workspaces || findOptions.workspaces.length === 0) {
          findOptions.workspaces = [PUBLIC_WORKSPACE_ID];
        }

        // `PUBLIC_WORKSPACE_ID` includes both saved objects without any workspace and with `PUBLIC_WORKSPACE_ID` workspace
        const index = findOptions.workspaces
          ? findOptions.workspaces.indexOf(PUBLIC_WORKSPACE_ID)
          : -1;
        if (!findOptions.workspacesSearchOperator && findOptions.workspaces && index !== -1) {
          findOptions.workspacesSearchOperator = 'OR';
          // remove this deletion logic when public workspace becomes to real
          if (this.isPermissionControlEnabled) {
            // remove public workspace to make sure we can pass permission control validation, more details in `WorkspaceSavedObjectsClientWrapper`
            findOptions.workspaces.splice(index, 1);
          }
        }
        if (findOptions.workspaces && findOptions.workspaces.length === 0) {
          delete findOptions.workspaces;
        }
        return wrapperOptions.client.find(findOptions);
      },
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: wrapperOptions.client.update,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
    };
  };

  constructor(private isPermissionControlEnabled?: boolean) {}
}
