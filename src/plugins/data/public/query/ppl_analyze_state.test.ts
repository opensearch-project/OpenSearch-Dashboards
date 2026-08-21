/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getPPLAnalyzeResult$,
  getPPLAnalyzeLoading$,
  setPPLAnalyzeResult,
  setPPLAnalyzeLoading,
  clearPPLAnalyzeResult,
} from './ppl_analyze_state';

const sampleResult = {
  query: 'source=accounts',
  response: { profile: { summary: { total_time_ms: 5 } } },
};

describe('ppl_analyze_state', () => {
  afterEach(() => {
    // Reset the module-level singletons so tests don't leak into each other.
    clearPPLAnalyzeResult();
  });

  it('clearPPLAnalyzeResult resets the stored result to null', () => {
    setPPLAnalyzeResult(sampleResult);
    expect(getPPLAnalyzeResult$().getValue()).toEqual(sampleResult);

    clearPPLAnalyzeResult();
    expect(getPPLAnalyzeResult$().getValue()).toBeNull();
  });

  it('clearPPLAnalyzeResult also turns off loading', () => {
    setPPLAnalyzeLoading(true);
    expect(getPPLAnalyzeLoading$().getValue()).toBe(true);

    clearPPLAnalyzeResult();
    expect(getPPLAnalyzeLoading$().getValue()).toBe(false);
  });

  it('setPPLAnalyzeResult clears loading when a result arrives', () => {
    setPPLAnalyzeLoading(true);
    setPPLAnalyzeResult(sampleResult);
    expect(getPPLAnalyzeLoading$().getValue()).toBe(false);
  });
});
