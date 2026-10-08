/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchDashboardsRequest } from '../../../../core/server';
import {
  DynamicConfigServiceSetup,
  IScopedWorkspaceConfigClient,
  ScopedWorkspaceConfigClient,
  ScopedWorkspaceConfigClientDeps,
} from './scoped_workspace_config_client';

/**
 * Hands out request scoped config clients. Consumers depend on this instead of on the
 * dynamic config service so that how the config is resolved stays in one place.
 */
export interface IWorkspaceConfigService {
  asScopedToRequest(request: OpenSearchDashboardsRequest): IScopedWorkspaceConfigClient;
}

export type WorkspaceConfigServiceSetupDeps = Pick<
  ScopedWorkspaceConfigClientDeps,
  'dynamicConfigService' | 'staticConfig'
>;

/**
 * Owns how the workspace plugin config is resolved on the server. The dynamic config
 * service can only be talked to once a request comes in, so the service is set up during
 * the plugin setup and resolves the config lazily, per request.
 */
export class WorkspaceConfigService implements IWorkspaceConfigService {
  private deps?: WorkspaceConfigServiceSetupDeps;

  constructor(private readonly logger: Logger) {}

  public setup(deps: WorkspaceConfigServiceSetupDeps) {
    this.deps = deps;
  }

  public asScopedToRequest(request: OpenSearchDashboardsRequest): IScopedWorkspaceConfigClient {
    if (!this.deps) {
      throw new Error('WorkspaceConfigService#setup must be called before asScopedToRequest');
    }

    return new ScopedWorkspaceConfigClient({ ...this.deps, request, logger: this.logger });
  }
}

export { DynamicConfigServiceSetup, IScopedWorkspaceConfigClient };
