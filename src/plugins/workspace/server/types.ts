/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchDashboardsRequest,
  SavedObjectsFindResponse,
  CoreSetup,
  WorkspaceAttribute,
  SavedObjectsServiceStart,
  Permissions,
  UiSettingsServiceStart,
  WorkspaceFindOptions,
} from '../../../core/server';
import { PermissionModeId } from '../../../core/server';
export interface WorkspaceAttributeWithPermission extends WorkspaceAttribute {
  permissions?: Permissions;
  permissionMode?: PermissionModeId;
}

export interface IRequestDetail {
  request: OpenSearchDashboardsRequest;
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
        workspaces: WorkspaceAttributeWithPermission[];
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

  /**
   * Associates a list of objects with the given workspace ID.
   *
   * This method takes a workspace ID and an array of objects, where each object contains
   * an `id` and `type`. It attempts to associate each object with the specified workspace.
   * If the association succeeds, the object is included in the result without an error.
   * If there is an issue associating an object, an error message is returned for that object.
   *
   * @returns A promise that resolves to a response object containing an array of results for each object.
   *          Each result will include the object's `id` and, if there was an error during association, an `error` field
   *          with the error message.
   *
   * @public
   */
  associate(
    requestDetail: IRequestDetail,
    workspaceId: string,
    objects: Array<{ id: string; type: string }>
  ): Promise<IResponse<Array<{ id: string; error?: string }>>>;

  /**
   * Dissociates a list of objects from the given workspace ID.
   *
   * This method takes a workspace ID and an array of objects, where each object contains
   * an `id` and `type`. It attempts to dissociate each object from the specified workspace.
   * If the dissociation succeeds, the object is included in the result without an error.
   * If there is an issue dissociating an object, an error message is returned for that object.
   *
   * @returns A promise that resolves to a response object containing an array of results for each object.
   *          Each result will include the object's `id` and, if there was an error during dissociation, an `error` field
   *          with the error message.
   *
   * @public
   */
  dissociate(
    requestDetail: IRequestDetail,
    workspaceId: string,
    objects: Array<{ id: string; type: string }>
  ): Promise<IResponse<Array<{ id: string; error?: string }>>>;
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

export interface WorkspacePluginSetup {
  client: IWorkspaceClientImpl;
}

export interface WorkspacePluginStart {
  client: IWorkspaceClientImpl;
}
