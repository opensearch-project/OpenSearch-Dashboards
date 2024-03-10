/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { WorkspacePlugin } from './plugin';

describe('Workspace plugin', () => {
  it('#call savedObjectsClient.setCurrentWorkspace when current workspace id changed', () => {
    const workspacePlugin = new WorkspacePlugin();
    const coreStart = coreMock.createStart();
    workspacePlugin.start(coreStart);
    coreStart.workspaces.currentWorkspaceId$.next('foo');
    expect(coreStart.savedObjects.client.setCurrentWorkspace).toHaveBeenCalledWith('foo');
  });
});
