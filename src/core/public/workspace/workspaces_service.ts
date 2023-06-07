/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreService } from 'src/core/types';
import { WorkspacesClient, WorkspacesClientContract } from './workspaces_client';
import { HttpStart } from '..';

/**
 * @public
 */
export interface WorkspacesStart {
  client: WorkspacesClientContract;
}

export class WorkspacesService implements CoreService<void, WorkspacesStart> {
  public async setup() {}
  public async start({ http }: { http: HttpStart }): Promise<WorkspacesStart> {
    return { client: new WorkspacesClient(http) };
  }
  public async stop() {}
}
