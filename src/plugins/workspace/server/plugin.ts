/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { Observable } from 'rxjs';

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  ISavedObjectsRepository,
  WORKSPACE_TYPE,
  ACL,
  PUBLIC_WORKSPACE_ID,
  MANAGEMENT_WORKSPACE_ID,
  Permissions,
  WorkspacePermissionMode,
  SavedObjectsClient,
  WorkspaceAttribute,
  DEFAULT_APP_CATEGORIES,
} from '../../../core/server';
import { IWorkspaceDBImpl } from './types';
import { WorkspaceClientWithSavedObject } from './workspace_client';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import { registerRoutes } from './routes';
import { ConfigSchema } from '../config';

export class WorkspacePlugin implements Plugin<{}, {}> {
  private readonly logger: Logger;
  private client?: IWorkspaceDBImpl;
  private config$: Observable<ConfigSchema>;

  private proxyWorkspaceTrafficToRealHandler(setupDeps: CoreSetup) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to {basePath}{osdPath*}
     */
    setupDeps.http.registerOnPreRouting(async (request, response, toolkit) => {
      const regexp = /\/w\/([^\/]*)/;
      const matchedResult = request.url.pathname.match(regexp);

      if (matchedResult) {
        const requestUrl = new URL(request.url.toString());
        requestUrl.pathname = requestUrl.pathname.replace(regexp, '');
        return toolkit.rewriteUrl(requestUrl.toString());
      }
      return toolkit.next();
    });
  }

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get('plugins', 'workspace');
    this.config$ = initializerContext.config.create<ConfigSchema>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Setting up Workspaces service');

    this.client = new WorkspaceClientWithSavedObject(core);

    await this.client.setup(core);
    const workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
      core.savedObjects.permissionControl,
      {
        config$: this.config$,
      }
    );

    core.savedObjects.addClientWrapper(
      0,
      'workspace',
      workspaceSavedObjectsClientWrapper.wrapperFactory
    );

    this.proxyWorkspaceTrafficToRealHandler(core);

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceDBImpl,
    });

    core.savedObjects.setClientFactoryProvider((repositoryFactory) => () =>
      new SavedObjectsClient(repositoryFactory.createInternalRepository())
    );

    return {
      client: this.client,
    };
  }

  private async checkAndCreateWorkspace(
    internalRepository: ISavedObjectsRepository,
    workspaceId: string,
    workspaceAttribute: Omit<WorkspaceAttribute, 'id' | 'permissions'>,
    permissions?: Permissions
  ) {
    /**
     * Internal repository is attached to global tenant.
     */
    try {
      await internalRepository.get(WORKSPACE_TYPE, workspaceId);
    } catch (error) {
      this.logger.debug(error?.toString() || '');
      this.logger.info(`Workspace ${workspaceId} is not found, create it by using internal user`);
      try {
        const createResult = await internalRepository.create(WORKSPACE_TYPE, workspaceAttribute, {
          id: workspaceId,
          permissions,
        });
        if (createResult.id) {
          this.logger.info(`Created workspace ${createResult.id} in global tenant.`);
        }
      } catch (e) {
        this.logger.error(`Create ${workspaceId} workspace error: ${e?.toString() || ''}`);
      }
    }
  }

  private async setupWorkspaces(startDeps: CoreStart) {
    const internalRepository = startDeps.savedObjects.createInternalRepository();
    const publicWorkspaceACL = new ACL().addPermission(
      [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.LibraryWrite],
      {
        users: ['*'],
      }
    );
    const managementWorkspaceACL = new ACL().addPermission([WorkspacePermissionMode.LibraryRead], {
      users: ['*'],
    });

    await Promise.all([
      this.checkAndCreateWorkspace(
        internalRepository,
        PUBLIC_WORKSPACE_ID,
        {
          name: i18n.translate('workspaces.public.workspace.default.name', {
            defaultMessage: 'public',
          }),
        },
        publicWorkspaceACL.getPermissions()
      ),
      this.checkAndCreateWorkspace(
        internalRepository,
        MANAGEMENT_WORKSPACE_ID,
        {
          name: i18n.translate('workspaces.management.workspace.default.name', {
            defaultMessage: 'Management',
          }),
          features: [`@${DEFAULT_APP_CATEGORIES.management.id}`],
        },
        managementWorkspaceACL.getPermissions()
      ),
    ]);
  }

  public start(core: CoreStart) {
    this.logger.debug('Starting SavedObjects service');

    this.setupWorkspaces(core);

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public stop() {}
}
