/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { resolve as resolveUrl } from 'url';
import type { PublicContract } from '@osd/utility-types';
import { Subject } from 'rxjs';
import { HttpFetchError, HttpFetchOptions, HttpSetup } from '../http';
import { WorkspaceAttribute, WorkspaceFindOptions } from '.';
import { WORKSPACES_API_BASE_URL } from './consts';

/**
 * WorkspacesClientContract as implemented by the {@link WorkspacesClient}
 *
 * @public
 */
export type WorkspacesClientContract = PublicContract<WorkspacesClient>;

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
  private http: HttpSetup;
  private currentWorkspaceId = '';
  public currentWorkspaceId$ = new Subject<string>();
  public workspaceList$ = new Subject<WorkspaceAttribute[]>();
  constructor(http: HttpSetup) {
    this.http = http;
    this.currentWorkspaceId$.subscribe(
      (currentWorkspaceId) => (this.currentWorkspaceId = currentWorkspaceId)
    );
    /**
     * Add logic to check if current workspace id is still valid
     * If not, remove the current workspace id and notify other subscribers
     */
    this.workspaceList$.subscribe(async (workspaceList) => {
      const currentWorkspaceId = this.currentWorkspaceId;
      if (currentWorkspaceId) {
        const findItem = workspaceList.find((item) => item.id === currentWorkspaceId);
        if (!findItem) {
          /**
           * Current workspace is staled
           */
          this.currentWorkspaceId$.next('');
        }
      }
    });

    /**
     * Initialize workspace list
     */
    this.updateWorkspaceListAndNotify();
  }

  private catchedFetch = async <T extends IResponse<any>>(
    path: string,
    options: HttpFetchOptions
  ) => {
    try {
      return await this.http.fetch<T>(path, options);
    } catch (error: unknown) {
      if (error instanceof HttpFetchError || error instanceof Error) {
        return {
          success: false,
          error: error.message,
        } as T;
      }

      return {
        success: false,
        error: 'Unknown error',
      } as T;
    }
  };

  private getPath(path: Array<string | undefined>): string {
    return resolveUrl(`${WORKSPACES_API_BASE_URL}/`, join(...path));
  }

  private async updateWorkspaceListAndNotify(): Promise<void> {
    const result = await this.list({
      perPage: 999,
    });

    if (result?.success) {
      this.workspaceList$.next(result.result.workspaces);
    }
  }

  public async enterWorkspace(id: string): Promise<IResponse<null>> {
    const workspaceResp = await this.get(id);
    if (workspaceResp.success) {
      this.currentWorkspaceId$.next(id);
      return {
        success: true,
        result: null,
      };
    } else {
      return workspaceResp;
    }
  }

  public async exitWorkspace(): Promise<IResponse<null>> {
    this.currentWorkspaceId$.next('');
    return {
      success: true,
      result: null,
    };
  }

  public async getCurrentWorkspaceId(): Promise<IResponse<WorkspaceAttribute['id']>> {
    const currentWorkspaceId = this.currentWorkspaceId;
    if (!currentWorkspaceId) {
      return {
        success: false,
        error: 'You are not in any workspace yet.',
      };
    }

    return {
      success: true,
      result: currentWorkspaceId,
    };
  }

  public async getCurrentWorkspace(): Promise<IResponse<WorkspaceAttribute>> {
    const currentWorkspaceIdResp = await this.getCurrentWorkspaceId();
    if (currentWorkspaceIdResp.success) {
      const currentWorkspaceResp = await this.get(currentWorkspaceIdResp.result);
      return currentWorkspaceResp;
    } else {
      return currentWorkspaceIdResp;
    }
  }

  /**
   * Persists an workspace
   *
   * @param attributes
   * @returns
   */
  public async create(
    attributes: Omit<WorkspaceAttribute, 'id'>
  ): Promise<IResponse<WorkspaceAttribute>> {
    if (!attributes) {
      return {
        success: false,
        error: 'Workspace attributes is required',
      };
    }

    const path = this.getPath([]);

    const result = await this.catchedFetch<IResponse<WorkspaceAttribute>>(path, {
      method: 'POST',
      body: JSON.stringify({
        attributes,
      }),
    });

    if (result.success) {
      this.updateWorkspaceListAndNotify();
    }

    return result;
  }

  /**
   * Deletes a workspace
   *
   * @param id
   * @returns
   */
  public async delete(id: string): Promise<IResponse<null>> {
    if (!id) {
      return {
        success: false,
        error: 'Id is required.',
      };
    }

    const result = await this.catchedFetch(this.getPath([id]), { method: 'DELETE' });

    if (result.success) {
      this.updateWorkspaceListAndNotify();
    }

    return result;
  }

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
    return this.catchedFetch(path, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  };

  /**
   * Fetches a single workspace
   *
   * @param {string} id
   * @returns The workspace for the given id.
   */
  public async get(id: string): Promise<IResponse<WorkspaceAttribute>> {
    if (!id) {
      return {
        success: false,
        error: 'Id is required.',
      };
    }

    const path = this.getPath([id]);
    return this.catchedFetch(path, {
      method: 'GET',
    });
  }

  /**
   * Updates a workspace
   *
   * @param {string} id
   * @param {object} attributes
   * @returns
   */
  public async update(
    id: string,
    attributes: Partial<WorkspaceAttribute>
  ): Promise<IResponse<boolean>> {
    if (!id || !attributes) {
      return {
        success: false,
        error: 'Id and attributes are required.',
      };
    }

    const path = this.getPath([id]);
    const body = {
      attributes,
    };

    const result = await this.catchedFetch(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (result.success) {
      this.updateWorkspaceListAndNotify();
    }

    return result;
  }

  public stop() {
    this.workspaceList$.unsubscribe();
    this.currentWorkspaceId$.unsubscribe();
  }
}
