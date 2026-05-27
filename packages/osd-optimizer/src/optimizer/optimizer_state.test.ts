/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bundle, EventInjector } from '../common';

import { createOptimizerStateSummarizer, OptimizerEvent, OptimizerState } from './optimizer_state';
import { OptimizerConfig } from './optimizer_config';

const makeBundle = (id: string) =>
  new Bundle({
    type: 'plugin',
    id,
    contextDir: `/repo/plugins/${id}/public`,
    publicDirNames: ['public'],
    outputDir: `/repo/plugins/${id}/target/public`,
    sourceRoot: `/repo`,
  });

const BUNDLE_A = makeBundle('a');
const BUNDLE_B = makeBundle('b');
const BUNDLE_C = makeBundle('c');

const mockConfig = ({
  bundles: [BUNDLE_A, BUNDLE_B, BUNDLE_C],
} as unknown) as OptimizerConfig;

const INITIAL_STATE: OptimizerState = {
  phase: 'initializing',
  startTime: Date.now(),
  durSec: 0,
  compilerStates: [],
  onlineBundles: [],
  offlineBundles: [],
};

/**
 * Wrapper that asserts the summarizer returned a defined state.
 * Avoids non-null assertions throughout the tests.
 */
function assertDefined(state: OptimizerState | undefined): OptimizerState {
  if (state === undefined) {
    throw new Error('Expected summarizer to return a state, got undefined');
  }
  return state;
}

describe('createOptimizerStateSummarizer', () => {
  let summarize: ReturnType<typeof createOptimizerStateSummarizer>;
  const injectEvent: EventInjector<OptimizerEvent> = jest.fn();

  beforeEach(() => {
    summarize = createOptimizerStateSummarizer(mockConfig);
  });

  it('initializes with all bundles online', () => {
    const state = assertDefined(
      summarize(INITIAL_STATE, { type: 'optimizer initialized' }, injectEvent)
    );
    expect(state.phase).toBe('initialized');
    expect(state.onlineBundles).toHaveLength(3);
    expect(state.offlineBundles).toHaveLength(0);
  });

  it('reaches success when all online bundles report compiler success', () => {
    let state = assertDefined(
      summarize(INITIAL_STATE, { type: 'optimizer initialized' }, injectEvent)
    );

    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'a', moduleCount: 10 }, injectEvent)
    );
    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'b', moduleCount: 10 }, injectEvent)
    );
    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'c', moduleCount: 10 }, injectEvent)
    );

    expect(state.phase).toBe('success');
  });

  it('transitions to running on compiler events after success', () => {
    let state = assertDefined(
      summarize(INITIAL_STATE, { type: 'optimizer initialized' }, injectEvent)
    );

    // Initial build succeeds
    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'a', moduleCount: 10 }, injectEvent)
    );
    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'b', moduleCount: 10 }, injectEvent)
    );
    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'c', moduleCount: 10 }, injectEvent)
    );
    expect(state.phase).toBe('success');

    state = assertDefined(summarize(state, { type: 'running', bundleId: 'a' }, injectEvent));
    expect(state.phase).toBe('running');

    state = assertDefined(
      summarize(state, { type: 'compiler success', bundleId: 'a', moduleCount: 11 }, injectEvent)
    );
    expect(state.phase).toBe('success');
  });
});
