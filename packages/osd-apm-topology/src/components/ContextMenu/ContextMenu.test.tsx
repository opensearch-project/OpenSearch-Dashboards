/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '../../test-utils/vitest.utilities';
import ContextMenu from './ContextMenu';

// Ensure React is available globally for source files using automatic JSX transform
(global as any).React = React;

const mockOnExpandChildren = jest.fn();
const mockOnCollapseDescendants = jest.fn();
const mockHasOutgoingEdges = jest.fn();

jest.mock('../../shared/hooks/use-node-relationships.hook', () => ({
  useNodeRelationships: () => ({
    hasOutgoingEdges: mockHasOutgoingEdges,
  }),
  Visibility: { Hidden: 'hidden', Visible: 'visible' },
}));

jest.mock('../../shared/hooks/use-on-click-outside.hook', () => ({
  useOnClickOutside: jest.fn(),
}));

jest.mock('./use-context-menu-actions.hook', () => ({
  useContextMenuActions: () => ({
    onExpandChildren: mockOnExpandChildren,
    onCollapseDescendants: mockOnCollapseDescendants,
  }),
}));

describe('ContextMenu', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasOutgoingEdges.mockReturnValue(false);
  });

  it('renders "Expand dependencies" menu item', () => {
    render(<ContextMenu nodeId="node-1" onClose={onClose} />);
    expect(screen.getByText('Expand dependencies')).toBeTruthy();
  });

  it('renders "Collapse dependencies" menu item', () => {
    render(<ContextMenu nodeId="node-1" onClose={onClose} />);
    expect(screen.getByText('Collapse dependencies')).toBeTruthy();
  });

  it('disables "Expand dependencies" when no hidden outgoing edges', () => {
    mockHasOutgoingEdges.mockImplementation((_nodeId: string, visibility: string) => {
      if (visibility === 'hidden') return false;
      return false;
    });
    render(<ContextMenu nodeId="node-1" onClose={onClose} />);
    const expandButton = screen.getByText('Expand dependencies').closest('button');
    expect(expandButton?.disabled).toBe(true);
  });

  it('enables "Expand dependencies" when hidden outgoing edges exist', () => {
    mockHasOutgoingEdges.mockImplementation((_nodeId: string, visibility: string) => {
      if (visibility === 'hidden') return true;
      return false;
    });
    render(<ContextMenu nodeId="node-1" onClose={onClose} />);
    const expandButton = screen.getByText('Expand dependencies').closest('button');
    expect(expandButton?.disabled).toBe(false);
  });
});
