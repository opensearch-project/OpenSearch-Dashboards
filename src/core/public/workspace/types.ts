/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAttribute } from '../../types';

export type WorkspaceObject = WorkspaceAttribute & { readonly?: boolean };

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
 *
 * TODO: Refactor the current workspace client implementation in workspace plugin to add the missing operations to this interface
 */
export interface IWorkspaceClient {
  /**
   * copy saved objects to target workspace
   *
   * @param {Array<{ id: string; type: string }>} objects
   * @param {string} targetWorkspace
   * @param {boolean} includeReferencesDeep
   * @returns {Promise<IResponse<any>>} result for this operation
   */
  copy(objects: any[], targetWorkspace: string, includeReferencesDeep?: boolean): Promise<any>;

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
}

interface DataSourceAssociationProps {
  excludedDataSourceIds: string[];
  onComplete?: () => void;
  onError?: () => void;
}

export interface WorkspaceUI {
  DataSourceAssociation: (props: DataSourceAssociationProps) => JSX.Element;
}
