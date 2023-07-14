/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreService } from 'src/core/types';
import { WorkspacesClient, WorkspacesClientContract } from './workspaces_client';
import type { WorkspaceAttribute } from '../../server/types';
import { HttpSetup } from '../http';
import { IUiSettingsClient } from '../ui_settings';

/**
 * @public
 */
export interface WorkspacesStart {
  client: WorkspacesClientContract;
  formatUrlWithWorkspaceId: (url: string, id: WorkspaceAttribute['id']) => string;
  setFormatUrlWithWorkspaceId: (formatFn: WorkspacesStart['formatUrlWithWorkspaceId']) => void;
}

export type WorkspacesSetup = WorkspacesStart;

export class WorkspacesService implements CoreService<WorkspacesSetup, WorkspacesStart> {
  private client?: WorkspacesClientContract;
  private formatUrlWithWorkspaceId(url: string, id: string) {
    return url;
  }
  private setFormatUrlWithWorkspaceId(formatFn: WorkspacesStart['formatUrlWithWorkspaceId']) {
    this.formatUrlWithWorkspaceId = formatFn;
  }
  public async setup({ http, uiSettings }: { http: HttpSetup; uiSettings: IUiSettingsClient }) {
    this.client = new WorkspacesClient(http);

    // If workspace was disabled while opening a workspace url, navigate to basePath
    if (uiSettings.get('workspace:enabled') === true) {
      this.client.init();
    }

    return {
      client: this.client,
      formatUrlWithWorkspaceId: (url: string, id: string) => this.formatUrlWithWorkspaceId(url, id),
      setFormatUrlWithWorkspaceId: (fn: WorkspacesStart['formatUrlWithWorkspaceId']) =>
        this.setFormatUrlWithWorkspaceId(fn),
    };
  }
  public async start(): Promise<WorkspacesStart> {
    return {
      client: this.client as WorkspacesClientContract,
      formatUrlWithWorkspaceId: this.formatUrlWithWorkspaceId,
      setFormatUrlWithWorkspaceId: (fn: WorkspacesStart['formatUrlWithWorkspaceId']) =>
        this.setFormatUrlWithWorkspaceId(fn),
    };
  }
  public async stop() {
    this.client?.stop();
  }
}
