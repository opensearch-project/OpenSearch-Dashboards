/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClassicExperienceBanner, ClassicExperienceBannerProps } from './classic_experience_banner';
import {
  NEW_DISCOVER_INFO_URL,
  SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY,
  HIDE_OLD_DISCOVER_LOCAL_STORAGE_KEY,
} from '../constants';

const navigateToExplore = jest.fn();
const TestHarness = (props: Partial<ClassicExperienceBannerProps>) => (
  <ClassicExperienceBanner navigateToExplore={navigateToExplore} {...props} />
);

describe('ClassicExperienceBanner', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => mockLocalStorage[key] || null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockLocalStorage[key];
    });
  });

  afterEach(() => {
    navigateToExplore.mockReset();
    jest.restoreAllMocks();
  });

  it('renders the banner correctly when visible', () => {
    render(<TestHarness />);
    expect(screen.getByTestId('exploreClassicExperienceBanner')).toBeInTheDocument();
    expect(
      screen.getByText('A new version of Discover with many improved features has been released.')
    ).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('does not render when HIDE_OLD_DISCOVER_LOCAL_STORAGE_KEY is set', () => {
    mockLocalStorage[HIDE_OLD_DISCOVER_LOCAL_STORAGE_KEY] = 'true';
    render(<TestHarness />);
    expect(screen.queryByTestId('exploreClassicExperienceBanner')).not.toBeInTheDocument();
  });

  it('renders the Learn More link correctly', () => {
    render(<TestHarness />);
    const learnMoreLink = screen.getByTestId('exploreClassicExperienceBanner__learnMore');
    expect(learnMoreLink.getAttribute('href')).toBe(NEW_DISCOVER_INFO_URL);
    expect(learnMoreLink.getAttribute('target')).toBe('_blank');
    expect(learnMoreLink).toHaveTextContent('Learn more');
  });

  it('renders the Try the new Discover button correctly', () => {
    render(<TestHarness />);
    const button = screen.getByTestId('exploreClassicExperienceBanner__newExperienceButton');
    expect(button).toHaveTextContent('Try the new Discover');
    expect(button).toBeInTheDocument();
  });

  it('handles Try the new Discover button click correctly', () => {
    render(<TestHarness />);
    const button = screen.getByTestId('exploreClassicExperienceBanner__newExperienceButton');

    fireEvent.click(button);

    expect(localStorage.removeItem).toHaveBeenCalledWith(SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY);
    expect(navigateToExplore).toHaveBeenCalled();
  });

  it('handles banner dismissal correctly', () => {
    render(<TestHarness />);
    const banner = screen.getByTestId('exploreClassicExperienceBanner');
    expect(banner).toBeInTheDocument();

    // Find and click the dismiss button (EuiCallOut creates a dismiss button)
    const dismissButton = banner.querySelector('[data-euiicon-type="cross"]')?.closest('button');
    expect(dismissButton).toBeInTheDocument();

    if (dismissButton) {
      fireEvent.click(dismissButton);
    }

    expect(localStorage.setItem).toHaveBeenCalledWith(HIDE_OLD_DISCOVER_LOCAL_STORAGE_KEY, 'true');
  });

  it('has correct accessibility attributes', () => {
    render(<TestHarness />);
    const celebrationEmoji = screen.getByRole('img', { name: 'New discover celebration' });
    expect(celebrationEmoji).toBeInTheDocument();
    expect(celebrationEmoji).toHaveAttribute('aria-label', 'New discover celebration');
  });

  it('banner is dismissible by default', () => {
    render(<TestHarness />);
    const banner = screen.getByTestId('exploreClassicExperienceBanner');
    // Check for dismiss button presence instead of CSS class
    const dismissButton =
      banner.querySelector('[aria-label="Dismiss"]') ||
      banner.querySelector('[data-euiicon-type="cross"]');
    expect(dismissButton).toBeInTheDocument();
  });

  it('has correct CSS class', () => {
    render(<TestHarness />);
    const banner = screen.getByTestId('exploreClassicExperienceBanner');
    expect(banner).toHaveClass('exploreClassicExperienceBanner');
  });
});
