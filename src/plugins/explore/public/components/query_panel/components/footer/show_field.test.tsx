/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ShowFieldToggle } from './show_field';

describe('ShowFieldToggle', () => {
  it('renders Show Fields by default', () => {
    render(<ShowFieldToggle isEnabled={false} onToggle={jest.fn()} />);
    expect(screen.getByText('Show Fields')).toBeInTheDocument();
  });

  it('toggles state and calls onToggle', () => {
    const onToggle = jest.fn();
    render(<ShowFieldToggle isEnabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Show Fields'));
    expect(onToggle).toHaveBeenCalled();
  });
});
