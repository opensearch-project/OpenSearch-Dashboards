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

  it('names the source it was given', () => {
    render(<ErrorCallout error="access denied" sourceLabel="My Metrics" />);
    expect(screen.getByTestId('metricsExploreErrorCallout')).toHaveTextContent(
      'We encountered a problem fetching data from the My Metrics data source. Check your connection and try again.'
    );
    expect(screen.getByTestId('metricsExploreErrorMessage')).toHaveTextContent('access denied');
  });

  it('reads as before for Prometheus', () => {
    render(<ErrorCallout error="Bad Request" sourceLabel="Prometheus" />);
    expect(
      screen.getByText(
        'We encountered a problem fetching data from the Prometheus data source. Check your connection and try again.'
      )
    ).toBeInTheDocument();
  });

  it.each([undefined, '', '   '])(
    'names no source type without a label (%p)',
    (sourceLabel?: string) => {
      render(<ErrorCallout error="access denied" sourceLabel={sourceLabel} />);
      expect(
        screen.getByText(
          'We encountered a problem fetching data from the data source. Check your connection and try again.'
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId('metricsExploreErrorCallout')).not.toHaveTextContent('Prometheus');
    }
  );
});
