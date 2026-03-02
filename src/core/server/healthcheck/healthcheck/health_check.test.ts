/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { HealthCheck, filterListByRegex } from './health_check';
import { mockRouter } from './router.mock';

const delayPromise = (time: number) => new Promise((res) => setTimeout(res, time));

const mockCoreSetup = () => ({
  http: mockRouter,
});

const mockCoreStart = () => ({});

function mockLogger() {
  return {
    trace: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    get: () => mockLogger(),
  };
}

describe('filterListByRegex', () => {
  it.each`
    list                                                                             | filters                                            | result
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['.*']}                                          | ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['.*test.*']}                                    | ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['^test:.*']}                                    | ${['test:1', 'test:2', 'test:another']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['.*another.*']}                                 | ${['test:another', 'another-test:1', 'another-more-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['^another-test:.*']}                            | ${['another-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['^test:.*', '^another-test:.*']}                | ${['test:1', 'test:2', 'test:another', 'another-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['^(?!test:).*', '^another-test:.*']}            | ${['another-test:1', 'another-more-test:1']}
    ${['test:1', 'test:2', 'test:another', 'another-test:1', 'another-more-test:1']} | ${['^(?!test:).*', '^test:1', '^another-test:.*']} | ${['test:1', 'another-test:1', 'another-more-test:1']}
  `('filter list by regex', ({ list, filters, result }) => {
    expect(filterListByRegex(list, filters)).toEqual(result);
  });
});

