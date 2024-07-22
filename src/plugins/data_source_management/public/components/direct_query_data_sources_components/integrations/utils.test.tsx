/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntegrationHealthBadge } from './utils';

describe('IntegrationHealthBadge', () => {
  test('renders "Unknown" badge for undefined status', () => {
    render(<IntegrationHealthBadge />);
    const badgeElement = screen.getByText('Unknown');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement.closest('.euiHealth')).toBeInTheDocument();
  });

  test('renders "Active" badge for available status', () => {
    render(<IntegrationHealthBadge status="available" />);
    const badgeElement = screen.getByText('Active');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement.closest('.euiHealth')).toBeInTheDocument();
  });

  test('renders "Partially Available" badge for partially-available status', () => {
    render(<IntegrationHealthBadge status="partially-available" />);
    const badgeElement = screen.getByText('Partially Available');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement.closest('.euiHealth')).toBeInTheDocument();
  });

  test('renders "Critical" badge for any other status', () => {
    render(<IntegrationHealthBadge status="critical" />);
    const badgeElement = screen.getByText('Critical');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement.closest('.euiHealth')).toBeInTheDocument();
  });
});
