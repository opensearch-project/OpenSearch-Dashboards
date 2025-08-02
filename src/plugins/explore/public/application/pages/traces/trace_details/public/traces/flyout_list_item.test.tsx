/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlyoutListItem } from './flyout_list_item';

describe('FlyoutListItem', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
  };

  it('renders title and description', () => {
    render(<FlyoutListItem {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('uses correct data-test-subj', () => {
    render(<FlyoutListItem {...defaultProps} />);

    expect(screen.getByTestId('Test TitleDescriptionList')).toBeInTheDocument();
  });

  it('shows filter button on hover when addSpanFilter is provided', () => {
    const addSpanFilter = jest.fn();
    render(<FlyoutListItem {...defaultProps} addSpanFilter={addSpanFilter} />);

    // Initially, filter button should not be visible
    expect(screen.queryByLabelText('span-flyout-filter-icon')).not.toBeInTheDocument();

    // Hover over the component
    fireEvent.mouseOver(screen.getByTestId('Test TitleDescriptionList'));

    // Filter button should now be visible
    expect(screen.getByLabelText('span-flyout-filter-icon')).toBeInTheDocument();

    // Mouse leave should hide the filter button
    fireEvent.mouseLeave(screen.getByTestId('Test TitleDescriptionList'));
    expect(screen.queryByLabelText('span-flyout-filter-icon')).not.toBeInTheDocument();
  });

  it('shows filter button on focus when addSpanFilter is provided', () => {
    const addSpanFilter = jest.fn();
    render(<FlyoutListItem {...defaultProps} addSpanFilter={addSpanFilter} />);

    // Focus the component
    fireEvent.focus(screen.getByTestId('Test TitleDescriptionList'));

    // Filter button should be visible
    expect(screen.getByLabelText('span-flyout-filter-icon')).toBeInTheDocument();
  });

  it('calls addSpanFilter when filter button is clicked', () => {
    const addSpanFilter = jest.fn();
    render(<FlyoutListItem {...defaultProps} addSpanFilter={addSpanFilter} />);

    // Hover to show the filter button
    fireEvent.mouseOver(screen.getByTestId('Test TitleDescriptionList'));

    // Click the filter button
    fireEvent.click(screen.getByLabelText('span-flyout-filter-icon'));

    expect(addSpanFilter).toHaveBeenCalled();
  });

  it('does not show filter button when addSpanFilter is not provided', () => {
    render(<FlyoutListItem {...defaultProps} />);

    // Hover over the component
    fireEvent.mouseOver(screen.getByTestId('Test TitleDescriptionList'));

    // Filter button should not be visible
    expect(screen.queryByLabelText('span-flyout-filter-icon')).not.toBeInTheDocument();
  });

  it('handles description value of "-"', () => {
    render(<FlyoutListItem {...defaultProps} description="-" />);

    // Should still render the description
    expect(screen.getByText('-')).toBeInTheDocument();
    // Should use simpler layout without flex group
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles React nodes as title and description', () => {
    const props = {
      title: <span data-test-subj="custom-title">Custom Title</span>,
      description: <div data-test-subj="custom-desc">Custom Description</div>,
    };

    render(<FlyoutListItem {...props} />);

    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    expect(screen.getByTestId('custom-desc')).toBeInTheDocument();
  });

  it('shows tooltip on filter button hover', async () => {
    const addSpanFilter = jest.fn();
    render(<FlyoutListItem {...defaultProps} addSpanFilter={addSpanFilter} />);

    // Show the filter button
    fireEvent.mouseOver(screen.getByTestId('Test TitleDescriptionList'));

    // Hover over the filter button
    fireEvent.mouseOver(screen.getByLabelText('span-flyout-filter-icon'));

    // Tooltip should be visible
    expect(await screen.findByText('Filter spans on this value')).toBeInTheDocument();
  });

  it('maintains proper styling', () => {
    render(<FlyoutListItem {...defaultProps} />);

    // Find elements with the correct CSS classes
    const titleText = screen.getByText('Test Title').closest('.exploreFlyoutListItem__titleText');
    const descriptionText = screen
      .getByText('Test Description')
      .closest('.exploreFlyoutListItem__descriptionText');

    // Title should have proper styling
    expect(titleText).toHaveClass('exploreFlyoutListItem__titleText');

    // Description should have proper styling
    expect(descriptionText).toHaveClass('exploreFlyoutListItem__descriptionText');
  });
});
