/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { URL } from 'node:url';
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
import { WorkspacesClientWithSavedObject } from './workspaces_client';
import { UiSettingsServiceStart } from '../ui_settings/types';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';

export interface WorkspacesServiceSetup {
  client: IWorkspaceDBImpl;
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
  uiSettings: UiSettingsServiceStart;
}

export class WorkspacesService
  implements CoreService<WorkspacesServiceSetup, WorkspacesServiceStart> {
  private logger: Logger;
  private client?: IWorkspaceDBImpl;
  private startDeps?: WorkspacesStartDeps;
  constructor(coreContext: CoreContext) {
    this.logger = coreContext.logger.get('workspaces-service');
  }

  private proxyWorkspaceTrafficToRealHandler(setupDeps: WorkspacesSetupDeps) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to
     * {basePath}{osdPath*} when workspace is enabled
     *
     * Return HTTP 404 if accessing {basePath}/w/{workspaceId} when workspace is disabled
     */
    setupDeps.http.registerOnPreRouting(async (request, response, toolkit) => {
      const regexp = /\/w\/([^\/]*)/;
      const matchedResult = request.url.pathname.match(regexp);

      if (matchedResult) {
        if (this.startDeps) {
          const savedObjectsClient = this.startDeps.savedObjects.getScopedClient(request);
          const uiSettingsClient = this.startDeps.uiSettings.asScopedToClient(savedObjectsClient);
          const workspacesEnabled = await uiSettingsClient.get<boolean>('workspace:enabled');

          if (workspacesEnabled) {
            const requestUrl = new URL(request.url.toString());
            requestUrl.pathname = requestUrl.pathname.replace(regexp, '');
            return toolkit.rewriteUrl(requestUrl.toString());
          } else {
            // If workspace was disable, return HTTP 404
            return response.notFound();
          }
        }
      }
      return toolkit.next();
    });
  }

  public async setup(setupDeps: WorkspacesSetupDeps): Promise<InternalWorkspacesServiceSetup> {
    this.logger.debug('Setting up Workspaces service');

    this.client = new WorkspacesClientWithSavedObject(setupDeps);

    await this.client.setup(setupDeps);
    const workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
      setupDeps.savedObject.permissionControl
    );

    setupDeps.savedObject.addClientWrapper(
      0,
      'workspace',
      workspaceSavedObjectsClientWrapper.wrapperFactory
    );

    this.proxyWorkspaceTrafficToRealHandler(setupDeps);

    registerRoutes({
      http: setupDeps.http,
      logger: this.logger,
      client: this.client as IWorkspaceDBImpl,
    });

    return {
      client: this.client,
    };
  }

  public async start(deps: WorkspacesStartDeps): Promise<InternalWorkspacesServiceStart> {
    this.startDeps = deps;
    this.logger.debug('Starting SavedObjects service');

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public async stop() {}
}
