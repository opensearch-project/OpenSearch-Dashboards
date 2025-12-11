/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_histogram.scss';

import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { useDispatch, useSelector } from 'react-redux';
import { DataPublicPluginStart, search } from '../../../../data/public';
import { TimechartHeader, TimechartHeaderBucketInterval } from './timechart_header';
import { DiscoverHistogram } from './histogram/histogram';
import { ExploreServices } from '../../types';
import { Chart } from './utils';
import {
  setInterval,
  clearResults,
  clearResultsByKey,
  clearQueryStatusMap,
  clearQueryStatusMapByKey,
  setShowHistogram,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { RootState } from '../../application/utils/state_management/store';
import {
  executeQueries,
  executeHistogramQuery,
  prepareHistogramCacheKey,
  defaultPrepareQueryString,
  executeDataTableQuery,
} from '../../application/utils/state_management/actions/query_actions';
import { ResultsSummary } from '../results_summary/results_summary';
import { selectSummaryAgentIsAvailable } from '../../application/utils/state_management/selectors';
import { usePersistedChartState } from './utils/use_persist_chart_state';
import { getUsageCollector } from '../../services/usage_collector';
import { useMetrics } from '../results_summary/use_metrics';
import { ToggleButtonGroup } from './timechart_header/toggle_button_group';
import { ActionButtons } from '../results_summary/action_buttons';

interface ExploreLogsChartProps {
  bucketInterval?: TimechartHeaderBucketInterval;
  chartData?: Chart;
  config: IUiSettingsClient;
  data: DataPublicPluginStart;
  services: ExploreServices;
  showHistogram: boolean;
}

export const ExploreLogsChart = ({
  bucketInterval,
  chartData,
  config,
  data,
  services,
  showHistogram,
}: ExploreLogsChartProps) => {
  const { from, to } = data.query.timefilter.timefilter.getTime();
  const timeRange = useMemo(() => {
    return {
      from: dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
      to: dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
    };
  }, [from, to]);
  const { interval } = useSelector((state: RootState) => state.legacy);
  const query = useSelector((state: RootState) => state.query);
  const breakdownField = useSelector((state: RootState) => state.queryEditor.breakdownField);
  const dispatch = useDispatch();
  const histogramCacheKey = prepareHistogramCacheKey(query, !!breakdownField);
  const dataTableCacheKey = defaultPrepareQueryString(query);
  const onChangeInterval = (newInterval: string) => {
    dispatch(setInterval(newInterval));
    dispatch(clearResultsByKey(histogramCacheKey));
    dispatch(clearQueryStatusMapByKey(histogramCacheKey));
    dispatch(
      executeHistogramQuery({
        services,
        cacheKey: histogramCacheKey,
        interval: newInterval,
        queryString: defaultPrepareQueryString(query),
      })
    );
    dispatch(
      executeDataTableQuery({
        services,
        cacheKey: dataTableCacheKey,
        queryString: dataTableCacheKey,
      })
    );
  };
  const timefilterUpdateHandler = useCallback(
    (ranges: { from: number; to: number }) => {
      dispatch(
        setDateRange({
          from: moment(ranges.from).toISOString(),
          to: moment(ranges.to).toISOString(),
        })
      );
      dispatch(clearResults());
      dispatch(clearQueryStatusMap());
      dispatch(executeQueries({ services }));
    },
    [dispatch, services]
  );

  const [summary, setSummary] = useState('');
  const { toggleIdSelected, updateToggleId } = usePersistedChartState('histogram');

  const assistantEnabled = services.core.application.capabilities?.assistant?.enabled;
  const isSummaryAgentAvailable = useSelector(selectSummaryAgentIsAvailable);
  const isSummaryAvailable = isSummaryAgentAvailable && Boolean(assistantEnabled);

  const usageCollection = getUsageCollector();
  const { reportMetric, reportCountMetric } = useMetrics(usageCollection);

  const buttonGroup = (
    <>
      <ActionButtons
        toggleIdSelected={toggleIdSelected}
        summary={summary}
        reportMetric={reportMetric}
      />

      <ToggleButtonGroup
        toggleIdSelected={toggleIdSelected}
        onToggleChange={updateToggleId}
        isSummaryAvailable={isSummaryAvailable || false}
      />
    </>
  );

  const timeChartHeader = (
    <div className="exploreChart__TimechartHeader" data-test-subj="dscChartTimechartHeader">
      <TimechartHeader
        title={i18n.translate('explore.discover.timechartHeader.logCount', {
          defaultMessage: 'Log count',
        })}
        bucketInterval={bucketInterval}
        dateFormat={config.get('dateFormat')}
        timeRange={timeRange}
        options={search.aggs.intervalOptions}
        onChangeInterval={onChangeInterval}
        stateInterval={interval || ''}
        toggleIdSelected={toggleIdSelected}
        additionalControl={buttonGroup}
        services={services}
      />
    </div>
  );

  const toggleLabel = i18n.translate('explore.discover.histogram.collapse', {
    defaultMessage: 'Toggle histogram',
  });

  const toggle = (
    <EuiToolTip content={toggleLabel}>
      <EuiButtonIcon
        aria-expanded={showHistogram}
        aria-label={toggleLabel}
        data-test-subj="histogramCollapseBtn"
        onClick={() => dispatch(setShowHistogram(!showHistogram))}
        iconType={showHistogram ? 'arrowDown' : 'arrowRight'}
        iconSize="m"
        color="text"
      />
    </EuiToolTip>
  );

  const queryEnhancedHistogramHeader = (
    <EuiFlexGroup
      direction="row"
      gutterSize="m"
      className="exploreChart__chartheader"
      data-test-subj="dscChartChartheader"
    >
      <EuiFlexItem grow={false}>{toggle}</EuiFlexItem>
      <EuiFlexItem grow={true} style={{ justifyContent: 'flex-start' }}>
        {timeChartHeader}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  // Show histogram if the current toggle is histogram or no summary feature available but toggle
  // previously selected summary
  const displayHistogram =
    chartData &&
    ((showHistogram && toggleIdSelected === 'histogram') ||
      (showHistogram && toggleIdSelected === 'summary' && !isSummaryAvailable));

  const displayResultsSummary =
    chartData && showHistogram && isSummaryAvailable && toggleIdSelected === 'summary';

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="none"
      className="exploreChart__wrapper exploreChart__wrapper--enhancement"
      data-test-subj="dscChartWrapper"
    >
      {queryEnhancedHistogramHeader}
      {displayHistogram && (
        <EuiFlexItem grow={false}>
          <section
            aria-label={i18n.translate('explore.discover.histogramOfFoundDocumentsAriaLabel', {
              defaultMessage: 'Histogram of found documents',
            })}
            className="exploreTimechart"
            data-test-subj="dscTimechart"
          >
            <div className="exploreHistogram" data-test-subj="discoverChart">
              <DiscoverHistogram
                chartData={chartData}
                chartType={'HistogramBar'}
                timefilterUpdateHandler={timefilterUpdateHandler}
                services={services}
              />
            </div>
          </section>
        </EuiFlexItem>
      )}
      {displayResultsSummary && (
        <ResultsSummary
          summary={summary}
          setSummary={setSummary}
          reportCountMetric={reportCountMetric}
        />
      )}
    </EuiFlexGroup>
  );
};
