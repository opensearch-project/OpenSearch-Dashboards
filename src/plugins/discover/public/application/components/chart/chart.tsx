/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_histogram.scss';

import React, { useCallback, useState } from 'react';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DataPublicPluginStart, search } from '../../../../../data/public';
import { HitsCounter } from './hits_counter';
import { TimechartHeader, TimechartHeaderBucketInterval } from './timechart_header';
import { DiscoverHistogram } from './histogram/histogram';
import { DiscoverServices } from '../../../build_services';
import { Chart } from './utils';
import { useDiscoverContext } from '../../view_components/context';
import { setInterval, useDispatch, useSelector } from '../../utils/state_management';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { DownloadCsvButton } from './download_csv_button';

interface DiscoverChartProps {
  bucketInterval?: TimechartHeaderBucketInterval;
  chartData?: Chart;
  config: IUiSettingsClient;
  data: DataPublicPluginStart;
  hits?: number;
  resetQuery: () => void;
  showResetButton?: boolean;
  isTimeBased?: boolean;
  services: DiscoverServices;
  isEnhancementsEnabled: boolean;
  discoverOptions: any;
  rows?: OpenSearchSearchHit[];
}

export const DiscoverChart = ({
  bucketInterval,
  chartData,
  config,
  data,
  hits,
  resetQuery,
  isTimeBased,
  services,
  showResetButton = false,
  isEnhancementsEnabled,
  discoverOptions,
  rows,
}: DiscoverChartProps) => {
  const { indexPattern, refetch$ } = useDiscoverContext();
  const { from, to } = data.query.timefilter.timefilter.getTime();
  const timeRange = {
    from: dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
    to: dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
  };
  const { interval } = useSelector((state) => state.discover);
  const dispatch = useDispatch();
  const onChangeInterval = (newInterval: string) => {
    dispatch(setInterval(newInterval));
    refetch$.next();
  };
  const timefilterUpdateHandler = useCallback(
    (ranges: { from: number; to: number }) => {
      data.query.timefilter.timefilter.setTime({
        from: moment(ranges.from).toISOString(),
        to: moment(ranges.to).toISOString(),
        mode: 'absolute',
      });
    },
    [data]
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const histogramIsApplicable = isTimeBased && !!chartData?.values.length;
  const showHistogram = histogramIsApplicable && (!isEnhancementsEnabled || !isCollapsed);

  const hitsCounterFlexItem = hits ? (
    <EuiFlexItem grow={false}>
      <div className="dscChart__hitsCounter" data-test-subj="dscChartHitsCounter">
        <HitsCounter
          hits={hits > 0 ? hits : 0}
          showResetButton={showResetButton}
          onResetQuery={resetQuery}
        />
      </div>
    </EuiFlexItem>
  ) : null;

  const timeChartHeader = histogramIsApplicable ? (
    <div className="dscChart__TimechartHeader" data-test-subj="dscChartTimechartHeader">
      <TimechartHeader
        bucketInterval={bucketInterval}
        dateFormat={config.get('dateFormat')}
        timeRange={timeRange}
        options={search.aggs.intervalOptions}
        onChangeInterval={onChangeInterval}
        stateInterval={interval || ''}
      />
    </div>
  ) : null;

  const exportAsCsvButtonFlexItem =
    rows?.length && indexPattern ? (
      <EuiFlexItem grow={false}>
        <DownloadCsvButton indexPattern={indexPattern} rows={rows} />
      </EuiFlexItem>
    ) : null;

  const toggleLabel = i18n.translate('discover.histogram.collapse', {
    defaultMessage: 'Toggle histogram',
  });

  const toggleFlexItem = histogramIsApplicable ? (
    <EuiFlexItem grow={false}>
      <EuiToolTip content={toggleLabel}>
        <EuiButtonIcon
          aria-expanded={isCollapsed}
          aria-label={toggleLabel}
          data-test-subj="histogramCollapseBtn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          iconType={isCollapsed ? 'arrowRight' : 'arrowDown'}
          iconSize={'s'}
        />
      </EuiToolTip>
    </EuiFlexItem>
  ) : null;

  const queryEnhancedHistogramHeader = (
    <EuiFlexGroup
      direction="row"
      gutterSize="m"
      className="dscChart__chartheader"
      data-test-subj="dscChartChartheader"
    >
      {toggleFlexItem}
      {hitsCounterFlexItem}
      <EuiFlexItem grow={true} style={{ justifyContent: 'flex-start' }}>
        {timeChartHeader}
      </EuiFlexItem>
      {exportAsCsvButtonFlexItem}
    </EuiFlexGroup>
  );

  const histogramHeader = (
    <EuiFlexGroup direction="column" gutterSize="xs">
      <EuiFlexGroup direction="row" gutterSize="s">
        {hitsCounterFlexItem}
        <EuiFlexItem grow={false}>{discoverOptions}</EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexItem grow={false}>{timeChartHeader}</EuiFlexItem>
      {exportAsCsvButtonFlexItem}
    </EuiFlexGroup>
  );

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="none"
      className={isEnhancementsEnabled ? 'dscChart__wrapper' : ''}
      data-test-subj="dscChartWrapper"
    >
      {isEnhancementsEnabled ? queryEnhancedHistogramHeader : histogramHeader}
      {showHistogram && (
        <EuiFlexItem grow={false}>
          <section
            aria-label={i18n.translate('discover.histogramOfFoundDocumentsAriaLabel', {
              defaultMessage: 'Histogram of found documents',
            })}
            className="dscTimechart"
            data-test-subj="dscTimechart"
          >
            <div className="dscHistogram" data-test-subj="discoverChart">
              <DiscoverHistogram
                chartData={chartData}
                timefilterUpdateHandler={timefilterUpdateHandler}
                services={services}
              />
            </div>
          </section>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
