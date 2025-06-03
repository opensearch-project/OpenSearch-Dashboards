/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewExperienceBanner } from './new_experience_banner';
import { NEW_DISCOVER_INFO_URL } from '../constants';

describe('NewExperienceBanner', () => {
  it('renders the banner correctly', () => {
    render(<NewExperienceBanner />);
    expect(screen.getByTestId('exploreNewExperienceBanner')).toBeInTheDocument();
  });

  it('hides the banner if clicking on dismiss button', () => {
    render(<NewExperienceBanner />);
    fireEvent.click(screen.getByTestId('closeCallOutButton'));
    expect(screen.queryByTestId('exploreNewExperienceBanner')).not.toBeInTheDocument();
  });

  it('renders the Learn More link correctly', () => {
    render(<NewExperienceBanner />);
    const learnMoreLink = screen.getByTestId('exploreNewExperienceBanner__learnMore');
    expect(learnMoreLink.getAttribute('href')).toBe(NEW_DISCOVER_INFO_URL);
    expect(learnMoreLink.getAttribute('target')).toBe('_blank');
  });
});
