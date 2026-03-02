/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { dashboardServerIsNotReadyYet } from './index';
import {
  SERVER_NOT_READY_RESET_STYLES_ROUTE,
  SERVER_NOT_READY_SCRIPT_ROUTE,
  SERVER_NOT_READY_STYLES_ROUTE,
} from './server';

describe('dashboardServerIsNotReadyYet (HTML renderer)', () => {
  it('renders expected markup with provided props and basePath', () => {
    const props = {
      appName: 'My App',
      documentationTroubleshootingLink: 'https://example.com/help',
      serverBasePath: '/base',
    };

    const html = dashboardServerIsNotReadyYet(props);

    // Title
    expect(html).toContain(`<title>${props.appName}</title>`);

    // Links to styles with base path
    expect(html).toContain(`${props.serverBasePath}${SERVER_NOT_READY_RESET_STYLES_ROUTE}`);
    expect(html).toContain(`${props.serverBasePath}${SERVER_NOT_READY_STYLES_ROUTE}`);

    // Root container and script include
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain(`${props.serverBasePath}${SERVER_NOT_READY_SCRIPT_ROUTE}`);

    // Injected config
    expect(html).toContain('window.__CONFIG');
    expect(html).toContain(`"appName":"${props.appName}"`);
    expect(html).toContain(`"serverBasePath":"${props.serverBasePath}"`);
    expect(html).toContain(props.documentationTroubleshootingLink);
  });
});
