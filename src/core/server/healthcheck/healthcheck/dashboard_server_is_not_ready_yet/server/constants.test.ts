/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SERVER_NOT_READY_RESET_STYLES_ROUTE,
  SERVER_NOT_READY_SCRIPT_ROUTE,
  SERVER_NOT_READY_STYLES_ROUTE,
} from './constants';

describe('Not ready server constants', () => {
  it('expose the expected public routes', () => {
    expect(SERVER_NOT_READY_SCRIPT_ROUTE).toBe('/healthcheck/public/server_not_ready/script');
    expect(SERVER_NOT_READY_STYLES_ROUTE).toBe('/healthcheck/public/server_not_ready/styles');
    expect(SERVER_NOT_READY_RESET_STYLES_ROUTE).toBe(
      '/healthcheck/public/server_not_ready/reset-styles'
    );
  });
});
