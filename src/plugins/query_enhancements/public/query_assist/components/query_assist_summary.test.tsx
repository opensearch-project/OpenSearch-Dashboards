/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { QueryAssistSummary } from './query_assist_summary';
import { useQueryAssist } from '../hooks';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn((value) => [value, () => null]),
}));

jest.mock('../hooks', () => ({
  useQueryAssist: jest.fn(),
}));

describe('query assist summary', () => {
  const PPL = 'ppl';
  const question = 'Are there any errors in my logs?';
  const queryContext = {
    question,
    query: PPL,
    queryResults: [{ size: 1 }],
  };

  const emptyResultQueryContext = {
    question,
    query: PPL,
    queryResults: [],
  };

  const coreSetupMock = coreMock.createSetup({});
  const httpMock = coreSetupMock.http;
  const data = new BehaviorSubject<any[]>([]);
  const question$ = new BehaviorSubject<string>('');
  const query$ = new BehaviorSubject<string>('');
  const reportUiStatsMock = jest.fn();
  const setSummary = jest.fn();
  const setLoading = jest.fn();
  const setQueryContext = jest.fn();
  const setFeedback = jest.fn();
  const setIsAssistantEnabledByCapability = jest.fn();
  const getQuery = jest.fn();
  const dataMock = {
    query: {
      queryString: {
        getUpdates$: () => query$,
        getQuery,
      },
    },
    search: {
      df: {
        df$: data,
      },
    },
  };

  afterEach(() => {
    data.next(undefined);
    question$.next(undefined);
    query$.next(undefined);
    jest.clearAllMocks();
  });

  const usageCollectionMock = {
    reportUiStats: reportUiStatsMock,
    METRIC_TYPE: {
      CLICK: 'click',
    },
  };
  const props: ComponentProps<typeof QueryAssistSummary> = {
    data: dataMock,
    http: httpMock,
    usageCollection: usageCollectionMock,
    dependencies: {
      isCollapsed: false,
      isSummaryCollapsed: false,
    },
    core: coreSetupMock,
  };

  const LOADING = {
    YES: true,
    NO: false,
  };
  const COLLAPSED = {
    YES: true,
    NO: false,
  };
  const FEEDBACK = {
    YES: true,
    NO: false,
  };

  const renderQueryAssistSummary = (isCollapsed: boolean) => {
    const component = render(
      <div>
        <QueryAssistSummary
          {...props}
          dependencies={{
            ...props.dependencies,
            isCollapsed,
          }}
        />
      </div>
    );
    return component;
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const mockUseState = (
    summary,
    loading,
    _queryContext,
    feedback,
    isAssistantEnabledByCapability = true,
    isQueryAssistCollapsed = COLLAPSED.NO
  ) => {
    React.useState.mockImplementationOnce(() => [summary, setSummary]);
    React.useState.mockImplementationOnce(() => [loading, setLoading]);
    React.useState.mockImplementationOnce(() => [_queryContext, setQueryContext]);
    React.useState.mockImplementationOnce(() => [feedback, setFeedback]);
    React.useState.mockImplementationOnce(() => [
      isAssistantEnabledByCapability,
      setIsAssistantEnabledByCapability,
    ]);
    React.useState.mockImplementationOnce(() => [undefined, jest.fn()]);
    useQueryAssist.mockImplementationOnce(() => ({
      question: 'question',
      question$,
      isQueryAssistCollapsed,
    }));
  };

  const defaultUseStateMock = () => {
    mockUseState(null, LOADING.NO, undefined, FEEDBACK.NO);
  };

  it('should not show if collapsed is true', () => {
    defaultUseStateMock();
    renderQueryAssistSummary(COLLAPSED.YES);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if assistant is disabled by capability', () => {
    mockUseState(null, LOADING.NO, undefined, FEEDBACK.NO, false);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if query assistant is collapsed', () => {
    mockUseState(null, LOADING.NO, undefined, FEEDBACK.NO, true, COLLAPSED.YES);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should show if collapsed is false', () => {
    defaultUseStateMock();
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(1);
  });

  it('should display loading view if loading state is true', () => {
    mockUseState(null, LOADING.YES, undefined, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_loading')).toBeInTheDocument();
    expect(screen.queryAllByTestId('queryAssist_summary_result')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_empty_text')).toHaveLength(0);
  });

  it('should display loading view if loading state is true even with summary', () => {
    mockUseState('summary', LOADING.YES, undefined, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_loading')).toBeInTheDocument();
    expect(screen.queryAllByTestId('queryAssist_summary_result')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_empty_text')).toHaveLength(0);
  });

  it('should display initial view if loading state is false and no summary', () => {
    defaultUseStateMock();
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_empty_text')).toBeInTheDocument();
    expect(screen.queryAllByTestId('queryAssist_summary_result')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_loading')).toHaveLength(0);
  });

  it('should display summary result', () => {
    mockUseState('summary', LOADING.NO, undefined, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    expect(screen.getByTestId('queryAssist_summary_result')).toHaveTextContent('summary');
    expect(screen.queryAllByTestId('queryAssist_summary_empty_text')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_loading')).toHaveLength(0);
  });

  it('should report metric for thumbup click', async () => {
    mockUseState('summary', LOADING.NO, undefined, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbup');
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbup'));
    expect(setFeedback).toHaveBeenCalledWith(true);
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbup/)
    );
  });

  it('should report metric for thumbdown click', async () => {
    mockUseState('summary', LOADING.NO, undefined, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbdown');
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbdown'));
    expect(setFeedback).toHaveBeenCalledWith(true);
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbdown/)
    );
  });

  it('should not fetch summary if queryResults is empty', async () => {
    mockUseState(null, LOADING.NO, emptyResultQueryContext, FEEDBACK.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(httpMock.post).toBeCalledTimes(0);
  });

  it('should fetch summary with expected payload and response', async () => {
    mockUseState('summary', LOADING.NO, queryContext, FEEDBACK.NO);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(httpMock.post).toBeCalledWith('/api/assistant/data2summary', {
      body: JSON.stringify({
        sample_data: `'${JSON.stringify(queryContext.queryResults)}'`,
        sample_count: 1,
        total_count: 1,
        question,
        ppl: PPL,
      }),
      query: {
        dataSourceId: undefined,
      },
    });
    await sleep(2000);
    expect(setSummary).toHaveBeenNthCalledWith(1, null);
    expect(setSummary).toHaveBeenNthCalledWith(2, RESPONSE_TEXT);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it('should handle fetch summary error', async () => {
    mockUseState('summary', LOADING.NO, queryContext, FEEDBACK.NO);
    httpMock.post.mockRejectedValueOnce({});
    renderQueryAssistSummary(COLLAPSED.NO);
    await sleep(2000);
    expect(setSummary).toBeCalledTimes(1);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it('should not update queryResults if subscription changed not in order', async () => {
    mockUseState('summary', LOADING.NO, queryContext, FEEDBACK.NO);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    await sleep(2000);
    dataMock.search.df.df$.next({
      size: 2,
      fields: [
        {
          name: 'title1',
          values: ['value1', 'value2'],
        },
        {
          name: 'title2',
          values: ['value3', 'value4'],
        },
      ],
    });
    question$.next(question);
    query$.next(PPL);
    await sleep(2000);
    expect(setQueryContext).toHaveBeenCalledTimes(0);
  });

  it('should update queryResults if subscriptions changed in order', async () => {
    mockUseState('summary', LOADING.NO, queryContext, FEEDBACK.NO);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    await sleep(2000);
    question$.next(question);
    query$.next(PPL);
    dataMock.search.df.df$.next({
      size: 2,
      fields: [
        {
          name: 'title1',
          values: ['value1', 'value2'],
        },
        {
          name: 'title2',
          values: ['value3', 'value4'],
        },
      ],
    });
    await sleep(2000);
    expect(setQueryContext).toHaveBeenCalledTimes(1);
  });

  it('should reset feedback state if re-fetch summary', async () => {
    mockUseState('summary', LOADING.NO, queryContext, FEEDBACK.YES);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    await sleep(2000);
    expect(setFeedback).toHaveBeenCalledWith(FEEDBACK.NO);
  });
});
