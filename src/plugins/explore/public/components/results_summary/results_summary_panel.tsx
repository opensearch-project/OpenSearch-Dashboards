/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiMarkdownFormat, EuiText } from '@elastic/eui';
import { useEffectOnce } from 'react-use';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { isEmpty } from 'lodash';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { EditorMode, QueryExecutionStatus } from '../../application/utils/state_management/types';
import { ExploreServices } from '../../types';
import { ResultsSummary, FeedbackStatus } from './results_summary';
import { RootState } from '../../application/utils/state_management/store';
import { useMetrics } from './use_metrics';

import './results_summary_panel.scss';
import { selectSummaryAgentIsAvailable } from '../../application/utils/state_management/selectors';

interface ResultsSummaryPanelProps {
  usageCollection?: UsageCollectionSetup;
  brandingLabel?: string;
}

type AccordionState = 'closed' | 'open';

const ACCORDION_STATE_LOCAL_STORAGE_KEY = 'resultsSummary.summaryAccordionState';

const SUMMARY_REQUEST_SAMPLE_SIZE = 10;

export const ResultsSummaryPanel: React.FC<ResultsSummaryPanelProps> = (props) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { core, http } = services;

  const isSummaryAgentAvailable = useSelector(selectSummaryAgentIsAvailable);

  const [accordionState, setAccordionState] = useState<AccordionState>('closed');
  const [summary, setSummary] = useState(''); // store fetched data
  const [loading, setLoading] = useState(false); // track loading state
  const [feedback, setFeedback] = useState(FeedbackStatus.NONE);

  const { reportMetric, reportCountMetric } = useMetrics(props.usageCollection);

  const { queryState, lastExecutedPrompt, dataSetState, queryResults, editorMode } = useSelector(
    (state: RootState) => ({
      queryState: state.query,
      lastExecutedPrompt: state.queryEditor.lastExecutedPrompt,
      dataSetState: state.query.dataset,
      queryResults: state.results[state.query.query as string]?.hits?.hits,
      editorMode: state.queryEditor.editorMode,
    })
  );

  const assistantEnabled = core.application.capabilities?.assistant?.enabled;
  const queryExecutedInPromptMode = useMemo(
    // Only read the mode when the query result changed
    () => [EditorMode.DualPrompt, EditorMode.SinglePrompt].includes(editorMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryResults]
  );

  const canGenerateSummary =
    Boolean(queryResults?.length) && Boolean(queryState.query) && queryExecutedInPromptMode;

  // The visibility of panel action buttons: thumbs up/down and copy to clipboard buttons
  const actionButtonVisible = Boolean(summary) && !loading && queryExecutedInPromptMode;

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

  const fetchSummary = useCallback(
    async ({ question, query, queryRes }: { question: string; query: string; queryRes: any }) => {
      setSummary('');
      if (isEmpty(queryRes)) {
        return;
      }

      setLoading(true);
      setFeedback(FeedbackStatus.NONE);

      const successMetric = 'generated';
      try {
        const actualSampleSize = Math.min(SUMMARY_REQUEST_SAMPLE_SIZE, queryRes?.length);
        const dataString = JSON.stringify(queryRes?.slice(0, actualSampleSize));
        const payload = `'${dataString}'`;
        // TODO: OSD core should not rely on plugin APIs, refactor this once this RFC is
        // implemented #9859
        const response = await http.post('/api/assistant/data2summary', {
          body: JSON.stringify({
            sample_data: payload,
            sample_count: actualSampleSize,
            total_count: queryRes?.length,
            question,
            ppl: query,
          }),
          query: {
            dataSourceId: dataSetState?.dataSource?.id,
          },
        });
        setSummary(response);
        reportCountMetric(successMetric, 1);
      } catch (error) {
        reportCountMetric(successMetric, 0);
        setSummary(
          i18n.translate('explore.resultsSummary.summary.errorPrompt', {
            defaultMessage: 'I am unable to respond to this query. Try another question.',
          })
        );
      } finally {
        setLoading(false);
      }
    },
    [http, reportCountMetric, dataSetState?.dataSource?.id]
  );

  useEffect(() => {
    if (
      accordionState === 'open' &&
      canGenerateSummary &&
      !summary &&
      !loading &&
      lastExecutedPrompt &&
      lastExecutedPrompt !== ''
    ) {
      fetchSummary({
        question: lastExecutedPrompt,
        query: queryState.query as string,
        queryRes: queryResults,
      });
    }
  }, [
    canGenerateSummary,
    lastExecutedPrompt,
    queryState.query,
    queryResults,
    fetchSummary,
    accordionState,
    summary,
    loading,
  ]);

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
  }, [loading, summary]);

  const onClickAccordion = (isOpen: boolean) => {
    const newState = isOpen ? 'open' : 'closed';
    setAccordionState(newState);
    localStorage.setItem(ACCORDION_STATE_LOCAL_STORAGE_KEY, newState);
  };

  if (!assistantEnabled || !isSummaryAgentAvailable) {
    return null;
  }

  return (
    <ResultsSummary
      accordionState={accordionState}
      onClickAccordion={onClickAccordion}
      actionButtonVisible={actionButtonVisible}
      feedback={feedback}
      onFeedback={onFeedback}
      summary={summary}
      canGenerateSummary={canGenerateSummary}
      loading={loading}
      onGenerateSummary={() =>
        fetchSummary({
          question: lastExecutedPrompt,
          query: queryState.query as string,
          queryRes: queryResults,
        })
      }
      brandingLabel={props.brandingLabel}
      sampleSize={SUMMARY_REQUEST_SAMPLE_SIZE}
      getPanelMessage={getPanelMessage}
    />
  );
};
