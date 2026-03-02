/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { HealthcheckService } from './service';
import { HealthCheckConfig } from 'src/core/common/healthcheck';
import { httpServiceMock } from '../http/http_service.mock';
import { notificationServiceMock } from '../notifications/notifications_service.mock';
import { chromeServiceMock } from '../chrome/chrome_service.mock';
import { uiSettingsServiceMock } from '../ui_settings/ui_settings_service.mock';

const initialChecks = [
  { name: 'task:1', result: 'green', status: 'finished' },
  { name: 'task:2', result: 'green', status: 'finished' },
];
const runChecks = [{ name: 'task:2', result: 'red', status: 'finished' }];
const mergedChecks = [
  { name: 'task:1', result: 'green', status: 'finished' },
  { name: 'task:2', result: 'red', status: 'finished' },
];

describe('HealthcheckService', () => {
  it('ensure mount is called on start', async () => {
    const service = new HealthcheckService();

    const core = {
      http: httpServiceMock.createStartContract(),
      notifications: notificationServiceMock.createStartContract(),
      chrome: chromeServiceMock.createStartContract(),
      uiSettings: uiSettingsServiceMock.createStartContract(),
      healthCheckConfig: {} as HealthCheckConfig,
    };

    service.start(core);
  });

  // Disabled because the run checks is not allowed
  it.skip('fetch-run', async () => {
    const service = new HealthcheckService();

    const core = {
      http: httpServiceMock.createStartContract(),
      notifications: notificationServiceMock.createStartContract(),
      chrome: chromeServiceMock.createStartContract(),
      uiSettings: uiSettingsServiceMock.createStartContract(),
      healthCheckConfig: {} as HealthCheckConfig,
    };

    const start = service.start(core);

    const responseFetch = await start.client.internal.fetch();
    expect(responseFetch.checks).toEqual(initialChecks);

    expect((await start.status$.pipe(first()).toPromise()).checks).toEqual(initialChecks);

    const responseRun = await start.client.internal.run();
    expect(responseRun.checks).toEqual(runChecks);

    expect((await start.status$.pipe(first()).toPromise()).checks).toEqual(mergedChecks);

    const responseFetch2 = await start.client.internal.fetch();
    expect(responseFetch2.checks).toEqual(initialChecks);
  });

  it.each`
    checks                                                                                                                                | status
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished' }]}                 | ${'green'}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished' }]}                   | ${'yellow'}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }]} | ${'green'}
    ${[{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }]}   | ${'yellow'}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }]}   | ${'red'}
    ${[{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }]}     | ${'red'}
  `('compute status overall', async ({ checks, status }) => {
    const service = new HealthcheckService();

    expect(service.computeOverallStatus(checks)).toBe(status);
  });

  it.each`
    checks                                                                                                                                | result
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished' }]}                 | ${{ status: 'green', checks: [{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished' }] }}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished' }]}                   | ${{ status: 'yellow', checks: [{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished' }] }}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }]} | ${{ status: 'green', checks: [{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }] }}
    ${[{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }]}   | ${{ status: 'yellow', checks: [{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'green', status: 'finished', critical: true }] }}
    ${[{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }]}   | ${{ status: 'red', checks: [{ name: 'task:1', result: 'green', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }] }}
    ${[{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }]}     | ${{ status: 'red', checks: [{ name: 'task:1', result: 'red', status: 'finished' }, { name: 'task:2', result: 'red', status: 'finished', critical: true }] }}
  `('generateNextState', async ({ checks, result }) => {
    const service = new HealthcheckService();

    expect(service.generateNextState({ checks })).toEqual(result);
  });
});
