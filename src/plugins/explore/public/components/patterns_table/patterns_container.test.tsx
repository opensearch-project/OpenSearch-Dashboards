/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PatternsContainer } from './patterns_container';
import { mockPatternItems } from './utils/patterns_table.stubs';

// Mock the PatternsTable component
jest.mock('./patterns_table', () => ({
  PatternsTable: (props: any) => (
    <div
      data-test-subj="mocked-patterns-table"
      data-testid="mocked-patterns-table"
      data-items={JSON.stringify(props.items)}
    />
  ),
}));

// Mock the useTabResults hook
jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(() => ({
    results: {
      hits: {
        hits: mockPatternItems.map((item) => ({
          _source: {
            sample_logs: [item.sample],
            pattern_count: item.count,
            patterns_field: 'test pattern',
          },
        })),
        total: 2096,
      },
    },
  })),
}));

// Mock the redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    // Mock state for query
    if (selector.toString().includes('state.query')) {
      return { query: 'test query', language: 'PPL' };
    }
    // Mock state for results
    if (selector.toString().includes('state.results')) {
      return {
        'test query': {
          hits: {
            hits: mockPatternItems.map((item) => ({
              _source: {
                // Use string literals instead of constants to avoid Jest errors
                sample_logs: [item.sample],
                pattern_count: item.count,
                patterns_field: 'test pattern',
              },
            })),
            total: 2096,
          },
        },
      };
    }
    // Mock state for UI
    if (selector.toString().includes('state.ui.activeTabId')) {
      return 'patterns';
    }
    return null;
  }),
  connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
}));

describe('PatternsContainer', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<PatternsContainer />);

    // Check if PatternsTable is rendered
    const patternsTable = getByTestId('mocked-patterns-table');
    expect(patternsTable).toBeInTheDocument();
  });
});
