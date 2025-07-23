/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { ResultsSummaryContent } from './results_summary_content';

describe('ResultsSummaryContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    render(<ResultsSummaryContent summary="" loading={true} />);
    expect(screen.getByText('Generating summary')).toBeInTheDocument();
  });

  it('should render empty state when summary is empty', () => {
    render(<ResultsSummaryContent summary="" loading={false} />);
    expect(screen.getByText('Run a query to generate summary')).toBeInTheDocument();
  });

  it('should render summary content when available', () => {
    const testSummary = 'Test summary content';
    render(<ResultsSummaryContent summary={testSummary} loading={false} />);
    expect(screen.getByText(testSummary)).toBeInTheDocument();
    expect(screen.getByTestId('exploreResultsSummary_summary_result')).toBeInTheDocument();
  });
});
