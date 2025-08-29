/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { KeyboardShortcutHelp } from './keyboard_shortcut_help';
import { ShortcutDefinition } from './types';

jest.mock('./key_parser', () => ({
  KeyStringParser: jest.fn().mockImplementation(() => ({
    getDisplayString: jest.fn((keys: string) => {
      if (keys === 'cmd+shift+a') {
        return 'Ctrl+Shift+A';
      }
      if (keys === 'shift+/') {
        return 'Shift+/';
      }
      if (keys === 'cmd+s') {
        return 'Ctrl+S';
      }
      if (keys === 'cmd+c') {
        return 'Ctrl+C';
      }
      if (keys === 'cmd+f') {
        return 'Ctrl+F';
      }
      return keys;
    }),
  })),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    {children}
  </IntlProvider>
);

describe('KeyboardShortcutHelp', () => {
  const mockShortcuts: ShortcutDefinition[] = [
    {
      id: 'save',
      pluginId: 'core',
      name: 'Save',
      category: 'editing',
      keys: 'cmd+s',
      execute: jest.fn(),
    },
    {
      id: 'copy',
      pluginId: 'core',
      name: 'Copy',
      category: 'editing',
      keys: 'cmd+c',
      execute: jest.fn(),
    },
    {
      id: 'help',
      pluginId: 'core',
      name: 'Show Help',
      category: 'navigation',
      keys: 'shift+/',
      execute: jest.fn(),
    },
    {
      id: 'search',
      pluginId: 'core',
      name: 'Search',
      category: 'navigation',
      keys: 'cmd+f',
      execute: jest.fn(),
    },
  ];

  const mockKeyboardShortcutService = {
    getAllShortcuts: jest.fn(() => mockShortcuts),
    register: jest.fn(),
    unregister: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Component Rendering', () => {
    it('renders trigger element when provided', () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: 'Open Help' })).toBeInTheDocument();
    });

    it('does not render modal initially', () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('keyboardShortcutsModal')).not.toBeInTheDocument();
    });

    it('renders modal when trigger is clicked', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });
    });

    it('renders modal title correctly', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('closes modal when close button is clicked', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));
      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('keyboardShortcutsCloseButton'));
      await waitFor(() => {
        expect(screen.queryByTestId('keyboardShortcutsModal')).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking outside', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));
      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId('keyboardShortcutsModal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Service Integration', () => {
    it('handles service unavailable gracefully', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp trigger={trigger} keyboardShortcutService={undefined} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });
    });

    it('handles service errors gracefully', async () => {
      const errorService = {
        getAllShortcuts: jest.fn(() => {
          throw new Error('Service error');
        }),
        register: jest.fn(),
        unregister: jest.fn(),
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp trigger={trigger} keyboardShortcutService={errorService} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('registers help shortcut on mount', () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith({
        id: 'show_help',
        pluginId: 'core',
        name: 'Show this help',
        category: 'navigation',
        keys: 'shift+/',
        execute: expect.any(Function),
      });
    });
  });

  describe('Platform-Specific Rendering', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
    });

    it('renders Windows-style shortcuts with plus separators', async () => {
      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        const plusSeparators = screen.queryAllByText('+');
        expect(plusSeparators.length).toBeGreaterThan(0);
      });
    });

    it('handles Mac user agent', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });

      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles key parsing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock the KeyStringParser to throw an error
      const mockKeyParser = jest.requireMock('./key_parser');
      mockKeyParser.KeyStringParser.mockImplementation(() => ({
        getDisplayString: jest.fn(() => {
          throw new Error('Parsing error');
        }),
      }));

      const trigger = <button data-testid="trigger">Open Help</button>;

      render(
        <TestWrapper>
          <KeyboardShortcutHelp
            trigger={trigger}
            keyboardShortcutService={mockKeyboardShortcutService}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Help' }));

      await waitFor(() => {
        expect(screen.getByTestId('keyboardShortcutsModal')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
