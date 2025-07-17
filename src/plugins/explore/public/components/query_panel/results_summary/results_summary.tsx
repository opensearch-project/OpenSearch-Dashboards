/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { isEmpty } from 'lodash';

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { EditorMode } from '../../../application/utils/state_management/types';
import { ExploreServices } from '../../../types';
import { ResultsSummaryButton, FeedbackStatus } from './results_summary_button';
import { RootState } from '../../../application/utils/state_management/store';
import { useMetrics } from './use_metrics';
import { selectSummaryAgentIsAvailable } from '../../../application/utils/state_management/selectors';
import { getUsageCollector } from '../../../services/usage_collector';
import { ResultStatus } from '../../../../../data/public';

const SUMMARY_REQUEST_SAMPLE_SIZE = 10;

export const ResultsSummary: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { core, http } = services;

  const isSummaryAgentAvailable = useSelector(selectSummaryAgentIsAvailable);

  const [summary, setSummary] = useState(''); // store fetched data
  const [loading, setLoading] = useState(true); // track loading state
  const [feedback, setFeedback] = useState(FeedbackStatus.NONE);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  const usageCollection = getUsageCollector();
  const { reportMetric, reportCountMetric } = useMetrics(usageCollection);

  const {
    queryState,
    lastExecutedPrompt,
    dataSetState,
    queryResults,
    editorMode,
    queryStatus,
  } = useSelector((state: RootState) => ({
    queryState: state.query,
    lastExecutedPrompt: state.queryEditor.lastExecutedPrompt,
    dataSetState: state.query.dataset,
    queryResults: state.results[state.query.query as string]?.hits?.hits,
    editorMode: state.queryEditor.editorMode,
    queryStatus: state.queryEditor.overallQueryStatus.status,
  }));

  const assistantEnabled = core.application.capabilities?.assistant?.enabled;
  const queryExecutedInPromptMode = useMemo(
    // Only read the mode when the query result changed
    () => [EditorMode.DualPrompt, EditorMode.SinglePrompt].includes(editorMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryResults]
  );

  // The visibility of panel action buttons: thumbs up/down and copy to clipboard buttons
  const actionButtonVisible =
    Boolean(summary) && !loading && queryExecutedInPromptMode && !generateError;

  const fetchSummary = useCallback(
    async ({ question, query, queryRes }: { question: string; query: string; queryRes: any }) => {
      if (isEmpty(queryRes) && !isEmpty(summary) && queryStatus !== ResultStatus.READY) {
        return;
      }

      setGenerateError(false);
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
        setGenerateError(true);
      } finally {
        setLoading(false);
      }
    },
    [http, reportCountMetric, dataSetState?.dataSource?.id, summary, queryStatus]
  );

  useEffect(() => {
    // Close popover and reset summary when a query is re-executed
    setIsPopoverOpen(false);
    setSummary('');
  }, [queryResults, setIsPopoverOpen, setSummary]);

  const autoTriggered = useRef(false);
  // Trigger auto generating for the first query
  useEffect(() => {
    if (!autoTriggered.current && !isEmpty(queryResults)) {
      autoTriggered.current = true;
      fetchSummary({
        question: lastExecutedPrompt,
        query: queryState.query,
        queryRes: queryResults,
      });
    }
  }, [queryResults, queryState.query, lastExecutedPrompt, fetchSummary]);

  const onFeedback = useCallback(
    (satisfied: boolean) => {
      if (feedback !== FeedbackStatus.NONE) return;
      const feedbackStatus = satisfied ? FeedbackStatus.THUMB_UP : FeedbackStatus.THUMB_DOWN;
      setFeedback(feedbackStatus);
      reportMetric(feedbackStatus);
    },
    [feedback, reportMetric]
  );

  if (!assistantEnabled || !isSummaryAgentAvailable) {
    return null;
  }

  return (
    <ResultsSummaryButton
      actionButtonVisible={actionButtonVisible}
      feedback={feedback}
      onFeedback={onFeedback}
      summary={summary}
      loading={loading}
      onGenerateSummary={() =>
        fetchSummary({
          question: lastExecutedPrompt,
          query: queryState.query as string,
          queryRes: queryResults,
        })
      }
      sampleSize={SUMMARY_REQUEST_SAMPLE_SIZE}
      isPopoverOpen={isPopoverOpen}
      setIsPopoverOpen={setIsPopoverOpen}
      generateError={generateError}
    />
  );
};
