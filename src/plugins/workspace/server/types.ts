/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  SavedObjectsFindResponse,
  CoreSetup,
  WorkspacePermissionMode,
  WorkspaceAttribute,
  SavedObjectsServiceStart,
} from '../../../core/server';

export interface WorkspaceAttributeWithPermission extends WorkspaceAttribute {
  permissions?: WorkspacePermissionItem[];
}

export interface WorkspaceFindOptions {
  page?: number;
  perPage?: number;
  search?: string;
  searchFields?: string[];
  sortField?: string;
  sortOrder?: string;
  permissionModes?: WorkspacePermissionMode[];
}

export interface IRequestDetail {
  request: OpenSearchDashboardsRequest;
  context: RequestHandlerContext;
  logger: Logger;
}

export interface IWorkspaceClientImpl {
  /**
   * Setup function for workspace client, need to be called before any other methods.
   * @param dep {@link CoreSetup}
   * @returns a promise indicate if the setup has successed.
   * @public
   */
  setup(dep: CoreSetup): Promise<IResponse<boolean>>;
  /**
   * Set saved objects client that will be used inside the workspace client.
   * @param savedObjects {@link SavedObjectsServiceStart}
   * @returns void
   * @public
   */
  setSavedObjects(savedObjects: SavedObjectsServiceStart): void;
  /**
   * Create a workspace
   * @param requestDetail {@link IRequestDetail}
   * @param payload {@link WorkspaceAttributeWithPermission}
   * @returns a Promise with a new-created id for the workspace
   * @public
   */
  create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): Promise<IResponse<{ id: WorkspaceAttributeWithPermission['id'] }>>;
  /**
   * List workspaces
   * @param requestDetail {@link IRequestDetail}
   * @param options {@link WorkspaceFindOptions}
   * @returns a Promise with workspaces list
   * @public
   */
  list(
    requestDetail: IRequestDetail,
    options: WorkspaceFindOptions
  ): Promise<
    IResponse<
      {
        workspaces: WorkspaceAttributeWithPermission[];
      } & Pick<SavedObjectsFindResponse, 'page' | 'per_page' | 'total'>
    >
  >;
  /**
   * Get the detail of a given workspace id
   * @param requestDetail {@link IRequestDetail}
   * @param id workspace id
   * @returns a Promise with the detail of {@link WorkspaceAttributeWithPermission}
   * @public
   */
  get(
    requestDetail: IRequestDetail,
    id: string
  ): Promise<IResponse<WorkspaceAttributeWithPermission>>;
  /**
   * Update the detail of a given workspace
   * @param requestDetail {@link IRequestDetail}
   * @param id workspace id
   * @param payload {@link WorkspaceAttributeWithPermission}
   * @returns a Promise with a boolean result indicating if the update operation successed.
   * @public
   */
  update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): Promise<IResponse<boolean>>;
  /**
   * Delete a given workspace
   * @param requestDetail {@link IRequestDetail}
   * @param id workspace id
   * @returns a Promise with a boolean result indicating if the delete operation successed.
   * @public
   */
  delete(requestDetail: IRequestDetail, id: string): Promise<IResponse<boolean>>;
  /**
   * Destroy the workspace client, should be called after the server disposes.
   * @returns a Promise with a boolean result indicating if the destroy operation successed.
   * @public
   */
  destroy(): Promise<IResponse<boolean>>;
}

export type IResponse<T> =
  | {
      result: T;
      success: true;
    }
  | {
      success: false;
      error?: string;
    };

export type WorkspacePermissionItem = {
  modes: Array<
    | WorkspacePermissionMode.LibraryRead
    | WorkspacePermissionMode.LibraryWrite
    | WorkspacePermissionMode.Read
    | WorkspacePermissionMode.Write
  >;
} & ({ type: 'user'; userId: string } | { type: 'group'; group: string });

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}
