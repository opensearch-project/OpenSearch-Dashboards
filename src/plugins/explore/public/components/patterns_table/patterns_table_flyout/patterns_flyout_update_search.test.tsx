/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EXPLORE_LOGS_TAB_ID } from '../../../../common';
import { PatternsFlyoutUpdateSearch } from './patterns_flyout_update_search';

jest.mock(
  '@elastic/eui',
  () => ({
    EuiButton: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
      <button onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    ),
  }),
  { virtual: true }
);

const mockDispatch = jest.fn();
const mockSetEditorText = jest.fn();
const mockExecuteQueries = jest.fn().mockReturnValue({ type: 'EXECUTE_QUERIES' });
const mockClosePatternsTableFlyout = jest.fn();
const mockGetQueryWithSource = jest
  .fn()
  .mockReturnValue({ query: 'source query', language: 'PPL' });
const mockBrainUpdateSearchPatternQuery = jest.fn().mockReturnValue('updated brain query');
const mockRegexUpdateSearchPatternQuery = jest.fn().mockReturnValue('updated regex query');
const mockSetActiveTab = jest.fn().mockReturnValue({ type: 'SET_ACTIVE_TAB' });
const mockSetQueryStringWithHistory = jest
  .fn()
  .mockReturnValue({ type: 'SET_QUERY_STRING_WITH_HISTORY' });
const mockServices = {};

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));

jest.mock('../../../application/hooks', () => ({
  useSetEditorText: () => mockSetEditorText,
}));

jest.mock('./patterns_flyout_context', () => ({
  usePatternsFlyoutContext: () => ({
    closePatternsTableFlyout: mockClosePatternsTableFlyout,
  }),
}));

jest.mock('../utils/utils', () => ({
  brainUpdateSearchPatternQuery: (...args: any[]) => mockBrainUpdateSearchPatternQuery(...args),
  regexUpdateSearchPatternQuery: (...args: any[]) => mockRegexUpdateSearchPatternQuery(...args),
}));

jest.mock('../../../application/utils/state_management/slices', () => ({
  setActiveTab: (...args: any[]) => mockSetActiveTab(...args),
  setQueryStringWithHistory: (...args: any[]) => mockSetQueryStringWithHistory(...args),
}));

jest.mock('../../../application/utils/languages', () => ({
  getQueryWithSource: (...args: any[]) => mockGetQueryWithSource(...args),
}));

jest.mock('../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn().mockImplementation(() => mockExecuteQueries()),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: mockServices }),
}));

jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectQuery: jest.fn().mockName('selectQuery'),
  selectPatternsField: jest.fn().mockName('selectPatternsField'),
  selectUsingRegexPatterns: jest.fn().mockName('selectUsingRegexPatterns'),
}));

describe('PatternsFlyoutUpdateSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const useSelector = require('react-redux').useSelector;
    const {
      selectQuery,
      selectPatternsField,
      selectUsingRegexPatterns,
    } = require('../../../application/utils/state_management/selectors');

    useSelector.mockImplementation((selector: any) => {
      if (selector === selectQuery) return { query: 'test query', language: 'PPL' };
      if (selector === selectPatternsField) return 'message';
      if (selector === selectUsingRegexPatterns) return false;
      return selector;
    });
  });

  it('should render the update search button', () => {
    render(<PatternsFlyoutUpdateSearch patternString="test pattern" />);

    expect(screen.getByRole('button', { name: /update search with pattern/i })).toBeInTheDocument();
    expect(screen.getByText('Update search')).toBeInTheDocument();
  });

  it('should render with the correct pattern string', () => {
    render(<PatternsFlyoutUpdateSearch patternString="custom pattern" />);

    expect(screen.getByRole('button', { name: /update search with pattern/i })).toBeInTheDocument();
  });

  it('should call all expected functions when button is clicked', async () => {
    const user = userEvent.setup();

    render(<PatternsFlyoutUpdateSearch patternString="test pattern" />);
    const button = screen.getByRole('button', { name: /update search with pattern/i });
    await user.click(button);

    expect(mockGetQueryWithSource).toHaveBeenCalled();
    expect(mockBrainUpdateSearchPatternQuery).toHaveBeenCalled();
    expect(mockSetQueryStringWithHistory).toHaveBeenCalled();
    expect(mockSetEditorText).toHaveBeenCalled();
    expect(mockSetActiveTab).toHaveBeenCalledWith(EXPLORE_LOGS_TAB_ID);
    expect(mockExecuteQueries).toHaveBeenCalled();
    expect(mockClosePatternsTableFlyout).toHaveBeenCalled();
  });

  it('should use regexUpdateSearchPatternQuery when usingRegexPatterns is true', async () => {
    const user = userEvent.setup();

    const useSelector = require('react-redux').useSelector;
    const {
      selectQuery,
      selectPatternsField,
      selectUsingRegexPatterns,
    } = require('../../../application/utils/state_management/selectors');

    useSelector.mockImplementation((selector: any) => {
      if (selector === selectQuery) return { query: 'test query', language: 'PPL' };
      if (selector === selectPatternsField) return 'message';
      if (selector === selectUsingRegexPatterns) return true;
      return selector;
    });

    render(<PatternsFlyoutUpdateSearch patternString="regex pattern" />);

    const button = screen.getByRole('button', { name: /update search with pattern/i });

    await user.click(button);

    expect(mockRegexUpdateSearchPatternQuery).toHaveBeenCalled();
    expect(mockBrainUpdateSearchPatternQuery).not.toHaveBeenCalled();
  });

  it('should throw an error when there is no pattern field', () => {
    const useSelector = require('react-redux').useSelector;
    const {
      selectQuery,
      selectPatternsField,
      selectUsingRegexPatterns,
    } = require('../../../application/utils/state_management/selectors');

    useSelector.mockImplementation((selector: any) => {
      if (selector === selectQuery) return { query: 'test query', language: 'PPL' };
      if (selector === selectPatternsField) return null;
      if (selector === selectUsingRegexPatterns) return false;
      return selector;
    });

    render(<PatternsFlyoutUpdateSearch patternString="test pattern" />);
    const button = screen.getByRole('button', { name: /update search with pattern/i });

    expect(() => {
      button.click();
    }).toThrow('no patterns field');
  });
});
