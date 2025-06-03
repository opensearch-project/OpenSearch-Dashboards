/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { dataPluginMock } from 'src/plugins/data/public/mocks';
import { CoreSetup } from 'opensearch-dashboards/public';
import { DataPublicPluginSetup, QueryEditorExtensionDependencies } from 'src/plugins/data/public';
import { BehaviorSubject } from 'rxjs';
import { usageCollectionPluginMock } from 'src/plugins/usage_collection/public/mocks';

import { convertResult, QueryAssistSummary } from './query_assist_summary';
import { QueryAssistContext, QueryAssistContextValue } from '../hooks';
import { DATA_FRAME_TYPES, IDataFrame } from '../../../../data/common';
import { coreMock } from '../../../../../core/public/mocks';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/public';

jest.useFakeTimers();

describe('query assist summary', () => {
  const defaultCoreSetupMock = coreMock.createSetup();
  const defaultDataSetupMock = dataPluginMock.createSetupContract();
  const defaultUsageCollectionSetupMock = usageCollectionPluginMock.createSetupContract();
  const defaultDependenciesMock = {
    language: 'PPL',
    onSelectLanguage: jest.fn(),
    // query editor is not collapsed
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
    query: {
      query: '',
      language: '',
    },
  };

  const defaultCoreStartMock = coreMock.createStart();
  defaultCoreStartMock.application.capabilities = {
    ...defaultCoreStartMock.application.capabilities,
    // assistant is turned on
    assistant: { enabled: true },
  };
  defaultCoreSetupMock.getStartServices.mockResolvedValue([defaultCoreStartMock, {}, {}]);

  const renderQueryAssistSummary = (
    props: Partial<QueryAssistContextValue>,
    deps?: {
      coreSetup?: CoreSetup;
      dataSetup?: DataPublicPluginSetup;
      dependencies?: QueryEditorExtensionDependencies;
      usageCollection?: UsageCollectionSetup;
    }
  ) => {
    const mocks = {
      coreSetup: defaultCoreSetupMock,
      dataSetup: defaultDataSetupMock,
      dependencies: defaultDependenciesMock,
      usageCollection: defaultUsageCollectionSetupMock,
      ...deps,
    };
    const defaults: QueryAssistContextValue = {
      // query assist is not collapsed
      isQuerySummaryCollapsed: false,
      isSummaryAgentAvailable: true,
      queryState: { question: '', generatedQuery: '' },
      updateQueryState: jest.fn(),
    };
    const component = render(
      <QueryAssistContext.Provider value={{ ...defaults, ...props }}>
        <QueryAssistSummary
          data={mocks.dataSetup}
          http={mocks.coreSetup.http}
          dependencies={mocks.dependencies}
          core={mocks.coreSetup}
          usageCollection={mocks.usageCollection}
        />
      </QueryAssistContext.Provider>
    );
    return (rerenderProps: Partial<QueryAssistContextValue>) => {
      component.rerender(
        <QueryAssistContext.Provider value={{ ...defaults, ...props, ...rerenderProps }}>
          <QueryAssistSummary
            data={mocks.dataSetup}
            http={mocks.coreSetup.http}
            dependencies={mocks.dependencies}
            core={mocks.coreSetup}
          />
        </QueryAssistContext.Provider>
      );
    };
  };

  const setupInitScreen = async () => {
    let rerender: (props: Partial<QueryAssistContextValue>) => any = jest.fn();
    const ppl = 'source=test | stats COUNT() as count';
    const question = 'test question';
    const summary = 'mock summary response';
    const dataFrame: IDataFrame = {
      type: DATA_FRAME_TYPES.DEFAULT,
      name: '73823750-90ec-11ef-8789-dd56e6283d4c',
      size: 3,
      fields: [
        {
          name: 'count',
          type: 'integer',
          values: [1483, 79, 48],
        },
        {
          name: 'response',
          type: 'string',
          values: ['200', '404', '503'],
        },
      ],
    };
    const coreSetup = coreMock.createSetup();
    // mock fetchSummary so the http request takes 1s to response
    coreSetup.http.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(summary), 1000))
    );
    // use defaultCoreSetupMock make to make sure assist capability is turned on
    coreSetup.getStartServices.mockResolvedValue([defaultCoreStartMock, {}, {}]);

    const dataSetup = dataPluginMock.createSetupContract();
    dataSetup.search.df.df$ = new BehaviorSubject<IDataFrame | undefined>(undefined);
    dataSetup.query.queryString.getQuery = jest
      .fn()
      .mockReturnValue({ query: ppl, language: 'PPL' });

    const usageCollection = usageCollectionPluginMock.createSetupContract();

    await act(async () => {
      rerender = renderQueryAssistSummary(
        {
          // ppl is generated
          queryState: { question, generatedQuery: ppl },
        },
        { dataSetup, coreSetup, usageCollection }
      );
    });
    return {
      usageCollection,
      coreSetup,
      rerender,
      dataSetup,
      ppl,
      dataFrame,
      question,
      summary,
    };
  };

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should show summary component', async () => {
    await act(async () => {
      renderQueryAssistSummary({});
    });
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(1);
  });

  it('should not show if collapsed is true', async () => {
    await act(async () => {
      renderQueryAssistSummary(
        {},
        { dependencies: { ...defaultDependenciesMock, isCollapsed: true } }
      );
    });
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if assistant is disabled by capability', async () => {
    const coreSetupAssistDisabledMock = coreMock.createSetup();
    const coreStartAssistDisabledMock = coreMock.createStart();
    coreStartAssistDisabledMock.application.capabilities = {
      ...coreStartAssistDisabledMock.application.capabilities,
      // assistant is turned off
      assistant: { enabled: false },
    };
    coreSetupAssistDisabledMock.getStartServices.mockResolvedValue([
      coreStartAssistDisabledMock,
      {},
      {},
    ]);
    await act(async () => {
      renderQueryAssistSummary({}, { coreSetup: coreSetupAssistDisabledMock });
    });
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should not show if query assistant is collapsed', async () => {
    await act(async () => {
      renderQueryAssistSummary({ isQuerySummaryCollapsed: true });
    });
    const summaryPanels = screen.queryAllByTestId('queryAssist__summary');
    expect(summaryPanels).toHaveLength(0);
  });

  it('should load the summary automatically only the first time ppl query was generated', async () => {
    const { coreSetup, dataSetup, rerender, dataFrame, summary } = await setupInitScreen();
    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });

    await waitFor(() => {
      // the generate summary request is sent only once
      expect(coreSetup.http.post).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('queryAssist_summary_loading')).toBeInTheDocument();
    });

    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    // ppl query is generated another time
    const anotherPPL = 'source=another_test | stats COUNT() as count';
    dataSetup.query.queryString.getQuery = jest
      .fn()
      .mockReturnValue({ query: anotherPPL, language: 'PPL' });

    await act(async () => {
      rerender({ queryState: { question: 'another question', generatedQuery: anotherPPL } });
      // ppl query returned results
      dataSetup.search.df.df$.next({
        type: DATA_FRAME_TYPES.DEFAULT,
        name: '73823750-90ec-11ef-8789-dd56e6283d4c',
        size: 2,
        fields: [
          {
            name: 'count',
            type: 'integer',
            values: [1483, 79],
          },
          {
            name: 'response',
            type: 'string',
            values: ['200', '404'],
          },
        ],
      });
    });
    await waitFor(() => {
      // The generate summary request should not be called the second time because the second time
      // ppl query generated should not auto-trigger the summarization
      expect(coreSetup.http.post).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('queryAssist_summary_click_to_generate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_generate'));
    await waitFor(() => {
      // Clicking "generate summary" should trigger the request summary call
      expect(coreSetup.http.post).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('queryAssist_summary_loading')).toBeInTheDocument();
    });
    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });
  });

  it('should display initial view', async () => {
    await act(async () => {
      renderQueryAssistSummary({});
    });
    expect(screen.getByTestId('queryAssist_summary_empty_text')).toBeInTheDocument();
    expect(screen.getByTestId('queryAssist_summary_buttons_generate')).toBeDisabled();
  });

  it('should report metric for thumbup click', async () => {
    const { usageCollection, dataSetup, dataFrame, summary } = await setupInitScreen();
    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });
    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbup'));
    expect(usageCollection.reportUiStats).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbup/)
    );
    // After clicking thumb up, only thumb up button will be visible
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbup')).toBeInTheDocument();
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbdown')).not.toBeInTheDocument();
  });

  it('should report metric for thumbdown click', async () => {
    const { usageCollection, dataSetup, dataFrame, summary } = await setupInitScreen();
    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });
    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbdown'));
    expect(usageCollection.reportUiStats).toHaveBeenCalledWith(
      'query-assist',
      'click',
      expect.stringMatching(/^thumbdown/)
    );
    // After clicking thumb down, only thumb down button will be visible
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbdown')).toBeInTheDocument();
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbup')).not.toBeInTheDocument();
  });

  it('should not display empty screen if result is empty', async () => {
    const firstPPL = 'source=test | stats COUNT() as count';
    const dataSetup = dataPluginMock.createSetupContract();
    dataSetup.search.df.df$ = new BehaviorSubject<IDataFrame | undefined>(undefined);
    dataSetup.query.queryString.getQuery = jest
      .fn()
      .mockReturnValue({ query: firstPPL, language: 'PPL' });

    await act(async () => {
      renderQueryAssistSummary(
        {
          queryState: { question: 'test question', generatedQuery: firstPPL },
        },
        { dataSetup }
      );
      // ppl query returned empty results
      dataSetup.search.df.df$.next({
        type: DATA_FRAME_TYPES.DEFAULT,
        name: '73823750-90ec-11ef-8789-dd56e6283d4c',
        size: 0,
        fields: [],
      });
    });
    expect(screen.getByTestId('queryAssist_summary_can_not_generate')).toBeInTheDocument();
    expect(defaultCoreSetupMock.http.post).not.toHaveBeenCalled();
  });

  it('should fetch summary with expected payload', async () => {
    const { coreSetup, question, ppl, dataFrame, dataSetup } = await setupInitScreen();
    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });
    expect(coreSetup.http.post).toBeCalledWith('/api/assistant/data2summary', {
      body: JSON.stringify({
        sample_data: `'${JSON.stringify(convertResult(dataFrame))}'`,
        sample_count: 3,
        total_count: 3,
        question,
        ppl,
      }),
      query: {
        dataSourceId: undefined,
      },
    });
  });

  it('should handle fetch summary error', async () => {
    const { coreSetup, dataFrame, dataSetup } = await setupInitScreen();
    coreSetup.http.post.mockRejectedValueOnce({});

    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });

    await waitFor(() => {
      expect(
        screen.queryByText('I am unable to respond to this query. Try another question.')
      ).toBeInTheDocument();
    });
  });

  it('should reset feedback state if re-fetch summary', async () => {
    const { dataSetup, dataFrame, summary } = await setupInitScreen();
    await act(async () => {
      // ppl query returned results
      dataSetup.search.df.df$.next(dataFrame);
    });
    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_thumbdown'));
    // After clicking thumb down, only thumb down button will be visible
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbdown')).toBeInTheDocument();
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbup')).not.toBeInTheDocument();

    // Click generate summary
    fireEvent.click(screen.getByTestId('queryAssist_summary_buttons_generate'));
    // after 1s, the fetch summary request respond
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      // the summary result is displayed
      expect(screen.getByText(summary)).toBeInTheDocument();
    });
    // both thumb up/down should be visible
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbdown')).toBeInTheDocument();
    expect(screen.queryByTestId('queryAssist_summary_buttons_thumbup')).toBeInTheDocument();
  });
});
