/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_histogram.scss';

import React, { useCallback } from 'react';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
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

interface DiscoverChartProps {
  bucketInterval?: TimechartHeaderBucketInterval;
  chartData?: Chart;
  config: IUiSettingsClient;
  data: DataPublicPluginStart;
  hits: number;
  resetQuery: () => void;
  showResetButton?: boolean;
  isTimeBased?: boolean;
  services: DiscoverServices;
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
}: DiscoverChartProps) => {
  const { refetch$ } = useDiscoverContext();
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

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false} className="dscChart__hitsCounter">
        <HitsCounter
          hits={hits > 0 ? hits : 0}
          showResetButton={showResetButton}
          onResetQuery={resetQuery}
        />
      </EuiFlexItem>
      {isTimeBased && (
        <EuiFlexItem className="dscChart__TimechartHeader">
          <TimechartHeader
            bucketInterval={bucketInterval}
            dateFormat={config.get('dateFormat')}
            timeRange={timeRange}
            options={search.aggs.intervalOptions}
            onChangeInterval={onChangeInterval}
            stateInterval={interval || ''}
          />
        </EuiFlexItem>
      )}
      {isTimeBased && chartData && (
        <EuiFlexItem grow={false}>
          <section
            aria-label={i18n.translate('discover.histogramOfFoundDocumentsAriaLabel', {
              defaultMessage: 'Histogram of found documents',
            })}
            className="dscTimechart"
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
