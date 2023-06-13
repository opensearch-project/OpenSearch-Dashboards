/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { resolve as resolveUrl } from 'url';
import type { PublicMethodsOf } from '@osd/utility-types';
import { WORKSPACES_API_BASE_URL } from '../../server/types';
import { HttpStart } from '../http';
import { WorkspaceAttribute, WorkspaceFindOptions } from '.';

/**
 * WorkspacesClientContract as implemented by the {@link WorkspacesClient}
 *
 * @public
 */
export type WorkspacesClientContract = PublicMethodsOf<WorkspacesClient>;

const join = (...uriComponents: Array<string | undefined>) =>
  uriComponents
    .filter((comp): comp is string => Boolean(comp))
    .map(encodeURIComponent)
    .join('/');

type IResponse<T> =
  | {
      result: T;
      success: true;
    }
  | {
      success: false;
      error?: string;
    };

/**
 * Workspaces is OpenSearchDashboards's visualize mechanism allowing admins to
 * organize related features
 *
 * @public
 */
export class WorkspacesClient {
  private http: HttpStart;
  constructor(http: HttpStart) {
    this.http = http;
  }

  private getPath(path: Array<string | undefined>): string {
    return resolveUrl(`${WORKSPACES_API_BASE_URL}/`, join(...path));
  }

  public async enterWorkspace(id: string): Promise<IResponse<null>> {
    return {
      success: false,
      error: 'Unimplement',
    };
  }

  public async exitWorkspace(): Promise<IResponse<null>> {
    return {
      success: false,
      error: 'Unimplement',
    };
  }

  public async getCurrentWorkspaceId(): Promise<IResponse<WorkspaceAttribute['id']>> {
    return {
      success: false,
      error: 'Unimplement',
    };
  }

  public async getCurrentWorkspace(): Promise<IResponse<WorkspaceAttribute>> {
    return {
      success: false,
      error: 'Unimplement',
    };
  }

  /**
   * Persists an workspace
   *
   * @param attributes
   * @returns
   */
  public create = (
    attributes: Omit<WorkspaceAttribute, 'id'>
  ): Promise<IResponse<WorkspaceAttribute>> => {
    if (!attributes) {
      return Promise.reject(new Error('requires attributes'));
    }

    const path = this.getPath([]);

    return this.http.fetch(path, {
      method: 'POST',
      body: JSON.stringify({
        attributes,
      }),
    });
  };

  /**
   * Deletes a workspace
   *
   * @param id
   * @returns
   */
  public delete = (id: string): Promise<IResponse<null>> => {
    if (!id) {
      return Promise.reject(new Error('requires id'));
    }

    return this.http.delete(this.getPath([id]), { method: 'DELETE' });
  };

  /**
   * Search for workspaces
   *
   * @param {object} [options={}]
   * @property {string} options.search
   * @property {string} options.search_fields - see OpenSearch Simple Query String
   *                                        Query field argument for more information
   * @property {integer} [options.page=1]
   * @property {integer} [options.per_page=20]
   * @property {array} options.fields
   * @returns A find result with workspaces matching the specified search.
   */
  public list = (
    options?: WorkspaceFindOptions
  ): Promise<
    IResponse<{
      workspaces: WorkspaceAttribute[];
      total: number;
      per_page: number;
      page: number;
    }>
  > => {
    const path = this.getPath(['_list']);
    return this.http.fetch(path, {
      method: 'GET',
      query: options,
    });
  };

  /**
   * Fetches a single workspace
   *
   * @param {string} id
   * @returns The workspace for the given id.
   */
  public get = (id: string): Promise<IResponse<WorkspaceAttribute>> => {
    if (!id) {
      return Promise.reject(new Error('requires id'));
    }

    const path = this.getPath([id]);
    return this.http.fetch(path, {
      method: 'GET',
    });
  };

  /**
   * Updates a workspace
   *
   * @param {string} id
   * @param {object} attributes
   * @returns
   */
  public update(id: string, attributes: Partial<WorkspaceAttribute>): Promise<IResponse<boolean>> {
    if (!id || !attributes) {
      return Promise.reject(new Error('requires id and attributes'));
    }

    const path = this.getPath([id]);
    const body = {
      attributes,
    };

    return this.http
      .fetch(path, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      .then((resp: WorkspaceAttribute) => {
        return {
          result: true,
          success: true,
        };
      });
  }
}
