/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { SpansTab } from './spans_tab';

jest.mock('./spans_data_table', () => ({
  SpansDataTable: () => <div data-test-subj="mock-spans-data-table">Spans Data Table</div>,
}));

describe('SpansTab', () => {
  it('renders SpansDataTable inside container', () => {
    const { container } = render(<SpansTab />);
    expect(screen.getByTestId('mock-spans-data-table')).toBeInTheDocument();
    expect(container.querySelector('.agentTraces-spans-tab')).toBeTruthy();
  });
});
