/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsTab } from './patterns_tab';

// Mock the dependencies
jest.mock('./action_bar/action_bar', () => ({
  ActionBar: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="mocked-action-bar" {...props} />
  ),
}));

jest.mock('../patterns_table/patterns_container', () => ({
  PatternsContainer: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="mocked-patterns-container" {...props} />
  ),
}));

describe('PatternsTab', () => {
  it('renders ActionBar and PatternsContainer with correct test subjects', () => {
    const { container } = render(<PatternsTab />);

    // Check if the main container is rendered
    expect(container.querySelector('.explore-logs-tab')).toBeInTheDocument();

    // Check if ActionBar is rendered with the correct test subject
    const actionBar = container.querySelector('[data-test-subj="patternsTabActionBar"]');
    expect(actionBar).toBeInTheDocument();

    // Check if PatternsContainer is rendered with the correct test subject
    const patternsContainer = container.querySelector('[data-test-subj="patternsTabContainer"]');
    expect(patternsContainer).toBeInTheDocument();
  });
});
