/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExperienceBannerWrapper } from './experience_banner_wrapper';

const mockNavigateToExplore = jest.fn();
const mockInitializeBannerWrapperToTrue = async () => {
  return {
    showClassicExperienceBanner: true,
    navigateToExplore: mockNavigateToExplore,
  };
};
const mockInitializeBannerWrapperToFalse = async () => {
  return {
    showClassicExperienceBanner: false,
    navigateToExplore: mockNavigateToExplore,
  };
};

describe('ExperienceBannerWrapper', () => {
  afterEach(() => {
    mockNavigateToExplore.mockReset();
  });

  it('should render nothing initially', () => {
    render(<ExperienceBannerWrapper initializeBannerWrapper={mockInitializeBannerWrapperToTrue} />);
    expect(screen.queryByTestId('exploreClassicExperienceBanner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exploreNewExperienceBanner')).not.toBeInTheDocument();
  });

  it('should render new banner if !showClassicExperienceBanner', async () => {
    render(
      <ExperienceBannerWrapper initializeBannerWrapper={mockInitializeBannerWrapperToFalse} />
    );
    expect(await screen.findByTestId('exploreNewExperienceBanner')).toBeInTheDocument();
  });

  it('should render classic banner if showClassicExperienceBanner', async () => {
    render(<ExperienceBannerWrapper initializeBannerWrapper={mockInitializeBannerWrapperToTrue} />);
    expect(await screen.findByTestId('exploreClassicExperienceBanner')).toBeInTheDocument();
  });

  it('clicking on classic button calls callback correctly', async () => {
    render(<ExperienceBannerWrapper initializeBannerWrapper={mockInitializeBannerWrapperToTrue} />);
    await screen.findByTestId('exploreClassicExperienceBanner');
    fireEvent.click(screen.getByTestId('exploreClassicExperienceBanner__newExperienceButton'));
    expect(mockNavigateToExplore).toHaveBeenCalled();
  });
});
