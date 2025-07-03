/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PplReference } from './ppl_reference';

// Mock useOpenSearchDashboards to provide test doc links
jest.mock('../../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      docLinks: {
        links: {
          noDocumentation: {
            ppl: { base: 'https://test-ppl-docs' },
            sqlPplLimitation: { base: 'https://test-limitation-docs' },
          },
        },
      },
    },
  }),
}));

describe('PplReference', () => {
  it('renders PPL and limitation documentation links', () => {
    render(<PplReference />);
    const pplLink = screen.getByText('PPL');
    const limitationLink = screen.getByText('here');

    expect(pplLink).toHaveAttribute('href', 'https://test-ppl-docs');
    expect(limitationLink).toHaveAttribute('href', 'https://test-limitation-docs');
    expect(screen.getByText(/Piped Processing Language/)).toBeInTheDocument();
  });
});
