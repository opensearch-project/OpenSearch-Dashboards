/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreService } from 'src/core/types';
import { WorkspacesClient, WorkspacesClientContract } from './workspaces_client';
import type { WorkspaceAttribute } from '../../server/types';
import { WORKSPACE_ID_QUERYSTRING_NAME } from './consts';
import { HttpSetup } from '../http';

/**
 * @public
 */
export interface WorkspacesStart {
  client: WorkspacesClientContract;
  formatUrlWithWorkspaceId: (url: string, id: WorkspaceAttribute['id']) => string;
}

export type WorkspacesSetup = WorkspacesStart;

function setQuerystring(url: string, params: Record<string, string>): string {
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams(urlObj.search);

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      searchParams.set(key, value);
    }
  }

  urlObj.search = searchParams.toString();
  return urlObj.toString();
}

export class WorkspacesService implements CoreService<WorkspacesSetup, WorkspacesStart> {
  private client?: WorkspacesClientContract;
  private formatUrlWithWorkspaceId(url: string, id: string) {
    return setQuerystring(url, {
      [WORKSPACE_ID_QUERYSTRING_NAME]: id,
    });
  }
  public async setup({ http }: { http: HttpSetup }) {
    this.client = new WorkspacesClient(http);
    return {
      client: this.client,
      formatUrlWithWorkspaceId: this.formatUrlWithWorkspaceId,
    };
  }
  public async start(): Promise<WorkspacesStart> {
    return {
      client: this.client as WorkspacesClientContract,
      formatUrlWithWorkspaceId: this.formatUrlWithWorkspaceId,
    };
  }
  public async stop() {
    this.client?.stop();
  }
}
