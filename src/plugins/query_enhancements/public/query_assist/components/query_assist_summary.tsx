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

import React, { useEffect, useState, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { IDataFrame } from 'src/plugins/data/common';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { merge, of } from 'rxjs';
import { filter, distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { HttpSetup } from 'opensearch-dashboards/public';
import { Dataset } from '../../../../data/common';
import { useQueryAssist } from '../hooks';
import { DataPublicPluginSetup, QueryEditorExtensionDependencies } from '../../../../data/public';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { CoreSetup } from '../../../../../core/public';
import { QueryAssistContextType } from '../../../common/query_assist';
import sparkleHollowSvg from '../../assets/sparkle_hollow.svg';
import sparkleSolidSvg from '../../assets/sparkle_solid.svg';

export interface QueryContext {
  question: string;
  query: string;
  queryResults: any;
}

interface QueryAssistSummaryProps {
  data: DataPublicPluginSetup;
  http: HttpSetup;
  usageCollection: UsageCollectionSetup;
  dependencies: QueryEditorExtensionDependencies;
  core: CoreSetup;
}

export const QueryAssistSummary: React.FC<QueryAssistSummaryProps> = (props) => {
  const { query, search } = props.data;
  const [summary, setSummary] = useState(null); // store fetched data
  const [loading, setLoading] = useState(false); // track loading state
  const [queryContext, setQueryContext] = useState<QueryContext | undefined>(undefined);
  const [feedback, setFeedback] = useState(false);
  const [isEnabledByCapability, setIsEnabledByCapability] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    query.queryString.getQuery()?.dataset
  );
  const { question$, isQueryAssistCollapsed } = useQueryAssist();
  const METRIC_APP = `query-assist`;
  const afterFeedbackTip = i18n.translate('queryEnhancements.queryAssist.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });

  const sampleSize = 10;

  const convertResult = (body: IDataFrame) => {
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
      setSelectedDataset(_query?.dataset);
    });
    return () => subscription.unsubscribe();
  }, [query.queryString]);

  useEffect(() => {
    let dataStack = [];
    const subscription = merge(
      question$.pipe(
        filter((value) => !isEmpty(value)),
        mergeMap((value) => of({ type: QueryAssistContextType.QUESTION, data: value }))
      ),
      query.queryString.getUpdates$().pipe(
        filter((value) => !isEmpty(value)),
        mergeMap((value) => of({ type: QueryAssistContextType.QUERY, data: value }))
      ),
      search.df?.df$?.pipe(
        distinctUntilChanged(),
        filter((value) => !isEmpty(value) && !isEmpty(value?.fields)),
        mergeMap((value) => of({ type: QueryAssistContextType.DATA, data: value }))
      )
    ).subscribe((value) => {
      // to ensure we only trigger summary when user hits the query assist button with natual language input
      switch (value.type) {
        case QueryAssistContextType.QUESTION:
          dataStack = [value.data];
          break;
        case QueryAssistContextType.QUERY:
          if (dataStack.length === 1) {
            dataStack.push(value.data.query);
          }
          break;
        case QueryAssistContextType.DATA:
          if (dataStack.length === 2) {
            dataStack.push(value.data);
            setQueryContext({
              question: dataStack[0],
              query: dataStack[1],
              queryResults: convertResult(dataStack[2]),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (isEmpty(queryContext?.queryResults)) return;
      setLoading(true);
      setSummary(null);
      setFeedback(false);
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
            dataSourceId: selectedDataset?.dataSource?.id,
          },
        });
        setSummary(response);
        reportCountMetric(SUCCESS_METRIC, 1);
      } catch (error) {
        reportCountMetric(SUCCESS_METRIC, 0);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryContext]);

  useEffect(() => {
    props.core.getStartServices().then(([coreStart, depsStart]) => {
      const assistantEnabled = !!coreStart.application.capabilities?.assistant?.enabled;
      setIsEnabledByCapability(assistantEnabled);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFeedback = useCallback(
    (satisfied: boolean) => {
      if (feedback) return;
      setFeedback(true);
      reportMetric(satisfied ? 'thumbup' : 'thumbdown');
    },
    [feedback, reportMetric]
  );

  if (props.dependencies.isCollapsed || isQueryAssistCollapsed || !isEnabledByCapability)
    return null;
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
                      defaultMessage: `Summary based on first ${sampleSize} records`,
                    })}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSmallButtonIcon
                    aria-label="feedback thumbs up"
                    color="text"
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
                <EuiFlexItem grow={false}>
                  <EuiSmallButtonIcon
                    aria-label="feedback thumbs down"
                    color="text"
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
