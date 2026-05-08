/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createCursorBus } from './cursor_context';

describe('createCursorBus', () => {
  it('publishes state to subscribers', () => {
    const bus = createCursorBus();
    const cb = jest.fn();
    bus.subscribe(cb);
    bus.publish({ idx: 5, yRatio: 0.5 });
    expect(cb).toHaveBeenCalledWith({ idx: 5, yRatio: 0.5 });
  });

  it('publishes null to subscribers', () => {
    const bus = createCursorBus();
    const cb = jest.fn();
    bus.subscribe(cb);
    bus.publish(null);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('supports multiple subscribers', () => {
    const bus = createCursorBus();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    bus.subscribe(cb1);
    bus.subscribe(cb2);
    bus.publish({ idx: 1, yRatio: 0.1 });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes correctly', () => {
    const bus = createCursorBus();
    const cb = jest.fn();
    const unsub = bus.subscribe(cb);
    unsub();
    bus.publish({ idx: 0, yRatio: 0 });
    expect(cb).not.toHaveBeenCalled();
  });
});
