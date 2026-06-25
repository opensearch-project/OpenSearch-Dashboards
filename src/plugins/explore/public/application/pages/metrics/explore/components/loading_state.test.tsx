/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ErrorCallout, LoadingIndicator } from './loading_state';

describe('LoadingIndicator', () => {
  it('renders a loading chart', () => {
    const { container } = render(<LoadingIndicator />);
    expect(container.querySelector('.euiLoadingChart')).toBeInTheDocument();
  });
});

describe('ErrorCallout', () => {
  it('renders the default error title and body', () => {
    render(<ErrorCallout error="Something went wrong" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Unable to load metrics');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('strips the leading "Error:" prefix from the displayed message', () => {
    render(<ErrorCallout error="Error: Bad Request" />);
    expect(screen.getByText('Bad Request')).toBeInTheDocument();
    expect(screen.queryByText('Error: Bad Request')).not.toBeInTheDocument();
  });
});
