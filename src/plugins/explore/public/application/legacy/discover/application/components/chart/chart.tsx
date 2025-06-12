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
import classNames from 'classnames';
import { DataPublicPluginStart, search } from '../../../../../../../../data/public';
import { TimechartHeader, TimechartHeaderBucketInterval } from './timechart_header';
import { DiscoverHistogram } from './histogram/histogram';
import { ExploreServices } from '../../../../../../types';
import { Chart } from './utils';
import { useDispatch, useSelector } from '../../utils/state_management';
import { setInterval } from '../../../../../utils/state_management/slices/legacy_slice';
import { executeQueries } from '../../../../../utils/state_management/actions/query_actions';
import { clearResults } from '../../../../../utils/state_management/slices/results_slice';

interface DiscoverChartProps {
  bucketInterval?: TimechartHeaderBucketInterval;
  chartData?: Chart;
  config: IUiSettingsClient;
  data: DataPublicPluginStart;
  services: ExploreServices;
  isEnhancementsEnabled: boolean;
}

export const DiscoverChart = ({
  bucketInterval,
  chartData,
  config,
  data,
  services,
  isEnhancementsEnabled,
}: DiscoverChartProps) => {
  const { from, to } = data.query.timefilter.timefilter.getTime();
  const timeRange = {
    from: dateMath.parse(from)?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
    to: dateMath.parse(to, { roundUp: true })?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') || '',
  };
  const { interval } = useSelector((state) => state.legacy);
  const dispatch = useDispatch();
  const onChangeInterval = (newInterval: string) => {
    dispatch(setInterval(newInterval));

    // EXPLICIT cache clear - same pattern as other triggers
    dispatch(clearResults());

    // Execute queries - interval will be picked up from Redux state
    dispatch(executeQueries({ services }) as any);
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

  const timeChartHeader = (
    <div className="dscChart__TimechartHeader" data-test-subj="dscChartTimechartHeader">
      <TimechartHeader
        bucketInterval={bucketInterval}
        dateFormat={config.get('dateFormat')}
        timeRange={timeRange}
        options={search.aggs.intervalOptions}
        onChangeInterval={onChangeInterval}
        stateInterval={interval || ''}
        isEnhancementsEnabled={isEnhancementsEnabled}
      />
    </div>
  );

  const toggleLabel = i18n.translate('explore.discover.histogram.collapse', {
    defaultMessage: 'Toggle histogram',
  });

  const toggle = (
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
  );

  const queryEnhancedHistogramHeader = (
    <EuiFlexGroup
      direction="row"
      gutterSize="m"
      className="dscChart__chartheader"
      data-test-subj="dscChartChartheader"
    >
      <EuiFlexItem grow={false}>{toggle}</EuiFlexItem>
      <EuiFlexItem grow={true} style={{ justifyContent: 'flex-start' }}>
        {timeChartHeader}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const histogramHeader = (
    <EuiFlexGroup direction="row" justifyContent="spaceBetween" gutterSize="xs">
      <EuiFlexItem grow={false}>{timeChartHeader}</EuiFlexItem>
    </EuiFlexGroup>
  );

  const showHistogram = !isEnhancementsEnabled || !isCollapsed;

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="none"
      className={classNames('dscChart__wrapper', {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'dscChart__wrapper--enhancement': isEnhancementsEnabled,
      })}
      data-test-subj="dscChartWrapper"
    >
      {isEnhancementsEnabled ? queryEnhancedHistogramHeader : histogramHeader}
      {chartData && showHistogram && (
        <EuiFlexItem grow={false}>
          <section
            aria-label={i18n.translate('explore.discover.histogramOfFoundDocumentsAriaLabel', {
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
