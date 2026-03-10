/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';

// OSD components use data-test-subj instead of data-testid
configure({ testIdAttribute: 'data-test-subj' });

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver =
  global.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

afterEach(() => {
  cleanup();
});

// @xyflow/react mock and exported mock refs
export const mockFitView = jest.fn();
export const mockUseReactFlow = jest.fn(() => ({
  fitView: mockFitView,
}));

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
