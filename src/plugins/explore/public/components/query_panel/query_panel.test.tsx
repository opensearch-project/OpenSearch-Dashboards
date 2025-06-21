/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { QueryPanel } from './query_panel';

// TODO: Add more test cases once api and services integrated.

jest.mock('./layout', () => ({
  QueryPanelLayout: ({ children, footer }: any) => (
    <div>
      <div data-test-subj="footer">{footer}</div>
      <div data-test-subj="editor-stack">{children}</div>
    </div>
  ),
}));
jest.mock('./components/editor_stack', () => ({
  EditorStack: (props: any) => (
    <div data-test-subj="editor-stack-mock">
      <button onClick={() => props.onPromptChange('source=test\n| where state=CA')}>
        PromptChange
      </button>
      <button onClick={() => props.onQueryChange('source=test\n| where state=CA')}>
        QueryChange
      </button>
    </div>
  ),
}));
jest.mock('./components/footer/index', () => ({
  QueryPanelFooter: (props: any) => (
    <div data-test-subj="footer-mock">
      <button onClick={props.onRunClick}>Run query</button>
      <button onClick={props.onRecentClick}>Recent Queries</button>
      {props.lineCount !== undefined && (
        <span data-test-subj="line-count">{props.lineCount} lines</span>
      )}
    </div>
  ),
}));
jest.mock('./components/footer/recent_query/table', () => ({
  RecentQueriesTable: (props: any) => (
    <div data-test-subj="recent-queries-table">
      <button
        onClick={() =>
          props.onClickRecentQuery({
            query: 'source=logs',
            prompt: '',
            language: 'ppl',
            dataset: 'test',
          })
        }
      >
        Use Recent Query
      </button>
    </div>
  ),
}));

// Provide minimal mocks for required props
const mockServices = {
  data: {
    autocomplete: { getQuerySuggestions: jest.fn().mockResolvedValue([]) },
    query: { timefilter: { timefilter: { setTime: jest.fn(), setRefreshInterval: jest.fn() } } },
  },
};
const mockIndexPattern = { timeFieldName: 'timestamp' };

describe('QueryPanel', () => {
  it('renders QueryPanel with footer and editor stack', () => {
    render(<QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />);
    expect(screen.queryByTestId('footer')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-stack')).toBeInTheDocument();
  });

  it('shows recent queries table when Recent Queries is clicked', () => {
    render(<QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />);
    fireEvent.click(screen.getByText('Recent Queries'));
    expect(screen.getByTestId('recent-queries-table')).toBeInTheDocument();
  });

  it('updates editor with recent query when a recent query is selected', async () => {
    render(<QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />);
    fireEvent.click(screen.getByText('Recent Queries'));
    fireEvent.click(screen.getByText('Use Recent Query'));
    // After selecting, the recent queries table should close
    expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();
  });

  it('sets loading state when running a query', async () => {
    jest.useFakeTimers();
    render(<QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />);
    fireEvent.click(screen.getByText('Run query'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    jest.useRealTimers();
  });
});
