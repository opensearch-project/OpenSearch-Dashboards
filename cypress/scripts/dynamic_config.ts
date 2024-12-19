/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { setTimeout } from 'timers/promises';
import fetch from 'node-fetch';

const CONNECTION_TIMEOUT = 15000;
const CONNECTION_TIMEOUT_TOTAL = 60000;
const CONNECTION_RETRY_INTERVAL = 15000;

/**
 * Check if the security plugin is enabled on Dashboards and set env.SECURITY_ENABLED accordingly.
 * Turn on test isolation when security is disabled, and off when security is enabled so we don't
 * have to log in for each test.
 */
const checkSecurity = async (config: Cypress.PluginConfigOptions) => {
  const startTime = Date.now();
  do {
    // Not catching to allow Cypress to fail
    const resp = await fetch(config.baseUrl, { timeout: CONNECTION_TIMEOUT });

    if (resp.status === 200) {
      console.log('OpenSearch Dashboards is configured without security.');
      config.env.SECURITY_ENABLED = false;

      console.log('Test isolation is turned on.');
      config.testIsolation = true;

      return;
    }

    if (resp.status === 401) {
      console.log('OpenSearch Dashboards is configured with security.');
      config.env.SECURITY_ENABLED = true;

      console.log('Test isolation is turned off.');
      config.testIsolation = false;

      return;
    }

    console.log('Waiting for OpenSearch Dashboards to be ready...');
    await setTimeout(CONNECTION_RETRY_INTERVAL);
  } while (Date.now() - startTime < CONNECTION_TIMEOUT_TOTAL);

  throw new Error(
    'Security plugin status check failed: OpenSearch Dashboards unreachable or misconfigured.'
  );
};

const checkPlugins = async (config: Cypress.PluginConfigOptions) => {
  const startTime = Date.now();
  const apiStatusUrl = new URL('/api/status', config.baseUrl);
  const headers: fetch.HeadersInit = {};

  if (config.env.SECURITY_ENABLED) {
    headers.Authorization =
      'Basic ' + Buffer.from(config.env.username + ':' + config.env.password).toString('base64');
  }

  do {
    // Not catching to allow Cypress to fail
    const resp = await fetch(apiStatusUrl, { timeout: CONNECTION_TIMEOUT, headers });
    if (resp.status === 200) {
      const json = await resp.json();

      if (!Array.isArray(json?.status?.statuses))
        throw new Error(
          'Invalid OpenSearch Dashboards status response: OpenSearch Dashboards unreachable or misconfigured.'
        );

      json.status.statuses.forEach?.(({ id }: { id: string }) => {
        if (!id.startsWith('plugin:')) return;
        const envName = id
          .replace(/^plugin:(.+?)(Dashboards)*@.*$/, '$1')
          .replace(/([A-Z])/g, '_$1')
          .toUpperCase();
        config.env[`${envName}_ENABLED`] = true;
      });

      return;
    }

    console.log('Waiting for OpenSearch Dashboards to be ready...');
    await setTimeout(CONNECTION_RETRY_INTERVAL);
  } while (Date.now() - startTime < CONNECTION_TIMEOUT_TOTAL);

  throw new Error(
    'Plugins status check failed: OpenSearch Dashboards unreachable or misconfigured.'
  );
};

export const setupDynamicConfig = async (config: Cypress.PluginConfigOptions) => {
  await checkSecurity(config);
  await checkPlugins(config);
};
