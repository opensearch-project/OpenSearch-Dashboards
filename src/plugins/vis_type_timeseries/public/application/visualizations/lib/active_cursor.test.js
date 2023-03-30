/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { EventBus } = require('./active_cursor');

describe('EventBus', () => {
  let eventBus;
  let listener;

  beforeEach(() => {
    eventBus = new EventBus();

    listener = jest.fn((eventDetail) => eventDetail);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('on() should add a listener', () => {
    eventBus.on('testEvent', listener);

    eventBus.trigger('testEvent', true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(true);
  });

  test('off() should remove a listener', () => {
    eventBus.on('testEvent', listener);
    eventBus.off('testEvent', listener);

    eventBus.trigger('testEvent', true);

    expect(listener).toHaveBeenCalledTimes(0);
  });

  test('trigger() should emit an event with detail', () => {
    eventBus.on('testEvent', listener);

    eventBus.trigger('testEvent', { message: 'test' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ message: 'test' });
  });
});
