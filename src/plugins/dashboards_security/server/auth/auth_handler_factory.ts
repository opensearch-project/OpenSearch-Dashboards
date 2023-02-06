/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter, CoreSetup, Logger, SessionStorageFactory } from 'opensearch-dashboards/server';
import { SecuritySessionCookie } from '../session/security_cookie';
import { SecurityPluginConfigType } from '..';
import { IAuthenticationType, IAuthHandlerConstructor } from './types/authentication_type';
import { MultipleAuthentication } from './types';

async function createAuthentication(
  ctor: IAuthHandlerConstructor,
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  coreSetup: CoreSetup,
  logger: Logger
): Promise<IAuthenticationType> {
  const authHandler = new ctor('', config, sessionStorageFactory, router, coreSetup, logger);
  await authHandler.init();
  return authHandler;
}

export async function getAuthenticationHandler(
  router: IRouter,
  config: SecurityPluginConfigType,
  core: CoreSetup,
  securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  logger: Logger
): Promise<IAuthenticationType> {
  const authHandlerType: IAuthHandlerConstructor = MultipleAuthentication;
  const auth: IAuthenticationType = await createAuthentication(
    authHandlerType,
    config,
    securitySessionStorageFactory,
    router,
    core,
    logger
  );
  return auth;
}
