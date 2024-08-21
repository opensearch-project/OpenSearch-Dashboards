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
  WorkspaceAttribute,
  SavedObjectsServiceStart,
  Permissions,
  UiSettingsServiceStart,
} from '../../../core/server';

export interface WorkspaceAttributeWithPermission extends WorkspaceAttribute {
  permissions?: Permissions;
}
import { WorkspacePermissionMode } from '../common/constants';

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
   * Set ui settings client that will be used inside the workspace client.
   * @param uiSettings {@link UiSettingsServiceStart}
   * @returns void
   * @public
   */
  setUiSettings(uiSettings: UiSettingsServiceStart): void;
  /**
   * Create a workspace
   * @param requestDetail {@link IRequestDetail}
   * @param payload - An object of type {@link WorkspaceAttributeWithPermission} excluding the 'id' property, and also containing an optional array of string.
   * @public
   */
  create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttributeWithPermission, 'id'> & {
      dataSources?: string[];
    }
  ): Promise<IResponse<{ id: WorkspaceAttribute['id'] }>>;
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
        workspaces: WorkspaceAttribute[];
      } & Pick<SavedObjectsFindResponse, 'page' | 'per_page' | 'total'>
    >
  >;
  /**
   * Get the detail of a given workspace id
   * @param requestDetail {@link IRequestDetail}
   * @param id workspace id
   * @returns a Promise with the detail of {@link WorkspaceAttribute}
   * @public
   */
  get(requestDetail: IRequestDetail, id: string): Promise<IResponse<WorkspaceAttribute>>;
  /**
   * Update the detail of a given workspace
   * @param requestDetail {@link IRequestDetail}
   * @param id workspace id
   * @param payload - An object of type {@link WorkspaceAttributeWithPermission} excluding the 'id' property, and also containing an optional array of string.
   * @returns a Promise with a boolean result indicating if the update operation successed.
   * @public
   */
  update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Partial<Omit<WorkspaceAttributeWithPermission, 'id'>> & {
      dataSources?: string[];
    }
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

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}

export interface WorkspacePluginSetup {
  client: IWorkspaceClientImpl;
}

export interface WorkspacePluginStart {
  client: IWorkspaceClientImpl;
}
