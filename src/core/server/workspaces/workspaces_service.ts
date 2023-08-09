/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { URL } from 'node:url';
import { i18n } from '@osd/i18n';
import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { InternalHttpServiceSetup } from '../http';
import { Logger } from '../logging';
import { registerRoutes } from './routes';
import {
  ISavedObjectsRepository,
  InternalSavedObjectsServiceSetup,
  SavedObjectsServiceStart,
} from '../saved_objects';
import { IWorkspaceDBImpl, WorkspaceAttribute } from './types';
import { WorkspacesClientWithSavedObject } from './workspaces_client';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import { InternalUiSettingsServiceSetup } from '../ui_settings';
import { uiSettings } from './ui_settings';
import { WORKSPACE_TYPE } from './constants';
import { MANAGEMENT_WORKSPACE, PUBLIC_WORKSPACE, PermissionMode } from '../../utils';
import { ACL, Permissions } from '../saved_objects/permission_control/acl';

export interface WorkspacesServiceSetup {
  client: IWorkspaceDBImpl;
}

export interface WorkspacesServiceStart {
  client: IWorkspaceDBImpl;
}

export interface WorkspacesSetupDeps {
  http: InternalHttpServiceSetup;
  savedObject: InternalSavedObjectsServiceSetup;
  uiSettings: InternalUiSettingsServiceSetup;
}

export interface WorkpsaceStartDeps {
  savedObjects: SavedObjectsServiceStart;
}

export type InternalWorkspacesServiceSetup = WorkspacesServiceSetup;
export type InternalWorkspacesServiceStart = WorkspacesServiceStart;

export class WorkspacesService
  implements CoreService<WorkspacesServiceSetup, WorkspacesServiceStart> {
  private logger: Logger;
  private client?: IWorkspaceDBImpl;

  constructor(coreContext: CoreContext) {
    this.logger = coreContext.logger.get('workspaces-service');
  }

  private proxyWorkspaceTrafficToRealHandler(setupDeps: WorkspacesSetupDeps) {
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

  public async setup(setupDeps: WorkspacesSetupDeps): Promise<InternalWorkspacesServiceSetup> {
    this.logger.debug('Setting up Workspaces service');

    setupDeps.uiSettings.register(uiSettings);

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

  private async setupWorkspaces(startDeps: WorkpsaceStartDeps) {
    const internalRepository = startDeps.savedObjects.createInternalRepository();
    const publicWorkspaceACL = new ACL().addPermission(
      [PermissionMode.LibraryRead, PermissionMode.LibraryWrite],
      {
        users: ['*'],
      }
    );
    const managementWorkspaceACL = new ACL().addPermission([PermissionMode.LibraryRead], {
      users: ['*'],
    });

    await Promise.all([
      this.checkAndCreateWorkspace(
        internalRepository,
        PUBLIC_WORKSPACE,
        {
          name: i18n.translate('workspaces.public.workspace.default.name', {
            defaultMessage: 'public',
          }),
        },
        publicWorkspaceACL.getPermissions()
      ),
      this.checkAndCreateWorkspace(
        internalRepository,
        MANAGEMENT_WORKSPACE,
        {
          name: i18n.translate('workspaces.management.workspace.default.name', {
            defaultMessage: 'Management',
          }),
        },
        managementWorkspaceACL.getPermissions()
      ),
    ]);
  }

  public async start(startDeps: WorkpsaceStartDeps): Promise<InternalWorkspacesServiceStart> {
    this.logger.debug('Starting SavedObjects service');

    this.setupWorkspaces(startDeps);

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public async stop() {}
}
