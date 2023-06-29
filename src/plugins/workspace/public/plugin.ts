/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin } from '../../../core/public';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  private getWorkpsaceIdFromURL(): string | null {
    return getWorkspaceIdFromUrl(window.location.href);
  }
  public async setup() {
    /**
     * Retrive workspace id from url
     */
    const workspaceId = this.getWorkpsaceIdFromURL();

    if (workspaceId) {
      /**
       * Enter a workspace
       */
    }

    return {};
  }

  public start() {
    return {};
  }

  public stop() {}
}
