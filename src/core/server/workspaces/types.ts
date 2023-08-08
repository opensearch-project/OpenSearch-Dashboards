/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  SavedObjectsFindResponse,
} from '..';

import { Permissions } from '../saved_objects/permission_control/acl';
import { PermissionMode } from '../../utils/constants';

import { WorkspacesSetupDeps } from './workspaces_service';

export interface WorkspaceAttribute {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
  permissions: Permissions;
}

export interface WorkspaceFindOptions {
  page?: number;
  perPage?: number;
  search?: string;
  searchFields?: string[];
  sortField?: string;
  sortOrder?: string;
}

export interface IRequestDetail {
  request: OpenSearchDashboardsRequest;
  context: RequestHandlerContext;
  logger: Logger;
}

export interface IWorkspaceDBImpl {
  setup(dep: WorkspacesSetupDeps): Promise<IResponse<boolean>>;
  create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttribute, 'id'>
  ): Promise<IResponse<{ id: WorkspaceAttribute['id'] }>>;
  list(
    requestDetail: IRequestDetail,
    options: WorkspaceFindOptions
  ): Promise<
    IResponse<
      {
        workspaces: WorkspaceAttribute[];
      } & Pick<SavedObjectsFindResponse, 'page' | 'per_page' | 'total'>
    >
  >;
  get(requestDetail: IRequestDetail, id: string): Promise<IResponse<WorkspaceAttribute>>;
  update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Omit<WorkspaceAttribute, 'id'>
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
    PermissionMode.LibraryRead | PermissionMode.LibraryWrite | PermissionMode.Management
  >;
} & ({ type: 'user'; userId: string } | { type: 'group'; group: string });
