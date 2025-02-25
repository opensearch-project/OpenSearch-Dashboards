/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { QueryAssistSummary, convertResult } from './query_assist_summary';
import { useQueryAssist } from '../hooks';
import { IDataFrame, Query } from '../../../../data/common';
import { FeedbackStatus as FEEDBACK } from '../../../common/query_assist';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn((value) => [value, () => null]),
  useRef: jest.fn(() => ({ current: null })),
}));

jest.mock('../hooks', () => ({
  useQueryAssist: jest.fn(),
}));

describe('query assist summary', () => {
  const PPL = 'ppl';
  const question = 'Are there any errors in my logs?';
  const dataFrame = {
    fields: [{ name: 'name', values: ['value'] }],
    size: 1,
  };
  const emptyDataFrame = {
    fields: [],
    size: 0,
  };

  const coreSetupMock = coreMock.createSetup({});
  const httpMock = coreSetupMock.http;
  const data$ = new BehaviorSubject<IDataFrame | undefined>(undefined);
  const question$ = new BehaviorSubject<string>('');
  const query$ = new BehaviorSubject<Query | undefined>(undefined);
  const reportUiStatsMock = jest.fn();
  const setSummary = jest.fn();
  const setLoading = jest.fn();
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
        df$: data$,
      },
    },
  };

  afterEach(() => {
    data$.next(undefined);
    question$.next('');
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

  const ISSUMMARYAGENT = {
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

  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const WAIT_TIME = 100;

  const mockUseState = (
    summary,
    loading,
    feedback,
    isAssistantEnabledByCapability = true,
    isQuerySummaryCollapsed = COLLAPSED.NO,
    isSummaryAgentAvailable = ISSUMMARYAGENT.YES
  ) => {
    React.useState.mockImplementationOnce(() => [summary, setSummary]);
    React.useState.mockImplementationOnce(() => [loading, setLoading]);
    React.useState.mockImplementationOnce(() => [feedback, setFeedback]);
    React.useState.mockImplementationOnce(() => [
      isAssistantEnabledByCapability,
      setIsAssistantEnabledByCapability,
    ]);

    useQueryAssist.mockImplementationOnce(() => ({
      question: 'question',
      question$,
      isQuerySummaryCollapsed,
      isSummaryAgentAvailable,
    }));
  };

  const defaultUseStateMock = () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, true);
  };

  it('should not show if collapsed is true', () => {
    defaultUseStateMock();
    renderQueryAssistSummary(COLLAPSED.YES);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if assistant is disabled by capability', () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, false);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if is not summary agent', () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, false, ISSUMMARYAGENT.NO);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if query assistant is collapsed', () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.YES);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should show if collapsed is false', () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(1);
  });

  it('should show if summary agent', () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(1);
  });

  it('should display loading view if loading state is true', () => {
    mockUseState(null, LOADING.YES, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.queryAllByTestId('queryAssist_summary_result')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_empty_text')).toHaveLength(0);
  });

  it('should display loading view if loading state is true even with summary', () => {
    mockUseState('summary', LOADING.YES, FEEDBACK.NONE, true);
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
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    expect(screen.getByTestId('queryAssist_summary_result')).toHaveTextContent('summary');
    expect(screen.queryAllByTestId('queryAssist_summary_empty_text')).toHaveLength(0);
    expect(screen.queryAllByTestId('queryAssist_summary_loading')).toHaveLength(0);
  });

  it('should report metric for thumbup click', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbup');
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbup'));
    expect(setFeedback).toHaveBeenCalledWith(FEEDBACK.THUMB_UP);
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbup/)
    );
  });

  it('should report metric for thumbdown click', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbdown');
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbdown'));
    expect(setFeedback).toHaveBeenCalledWith(FEEDBACK.THUMB_DOWN);
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbdown/)
    );
  });

  it('should hide thumbdown button if thumbup button is clicked', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.THUMB_UP, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbup');
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbdown')).not.toBeInTheDocument();
  });

  it('should hide thumbup button if thumbdown button is clicked', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.THUMB_DOWN, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    expect(screen.getByTestId('queryAssist_summary_result')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_buttons_thumbdown');
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbup')).not.toBeInTheDocument();
  });

  it('should not fetch summary if data is empty', async () => {
    mockUseState(null, LOADING.NO, FEEDBACK.NONE, true);
    renderQueryAssistSummary(COLLAPSED.NO);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(emptyDataFrame);
    expect(httpMock.post).toBeCalledTimes(0);
  });

  it('should fetch summary with expected payload and response', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE, true);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(dataFrame as IDataFrame);
    await sleep(WAIT_TIME);
    expect(httpMock.post).toBeCalledWith('/api/assistant/data2summary', {
      body: JSON.stringify({
        sample_data: `'${JSON.stringify(convertResult(dataFrame))}'`,
        sample_count: 1,
        total_count: 1,
        question,
        ppl: PPL,
      }),
      query: {
        dataSourceId: undefined,
      },
    });
    expect(setSummary).toHaveBeenNthCalledWith(1, '');
    expect(setSummary).toHaveBeenNthCalledWith(2, RESPONSE_TEXT);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it('should handle fetch summary error', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE);
    httpMock.post.mockRejectedValueOnce({});
    renderQueryAssistSummary(COLLAPSED.NO);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(dataFrame as IDataFrame);
    await sleep(WAIT_TIME);
    expect(setSummary).toBeCalledTimes(2);
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it('should not update queryResults if subscription changed not in order', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    data$.next(dataFrame as IDataFrame);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    await sleep(WAIT_TIME);
    expect(httpMock.post).toHaveBeenCalledTimes(0);
  });

  it('should update queryResults if subscriptions changed in order', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.NONE);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(dataFrame as IDataFrame);
    await sleep(WAIT_TIME);
    expect(httpMock.post).toHaveBeenCalledTimes(1);
    data$.next(undefined);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(dataFrame as IDataFrame);
    await sleep(WAIT_TIME);
    expect(httpMock.post).toHaveBeenCalledTimes(2);
  });

  it('should reset feedback state if re-fetch summary', async () => {
    mockUseState('summary', LOADING.NO, FEEDBACK.THUMB_UP);
    const RESPONSE_TEXT = 'response';
    httpMock.post.mockResolvedValue(RESPONSE_TEXT);
    renderQueryAssistSummary(COLLAPSED.NO);
    question$.next(question);
    query$.next({ query: PPL, language: 'PPL' });
    data$.next(dataFrame as IDataFrame);
    await sleep(WAIT_TIME);
    expect(setFeedback).toHaveBeenCalledWith(FEEDBACK.NONE);
  });
});
