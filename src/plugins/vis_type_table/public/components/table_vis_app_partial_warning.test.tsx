/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableVisApp } from './table_vis_app';

jest.mock('./table_vis_component_group', () => ({
  TableVisComponentGroup: () => <div data-test-subj="TableVisComponentGroup" />,
}));

jest.mock('./table_vis_component', () => ({
  TableVisComponent: () => <div data-test-subj="TableVisComponent" />,
}));

/**
 * Minimal mocks required by TableVisApp. At this component-scope
 * we only stub the fields the component actually touches.
 */
const coreMock = {} as any;
const handlersMock: any = {
  done: jest.fn(),
  event: jest.fn(),
  uiState: {
    on: jest.fn(),
    off: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  },
};

const baseVisData = {
  table: {
    rows: [{ col1: 'value' }],
    columns: [{ id: 'col1', name: 'Column 1' }],
    formattedColumns: [],
  },
  direction: 'row' as const,
};

describe('TableVisApp – partial results warning', () => {
  it('renders an EuiCallOut when sumOtherDocCount > 0', () => {
    render(
      <TableVisApp
        services={coreMock}
        handlers={handlersMock}
        visConfig={{} as any}
        visData={baseVisData as any}
        meta={{ sumOtherDocCount: 5 }}
      />
    );

    expect(screen.getByText(/partial results/i)).toBeInTheDocument();
  });

  it('does not render the call-out when sumOtherDocCount is 0 or undefined', () => {
    render(
      <TableVisApp
        services={coreMock}
        handlers={handlersMock}
        visConfig={{} as any}
        visData={baseVisData as any}
        meta={{ sumOtherDocCount: 0 }}
      />
    );

    expect(screen.queryByText(/partial results/i)).toBeNull();
  });
});
