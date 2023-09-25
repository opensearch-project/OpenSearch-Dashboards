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
  Permissions,
  WorkspaceAttribute,
  SavedObjectsServiceStart,
} from '../../../core/server';

export interface WorkspaceAttributeWithPermission extends WorkspaceAttribute {
  permissions: Permissions;
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

export interface IWorkspaceDBImpl {
  setup(dep: CoreSetup): Promise<IResponse<boolean>>;
  setSavedObjects(savedObjects: SavedObjectsServiceStart): void;
  create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): Promise<IResponse<{ id: WorkspaceAttribute['id'] }>>;
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
  get(
    requestDetail: IRequestDetail,
    id: string
  ): Promise<IResponse<WorkspaceAttributeWithPermission>>;
  update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'>
  ): Promise<IResponse<boolean>>;
  delete(requestDetail: IRequestDetail, id: string): Promise<IResponse<boolean>>;
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

export type WorkspaceRoutePermissionItem = {
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
