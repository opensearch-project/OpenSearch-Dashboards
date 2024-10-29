/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  EuiSplitPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIconTip,
  EuiSmallButtonIcon,
  EuiSpacer,
  EuiCopy,
  EuiSmallButtonEmpty,
} from '@elastic/eui';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { IDataFrame } from 'src/plugins/data/common';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { HttpSetup } from 'opensearch-dashboards/public';
import { QueryAssistState, useQueryAssist } from '../hooks';
import { DataPublicPluginSetup, QueryEditorExtensionDependencies } from '../../../../data/public';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { CoreSetup } from '../../../../../core/public';
import { FeedbackStatus } from '../../../common/query_assist';

export interface QueryContext {
  question: string;
  query: string;
  queryResults: any;
}

interface QueryAssistSummaryProps {
  data: DataPublicPluginSetup;
  http: HttpSetup;
  usageCollection?: UsageCollectionSetup;
  dependencies: QueryEditorExtensionDependencies;
  core: CoreSetup;
}

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

export const QueryAssistSummary: React.FC<QueryAssistSummaryProps> = (props) => {
  const { query, search } = props.data;
  const [summary, setSummary] = useState(''); // store fetched data
  const [loading, setLoading] = useState(false); // track loading state
  const [feedback, setFeedback] = useState(FeedbackStatus.NONE);
  const [isEnabledByCapability, setIsEnabledByCapability] = useState(false);
  const selectedDataset = useRef(query.queryString.getQuery()?.dataset);
  const { isQueryAssistCollapsed, queryState } = useQueryAssist();

  const [results, setResults] = useState<any[]>([]);
  // the question and answer used last time to generate summary
  const lastUsedQueryStateRef = useRef<QueryAssistState | undefined>();
  // the current question and generated answer
  const currentQueryStateRef = useRef<QueryAssistState>(queryState);

  const METRIC_APP = `query-assist`;
  const afterFeedbackTip = i18n.translate('queryEnhancements.queryAssist.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });
  const errorPrompt = i18n.translate('queryEnhancements.queryAssist.summary.errorPrompt', {
    defaultMessage: 'I am unable to respond to this query. Try another question.',
  });

  const sampleSize = 10;

  const queryChanged =
    queryState.generatedQuery &&
    queryState.generatedQuery !== props.data.query.queryString.getQuery().query;
  // It can generate summary when
  // 1. it has the current generated query(answer)
  // 2. user didn't run a different query other than the generated one
  // 3. there are search results
  const canGenerateSummary =
    Boolean(results.length) && Boolean(queryState.generatedQuery) && !queryChanged;
  // Generate summary can be auto triggered only when first time generating the query
  const shouldAutoTrigger = !lastUsedQueryStateRef.current;
  // Display a message in the panel to indicate that clicking
  // "Generate summary" button is needed to generate the summary
  const manualTriggerVisible =
    !shouldAutoTrigger &&
    canGenerateSummary &&
    lastUsedQueryStateRef.current?.generatedQuery !== queryState.generatedQuery;
  // The visibility of panel action buttons: thumbs up/down and copy to clipboard buttons
  const actionButtonVisible = summary && !loading && !queryChanged && !manualTriggerVisible;

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

  const fetchSummary = useCallback(
    async (queryContext: QueryContext) => {
      if (isEmpty(queryContext?.queryResults)) return;
      setLoading(true);
      setSummary('');
      setFeedback(FeedbackStatus.NONE);
      const SUCCESS_METRIC = 'fetch_summary_success';
      try {
        const actualSampleSize = Math.min(sampleSize, queryContext?.queryResults?.length);
        const dataString = JSON.stringify(queryContext?.queryResults?.slice(0, actualSampleSize));
        const payload = `'${dataString}'`;
        const response = await props.http.post('/api/assistant/data2summary', {
          body: JSON.stringify({
            sample_data: payload,
            sample_count: actualSampleSize,
            total_count: queryContext?.queryResults?.length,
            question: queryContext?.question,
            ppl: queryContext?.query,
          }),
          query: {
            dataSourceId: selectedDataset.current?.dataSource?.id,
          },
        });
        setSummary(response);
        lastUsedQueryStateRef.current = {
          question: queryContext.question,
          generatedQuery: queryContext.query,
        };
        reportCountMetric(SUCCESS_METRIC, 1);
      } catch (error) {
        reportCountMetric(SUCCESS_METRIC, 0);
        setSummary(errorPrompt);
      } finally {
        setLoading(false);
      }
    },
    [props.http, reportCountMetric, errorPrompt]
  );

  useEffect(() => {
    currentQueryStateRef.current = queryState;
  }, [queryState]);

  useEffect(() => {
    const { question, generatedQuery } = currentQueryStateRef.current;
    if (shouldAutoTrigger && canGenerateSummary) {
      fetchSummary({ question, query: generatedQuery, queryResults: results });
    }
  }, [results, canGenerateSummary, fetchSummary, shouldAutoTrigger]);

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

  useEffect(() => {
    const subscription = query.queryString.getUpdates$().subscribe((_query) => {
      selectedDataset.current = _query?.dataset;
    });
    return () => subscription.unsubscribe();
  }, [query.queryString]);

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

  useEffect(() => {
    props.core.getStartServices().then(([coreStart, depsStart]) => {
      const assistantEnabled = !!coreStart.application.capabilities?.assistant?.enabled;
      setIsEnabledByCapability(assistantEnabled);
    });
  }, [props.core]);

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
        <EuiText size="s" data-test-subj="queryAssist_summary_loading">
          {i18n.translate('queryEnhancements.queryAssist.summary.generating', {
            defaultMessage: 'Generating response...',
          })}
        </EuiText>
      );
    }
    if (queryChanged) {
      return (
        <EuiText size="s" data-test-subj="queryAssist_summary_unavailable">
          {i18n.translate('queryEnhancements.queryAssist.summary.unavailable', {
            defaultMessage: 'Summary unavailable for custom queries',
          })}
        </EuiText>
      );
    }

    if (manualTriggerVisible) {
      return (
        <EuiText size="s" data-test-subj="queryAssist_summary_click_to_generate">
          {i18n.translate('queryEnhancements.queryAssist.summary.clickToGenerate', {
            defaultMessage: 'Select the "Generate summary" button to generate summaries',
          })}
        </EuiText>
      );
    }

    if (summary) {
      return (
        <EuiText size="s" data-test-subj="queryAssist_summary_result">
          {summary}
        </EuiText>
      );
    }

    return (
      <EuiText size="s" data-test-subj="queryAssist_summary_empty_text">
        {i18n.translate('queryEnhancements.queryAssist.summary.placeholder', {
          defaultMessage: 'Ask a question to generate summary',
        })}
      </EuiText>
    );
  }, [loading, queryChanged, summary, manualTriggerVisible]);

  if (props.dependencies.isCollapsed || isQueryAssistCollapsed || !isEnabledByCapability) {
    return null;
  }

  return (
    <EuiSplitPanel.Outer
      className="queryAssist queryAssist__summary"
      data-test-subj="queryAssist__summary"
      hasBorder={true}
      borderRadius="none"
    >
      <EuiSplitPanel.Inner className={'queryAssist queryAssist__summary_banner'}>
        <EuiFlexGroup alignItems={'center'} gutterSize={'xs'}>
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <strong>
                {i18n.translate('queryEnhancements.queryAssist.summary.panelTitle', {
                  defaultMessage: 'Summary',
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={true} data-test-subj="queryAssist_summary_buttons">
            <EuiFlexGroup alignItems={'center'} justifyContent={'flexEnd'} gutterSize={'xs'}>
              {actionButtonVisible && (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiIconTip
                      type={'iInCircle'}
                      content={`Summary based on first ${sampleSize} records`}
                      aria-label={i18n.translate(
                        'queryEnhancements.queryAssist.summary.sampletip',
                        {
                          defaultMessage: 'Summary based on first {sampleSize} records',
                          values: { sampleSize },
                        }
                      )}
                    />
                  </EuiFlexItem>
                  {feedback !== FeedbackStatus.THUMB_DOWN && (
                    <EuiFlexItem grow={false}>
                      <EuiSmallButtonIcon
                        aria-label="feedback thumbs up"
                        color={feedback === FeedbackStatus.THUMB_UP ? 'subdued' : 'text'}
                        iconType="thumbsUp"
                        title={
                          !feedback
                            ? i18n.translate('queryEnhancements.queryAssist.summary.goodResponse', {
                                defaultMessage: `Good response`,
                              })
                            : afterFeedbackTip
                        }
                        onClick={() => onFeedback(true)}
                        data-test-subj="queryAssist_summary_buttons_thumbup"
                      />
                    </EuiFlexItem>
                  )}
                  {feedback !== FeedbackStatus.THUMB_UP && (
                    <EuiFlexItem grow={false}>
                      <EuiSmallButtonIcon
                        aria-label="feedback thumbs down"
                        color={feedback === FeedbackStatus.THUMB_DOWN ? 'subdued' : 'text'}
                        title={
                          !feedback
                            ? i18n.translate('queryEnhancements.queryAssist.summary.badResponse', {
                                defaultMessage: `Bad response`,
                              })
                            : afterFeedbackTip
                        }
                        iconType="thumbsDown"
                        onClick={() => onFeedback(false)}
                        data-test-subj="queryAssist_summary_buttons_thumbdown"
                      />
                    </EuiFlexItem>
                  )}
                  <EuiSpacer className="verticalRuler" size="m" />
                  <EuiFlexItem grow={false}>
                    <EuiCopy textToCopy={summary ?? ''}>
                      {(copy) => (
                        <EuiSmallButtonIcon
                          aria-label="Copy to clipboard"
                          title={i18n.translate('queryEnhancements.queryAssist.summary.copy', {
                            defaultMessage: `Copy to clipboard`,
                          })}
                          onClick={copy}
                          color="text"
                          iconType="copy"
                          data-test-subj="queryAssist_summary_buttons_copy"
                        />
                      )}
                    </EuiCopy>
                  </EuiFlexItem>
                </>
              )}
              <EuiSpacer className="verticalRuler" size="m" />
              <EuiFlexItem grow={false}>
                <EuiSmallButtonEmpty
                  isDisabled={!canGenerateSummary}
                  isLoading={loading}
                  onClick={() =>
                    fetchSummary({
                      question: queryState.question,
                      query: queryState.generatedQuery,
                      queryResults: results,
                    })
                  }
                  data-test-subj="queryAssist_summary_buttons_generate"
                >
                  {i18n.translate('queryEnhancements.queryAssist.summary.generateSummary', {
                    defaultMessage: 'Generate summary',
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiSplitPanel.Inner>
      <EuiSplitPanel.Inner paddingSize={'s'}>{getPanelMessage()}</EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
