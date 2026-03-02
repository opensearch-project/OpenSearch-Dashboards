/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScheduledIntervalTask } from './scheduled_task';

const delayPromise = (time: number) => new Promise((res) => setTimeout(res, time));

describe('ScheduledIntervalTask', () => {
  it('create task and start', async () => {
    const fn = jest.fn(() => {});
    const task = new ScheduledIntervalTask(fn, 1000);

    task.start();

    await delayPromise(1500);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('create task, start, and cancel after a time', async () => {
    const fn = jest.fn(() => {});
    const task = new ScheduledIntervalTask(fn, 500);

    task.start();

    await delayPromise(3200);

    expect(fn).toHaveBeenCalledTimes(6);
    task.stop();

    await delayPromise(1000);
    expect(fn).toHaveBeenCalledTimes(6);
  });
});
