/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectPermissions,
  WorkspaceAttribute,
  WorkspaceAttributeWithPermission,
  WorkspaceFindOptions,
} from '../../types';
import { SavedObjectsImportResponse } from '../saved_objects';

export type WorkspaceObject = WorkspaceAttribute & { readonly?: boolean; owner?: boolean };

export type IWorkspaceResponse<T> =
  | {
      result: T;
      success: true;
    }
  | {
      success: false;
      error?: string;
    };

export interface AssociationResult {
  id: string;
  error?: string;
}

/**
 * This interface representing a client for managing workspace-related operations.
 * Workspace client should implement this interface.
 */
export interface IWorkspaceClient {
  /**
   * copy saved objects to target workspace
   *
   * @param {Array<{ id: string; type: string }>} objects
   * @param {string} targetWorkspace
   * @param {boolean} includeReferencesDeep
   * @returns {Promise<SavedObjectsImportResponse>} result for this operation
   */
  copy(
    objects: Array<{ id: string; type: string }>,
    targetWorkspace: string,
    includeReferencesDeep?: boolean
  ): Promise<SavedObjectsImportResponse>;

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
   */
  associate(
    savedObjects: Array<{ id: string; type: string }>,
    workspaceId: string
  ): Promise<IWorkspaceResponse<AssociationResult[]>>;

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
   */
  dissociate(
    savedObjects: Array<{ id: string; type: string }>,
    workspaceId: string
  ): Promise<IWorkspaceResponse<AssociationResult[]>>;

  ui(): WorkspaceUI;

  /**
   * A bypass layer to get current workspace id
   */
  getCurrentWorkspaceId(): IWorkspaceResponse<WorkspaceAttributeWithPermission['id']>;

  /**
   * Do a find in the latest workspace list with current workspace id
   */
  getCurrentWorkspace(): Promise<IWorkspaceResponse<WorkspaceAttributeWithPermission>>;

  /**
   * Create a workspace
   *
   * @param attributes
   * @returns {Promise<IResponse<Pick<WorkspaceAttribute, 'id'>>>} id of the new created workspace
   */
  create(
    attributes: Omit<WorkspaceAttribute, 'id'>,
    settings: {
      dataSources?: string[];
      permissions?: SavedObjectPermissions;
      dataConnections?: string[];
    }
  ): Promise<IWorkspaceResponse<Pick<WorkspaceAttributeWithPermission, 'id'>>>;

  /**
   * Deletes a workspace by workspace id
   *
   * @param id
   * @returns {Promise<IWorkspaceResponse<null>>} result for this operation
   */
  delete(id: string): Promise<IWorkspaceResponse<null>>;

  /**
   * Search for workspaces
   *
   * @param {object} [options={}]
   * @property {string} options.search
   * @property {string} options.searchFields - see OpenSearch Simple Query String
   *                                        Query field argument for more information
   * @property {integer} [options.page=1]
   * @property {integer} [options.perPage=20]
   * @property {array} options.fields
   * @property {string array} permissionModes
   * @returns A find result with workspaces matching the specified search.
   */
  list(
    options?: WorkspaceFindOptions
  ): Promise<
    IWorkspaceResponse<{
      workspaces: WorkspaceAttributeWithPermission[];
      total: number;
      per_page: number;
      page: number;
    }>
  >;

  /**
   * Fetches a single workspace by a workspace id
   *
   * @param {string} id
   * @returns {Promise<IWorkspaceResponse<WorkspaceAttributeWithPermission>>} The metadata of the workspace for the given id.
   */
  get(id: string): Promise<IWorkspaceResponse<WorkspaceAttributeWithPermission>>;

  /**
   * Updates a workspace
   *
   * @param {string} id
   * @param {object} attributes
   * @returns {Promise<IWorkspaceResponse<boolean>>} result for this operation
   */
  update(
    id: string,
    attributes: Partial<WorkspaceAttribute>,
    settings: {
      dataSources?: string[];
      permissions?: SavedObjectPermissions;
      dataConnections?: string[];
    }
  ): Promise<IWorkspaceResponse<boolean>>;
}

interface DataSourceAssociationProps {
  excludedDataSourceIds: string[];
  onComplete?: () => void;
  onError?: () => void;
}

export interface WorkspaceUI {
  DataSourceAssociation: (props: DataSourceAssociationProps) => JSX.Element;
}
