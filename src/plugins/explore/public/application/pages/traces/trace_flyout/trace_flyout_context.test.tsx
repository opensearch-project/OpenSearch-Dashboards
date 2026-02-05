/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceFlyoutProvider, useTraceFlyoutContext } from './trace_flyout_context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

jest.mock('../../../../../../opensearch_dashboards_react/public');

jest.mock('../../../../components/data_table/table_cell/trace_utils/trace_utils', () => ({
  getTraceDetailsUrlParams: jest.fn(() => ({ spanId: 'test-span', traceId: 'test-trace' })),
}));

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;

const mockOsdUrlStateStorage = {
  set: jest.fn(),
};

const TestComponent = () => {
  const { isFlyoutOpen, flyoutData, openTraceFlyout, closeTraceFlyout } = useTraceFlyoutContext();

  return (
    <div>
      <div data-test-subj="flyout-open">{isFlyoutOpen.toString()}</div>
      <div data-test-subj="flyout-data">
        {flyoutData ? JSON.stringify(flyoutData) : 'undefined'}
      </div>
      <button
        onClick={() =>
          openTraceFlyout({
            traceId: 'test-trace',
            spanId: 'test-span',
            // @ts-expect-error TS2740 TODO(ts-error): fixme
            dataset: { id: 'test-dataset', title: 'test', type: 'INDEX_PATTERN' },
            // @ts-expect-error TS2739 TODO(ts-error): fixme
            rowData: { _source: {} },
          })
        }
        data-test-subj="open-flyout"
      >
        Open
      </button>
      <button onClick={closeTraceFlyout} data-test-subj="close-flyout">
        Close
      </button>
    </div>
  );
};

describe('TraceFlyoutContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({
      services: { osdUrlStateStorage: mockOsdUrlStateStorage },
    } as any);
  });

  it('provides initial state', () => {
    render(
      <TraceFlyoutProvider>
        <TestComponent />
      </TraceFlyoutProvider>
    );

    expect(screen.getByTestId('flyout-open')).toHaveTextContent('false');
    expect(screen.getByTestId('flyout-data')).toHaveTextContent('undefined');
  });

  it('opens flyout with data', () => {
    render(
      <TraceFlyoutProvider>
        <TestComponent />
      </TraceFlyoutProvider>
    );

    fireEvent.click(screen.getByTestId('open-flyout'));

    expect(screen.getByTestId('flyout-open')).toHaveTextContent('true');
    expect(screen.getByTestId('flyout-data')).toHaveTextContent('test-trace');
    expect(mockOsdUrlStateStorage.set).toHaveBeenCalledWith(
      '_a',
      { spanId: 'test-span', traceId: 'test-trace' },
      { replace: true }
    );
  });

  it('closes flyout', () => {
    render(
      <TraceFlyoutProvider>
        <TestComponent />
      </TraceFlyoutProvider>
    );

    fireEvent.click(screen.getByTestId('open-flyout'));
    fireEvent.click(screen.getByTestId('close-flyout'));

    expect(screen.getByTestId('flyout-open')).toHaveTextContent('false');
  });

  it('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useTraceFlyoutContext must be used within a TraceFlyoutProvider'
    );

    consoleError.mockRestore();
  });
});
