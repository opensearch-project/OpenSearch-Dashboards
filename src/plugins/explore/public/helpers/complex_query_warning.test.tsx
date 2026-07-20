/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ComplexQueryWarningCallout } from './complex_query_warning';

describe('ComplexQueryWarningCallout', () => {
  it('renders the complex-query warning with its title and message', () => {
    render(<ComplexQueryWarningCallout />);

    expect(screen.getByTestId('complexQueryWarningCallout')).toBeInTheDocument();
    expect(screen.getByText('Complex query')).toBeInTheDocument();
    expect(
      screen.getByText(/re-runs every time the dashboard loads or refreshes/i)
    ).toBeInTheDocument();
  });
});
