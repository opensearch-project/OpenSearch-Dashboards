/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test utilities barrel file.
 * Re-exports @testing-library/react and provides Jest-compatible aliases.
 */

export * from '@testing-library/react';

// Alias Jest's `jest` as `vi` for vitest-style test code
const vi = jest;
export { vi };

// Re-export Jest globals for backward compat
const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  test,
} = globalThis as any;
export { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, test };

// Type alias
export type Mock = jest.Mock;

const mockFitView = jest.fn();
const mockUseReactFlow = jest.fn(() => ({
  fitView: mockFitView,
}));

// Export the mocks so they can be accessed in tests
export { mockFitView, mockUseReactFlow };

jest.mock('@xyflow/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const Position = { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' };
  const MarkerType = { Arrow: 'arrow', ArrowClosed: 'arrowclosed' };
  return {
    Position,
    MarkerType,
    Handle: ({ type, position, id, ...rest }: any) =>
      React.createElement('div', {
        'data-test-subj': `handle-${type}-${position}`,
        'data-handleid': id,
        'data-handletype': type,
        'data-handlepos': position,
        ...rest,
      }),
    BezierEdge: (props: any) =>
      React.createElement('path', {
        'data-test-subj': 'bezier-edge',
        style: props.style,
        ...(props.label ? { 'data-label': props.label } : {}),
      }),
    useReactFlow: () => mockUseReactFlow(),
    ReactFlowProvider: ({ children }: any) => children,
    useNodesState: (initial: any) => [initial, jest.fn(), jest.fn()],
    useEdgesState: (initial: any) => [initial, jest.fn(), jest.fn()],
  };
});
