/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreService } from '../../types';
import { IReadOnlyService, IdentitySourceHandler, InternalSecurityServiceSetup } from './types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { ReadonlyService } from './readonly_service';
import { IdentitySourceService } from './identity_source_service';
import { InternalHttpServiceSetup } from '../http';
import { registerRoutes } from './router';

export interface SecuritySetupDeps {
  http: InternalHttpServiceSetup;
}

export class SecurityService implements CoreService<InternalSecurityServiceSetup> {
  private logger: Logger;
  private readonlyService: IReadOnlyService;
  private identitySourceService: IdentitySourceService;

  constructor(coreContext: CoreContext) {
    this.logger = coreContext.logger.get('security-service');
    this.readonlyService = new ReadonlyService();
    this.identitySourceService = new IdentitySourceService(this.logger);
  }

  public setup(setupDeps: SecuritySetupDeps) {
    this.logger.debug('Setting up Security service');

    const securityService = this;
    const router = setupDeps.http.createRouter('/api/security/');

    registerRoutes({
      router,
      identitySourceService: this.identitySourceService,
    });

    return {
      registerReadonlyService(service: IReadOnlyService) {
        securityService.readonlyService = service;
      },
      readonlyService() {
        return securityService.readonlyService;
      },
      registerIdentitySourceHandler(source: string, handler: IdentitySourceHandler) {
        securityService.identitySourceService.registerIdentitySourceHandler(source, handler);
      },
    };
  }

  public start() {
    this.logger.debug('Starting plugin');
  }

  public stop() {
    this.logger.debug('Stopping plugin');
  }
}
