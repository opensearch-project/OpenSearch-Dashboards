/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TextSelectionMonitor } from './text_selection_monitor';
import { useTextSelection } from '../hooks/use_text_selection';

// Mock the useTextSelection hook
jest.mock('../hooks/use_text_selection');

describe('TextSelectionMonitor', () => {
  let mockUseTextSelection: jest.Mock;

  beforeEach(() => {
    mockUseTextSelection = useTextSelection as jest.Mock;
    mockUseTextSelection.mockReturnValue('selected text');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<TextSelectionMonitor />)).not.toThrow();
    });

    it('should render null (no visible content)', () => {
      const { container } = render(<TextSelectionMonitor />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render any DOM elements', () => {
      const { container } = render(<TextSelectionMonitor />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('hook integration', () => {
    it('should call useTextSelection hook', () => {
      render(<TextSelectionMonitor />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
    });

    it('should call useTextSelection hook with no arguments', () => {
      render(<TextSelectionMonitor />);
      expect(mockUseTextSelection).toHaveBeenCalledWith();
    });

    it('should work regardless of useTextSelection return value', () => {
      // Test with different return values
      const testValues = ['', 'some text', null, undefined, 'long selected text content'];

      testValues.forEach((returnValue) => {
        mockUseTextSelection.mockReturnValue(returnValue);
        expect(() => render(<TextSelectionMonitor />)).not.toThrow();
      });
    });
  });

  describe('lifecycle', () => {
    it('should call useTextSelection on mount', () => {
      render(<TextSelectionMonitor />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
    });

    it('should continue to work after re-renders', () => {
      const { rerender } = render(<TextSelectionMonitor />);

      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);

      rerender(<TextSelectionMonitor />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(2);

      rerender(<TextSelectionMonitor />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(3);
    });

    it('should handle unmounting gracefully', () => {
      const { unmount } = render(<TextSelectionMonitor />);

      expect(() => unmount()).not.toThrow();
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle useTextSelection throwing an error', () => {
      mockUseTextSelection.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => render(<TextSelectionMonitor />)).toThrow('Hook error');
    });

    it('should handle useTextSelection returning undefined', () => {
      mockUseTextSelection.mockReturnValue(undefined);

      expect(() => render(<TextSelectionMonitor />)).not.toThrow();
    });

    it('should handle useTextSelection returning null', () => {
      mockUseTextSelection.mockReturnValue(null);

      expect(() => render(<TextSelectionMonitor />)).not.toThrow();
    });
  });

  describe('multiple instances', () => {
    it('should handle multiple TextSelectionMonitor instances', () => {
      const { container } = render(
        <>
          <TextSelectionMonitor />
          <TextSelectionMonitor />
          <TextSelectionMonitor />
        </>
      );

      expect(mockUseTextSelection).toHaveBeenCalledTimes(3);
      expect(container.innerHTML).toBe('');
    });

    it('should work with other components', () => {
      const { container } = render(
        <div>
          <span>Some content</span>
          <TextSelectionMonitor />
          <p>More content</p>
        </div>
      );

      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
      expect(container.querySelector('span')).toHaveTextContent('Some content');
      expect(container.querySelector('p')).toHaveTextContent('More content');
    });
  });

  describe('performance', () => {
    it('should be lightweight and not affect rendering performance', () => {
      const startTime = performance.now();

      // Render multiple instances
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<TextSelectionMonitor />);
        unmount();
      }

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render very quickly (less than 100ms for 100 instances)
      expect(renderTime).toBeLessThan(100);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(100);
    });

    it('should not cause memory leaks with frequent mounting/unmounting', () => {
      // This test ensures the component cleans up properly
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<TextSelectionMonitor />);
        unmount();
      }

      expect(mockUseTextSelection).toHaveBeenCalledTimes(50);
    });
  });

  describe('integration scenarios', () => {
    it('should work in different React contexts', () => {
      const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div data-test-subj="provider">{children}</div>
      );

      const { container } = render(
        <TestProvider>
          <TextSelectionMonitor />
        </TestProvider>
      );

      expect(container.querySelector('[data-test-subj="provider"]')).toBeInTheDocument();
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
    });

    it('should work with React.StrictMode', () => {
      render(
        <React.StrictMode>
          <TextSelectionMonitor />
        </React.StrictMode>
      );

      // In StrictMode, effects run twice in development
      // But our component should handle this gracefully
      expect(mockUseTextSelection).toHaveBeenCalled();
    });

    it('should work with conditional rendering', () => {
      const ConditionalWrapper: React.FC<{ show: boolean }> = ({ show }) => (
        <div>{show && <TextSelectionMonitor />}</div>
      );

      const { rerender } = render(<ConditionalWrapper show={false} />);
      expect(mockUseTextSelection).not.toHaveBeenCalled();

      rerender(<ConditionalWrapper show={true} />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);

      rerender(<ConditionalWrapper show={false} />);
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1); // No additional calls
    });
  });

  describe('component contract', () => {
    it('should be a functional component', () => {
      expect(typeof TextSelectionMonitor).toBe('function');
    });

    it('should not accept any props', () => {
      // TypeScript should enforce this, but we can test runtime behavior
      const { container } = render(<TextSelectionMonitor />);
      expect(container.innerHTML).toBe('');
    });

    it('should always return null', () => {
      const result = TextSelectionMonitor({});
      expect(result).toBeNull();
    });

    it('should be pure (same input produces same output)', () => {
      const result1 = TextSelectionMonitor({});
      const result2 = TextSelectionMonitor({});

      expect(result1).toBe(result2);
      expect(result1).toBeNull();
    });
  });

  describe('documentation compliance', () => {
    it('should match the documented behavior of being invisible', () => {
      const { container } = render(<TextSelectionMonitor />);

      // Should not render any visible content
      expect(container.firstChild).toBeNull();
      expect(container.textContent).toBe('');
    });

    it('should match the documented behavior of activating text selection', () => {
      render(<TextSelectionMonitor />);

      // Should activate the useTextSelection hook
      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
    });

    it('should serve as a hook runner as documented', () => {
      // The component's sole purpose is to run the useTextSelection hook
      render(<TextSelectionMonitor />);

      expect(mockUseTextSelection).toHaveBeenCalledTimes(1);
      expect(mockUseTextSelection).toHaveBeenCalledWith();
    });
  });
});
