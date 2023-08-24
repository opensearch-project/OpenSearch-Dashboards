/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import Boom from '@hapi/boom';
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
  ACL,
  WorkspacePermissionMode,
} from '../../../../core/server';
import { ConfigSchema } from '../../config';

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
  private config?: ConfigSchema;
  private formatWorkspacePermissionModeToStringArray(
    permission: WorkspacePermissionMode | WorkspacePermissionMode[]
  ): string[] {
    if (Array.isArray(permission)) {
      return permission;
    }

    return [permission];
  }
  private async validateSingleWorkspacePermissions(
    workspaceId: string | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    if (!workspaceId) {
      return;
    }
    const validateResult = await this.permissionControl.validate(
      request,
      {
        type: WORKSPACE_TYPE,
        id: workspaceId,
      },
      this.formatWorkspacePermissionModeToStringArray(permissionMode)
    );
    if (!validateResult?.result) {
      throw generateWorkspacePermissionError();
    }
  }

  private async validateMultiWorkspacesPermissions(
    workspaces: string[] | undefined,
    request: OpenSearchDashboardsRequest,
    permissionMode: WorkspacePermissionMode | WorkspacePermissionMode[]
  ) {
    if (!workspaces) {
      return;
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
      if (!validateResult?.result) {
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
      const validateResult = await this.permissionControl.validate(
        request,
        {
          type: WORKSPACE_TYPE,
          id: workspaceId,
        },
        this.formatWorkspacePermissionModeToStringArray(permissionMode)
      );
      if (validateResult?.result) {
        permitted = true;
        break;
      }
    }
    if (!permitted) {
      throw generateWorkspacePermissionError();
    }
  }

  private isDashboardAdmin(request: OpenSearchDashboardsRequest): boolean {
    const config = this.config || ({} as ConfigSchema);
    const principals = this.permissionControl.getPrincipalsFromRequest(request);
    const adminBackendRoles = config?.dashboardAdmin?.backendRoles || [];
    const matchAny = principals?.groups?.some((item) => adminBackendRoles.includes(item)) || false;
    return matchAny;
  }

  /**
   * check if the type include workspace
   * Workspace permission check is totally different from object permission check.
   * @param type
   * @returns
   */
  private isRelatedToWorkspace(type: string | string[]): boolean {
    return type === WORKSPACE_TYPE || (Array.isArray(type) && type.includes(WORKSPACE_TYPE));
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const deleteWithWorkspacePermissionControl = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      if (this.isRelatedToWorkspace(type)) {
        await this.validateSingleWorkspacePermissions(id, wrapperOptions.request, [
          WorkspacePermissionMode.Management,
        ]);
      }

      const objectToDeleted = await wrapperOptions.client.get(type, id, options);
      await this.validateMultiWorkspacesPermissions(
        objectToDeleted.workspaces,
        wrapperOptions.request,
        [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
      );
      return await wrapperOptions.client.delete(type, id, options);
    };

    const updateWithWorkspacePermissionControl = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (this.isRelatedToWorkspace(type)) {
        await this.validateSingleWorkspacePermissions(id, wrapperOptions.request, [
          WorkspacePermissionMode.Management,
        ]);
      }
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkUpdateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      const workspaceIds = objects.reduce<string[]>((acc, cur) => {
        if (this.isRelatedToWorkspace(cur.type)) {
          acc.push(cur.id);
        }
        return acc;
      }, []);
      const permittedWorkspaceIds =
        (await this.permissionControl.getPermittedWorkspaceIds(wrapperOptions.request, [
          WorkspacePermissionMode.Management,
        ])) ?? [];
      const workspacePermitted = workspaceIds.every((id) => permittedWorkspaceIds.includes(id));
      if (!workspacePermitted) {
        throw generateWorkspacePermissionError();
      }

      return await wrapperOptions.client.bulkUpdate(objects, options);
    };

    const bulkCreateWithWorkspacePermissionControl = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (options.workspaces) {
        await this.validateMultiWorkspacesPermissions(options.workspaces, wrapperOptions.request, [
          WorkspacePermissionMode.Write,
          WorkspacePermissionMode.Management,
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
          [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Management]
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
        [
          WorkspacePermissionMode.LibraryRead,
          WorkspacePermissionMode.LibraryWrite,
          WorkspacePermissionMode.Management,
        ]
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
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
          ]
        );
      }
      return objectToBulkGet;
    };

    const findWithWorkspacePermissionControl = async <T = unknown>(
      options: SavedObjectsFindOptions
    ) => {
      const principals = this.permissionControl.getPrincipalsFromRequest(wrapperOptions.request);

      if (this.isRelatedToWorkspace(options.type)) {
        const queryDSLForQueryingWorkspaces = ACL.genereateGetPermittedSavedObjectsQueryDSL(
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
          ],
          principals,
          WORKSPACE_TYPE
        );
        options.queryDSL = queryDSLForQueryingWorkspaces;
      } else {
        const permittedWorkspaceIds = await this.permissionControl.getPermittedWorkspaceIds(
          wrapperOptions.request,
          [
            WorkspacePermissionMode.LibraryRead,
            WorkspacePermissionMode.LibraryWrite,
            WorkspacePermissionMode.Management,
          ]
        );
        if (options.workspaces) {
          const permittedWorkspaces = options.workspaces.filter((item) =>
            (permittedWorkspaceIds || []).includes(item)
          );
          if (!permittedWorkspaces.length) {
            /**
             * If user does not have any one workspace access
             * deny the request
             */
            throw generateWorkspacePermissionError();
          }

          /**
           * Overwrite the options.workspaces when user has the access of partial workspaces.
           * This mainly solve the problem that public workspace's ACL may be modified by dashboard_admin.
           * And in custom workspace, we will fetch objects from public workspace and current custom workspace.
           */
          options.workspaces = permittedWorkspaces;
        } else {
          const queryDSL = ACL.genereateGetPermittedSavedObjectsQueryDSL(
            [WorkspacePermissionMode.Read, WorkspacePermissionMode.Write],
            principals,
            options.type
          );
          options.workspaces = undefined;
          /**
           * Select all the docs that
           * 1. ACL matches read or write permission OR
           * 2. workspaces matches library_read or library_write or management OR
           * 3. Advanced settings
           */
          options.queryDSL = {
            query: {
              bool: {
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          term: {
                            type: 'config',
                          },
                        },
                        queryDSL.query,
                        {
                          terms: {
                            workspaces: permittedWorkspaceIds,
                          },
                        },
                        // TODO: remove this child clause when home workspace proposal is finalized.
                        {
                          bool: {
                            must_not: {
                              exists: {
                                field: 'workspaces',
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          };
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
      await this.validateMultiWorkspacesPermissions(targetWorkspaces, wrapperOptions.request, [
        WorkspacePermissionMode.LibraryWrite,
        WorkspacePermissionMode.Management,
      ]);

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
