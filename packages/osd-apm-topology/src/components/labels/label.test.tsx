/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test_utils/vitest.utilities';
import { Label } from './label';

describe('Label', () => {
  it('renders with text and children', () => {
    render(
      <Label text="Test Label">
        <div data-test-subj="test-child">Child</div>
      </Label>
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    render(
      <Label text="Test Label">
        <div data-test-subj="test-child">Child</div>
      </Label>
    );

    const container = screen.getByText('Test Label').parentElement;
    expect(container).toHaveClass('osd:flex');
    expect(container).toHaveClass('osd:items-center');

    const childContainer = screen.getByTestId('test-child').parentElement;
    expect(childContainer).toHaveClass('osd:flex');
    expect(childContainer).toHaveClass('osd:items-center');
  });
});
