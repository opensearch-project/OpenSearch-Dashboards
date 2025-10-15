/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PatternsContainer } from './patterns_container';
import { mockPatternItems } from './utils/patterns_table.stubs';

jest.mock('./patterns_table', () => ({
  PatternsTable: (props: any) => (
    <div
      data-test-subj="mocked-patterns-table"
      data-testid="mocked-patterns-table"
      data-items={JSON.stringify(props.items)}
    />
  ),
}));

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

jest.mock('../tabs/action_bar/patterns_settings/patterns_settings_popover_content', () => ({
  PatternsSettingsPopoverContent: () => <div data-test-subj="mocked-patterns-settings" />,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    if (selector.toString().includes('selectQuery')) {
      return { query: 'test query', language: 'PPL' };
    }
    if (selector.toString().includes('selectResults')) {
      return {
        'default-query': {
          hits: {
            hits: mockPatternItems.map((item) => ({
              _source: {
                // using string literals instead of constants to avoid jest errors
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
    if (selector.toString().includes('state.ui.activeTabId')) {
      return 'patterns';
    }
    return {};
  }),
  useDispatch: jest.fn(() => jest.fn()),
  connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn().mockReturnValue('default-query'),
  prepareHistogramCacheKey: jest.fn().mockReturnValue('histogram:default-query'),
}));

jest.mock('./utils/utils', () => ({
  highlightLogUsingPattern: jest.fn((log) => `<mark>${log}</mark>`),
  isValidFiniteNumber: jest.fn((val) => !isNaN(val) && isFinite(val)),
}));

describe('PatternsContainer', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<PatternsContainer />);

    const patternsTable = getByTestId('mocked-patterns-table');
    expect(patternsTable).toBeInTheDocument();
  });
});
