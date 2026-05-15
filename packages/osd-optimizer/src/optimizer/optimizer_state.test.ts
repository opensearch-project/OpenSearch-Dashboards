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

  describe('watch-mode rebuild', () => {
    it('reaches success again after a changes event triggers rebuild', () => {
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

      // File change detected — only bundles A and B are affected
      state = assertDefined(summarize(state, { type: 'changes detected' }, injectEvent));
      expect(state.phase).toBe('reallocating');

      state = assertDefined(
        summarize(state, { type: 'changes', bundles: [BUNDLE_A, BUNDLE_B] }, injectEvent)
      );
      expect(state.phase).toBe('running');

      // onlineBundles should NOT grow beyond 3 (deduped)
      expect(state.onlineBundles).toHaveLength(3);

      // Rebuild completes for affected bundles
      state = assertDefined(
        summarize(state, { type: 'compiler success', bundleId: 'a', moduleCount: 11 }, injectEvent)
      );
      state = assertDefined(
        summarize(state, { type: 'compiler success', bundleId: 'b', moduleCount: 11 }, injectEvent)
      );

      // Should reach success — all 3 bundles have reported (c from prior build, a+b from rebuild)
      expect(state.phase).toBe('success');
    });

    it('does not grow onlineBundles on repeated changes events', () => {
      let state = assertDefined(
        summarize(INITIAL_STATE, { type: 'optimizer initialized' }, injectEvent)
      );

      // Initial build
      state = assertDefined(
        summarize(state, { type: 'compiler success', bundleId: 'a', moduleCount: 10 }, injectEvent)
      );
      state = assertDefined(
        summarize(state, { type: 'compiler success', bundleId: 'b', moduleCount: 10 }, injectEvent)
      );
      state = assertDefined(
        summarize(state, { type: 'compiler success', bundleId: 'c', moduleCount: 10 }, injectEvent)
      );

      // Multiple rebuild cycles
      for (let i = 0; i < 5; i++) {
        state = assertDefined(
          summarize(state, { type: 'changes', bundles: [BUNDLE_A, BUNDLE_B] }, injectEvent)
        );
        expect(state.onlineBundles).toHaveLength(3);

        state = assertDefined(
          summarize(
            state,
            { type: 'compiler success', bundleId: 'a', moduleCount: 10 },
            injectEvent
          )
        );
        state = assertDefined(
          summarize(
            state,
            { type: 'compiler success', bundleId: 'b', moduleCount: 10 },
            injectEvent
          )
        );
        expect(state.phase).toBe('success');
      }
    });
  });
});
