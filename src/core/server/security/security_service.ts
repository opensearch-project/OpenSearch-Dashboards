/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreService } from '../../types';
import { IReadOnlyService, InternalSecurityServiceSetup } from './types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';
import { ReadonlyService } from './readonly_service';

export class SecurityService implements CoreService<InternalSecurityServiceSetup> {
  private logger: Logger;
  private readonlyService: IReadOnlyService;

  constructor(coreContext: CoreContext) {
    this.logger = coreContext.logger.get('security-service');
    this.readonlyService = new ReadonlyService();
  }

  public setup() {
    this.logger.debug('Setting up Security service');

    const securityService = this;

    return {
      registerReadonlyService(service: IReadOnlyService) {
        securityService.readonlyService = service;
      },
      readonlyService() {
        return securityService.readonlyService;
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
