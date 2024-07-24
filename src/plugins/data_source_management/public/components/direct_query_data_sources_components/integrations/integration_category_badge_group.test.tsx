/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { badges } from './integration_category_badge_group';

describe('badges', () => {
  it('renders all badges if labels length is less than or equal to 3', () => {
    const labels = ['Label1', 'Label2', 'Label3'];
    render(badges(labels));

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders a tooltip if labels length is greater than 3', async () => {
    const labels = ['Label1', 'Label2', 'Label3', 'Label4', 'Label5'];
    render(badges(labels));

    expect(screen.getByText('Label1')).toBeInTheDocument();
    expect(screen.getByText('Label2')).toBeInTheDocument();
    expect(screen.getByText('+3 more')).toBeInTheDocument();

    // Verify tooltip content
    const tooltipTrigger = screen.getByText('+3 more');
    fireEvent.mouseOver(tooltipTrigger);

    await waitFor(() => {
      const tooltipContent = screen.getByText('Label3, Label4, Label5');
      expect(tooltipContent).toBeInTheDocument();
    });
  });

  it('renders correct tooltip content for additional labels', async () => {
    const labels = ['Label1', 'Label2', 'Label3', 'Label4'];
    render(badges(labels));

    expect(screen.getByText('Label1')).toBeInTheDocument();
    expect(screen.getByText('Label2')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();

    // Verify tooltip content
    const tooltipTrigger = screen.getByText('+2 more');
    fireEvent.mouseOver(tooltipTrigger);

    await waitFor(() => {
      const tooltipContent = screen.getByText('Label3, Label4');
      expect(tooltipContent).toBeInTheDocument();
    });
  });
});
