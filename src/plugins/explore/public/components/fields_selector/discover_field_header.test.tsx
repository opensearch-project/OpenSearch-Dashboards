/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverFieldHeader } from './discover_field_header';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

const mockUseKeyboardShortcut = jest.fn();

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      keyboardShortcut: {
        useKeyboardShortcut: mockUseKeyboardShortcut,
        register: jest.fn(),
        unregister: jest.fn(),
        getAllShortcuts: jest.fn(),
      },
    },
  }),
}));

describe('DiscoverFieldHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders fields header', () => {
    render(<DiscoverFieldHeader />);
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('calls onCollapse when button clicked', () => {
    const onCollapse = jest.fn();
    render(<DiscoverFieldHeader onCollapse={onCollapse} />);

    fireEvent.click(screen.getByTestId('fieldList-collapse-button'));
    expect(onCollapse).toHaveBeenCalled();
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('registers keyboard shortcut correctly', () => {
      const onCollapse = jest.fn();
      render(<DiscoverFieldHeader onCollapse={onCollapse} />);

      expect(mockUseKeyboardShortcut).toHaveBeenCalledTimes(1);
      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'ToggleFieldsPanel',
        pluginId: 'explore',
        name: 'Toggle fields panel',
        category: 'Panel / layout',
        keys: 'shift+f',
        execute: expect.any(Function),
      });
    });

    it('keyboard shortcut calls onCollapse when executed', () => {
      const onCollapse = jest.fn();
      render(<DiscoverFieldHeader onCollapse={onCollapse} />);

      const shortcutCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'ToggleFieldsPanel'
      );
      expect(shortcutCall).toBeDefined();

      const executeFunction = shortcutCall[0].execute;

      executeFunction();
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('keyboard shortcut execute function is the same as button click handler', () => {
      const onCollapse = jest.fn();
      render(<DiscoverFieldHeader onCollapse={onCollapse} />);

      const button = screen.getByTestId('fieldList-collapse-button');
      const shortcutCall = mockUseKeyboardShortcut.mock.calls[0];
      const executeFunction = shortcutCall[0].execute;

      fireEvent.click(button);
      expect(onCollapse).toHaveBeenCalledTimes(1);

      executeFunction();
      expect(onCollapse).toHaveBeenCalledTimes(2);

      expect(onCollapse).toHaveBeenCalledTimes(2);
    });

    it('keyboard shortcut works when onCollapse is not provided', () => {
      render(<DiscoverFieldHeader />);

      const shortcutCall = mockUseKeyboardShortcut.mock.calls[0];
      const executeFunction = shortcutCall[0].execute;

      expect(() => executeFunction()).not.toThrow();
    });

    it('keyboard shortcut works independently of button clicks', () => {
      const onCollapse = jest.fn();
      render(<DiscoverFieldHeader onCollapse={onCollapse} />);

      const shortcutCall = mockUseKeyboardShortcut.mock.calls[0];
      const executeFunction = shortcutCall[0].execute;

      executeFunction();
      expect(onCollapse).toHaveBeenCalledTimes(1);

      executeFunction();
      expect(onCollapse).toHaveBeenCalledTimes(2);

      executeFunction();
      expect(onCollapse).toHaveBeenCalledTimes(3);
    });

    it('registers shortcut even when onCollapse is not provided', () => {
      render(<DiscoverFieldHeader />);

      expect(mockUseKeyboardShortcut).toHaveBeenCalledTimes(1);
      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'ToggleFieldsPanel',
        pluginId: 'explore',
        name: 'Toggle fields panel',
        category: 'Panel / layout',
        keys: 'shift+f',
        execute: expect.any(Function),
      });
    });
  });
});
