/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  SessionStorageFactory,
} from 'opensearch-dashboards/server';
import { first } from 'rxjs/operators';
import { SecurityPluginSetup, SecurityPluginStart } from './types';
import { SecurityPluginConfigType } from '.';
import { SecuritySessionCookie, getSecurityCookieOptions } from './session/security_cookie';
import { getAuthenticationHandler } from './auth/auth_handler_factory';
import { IAuthenticationType } from './auth/types/authentication_type';


export class SecurityPlugin implements Plugin<SecurityPluginSetup, SecurityPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config: SecurityPluginConfigType = await config$.pipe(first()).toPromise();

    const router = core.http.createRouter();

    const securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = await core.http.createCookieSessionStorageFactory<
      SecuritySessionCookie
    >(getSecurityCookieOptions(config));

    // setup auth
    const auth: IAuthenticationType = await getAuthenticationHandler(
      router,
      config,
      core,
      securitySessionStorageFactory,
      this.logger
    );
    core.http.registerAuth(auth.authHandler);

    return {
      config$,
    };
  }

  // TODO: add more logs
  public async start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
