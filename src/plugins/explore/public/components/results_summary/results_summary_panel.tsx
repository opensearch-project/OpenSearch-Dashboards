/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiMarkdownFormat, EuiText } from '@elastic/eui';
import { useEffectOnce, useObservable } from 'react-use';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { IDataFrame } from 'src/plugins/data/common';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { of } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataPublicPluginSetup } from '../../../../data/public';
import { ExploreServices } from '../../types';
import { ResultsSummary, FeedbackStatus } from './results_summary';

import './results_summary_panel.scss';

export interface QueryContext {
  question: string;
  query: string;
  queryResults: any;
}

interface ResultsSummaryPanelProps {
  data: DataPublicPluginSetup;
  usageCollection?: UsageCollectionSetup;
  brandingLabel?: string;
}

type AccordionState = 'closed' | 'open';

const ACCORDION_STATE_LOCAL_STORAGE_KEY = 'resultsSummary.summaryAccordionState';

export const convertResult = (body: IDataFrame) => {
  const data = body as IDataFrame;
  const hits: any[] = [];

  if (data && data.fields && data.fields.length > 0) {
    for (let index = 0; index < data.size; index++) {
      const hit: { [key: string]: any } = {};
      data.fields.forEach((field) => {
        hit[field.name] = field.values[index];
      });
      hits.push({
        _index: data.name,
        _source: hit,
      });
    }
  }

  return hits;
};

