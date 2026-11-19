/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { hasStatsPipe, isVisualizationTabTarget } from './has_stats_pipe';

describe('has_stats_pipe', () => {
  it.each([
    ['source = spans | stats count() by name', true],
    ['source = spans |STATS avg(durationInNanos) ', true],
    ['source = spans | where status = "error"', false],
    ['', false],
  ])('%p targets Visualization: %p', (query, expected) => {
    expect(hasStatsPipe(query)).toBe(expected);
    expect(isVisualizationTabTarget(query)).toBe(expected);
  });
});
