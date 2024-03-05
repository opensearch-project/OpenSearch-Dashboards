/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/server/mocks';
import { WorkspacePlugin } from './plugin';

describe('Workspace server plugin', () => {
  it('#setup', async () => {
    let value;
    const setupMock = coreMock.createSetup();
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      workspace: {
        enabled: true,
      },
    });
    setupMock.capabilities.registerProvider.mockImplementationOnce((fn) => (value = fn()));
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    await workspacePlugin.setup(setupMock);
    expect(value).toMatchInlineSnapshot(`
      Object {
        "workspaces": Object {
          "enabled": true,
        },
      }
    `);
  });
});