export const ResultsSummaryPanel: React.FC<ResultsSummaryPanelProps> = (props) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { core, http, isSummaryAgentAvailable$ } = services;
  const { query, search } = props.data;

  const isSummaryAgentAvailable = useObservable(isSummaryAgentAvailable$ ?? of(false), false);

  const [results, setResults] = useState<any[]>([]);
  const [accordionState, setAccordionState] = useState<AccordionState>('open');
  const [summary, setSummary] = useState(''); // store fetched data
  const [loading, setLoading] = useState(false); // track loading state
  const [feedback, setFeedback] = useState(FeedbackStatus.NONE);
  const [isEnabledBySetting, setIsEnabledBySetting] = useState(false);
  const selectedDataset = useRef(query.queryString.getQuery()?.dataset);
  const queryState = useSelector((state: any) => state.query);
  const updateQueryState = useCallback((x: any) => {}, []); // FIXME

  const isQueryDirty =
    queryState.query && queryState.query !== props.data.query.queryString.getQuery().query;

  const canGenerateSummary = Boolean(results.length) && Boolean(queryState.query) && !isQueryDirty;

  // The visibility of panel action buttons: thumbs up/down and copy to clipboard buttons
  const actionButtonVisible = Boolean(summary) && !loading && !isQueryDirty;

  const METRIC_APP = `query-assist`;
  const afterFeedbackTip = i18n.translate('explore.resultsSummary.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });
  const errorPrompt = i18n.translate('explore.resultsSummary.summary.errorPrompt', {
    defaultMessage: 'I am unable to respond to this query. Try another question.',
  });

  const sampleSize = 10;

  const reportMetric = useCallback(
    (metric: string) => {
      if (props.usageCollection) {
        props.usageCollection.reportUiStats(
          METRIC_APP,
          props.usageCollection.METRIC_TYPE.CLICK,
          metric + '-' + uuidv4()
        );
      }
    },
    [props.usageCollection, METRIC_APP]
  );

  const reportCountMetric = useCallback(
    (metric: string, count: number) => {
      if (props.usageCollection) {
        props.usageCollection.reportUiStats(
          METRIC_APP,
          props.usageCollection.METRIC_TYPE.COUNT,
          metric + '-' + uuidv4(),
          count
        );
      }
    },
    [props.usageCollection, METRIC_APP]
  );

  useEffectOnce(() => {
    const storedValue = localStorage.getItem(ACCORDION_STATE_LOCAL_STORAGE_KEY);

    const isValidState = (value: string | null) => value === 'open' || value === 'closed';

    if (storedValue !== null) {
      setAccordionState(isValidState(storedValue) ? (storedValue as AccordionState) : 'open');

      if (!isValidState(storedValue)) {
        localStorage.setItem(ACCORDION_STATE_LOCAL_STORAGE_KEY, 'open');
      }
    }
  });

  useEffect(() => {
    const assistantEnabled = !!core.application.capabilities?.assistant?.enabled;
    setIsEnabledBySetting(assistantEnabled);
  }, [core]);

  useEffect(() => {
    const subscription = query.queryString.getUpdates$().subscribe((_query) => {
      selectedDataset.current = _query?.dataset;
    });
    return () => subscription.unsubscribe();
  }, [query.queryString]);

  useEffect(() => {
    return () => {
      // reset the state when unmount, so when navigating away and
      // back to discover, it won't use stale state
      updateQueryState({ question: '', query: '' });
    };
  }, [updateQueryState]);

  useEffect(() => {
    const subscription = search.df.df$
      .pipe(
        distinctUntilChanged(),
        filter((value) => !isEmpty(value) && !isEmpty(value?.fields))
      )
      .subscribe((df) => {
        if (df) {
          setResults(convertResult(df));
        }
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [search.df.df$]);

  const fetchSummary = useCallback(
    async (queryContext: QueryContext) => {
      setSummary('');
      if (isEmpty(queryContext?.queryResults)) {
        return;
      }

      setLoading(true);
      setFeedback(FeedbackStatus.NONE);

      const SUCCESS_METRIC = 'generated';
      try {
        const actualSampleSize = Math.min(sampleSize, queryContext?.queryResults?.length);
        const dataString = JSON.stringify(queryContext?.queryResults?.slice(0, actualSampleSize));
        const payload = `'${dataString}'`;
        const response = await http.post('/api/assistant/data2summary', {
          body: JSON.stringify({
            sample_data: payload,
            sample_count: actualSampleSize,
            total_count: queryContext?.queryResults?.length,
            question: 'Show all the logs', // TODO
            ppl: queryContext?.query,
          }),
          query: {
            dataSourceId: selectedDataset.current?.dataSource?.id,
          },
        });
        setSummary(response);
        reportCountMetric(SUCCESS_METRIC, 1);
      } catch (error) {
        reportCountMetric(SUCCESS_METRIC, 0);
        setSummary(errorPrompt);
      } finally {
        setLoading(false);
      }
    },
    [http, reportCountMetric, errorPrompt]
  );

  const onFeedback = useCallback(
    (satisfied: boolean) => {
      if (feedback !== FeedbackStatus.NONE) return;
      const feedbackStatus = satisfied ? FeedbackStatus.THUMB_UP : FeedbackStatus.THUMB_DOWN;
      setFeedback(feedbackStatus);
      reportMetric(feedbackStatus);
    },
    [feedback, reportMetric]
  );

  const getPanelMessage = useCallback(() => {
    if (loading) {
      return (
        <EuiText size="s" data-test-subj="resultsSummary_summary_loading">
          {i18n.translate('explore.resultsSummary.summary.generating', {
            defaultMessage: 'Generating response...',
          })}
        </EuiText>
      );
    }

    if (isQueryDirty) {
      return (
        <EuiText size="s" data-test-subj="resultsSummary_summary_unavailable">
          {i18n.translate('explore.resultsSummary.summary.unavaialble', {
            defaultMessage: 'Summary unavaialble for custom PPL queries.',
          })}
        </EuiText>
      );
    }

    if (!canGenerateSummary) {
      return (
        <EuiText size="s" data-test-subj="resultsSummary_summary_can_not_generate">
          {i18n.translate('explore.resultsSummary.summary.canNotGenerate', {
            defaultMessage: 'I am unable to summarize your results. Try another question.',
          })}
        </EuiText>
      );
    }

    if (summary) {
      return (
        <EuiText size="s" data-test-subj="resultsSummary_summary_result">
          <EuiMarkdownFormat>{summary}</EuiMarkdownFormat>
        </EuiText>
      );
    }

    return (
      <EuiText size="s" data-test-subj="resultsSummary_summary_empty_text">
        {i18n.translate('explore.resultsSummary.summary.placeholder', {
          defaultMessage: 'Ask a question to generate summary',
        })}
      </EuiText>
    );
  }, [loading, isQueryDirty, summary, canGenerateSummary]);

  const onClickAccordion = (isOpen: boolean) => {
    const newState = isOpen ? 'open' : 'closed';
    setAccordionState(newState);
    localStorage.setItem(ACCORDION_STATE_LOCAL_STORAGE_KEY, newState);
  };

  if (!isEnabledBySetting || !isSummaryAgentAvailable) {
    return null;
  }

  return (
    <ResultsSummary
      accordionState={accordionState}
      onClickAccordion={onClickAccordion}
      actionButtonVisible={actionButtonVisible}
      feedback={feedback}
      afterFeedbackTip={afterFeedbackTip}
      onFeedback={onFeedback}
      summary={summary}
      canGenerateSummary={canGenerateSummary}
      loading={loading}
      onGenerateSummary={() =>
        fetchSummary({
          question: queryState.question,
          query: queryState.query,
          queryResults: results,
        })
      }
      brandingLabel={props.brandingLabel}
      sampleSize={sampleSize}
      getPanelMessage={getPanelMessage}
    />
  );
};
