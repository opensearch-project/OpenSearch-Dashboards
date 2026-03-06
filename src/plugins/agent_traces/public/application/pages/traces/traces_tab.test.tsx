/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TracesTab } from './traces_tab';

jest.mock('./traces_table', () => ({
  TracesTable: () => <div data-test-subj="mock-traces-table">Traces Table</div>,
}));

describe('TracesTab', () => {
  it('renders TracesTable inside container', () => {
    const { container } = render(<TracesTab />);
    expect(screen.getByTestId('mock-traces-table')).toBeInTheDocument();
    expect(container.querySelector('.agentTraces-traces-tab')).toBeTruthy();
  });
});
