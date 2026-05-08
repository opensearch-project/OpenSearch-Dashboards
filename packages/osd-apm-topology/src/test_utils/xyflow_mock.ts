/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared @xyflow/react mock for tests.
 *
 * Usage in test files:
 *   jest.mock('@xyflow/react', () => require('../../test_utils/xyflow_mock'));
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react');

const Position = { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' };
const MarkerType = { Arrow: 'arrow', ArrowClosed: 'arrowclosed' };

module.exports = {
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
  useReactFlow: jest.fn(() => ({
    fitView: jest.fn(),
  })),
  ReactFlowProvider: ({ children }: any) => children,
  useNodesState: (initial: any) => [initial, jest.fn(), jest.fn()],
  useEdgesState: (initial: any) => [initial, jest.fn(), jest.fn()],
};
