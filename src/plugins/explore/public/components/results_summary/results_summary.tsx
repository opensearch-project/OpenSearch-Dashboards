/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { isEmpty } from 'lodash';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { ResultsSummaryContent } from './results_summary_content';
import { RootState } from '../../application/utils/state_management/store';
import {
  selectDataset,
  selectQueryStatus,
} from '../../application/utils/state_management/selectors';
import { ResultStatus } from '../../../../data/public';

const SUMMARY_REQUEST_SAMPLE_SIZE = 10;

interface ResultsSummaryProps {
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  reportCountMetric: (metric: string, count: number) => void;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  summary,
  setSummary,
  reportCountMetric,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { http } = services;

  const queryState = useSelector((state: RootState) => state.query);
  const lastExecutedPrompt = useSelector(
    (state: RootState) => state.queryEditor.lastExecutedPrompt
  );
  const dataSetState = useSelector(selectDataset);
  const queryResults = useSelector(
    (state: RootState) => state.results[state.query.query as string]?.hits?.hits
  );
  const queryStatus = useSelector(selectQueryStatus);

  const [loading, setLoading] = useState(false); // track loading state

  const fetchSummary = useCallback(
    async ({ question, query, queryRes }: { question: string; query: string; queryRes: any }) => {
      if (isEmpty(queryRes) && !isEmpty(summary) && queryStatus.status !== ResultStatus.READY) {
        return;
      }

      setLoading(true);

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
    [http, reportCountMetric, dataSetState?.dataSource?.id, summary, queryStatus, setSummary]
  );

  useEffect(() => {
    if (isEmpty(summary) && !isEmpty(queryResults)) {
      fetchSummary({
        question: lastExecutedPrompt,
        query: queryState.query,
        queryRes: queryResults,
      });
    }
  }, [queryResults, queryState.query, lastExecutedPrompt, fetchSummary, summary]);

  return <ResultsSummaryContent summary={summary} loading={loading} />;
};
