/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { RequestHandlerContext } from 'src/core/server';

import { CoreContext } from '../core_context';
import {
  IRouter,
  RouteConfig,
  InternalHttpServiceSetup,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
} from '../http';

import { Logger } from '../logging';
import { InternalRenderingServiceSetup } from '../rendering';
import { CoreService } from '../../types';

import {
  InternalHttpResourcesSetup,
  HttpResources,
  HttpResourcesResponseOptions,
  HttpResourcesRenderOptions,
  HttpResourcesRequestHandler,
  HttpResourcesServiceToolkit,
} from './types';

export interface SetupDeps {
  http: InternalHttpServiceSetup;
  rendering: InternalRenderingServiceSetup;
}

export class HttpResourcesService implements CoreService<InternalHttpResourcesSetup> {
  private readonly logger: Logger;
  constructor(core: CoreContext) {
    this.logger = core.logger.get('http-resources');
  }

  setup(deps: SetupDeps) {
    this.logger.debug('setting up HttpResourcesService');
    return {
      createRegistrar: this.createRegistrar.bind(this, deps),
    };
  }

  start() {}
  stop() {}

  private createRegistrar(deps: SetupDeps, router: IRouter): HttpResources {
    return {
      register: <P, Q, B>(
        route: RouteConfig<P, Q, B, 'get'>,
        handler: HttpResourcesRequestHandler<P, Q, B>
      ) => {
        return router.get<P, Q, B>(route, async (context, request, response) => {
          return handler(context, request, {
            ...response,
            ...(await this.createResponseToolkit(deps, context, request, response)),
          });
        });
      },
    };
  }

  private async createResponseToolkit(
    deps: SetupDeps,
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ): Promise<HttpResourcesServiceToolkit> {
    const cspHeader = deps.http.csp.header;
    const cspReportOnly = deps.http.cspReportOnly;

    let cspReportOnlyIsEmitting: boolean;
    try {
      const dynamicConfigClient = context.core.dynamicConfig.client;
      const dynamicConfigStore = context.core.dynamicConfig.createStoreFromRequest(request);
      const cspReportOnlyDynamicConfig = await dynamicConfigClient.getConfig(
        { pluginConfigPath: 'csp-report-only' },
        dynamicConfigStore ? { asyncLocalStorageContext: dynamicConfigStore } : undefined
      );
      cspReportOnlyIsEmitting = cspReportOnlyDynamicConfig?.isEmitting ?? cspReportOnly.isEmitting;
    } catch (e) {
      cspReportOnlyIsEmitting = cspReportOnly.isEmitting;
    }

    const cspReportOnlyHeaders = cspReportOnlyIsEmitting
      ? {
          'content-security-policy-report-only': cspReportOnly.cspReportOnlyHeader,
          'reporting-endpoints': cspReportOnly.reportingEndpointsHeader,
        }
      : {};

    return {
      async renderCoreApp(options: HttpResourcesRenderOptions = {}) {
        const body = await deps.rendering.render(request, context.core.uiSettings.client, {
          includeUserSettings: true,
        });

        return response.ok({
          body,
          headers: {
            ...options.headers,
            ...cspReportOnlyHeaders,
            'content-security-policy': cspHeader,
          },
        });
      },
      async renderAnonymousCoreApp(options: HttpResourcesRenderOptions = {}) {
        const body = await deps.rendering.render(request, context.core.uiSettings.client, {
          includeUserSettings: false,
        });

        return response.ok({
          body,
          headers: {
            ...options.headers,
            ...cspReportOnlyHeaders,
            'content-security-policy': cspHeader,
          },
        });
      },
      renderHtml(options: HttpResourcesResponseOptions) {
        return response.ok({
          body: options.body,
          headers: {
            ...options.headers,
            ...cspReportOnlyHeaders,
            'content-type': 'text/html',
            'content-security-policy': cspHeader,
          },
        });
      },
      renderJs(options: HttpResourcesResponseOptions) {
        return response.ok({
          body: options.body,
          headers: {
            ...options.headers,
            ...cspReportOnlyHeaders,
            'content-type': 'text/javascript',
            'content-security-policy': cspHeader,
          },
        });
      },
    };
  }
}
