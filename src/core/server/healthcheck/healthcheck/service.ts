/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { HttpServerSetup } from 'opensearch-dashboards/server/http/http_server';
import { CoreService } from '../../../types';
import { CoreContext } from '../../core_context';
import { Logger } from '../../logging';
import {
  HealthCheckServiceSetup,
  HealthCheckServiceStart,
  HealthCheckServiceStartDeps,
} from './types';
import { HealthCheck } from './health_check';
import { HealthCheckConfigType } from './config';
import { addRoutesNotReadyServer } from './routes';
import { configureDashboardServerIsNotReadyRoutes } from './dashboard_server_is_not_ready_yet/server';

function createSetup(ctx: HealthCheckService): HealthCheckServiceSetup {
  return {
    register: ctx.healthCheck.register.bind(ctx.healthCheck),
    get: ctx.healthCheck.get.bind(ctx.healthCheck),
    getAll: ctx.healthCheck.getAll.bind(ctx.healthCheck),
  };
}

export class HealthCheckService
  implements CoreService<HealthCheckServiceSetup, HealthCheckServiceStart> {
  private readonly logger: Logger;
  healthCheck: HealthCheck;
  private readonly config$: Observable<HealthCheckConfigType>;

  constructor(private readonly coreContext: CoreContext) {
    this.logger = this.coreContext.logger.get('healthcheck');
    this.config$ = this.coreContext.configService.atPath<HealthCheckConfigType>('healthcheck');
    this.healthCheck = new HealthCheck(this.logger, {});
  }

  async setup(...params: any[]) {
    this.logger.debug('Setup starts');
    const config = await this.config$.pipe(first()).toPromise();

    await this.healthCheck.setup(params[0], config);

    this.logger.debug('Setup finished');
    return createSetup(this);
  }

  async start(core: HealthCheckServiceStartDeps) {
    this.logger.debug('Start starts');
    await this.healthCheck.start(core);

    this.logger.debug('Start finished');
    return createSetup(this);
  }

  stop(): void | Promise<void> {
    this.logger.debug('Stop starts');
    this.healthCheck.stop();
    this.logger.debug('Stop finished');
  }

  enhanceNotReadyServer(server: HttpServerSetup['server'], basePath: HttpServerSetup['basePath']) {
    addRoutesNotReadyServer(server, { healthcheck: this.healthCheck, logger: this.logger });
    configureDashboardServerIsNotReadyRoutes(server, {
      getTroubleshootingLink: () => {
        return this.healthCheck.getConfig().server_not_ready_troubleshooting_link;
      },
      serverBasePath: basePath.serverBasePath,
    });
  }
}
