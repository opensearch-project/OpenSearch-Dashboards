/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpansTab } from './spans_tab';

jest.mock('./spans_table', () => ({
  SpansTable: () => <div data-test-subj="mock-spans-table">Spans Table</div>,
}));

describe('SpansTab', () => {
  it('renders SpansTable inside container', () => {
    const { container } = render(<SpansTab />);
    expect(screen.getByTestId('mock-spans-table')).toBeInTheDocument();
    expect(container.querySelector('.agentTraces-spans-tab')).toBeTruthy();
  });
});
