/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LinkRenderer } from './link_renderer';

describe('<LinkRenderer />', () => {
  test('renders link with href and children', () => {
    const { getByText } = render(<LinkRenderer href="https://example.com">Link Text</LinkRenderer>);

    const link = getByText('Link Text');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders link without href', () => {
    const { getByText } = render(<LinkRenderer>Link Text</LinkRenderer>);

    const link = getByText('Link Text');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders with complex children', () => {
    const { container } = render(
      <LinkRenderer href="https://example.com">
        <span>Complex</span> <strong>Content</strong>
      </LinkRenderer>
    );

    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('Complex');

    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong).toHaveTextContent('Content');
  });
});
