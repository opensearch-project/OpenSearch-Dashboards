/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatternsFlyoutProvider, usePatternsFlyoutContext } from './patterns_flyout_context';
import { PatternsFlyoutRecord } from './patterns_table_flyout';

jest.mock('../utils/utils', () => ({
  isValidFiniteNumber: jest.fn((val) => !isNaN(val) && isFinite(val)),
}));

const TestComponent: React.FC = () => {
  const {
    isFlyoutOpen,
    patternsFlyoutData,
    openPatternsTableFlyout,
    closePatternsTableFlyout,
  } = usePatternsFlyoutContext();

  const validRecord: PatternsFlyoutRecord = {
    pattern: 'test-pattern',
    count: 42,
    sample: ['sample-log-1', 'sample-log-2'],
  };

  const invalidRecord = {
    pattern: 'test-pattern',
    count: NaN,
    sample: ['sample-log'],
  };

  return (
    <div>
      <div data-test-subj="flyout-open">{isFlyoutOpen ? 'true' : 'false'}</div>
      <div data-test-subj="flyout-data">
        {patternsFlyoutData ? JSON.stringify(patternsFlyoutData) : 'undefined'}
      </div>
      <button data-test-subj="open-valid" onClick={() => openPatternsTableFlyout(validRecord)}>
        Open with valid data
      </button>
      <button
        data-test-subj="open-invalid"
        onClick={() => openPatternsTableFlyout(invalidRecord as any)}
      >
        Open with invalid data
      </button>
      <button data-test-subj="open-undefined" onClick={() => openPatternsTableFlyout()}>
        Open with undefined
      </button>
      <button data-test-subj="close" onClick={closePatternsTableFlyout}>
        Close
      </button>
    </div>
  );
};

const ComponentWithoutProvider: React.FC = () => {
  try {
    usePatternsFlyoutContext();
    return <div>Should not render</div>;
  } catch (e) {
    return <div data-test-subj="error-message">{(e as Error).message}</div>;
  }
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PatternsFlyoutProvider>{component}</PatternsFlyoutProvider>);
};

describe('PatternsFlyoutContext', () => {
  describe('PatternsFlyoutProvider', () => {
    it('should initialize with flyout closed and no data', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('false');
      expect(screen.getByTestId('flyout-data')).toHaveTextContent('undefined');
    });

    it('should open flyout with valid data', () => {
      renderWithProvider(<TestComponent />);
      fireEvent.click(screen.getByTestId('open-valid'));
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('true');
      expect(screen.getByTestId('flyout-data')).toHaveTextContent(/test-pattern/);
      expect(screen.getByTestId('flyout-data')).toHaveTextContent(/42/);
      expect(screen.getByTestId('flyout-data')).toHaveTextContent(/sample-log-1/);
    });

    it('should open flyout but set data to undefined when given invalid data', () => {
      renderWithProvider(<TestComponent />);
      fireEvent.click(screen.getByTestId('open-invalid'));
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('true');
      expect(screen.getByTestId('flyout-data')).toHaveTextContent('undefined');
    });

    it('should open flyout but set data to undefined when given no data', () => {
      renderWithProvider(<TestComponent />);
      fireEvent.click(screen.getByTestId('open-undefined'));
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('true');
      expect(screen.getByTestId('flyout-data')).toHaveTextContent('undefined');
    });

    it('should close the flyout', () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByTestId('open-valid'));
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('close'));
      expect(screen.getByTestId('flyout-open')).toHaveTextContent('false');
    });
  });

  describe('usePatternsFlyoutContext', () => {
    it('should throw error when used outside of provider', () => {
      render(<ComponentWithoutProvider />);
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'usePatternsFlyoutContext must be used within a PatternsFlyoutProvider'
      );
    });
  });
});
