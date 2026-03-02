/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

export const healthCheckConfig = {
  enabled: true,
  checks_enabled: '.*',
  retries_delay: 2500,
  interval: 15 * 60 * 1000,
  server_not_ready_troubleshooting_link: 'https://example.healthcheck-docs.com',
  max_retries: 5,
};
