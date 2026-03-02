/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import {
  SERVER_NOT_READY_RESET_STYLES_ROUTE,
  SERVER_NOT_READY_SCRIPT_ROUTE,
  SERVER_NOT_READY_STYLES_ROUTE,
} from './constants';
import { configureDashboardServerIsNotReadyRoutes } from './route';

describe('configureDashboardServerIsNotReadyRoutes', () => {
  it('registers static asset routes for script and styles', () => {
    const server = { route: jest.fn() } as any;

    // Provide required options as per current route signature
    configureDashboardServerIsNotReadyRoutes(server, {
      getTroubleshootingLink: () => 'https://example.healthcheck-docs.com',
      serverBasePath: '',
    });

    // One catch-all HTML route + three static asset routes
    // Wazuh: update expected route count to 5 to account for new reset styles route
    expect(server.route).toHaveBeenCalledTimes(5);

    const calls = server.route.mock.calls.map((c: any[]) => c[0]);

    const scriptRoute = calls.find((c: any) => c.path === SERVER_NOT_READY_SCRIPT_ROUTE);
    const stylesRoute = calls.find((c: any) => c.path === SERVER_NOT_READY_STYLES_ROUTE);
    const resetStylesRoute = calls.find((c: any) => c.path === SERVER_NOT_READY_RESET_STYLES_ROUTE);

    expect(scriptRoute).toBeDefined();
    expect(stylesRoute).toBeDefined();
    expect(resetStylesRoute).toBeDefined();

    expect(scriptRoute).toEqual(
      expect.objectContaining({ method: 'get', handler: expect.any(Object) })
    );
    expect(stylesRoute).toEqual(
      expect.objectContaining({ method: 'get', handler: expect.any(Object) })
    );
    expect(resetStylesRoute).toEqual(
      expect.objectContaining({ method: 'get', handler: expect.any(Object) })
    );

    // Ensure the file handlers point to the client assets
    expect(scriptRoute.handler.file).toEqual(
      expect.stringContaining(`${path.sep}client${path.sep}script.js`)
    );
    expect(stylesRoute.handler.file).toEqual(
      expect.stringContaining(`${path.sep}client${path.sep}styles.css`)
    );
    expect(resetStylesRoute.handler.file).toEqual(
      expect.stringContaining(`${path.sep}client${path.sep}reset.css`)
    );
  });
});
