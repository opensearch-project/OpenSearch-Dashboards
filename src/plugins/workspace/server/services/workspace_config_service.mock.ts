/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigSchema } from '../../config';
import { IScopedWorkspaceConfigClient } from './scoped_workspace_config_client';
import { IWorkspaceConfigService } from './workspace_config_service';

export type ScopedWorkspaceConfigClientMock = jest.Mocked<IScopedWorkspaceConfigClient>;

export interface WorkspaceConfigServiceMock extends jest.Mocked<IWorkspaceConfigService> {
  scopedClient: ScopedWorkspaceConfigClientMock;
}

/**
 * A config service which resolves to the given config for every request. Pass a rejected
 * `getMaximumWorkspaces` to exercise the fallbacks in the consumers.
 */
export const createWorkspaceConfigServiceMock = (
  config: Partial<ConfigSchema> = {}
): WorkspaceConfigServiceMock => {
  const scopedClient: ScopedWorkspaceConfigClientMock = {
    get: jest.fn().mockResolvedValue(config),
    getMaximumWorkspaces: jest.fn().mockResolvedValue(config.maximum_workspaces),
  };

  return {
    scopedClient,
    asScopedToRequest: jest.fn().mockReturnValue(scopedClient),
  };
};
