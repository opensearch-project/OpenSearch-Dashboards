/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  registerPPLLintEventSink,
  emitPPLLintEvent,
  PPLLintEvent,
} from '../events';

const sampleEvent: PPLLintEvent = {
  type: 'diagnostic-shown',
  ruleId: 'field-validation',
  layer: 'static',
};

describe('PPL lint event sink', () => {
  afterEach(() => {
    // Clear any sink left registered by a test.
    registerPPLLintEventSink(undefined);
  });

  it('is a no-op when no sink is registered', () => {
    expect(() => emitPPLLintEvent(sampleEvent)).not.toThrow();
  });

  it('delivers events to the registered sink', () => {
    const received: PPLLintEvent[] = [];
    registerPPLLintEventSink((e) => received.push(e));

    emitPPLLintEvent(sampleEvent);

    expect(received).toEqual([sampleEvent]);
  });

  it('stops delivering after the disposer runs', () => {
    const received: PPLLintEvent[] = [];
    const dispose = registerPPLLintEventSink((e) => received.push(e));

    dispose();
    emitPPLLintEvent(sampleEvent);

    expect(received).toHaveLength(0);
  });

  it('disposer only clears the sink it installed (out-of-order teardown)', () => {
    const first: PPLLintEvent[] = [];
    const second: PPLLintEvent[] = [];
    const disposeFirst = registerPPLLintEventSink((e) => first.push(e));
    registerPPLLintEventSink((e) => second.push(e));

    // The first disposer must not remove the newer sink.
    disposeFirst();
    emitPPLLintEvent(sampleEvent);

    expect(first).toHaveLength(0);
    expect(second).toEqual([sampleEvent]);
  });

  it('swallows a throwing sink so linting is unaffected', () => {
    registerPPLLintEventSink(() => {
      throw new Error('sink blew up');
    });

    expect(() => emitPPLLintEvent(sampleEvent)).not.toThrow();
  });
});
