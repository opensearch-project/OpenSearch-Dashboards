/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsCheckConflictsObject,
  OpenSearchDashboardsRequest,
  SavedObjectsFindOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsClientWrapperOptions,
  SavedObject,
  SavedObjectsBulkGetObject,
  SavedObjectsBulkResponse,
} from '../../../../core/server';
import { IWorkspaceClientImpl } from '../types';
import { validateIsWorkspaceDataSourceAndConnectionObjectType } from '../../common/utils';

const UI_SETTINGS_SAVED_OBJECTS_TYPE = 'config';

type WorkspaceOptions = Pick<SavedObjectsBaseOptions, 'workspaces'> | undefined;

const generateSavedObjectsForbiddenError = () =>
  SavedObjectsErrorHelpers.decorateForbiddenError(
    new Error(
      i18n.translate('workspace.id_consumer.saved_objects.forbidden', {
        defaultMessage: 'Saved object does not belong to the workspace',
      })
    )
  );

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
      // In order to get all data sources in workspace, use * to skip appending workspace id automatically
      finalWorkspaces = (workspaceIdsInUserOptions || []).filter((id) => id !== '*');
    } else if (workspaceIdParsedFromRequest) {
      finalWorkspaces = [workspaceIdParsedFromRequest];
    }

    return {
      ...(others as T),
      ...(finalWorkspaces.length ? { workspaces: finalWorkspaces } : {}),
    };
  }

  private isConfigType(type: string): boolean {
    return type === UI_SETTINGS_SAVED_OBJECTS_TYPE;
  }

  private async checkWorkspacesExist(
    workspaces: SavedObject['workspaces'] | null,
    wrapperOptions: SavedObjectsClientWrapperOptions
  ) {
    if (workspaces?.length) {
      let invalidWorkspaces: string[] = [];
      // If only has one workspace, we should use get to optimize performance
      if (workspaces.length === 1) {
        const workspaceGet = await this.workspaceClient.get(
          { request: wrapperOptions.request },
          workspaces[0]
        );
        if (!workspaceGet.success) {
          invalidWorkspaces = [workspaces[0]];
        }
      } else {
        const workspaceList = await this.workspaceClient.list(
          {
            request: wrapperOptions.request,
          },
          {
            perPage: 9999,
          }
        );
        if (workspaceList.success) {
          const workspaceIdsSet = new Set(
            workspaceList.result.workspaces.map((workspace) => workspace.id)
          );
          invalidWorkspaces = workspaces.filter(
            (targetWorkspace) => !workspaceIdsSet.has(targetWorkspace)
          );
        }
      }

      if (invalidWorkspaces.length > 0) {
        throw SavedObjectsErrorHelpers.decorateBadRequestError(
          new Error(
            i18n.translate('workspace.id_consumer.invalid', {
              defaultMessage: 'Exist invalid workspaces',
            })
          )
        );
      }
    }
  }

  private validateObjectInAWorkspace<T>(
    object: SavedObject<T>,
    workspace: string,
    request: OpenSearchDashboardsRequest
  ) {
    // Keep the original object error
    if (!!object?.error) {
      return true;
    }
    // Data source is a workspace level object, validate if the request has access to the data source within the requested workspace.
    if (validateIsWorkspaceDataSourceAndConnectionObjectType(object.type)) {
      if (!!getWorkspaceState(request).isDataSourceAdmin) {
        return true;
      }
      // Deny access if the object is a global data source (no workspaces assigned)
      if (!object.workspaces || object.workspaces.length === 0) {
        return false;
      }
    }
    /*
     * Allow access if the requested workspace matches one of the object's assigned workspaces
     * This ensures that the user can only access data sources within their current workspace
     */
    if (object.workspaces && object.workspaces.length > 0) {
      return object.workspaces.includes(workspace);
    }
    // Allow access if the object is a global object (object.workspaces is null/[])
    return true;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    return {
      ...wrapperOptions.client,
      create: async <T>(type: string, attributes: T, options: SavedObjectsCreateOptions = {}) => {
        const finalOptions = this.isConfigType(type)
          ? options
          : this.formatWorkspaceIdParams(wrapperOptions.request, options);
        await this.checkWorkspacesExist(finalOptions?.workspaces, wrapperOptions);
        return wrapperOptions.client.create(type, attributes, finalOptions);
      },
      bulkCreate: async <T = unknown>(
        objects: Array<SavedObjectsBulkCreateObject<T>>,
        options: SavedObjectsCreateOptions = {}
      ) => {
        const finalOptions = this.formatWorkspaceIdParams(wrapperOptions.request, options);
        await this.checkWorkspacesExist(finalOptions?.workspaces, wrapperOptions);
        return wrapperOptions.client.bulkCreate(objects, finalOptions);
      },
      checkConflicts: (
        objects: SavedObjectsCheckConflictsObject[] = [],
        options: SavedObjectsBaseOptions = {}
      ) =>
        wrapperOptions.client.checkConflicts(
          objects,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      delete: wrapperOptions.client.delete,
      find: async (options: SavedObjectsFindOptions) => {
        // Based on https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/ui_settings/create_or_upgrade_saved_config/get_upgradeable_config.ts#L49
        // we need to make sure the find call for upgrade config should be able to find all the global configs as it was before.
        // It is a workaround for 2.17, should be optimized in the upcoming 2.18 release.
        const finalOptions =
          this.isConfigType(options.type as string) && options.sortField === 'buildNum'
            ? options
            : this.formatWorkspaceIdParams(wrapperOptions.request, options);
        await this.checkWorkspacesExist(finalOptions?.workspaces, wrapperOptions);
        return wrapperOptions.client.find(finalOptions);
      },
      bulkGet: async <T = unknown>(
        objects: SavedObjectsBulkGetObject[] = [],
        options: SavedObjectsBaseOptions = {}
      ): Promise<SavedObjectsBulkResponse<T>> => {
        const { workspaces } = this.formatWorkspaceIdParams(wrapperOptions.request, options);
        if (!!workspaces && workspaces.length > 1) {
          // Version 2.18 does not support the passing of multiple workspaces.
          throw SavedObjectsErrorHelpers.createBadRequestError('Multiple workspace parameters');
        }

        const objectToBulkGet = await wrapperOptions.client.bulkGet<T>(objects, options);

        if (workspaces?.length === 1) {
          return {
            ...objectToBulkGet,
            saved_objects: objectToBulkGet.saved_objects.map((object) => {
              return this.validateObjectInAWorkspace(object, workspaces[0], wrapperOptions.request)
                ? object
                : {
                    id: object.id,
                    type: object.type,
                    attributes: {} as T,
                    references: [],
                    error: {
                      ...generateSavedObjectsForbiddenError().output.payload,
                    },
                  };
            }),
          };
        }

        return objectToBulkGet;
      },
      get: async <T = unknown>(
        type: string,
        id: string,
        options: SavedObjectsBaseOptions = {}
      ): Promise<SavedObject<T>> => {
        const { workspaces } = this.formatWorkspaceIdParams(wrapperOptions.request, options);
        if (!!workspaces && workspaces.length > 1) {
          // Version 2.18 does not support the passing of multiple workspaces.
          throw SavedObjectsErrorHelpers.createBadRequestError('Multiple workspace parameters');
        }

        const objectToGet = await wrapperOptions.client.get<T>(type, id, options);
        if (
          workspaces?.length === 1 &&
          !this.validateObjectInAWorkspace(objectToGet, workspaces[0], wrapperOptions.request)
        ) {
          throw generateSavedObjectsForbiddenError();
        }

        // Allow access if no specific workspace is requested.
        return objectToGet;
      },
      update: wrapperOptions.client.update,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
    };
  };

  constructor(private readonly workspaceClient: IWorkspaceClientImpl) {}
}
