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
import { WorkspacesSetupDeps } from './workspaces_service';

export interface WorkspaceAttribute {
  id: string;
  name: string;
  description?: string;
  features?: string[];
}

export interface WorkspaceFindOptions {
  page?: number;
  per_page?: number;
  search?: string;
  search_fields?: string[];
  sort_field?: string;
  sort_order?: string;
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

export const WORKSPACES_API_BASE_URL = '/api/workspaces';
