/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutControls } from './layout_controls';
// Mock the hook
const mockOnLayoutChange = jest.fn();
const mockOnExpandAll = jest.fn();

jest.mock('./use_layout_controls.hook', () => ({
  useLayoutControls: () => ({
    onLayoutChange: mockOnLayoutChange,
    onExpandAll: mockOnExpandAll,
  }),
}));

// Mock the translation function
jest.mock('../../shared/i18n/t', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'controls.layout': 'Layout',
      'controls.expandAll': 'Expand All',
    };
    return translations[key] || key;
  },
}));

// Mock the icons
jest.mock('../../shared/resources', () => ({
  LayoutIcon: ({ className }: { className?: string }) => (
    <div data-test-subj="layout-icon" className={className}>
      Layout Icon
    </div>
  ),
  ExpandAllIcon: ({ className }: { className?: string }) => (
    <div data-test-subj="expand-all-icon" className={className}>
      Expand All Icon
    </div>
  ),
}));

describe('LayoutControls', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both control buttons', () => {
    render(<LayoutControls />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    expect(screen.getByRole('button', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
  });

  it('should call onLayoutChange when layout button is clicked', async () => {
    render(<LayoutControls />);
    const layoutButton = screen.getByRole('button', { name: 'Layout' });
    await user.click(layoutButton);
    expect(mockOnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('should call onExpandAll when expand all button is clicked', async () => {
    render(<LayoutControls />);

    const expandButton = screen.getByRole('button', { name: 'Expand All' });
    await user.click(expandButton);

    expect(mockOnExpandAll).toHaveBeenCalledTimes(1);
  });
});
