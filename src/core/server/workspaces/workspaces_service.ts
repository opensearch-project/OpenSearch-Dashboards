/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { InternalHttpServiceSetup } from '../http';
import { Logger } from '../logging';
import { registerRoutes } from './routes';
import {
  InternalSavedObjectsServiceSetup,
  InternalSavedObjectsServiceStart,
} from '../saved_objects';
import { IWorkspaceDBImpl } from './types';
import { WorkspacesClientWithSavedObject } from './workspaces_client_with_saved_object';

export interface WorkspacesServiceSetup {
  setWorkspacesClient: (client: IWorkspaceDBImpl) => void;
}

export interface WorkspacesServiceStart {
  client: IWorkspaceDBImpl;
}

export interface WorkspacesSetupDeps {
  http: InternalHttpServiceSetup;
  savedObject: InternalSavedObjectsServiceSetup;
}

export type InternalWorkspacesServiceSetup = WorkspacesServiceSetup;
export type InternalWorkspacesServiceStart = WorkspacesServiceStart;

/** @internal */
export interface WorkspacesStartDeps {
  savedObjects: InternalSavedObjectsServiceStart;
}

export class WorkspacesService
  implements CoreService<WorkspacesServiceSetup, WorkspacesServiceStart> {
  private logger: Logger;
  private client?: IWorkspaceDBImpl;
  constructor(private readonly coreContext: CoreContext) {
    this.logger = coreContext.logger.get('workspaces-service');
  }

  public async setup(setupDeps: WorkspacesSetupDeps): Promise<InternalWorkspacesServiceSetup> {
    this.logger.debug('Setting up Workspaces service');

    this.client = this.client || new WorkspacesClientWithSavedObject(setupDeps);
    await this.client.setup(setupDeps);

    registerRoutes({
      http: setupDeps.http,
      logger: this.logger,
      client: this.client as IWorkspaceDBImpl,
    });

    return {
      setWorkspacesClient: (client: IWorkspaceDBImpl) => {
        this.client = client;
      },
    };
  }

  public async start(deps: WorkspacesStartDeps): Promise<InternalWorkspacesServiceStart> {
    this.logger.debug('Starting SavedObjects service');

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public async stop() {}
}
