/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { RunQueryButton } from './run_query';

describe('RunQueryButton', () => {
  it('renders button', () => {
    render(<RunQueryButton onClick={jest.fn()} />);
    expect(screen.getByText('Run query')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<RunQueryButton onClick={onClick} />);
    fireEvent.click(screen.getByText('Run query'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when isDisabled is true', () => {
    render(<RunQueryButton onClick={jest.fn()} isDisabled />);
    expect(screen.getByRole('button', { name: 'Run query' })).toBeDisabled();
  });
});