describe('HealthCheck', () => {
  it('Register items', () => {
    const healthcheck = new HealthCheck(mockLogger());

    healthcheck.register({
      name: 'test:1',
      run: () => {},
    });
    healthcheck.register({
      name: 'test:2',
      run: () => {},
    });
    healthcheck.register({
      name: 'another-test:1',
      run: () => {},
    });

    expect(healthcheck.getAll()).toHaveLength(3);
  });

  it('Start initial check and set interval', async () => {
    const healthcheck = new HealthCheck(mockLogger());

    const task1 = {
      name: 'test:1',
      run: jest.fn(),
    };

    const task2 = {
      name: 'test:2',
      run: jest.fn(),
    };

    const task3 = {
      name: 'another-test:1',
      run: jest.fn(),
    };

    healthcheck.register(task1);
    healthcheck.register(task2);
    healthcheck.register(task3);

    await healthcheck.setup(mockCoreSetup(), {
      enabled: true,
      checks_enabled: '.*',
      retries_delay: moment.duration(2.5, 'seconds'),
      max_retries: 5,
      interval: moment.duration(3, 'seconds'), // Define a low value for testing
    });

    await healthcheck.start(mockCoreStart());

    expect(task1.run).toHaveBeenCalledTimes(1);
    expect(task2.run).toHaveBeenCalledTimes(1);
    expect(task3.run).toHaveBeenCalledTimes(1);

    await delayPromise(3000);

    expect(task1.run).toHaveBeenCalledTimes(2);
    expect(task2.run).toHaveBeenCalledTimes(2);
    expect(task3.run).toHaveBeenCalledTimes(2);
  });

  it('Start initial check and set interval with task filters', async () => {
    const healthcheck = new HealthCheck(mockLogger());

    const task1 = {
      name: 'test:1',
      run: jest.fn(),
    };

    const task2 = {
      name: 'test:2',
      run: jest.fn(),
    };

    const task3 = {
      name: 'another-test:1',
      run: jest.fn(),
    };

    healthcheck.register(task1);
    healthcheck.register(task2);
    healthcheck.register(task3);

    await healthcheck.setup(mockCoreSetup(), {
      enabled: true,
      checks_enabled: '^test:.*',
      retries_delay: moment.duration(2.5, 'seconds'),
      max_retries: 5,
      interval: moment.duration(3, 'seconds'), // Define a low value for testing
    });

    await healthcheck.start(mockCoreStart());

    expect(task1.run).toHaveBeenCalledTimes(1);
    expect(task2.run).toHaveBeenCalledTimes(1);
    expect(task3.run).toHaveBeenCalledTimes(0);

    await delayPromise(3000);

    expect(task1.run).toHaveBeenCalledTimes(2);
    expect(task2.run).toHaveBeenCalledTimes(2);
    expect(task3.run).toHaveBeenCalledTimes(0);
  });

  it('Start initial check and set interval with task filters no match', async () => {
    const healthcheck = new HealthCheck(mockLogger());

    const task1 = {
      name: 'test:1',
      run: jest.fn(),
    };

    const task2 = {
      name: 'test:2',
      run: jest.fn(),
    };

    const task3 = {
      name: 'another-test:1',
      run: jest.fn(),
    };

    healthcheck.register(task1);
    healthcheck.register(task2);
    healthcheck.register(task3);

    await healthcheck.setup(mockCoreSetup(), {
      enabled: true,
      checks_enabled: '^no-match-test:.*',
      retries_delay: moment.duration(2.5, 'seconds'),
      max_retries: 5,
      interval: moment.duration(3, 'seconds'), // Define a low value for testing
    });

    await healthcheck.start(mockCoreStart());

    expect(task1.run).toHaveBeenCalledTimes(0);
    expect(task2.run).toHaveBeenCalledTimes(0);
    expect(task3.run).toHaveBeenCalledTimes(0);

    await delayPromise(3000);

    expect(task1.run).toHaveBeenCalledTimes(0);
    expect(task2.run).toHaveBeenCalledTimes(0);
    expect(task3.run).toHaveBeenCalledTimes(0);
  });

  it('Start on disabled service', async () => {
    const healthcheck = new HealthCheck(mockLogger());

    const task1 = {
      name: 'test:1',
      run: jest.fn(),
    };

    const task2 = {
      name: 'test:2',
      run: jest.fn(),
    };

    const task3 = {
      name: 'another-test:1',
      run: jest.fn(),
    };

    healthcheck.register(task1);
    healthcheck.register(task2);
    healthcheck.register(task3);

    await healthcheck.setup(mockCoreSetup(), {
      enabled: false,
      checks_enabled: '.*',
      retries_delay: moment.duration(2.5, 'seconds'),
      max_retries: 5,
      interval: moment.duration(3, 'seconds'), // Define a low value for testing
    });

    await healthcheck.start(mockCoreStart());

    expect(task1.run).toHaveBeenCalledTimes(0);
    expect(task2.run).toHaveBeenCalledTimes(0);
    expect(task3.run).toHaveBeenCalledTimes(0);

    await delayPromise(3000);

    expect(task1.run).toHaveBeenCalledTimes(0);
    expect(task2.run).toHaveBeenCalledTimes(0);
    expect(task3.run).toHaveBeenCalledTimes(0);
  });

  it('Start initial check and set interval with task filters and external run for disabled task', async () => {
    const healthcheck = new HealthCheck(mockLogger());

    const task1 = {
      name: 'test:1',
      run: jest.fn(),
    };

    const task2 = {
      name: 'test:2',
      run: jest.fn(),
    };

    const task3 = {
      name: 'another-test:1',
      run: jest.fn(),
    };

    healthcheck.register(task1);
    healthcheck.register(task2);
    healthcheck.register(task3);

    await healthcheck.setup(mockCoreSetup(), {
      enabled: true,
      checks_enabled: '^test:.*',
      retries_delay: moment.duration(2.5, 'seconds'),
      max_retries: 5,
      interval: moment.duration(3, 'seconds'), // Define a low value for testing
    });

    await healthcheck.start(mockCoreStart());

    expect(task1.run).toHaveBeenCalledTimes(1);
    expect(task2.run).toHaveBeenCalledTimes(1);
    expect(task3.run).toHaveBeenCalledTimes(0);

    await delayPromise(3000);

    expect(task1.run).toHaveBeenCalledTimes(2);
    expect(task2.run).toHaveBeenCalledTimes(2);
    expect(task3.run).toHaveBeenCalledTimes(0);

    await healthcheck.runInternal(['another-test:1']);

    expect(task1.run).toHaveBeenCalledTimes(2);
    expect(task2.run).toHaveBeenCalledTimes(2);
    expect(task3.run).toHaveBeenCalledTimes(1);
  });
});
