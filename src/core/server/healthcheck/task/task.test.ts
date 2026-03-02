/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './task';

describe('Task', () => {
  it('create task and ensure this has the expected fields in the info', async () => {
    const task = new Task({
      name: 'test',
      run: () => {},
      critical: false,
    });

    const info = task.getInfo();

    expect(info.critical).toBe(false);
    expect(info.createdAt).toBeDefined();
    expect(info.data).toBe(null);
    expect(info.duration).toBe(null);
    expect(info.error).toBe(null);
    expect(info.finishedAt).toBe(null);
    expect(info.name).toBe('test');
    expect(info.status).toBe('not_started');
    expect(info.result).toBe('gray');
    expect(info.startedAt).toBe(null);
  });

  it('run task', async () => {
    const taskDefinition = {
      name: 'test',
      run: jest.fn(() => 'result:ok'),
      critical: false,
    };
    const task = new Task(taskDefinition);

    const infoRun = await task.run();

    expect(infoRun.critical).toBe(false);
    expect(infoRun.createdAt).toBeDefined();
    expect(infoRun.data).toBe('result:ok');
    expect(infoRun.duration).toBeDefined();
    expect(infoRun.error).toBe(null);
    expect(infoRun.finishedAt).toBeDefined();
    expect(infoRun.name).toBe('test');
    expect(infoRun.status).toBe('finished');
    expect(infoRun.result).toBe('green');
    expect(infoRun.startedAt).toBeDefined();

    expect(taskDefinition.run).toHaveBeenCalledTimes(1);

    const info = task.getInfo();

    expect(infoRun.critical).toBe(false);
    expect(info.createdAt).toBeDefined();
    expect(info.data).toBe('result:ok');
    expect(info.duration).toBeDefined();
    expect(info.error).toBe(null);
    expect(info.finishedAt).toBeDefined();
    expect(info.name).toBe('test');
    expect(info.status).toBe('finished');
    expect(info.result).toBe('green');
    expect(info.startedAt).toBeDefined();
  });

  it('run task with warning', async () => {
    const taskDefinition = {
      name: 'test',
      run: jest.fn(() => {
        throw new Error('test:warning');
      }),
      critical: false,
    };
    const task = new Task(taskDefinition);

    await expect(async () => await task.run()).rejects.toThrowError('test:warning');

    expect(taskDefinition.run).toHaveBeenCalledTimes(1);

    const info = task.getInfo();

    expect(info.critical).toBe(false);
    expect(info.createdAt).toBeDefined();
    expect(info.data).toBe(null);
    expect(info.duration).toBeDefined();
    expect(info.error).toBe('test:warning');
    expect(info.finishedAt).toBeDefined();
    expect(info.name).toBe('test');
    expect(info.status).toBe('finished');
    expect(info.result).toBe('yellow');
    expect(info.startedAt).toBeDefined();
  });

  it('run task with error', async () => {
    const taskDefinition = {
      name: 'test',
      run: jest.fn(() => {
        throw new Error('test:error');
      }),
      critical: true,
    };
    const task = new Task(taskDefinition);

    await expect(async () => await task.run()).rejects.toThrowError('test:error');

    expect(taskDefinition.run).toHaveBeenCalledTimes(1);

    const info = task.getInfo();

    expect(info.critical).toBe(true);
    expect(info.createdAt).toBeDefined();
    expect(info.data).toBe(null);
    expect(info.duration).toBeDefined();
    expect(info.error).toBe('test:error');
    expect(info.finishedAt).toBeDefined();
    expect(info.name).toBe('test');
    expect(info.status).toBe('finished');
    expect(info.result).toBe('red');
    expect(info.startedAt).toBeDefined();
  });
});
