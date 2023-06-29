/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { URL } from 'node:url';
import { HttpServiceSetup, Plugin } from 'opensearch-dashboards/server';

export interface WorkspacesSetupDeps {
  http: HttpServiceSetup;
}

export class WorkspacesService implements Plugin<{}, {}> {
  private proxyWorkspaceTrafficToRealHandler(setupDeps: WorkspacesSetupDeps) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to
     * {basePath}{osdPath*}
     */
    setupDeps.http.registerOnPreRouting((request, response, toolkit) => {
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

  public async setup(setupDeps: WorkspacesSetupDeps) {
    this.proxyWorkspaceTrafficToRealHandler(setupDeps);

    return {};
  }

  public async start(deps: {}) {
    return {};
  }

  public async stop() {}
}
