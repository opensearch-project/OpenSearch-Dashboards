/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, Plugin } from '../../../core/public';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';

export class WorkspacePlugin implements Plugin<{}, {}> {
  private getWorkspaceIdFromURL(basePath?: string): string | null {
    return getWorkspaceIdFromUrl(window.location.href, basePath);
  }
  public async setup(core: CoreSetup) {
    /**
     * Retrieve workspace id from url
     */
    const workspaceId = this.getWorkspaceIdFromURL(core.http.basePath.getBasePath());

    if (workspaceId) {
      core.workspaces.currentWorkspaceId$.next(workspaceId);
    }

    return {};
  }

  public start() {
    return {};
  }

  public stop() {}
}
