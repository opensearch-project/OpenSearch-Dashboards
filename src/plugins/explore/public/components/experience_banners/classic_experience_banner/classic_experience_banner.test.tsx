/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClassicExperienceBanner, ClassicExperienceBannerProps } from './classic_experience_banner';
import { NEW_DISCOVER_INFO_URL, SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY } from '../constants';

const navigateToExplore = jest.fn();
const TestHarness = (props: Partial<ClassicExperienceBannerProps>) => (
  <ClassicExperienceBanner navigateToExplore={navigateToExplore} {...props} />
);

describe('ClassicExperienceBanner', () => {
  afterEach(() => {
    navigateToExplore.mockReset();
  });

  it('renders the banner correctly', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('exploreClassicExperienceBanner')).toBeInTheDocument();
  });

  it('renders the Learn More link correctly', () => {
    render(<TestHarness />);
    const learnMoreLink = screen.getByTestId('exploreClassicExperienceBanner__learnMore');
    expect(learnMoreLink.getAttribute('href')).toBe(NEW_DISCOVER_INFO_URL);
    expect(learnMoreLink.getAttribute('target')).toBe('_blank');
  });

  it('renders the Try the new Discover button correctly', () => {
    jest.spyOn(Storage.prototype, 'removeItem');
    Storage.prototype.setItem = jest.fn();
    render(<TestHarness />);
    const button = screen.getByTestId('exploreClassicExperienceBanner__newExperienceButton');
    fireEvent.click(button);
    expect(localStorage.removeItem).toHaveBeenCalledWith(SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY);
    expect(navigateToExplore).toHaveBeenCalled();
  });
});
