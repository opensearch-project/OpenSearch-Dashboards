/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  EuiSplitPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiIconTip,
  EuiSmallButtonIcon,
  EuiSpacer,
  EuiCopy,
} from '@elastic/eui';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { IDataFrame } from 'src/plugins/data/common';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { merge, of } from 'rxjs';
import { filter, distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { HttpSetup } from 'opensearch-dashboards/public';
import { useQueryAssist } from '../hooks';
import { DataPublicPluginSetup, QueryEditorExtensionDependencies } from '../../../../data/public';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { CoreSetup } from '../../../../../core/public';
import { QueryAssistContextType } from '../../../common/query_assist';
import sparkleHollowSvg from '../../assets/sparkle_hollow.svg';
import sparkleSolidSvg from '../../assets/sparkle_solid.svg';
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
  const { question$, isQuerySummaryCollapsed, isSummaryAgentAvailable } = useQueryAssist();
  const METRIC_APP = `query-assist`;
  const afterFeedbackTip = i18n.translate('queryEnhancements.queryAssist.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });
  const errorPrompt = i18n.translate('queryEnhancements.queryAssist.summary.errorPrompt', {
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

  useEffect(() => {
    const subscription = query.queryString.getUpdates$().subscribe((_query) => {
      selectedDataset.current = _query?.dataset;
    });
    return () => subscription.unsubscribe();
  }, [query.queryString]);

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
    let dataStack: Array<string | IDataFrame | undefined> = [];
    const subscription = merge(
      question$.pipe(
        filter((value) => !isEmpty(value)),
        mergeMap((value) => of({ type: QueryAssistContextType.QUESTION as const, data: value }))
      ),
      query.queryString.getUpdates$().pipe(
        filter((value) => !isEmpty(value)),
        mergeMap((value) => of({ type: QueryAssistContextType.QUERY as const, data: value }))
      ),
      search.df?.df$?.pipe(
        distinctUntilChanged(),
        filter((value) => !isEmpty(value) && !isEmpty(value?.fields)),
        mergeMap((value) => of({ type: QueryAssistContextType.DATA as const, data: value }))
      )
    ).subscribe((value) => {
      // to ensure we only trigger summary when user hits the query assist button with natural language input
      switch (value.type) {
        case QueryAssistContextType.QUESTION:
          dataStack = [value.data];
          break;
        case QueryAssistContextType.QUERY:
          if (dataStack.length === 1) {
            dataStack.push(value.data.query as string);
          }
          break;
        case QueryAssistContextType.DATA:
          if (dataStack.length === 2) {
            dataStack.push(value.data);
            fetchSummary({
              question: dataStack[0] as string,
              query: dataStack[1] as string,
              queryResults: convertResult(dataStack[2] as IDataFrame),
            });
            dataStack = [];
          }
          break;
        default:
          break;
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [question$, query.queryString, search.df?.df$, fetchSummary]);

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

  if (
    props.dependencies.isCollapsed ||
    isQuerySummaryCollapsed ||
    !isEnabledByCapability ||
    !isSummaryAgentAvailable
  ) {
    return null;
  }

  const isDarkMode = props.core.uiSettings.get('theme:darkMode');
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
            <EuiIcon type={isDarkMode ? sparkleSolidSvg : sparkleHollowSvg} size="m" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <strong>
                {i18n.translate('queryEnhancements.queryAssist.summary.panelTitle', {
                  defaultMessage: 'Response',
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
          {summary && !loading && (
            <EuiFlexItem grow={true} data-test-subj="queryAssist_summary_buttons">
              <EuiFlexGroup alignItems={'center'} justifyContent={'flexEnd'} gutterSize={'xs'}>
                <EuiFlexItem grow={false}>
                  <EuiIconTip
                    type={'iInCircle'}
                    content={`Summary based on first ${sampleSize} records`}
                    aria-label={i18n.translate('queryEnhancements.queryAssist.summary.sampletip', {
                      defaultMessage: 'Summary based on first {sampleSize} records',
                      values: { sampleSize },
                    })}
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
                <EuiSpacer size="m" style={{ borderLeft: '1px solid #D3DAE6', height: '20px' }} />
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
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiSplitPanel.Inner>
      <EuiSplitPanel.Inner paddingSize={'s'}>
        {!summary && !loading && (
          <EuiText size="s" data-test-subj="queryAssist_summary_empty_text">
            {i18n.translate('queryEnhancements.queryAssist.summary.placeholder', {
              defaultMessage: `Ask a question to generate summary.`,
            })}
          </EuiText>
        )}
        {loading && (
          <EuiText size="s" data-test-subj="queryAssist_summary_loading">
            {i18n.translate('queryEnhancements.queryAssist.summary.generating', {
              defaultMessage: `Generating response...`,
            })}
          </EuiText>
        )}
        {summary && !loading && (
          <EuiText size="s" data-test-subj="queryAssist_summary_result">
            {summary}
          </EuiText>
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
