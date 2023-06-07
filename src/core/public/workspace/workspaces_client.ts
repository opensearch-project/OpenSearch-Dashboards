/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { resolve as resolveUrl } from 'url';
import type { PublicMethodsOf } from '@osd/utility-types';
import { HttpStart } from '../http';
import { WorkspaceAttribute, WorkspaceFindOptions } from '.';

/**
 * WorkspacesClientContract as implemented by the {@link WorkspacesClient}
 *
 * @public
 */
export type WorkspacesClientContract = PublicMethodsOf<WorkspacesClient>;

const API_BASE_URL = '/api/workspaces/';

const join = (...uriComponents: Array<string | undefined>) =>
  uriComponents
    .filter((comp): comp is string => Boolean(comp))
    .map(encodeURIComponent)
    .join('/');

/**
 * Workspaces is OpenSearchDashboards's visualize mechanism allowing admins to
 * organize related features
 *
 * @public
 */
export class WorkspacesClient {
  private http: HttpStart;
  /** @internal */
  constructor(http: HttpStart) {
    this.http = http;
  }

  private async performBulkGet(objects: Array<{ id: string }>): Promise<WorkspaceAttribute[]> {
    const path = this.getPath(['_bulk_get']);
    return this.http.fetch(path, {
      method: 'POST',
      body: JSON.stringify(objects),
    });
  }

  private getPath(path: Array<string | undefined>): string {
    return resolveUrl(API_BASE_URL, join(...path));
  }

  /**
   * Persists an workspace
   *
   * @param attributes
   * @returns
   */
  public create = (attributes: Omit<WorkspaceAttribute, 'id'>): Promise<WorkspaceAttribute> => {
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
  public delete = (id: string): Promise<{ success: boolean }> => {
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
    WorkspaceAttribute & {
      total: number;
      perPage: number;
      page: number;
    }
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
  public get = (id: string): Promise<WorkspaceAttribute> => {
    if (!id) {
      return Promise.reject(new Error('requires id'));
    }

    return this.performBulkGet([{ id }]).then((res) => {
      if (res.length) {
        return res[0];
      }

      return Promise.reject('No workspace can be found');
    });
  };

  /**
   * Updates a workspace
   *
   * @param {string} type
   * @param {string} id
   * @param {object} attributes
   * @returns
   */
  public update(
    id: string,
    attributes: Partial<WorkspaceAttribute>
  ): Promise<{
    success: boolean;
  }> {
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
          success: true,
        };
      });
  }
}
