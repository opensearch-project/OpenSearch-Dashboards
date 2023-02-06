/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Plugin,
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  AppMountParameters,
} from 'opensearch-dashboards/public';
import { ClientConfigType, SecurityPluginSetup, SecurityPluginStart } from './types';
import { APP_ID_LOGIN, LOGIN_PAGE_URI } from '../common';
import { setupLogoutButton } from './apps/logout/logout-app';

export class SecurityPlugin implements Plugin<SecurityPluginSetup, SecurityPluginStart> {
  // @ts-ignore : initializerContext not used
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(core: CoreSetup): Promise<SecurityPluginSetup> {
    const config = this.initializerContext.config.get<ClientConfigType>();

    /* Privilege evaluation:: check the user's permissiion. Regsiter application based on user's permission
     * This setep need to be implemented
     */
    core.application.register({
      id: APP_ID_LOGIN,
      title: 'Security',
      chromeless: true,
      appRoute: LOGIN_PAGE_URI,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/login/login-app');
        // @ts-ignore depsStart not used.
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, params, config);
      },
    });

    return {};
  }

  public start(core: CoreStart): SecurityPluginStart {
    const config = this.initializerContext.config.get<ClientConfigType>();
    setupLogoutButton(core, config);

    return {};
  }

  public stop() {}
}
