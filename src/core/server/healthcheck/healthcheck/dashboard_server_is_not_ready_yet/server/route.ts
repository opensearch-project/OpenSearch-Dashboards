/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { HttpServerSetup } from 'opensearch-dashboards/server/http/http_server';
import { Request, ResponseToolkit } from '@hapi/hapi';
import {
  SERVER_NOT_READY_RESET_STYLES_ROUTE,
  SERVER_NOT_READY_SCRIPT_ROUTE,
  SERVER_NOT_READY_STYLES_ROUTE,
  SERVER_NOT_READY_FONTS_ROUTE,
} from './constants';
import { dashboardServerIsNotReadyYet } from '..';

export const configureDashboardServerIsNotReadyRoutes = (
  server: HttpServerSetup['server'],
  {
    getTroubleshootingLink,
    serverBasePath = '',
  }: { getTroubleshootingLink: () => string; serverBasePath: string }
) => {
  const appName = 'Wazuh dashboard';

  server.route({
    path: '/{p*}',
    method: '*',
    handler: (_request: Request, h: ResponseToolkit) => {
      const html = `<!DOCTYPE html> ${dashboardServerIsNotReadyYet({
        appName,
        documentationTroubleshootingLink: getTroubleshootingLink(),
        serverBasePath,
      })}`;
      // If server is not ready yet, because plugins or core can perform
      // long running tasks (build assets, saved objects migrations etc.)
      // we should let client know that and ask to retry after 30 seconds.
      // Wazuh
      return h.response(html).type('text/html').code(503).header('Retry-After', '30').takeover();
    },
  });

  server.route({
    path: SERVER_NOT_READY_SCRIPT_ROUTE,
    method: 'get',
    handler: {
      file: path.join(__dirname, '../client/script.js'),
    },
  });

  server.route({
    path: SERVER_NOT_READY_STYLES_ROUTE,
    method: 'get',
    handler: {
      file: path.join(__dirname, '../client/styles.css'),
    },
  });

  // Serve embedded fonts for the not-ready page from the existing app assets
  // Using a directory handler allows relative CSS urls like
  //   url('fonts/source_sans_3/SourceSans3-Regular.ttf.woff2')
  // to resolve under `${serverBasePath}${SERVER_NOT_READY_FONTS_ROUTE}`
  server.route({
    path: `${SERVER_NOT_READY_FONTS_ROUTE}/{path*}`,
    method: 'get',
    handler: {
      directory: {
        path: path.join(__dirname, '../../../../core_app/assets/fonts'),
        redirectToSlash: false,
        index: false,
      },
    },
  });

  server.route({
    path: SERVER_NOT_READY_RESET_STYLES_ROUTE,
    method: 'get',
    handler: {
      file: path.join(__dirname, '../client/reset.css'),
    },
  });
};
