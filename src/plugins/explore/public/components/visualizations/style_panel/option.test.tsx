/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Option } from './option';

describe('Option', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Option title="Test Option">
        <div>Test Content</div>
      </Option>
    );
    expect(container).toBeInTheDocument();

    // Check for data-test-subj attribute
    const element = container.querySelector('[data-test-subj="explore-dvOption-Test-Option"]');
    expect(element).toBeInTheDocument();
  });

  it('renders the title correctly', () => {
    render(
      <Option title="Test Option">
        <div>Test Content</div>
      </Option>
    );
    expect(screen.getByText('Test Option')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Option title="Test Option">
        <div>Test Content</div>
      </Option>
    );

    // The content should be in the DOM
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with complex children', () => {
    render(
      <Option title="Complex Option">
        <div>
          <h3>Nested Header</h3>
          <p>Paragraph text</p>
          <button>Click me</button>
        </div>
      </Option>
    );

    // Check all nested elements are rendered
    expect(screen.getByText('Nested Header')).toBeInTheDocument();
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
