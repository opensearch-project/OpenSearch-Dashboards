/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { TracesTab } from './traces_tab';

jest.mock('./traces_data_table', () => ({
  TracesDataTable: () => <div data-test-subj="mock-traces-data-table">Traces Data Table</div>,
}));

describe('TracesTab', () => {
  it('renders TracesDataTable inside container', () => {
    const { container } = render(<TracesTab />);
    expect(screen.getByTestId('mock-traces-data-table')).toBeInTheDocument();
    expect(container.querySelector('.agentTraces-traces-tab')).toBeTruthy();
  });
});
