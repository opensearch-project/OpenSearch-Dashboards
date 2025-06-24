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

// Mock the redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    if (selector.name === 'selectRows') {
      return mockPatternItems.map((item) => ({
        _source: {
          // Use string literals instead of constants to avoid Jest errors
          patterns_field: item.pattern,
          count: item.count,
        },
      }));
    }
    if (selector.name === 'selectTotalHits') {
      return 2096;
    }
    return null;
  }),
}));

describe('PatternsContainer', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<PatternsContainer />);

    // Check if PatternsTable is rendered
    const patternsTable = getByTestId('mocked-patterns-table');
    expect(patternsTable).toBeInTheDocument();
  });
});
