/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SaveQueryButton } from './save_query';
import { DateTimeRangePicker } from './date_time_range_picker';
import { RunQueryButton } from './run_query_button';
import { FilterPanelToggle } from './filter_panel_toggle';
import { RecentQueriesButton } from './recent_queries_button';
import { useDatasetContext } from '../../../application/context';
import { DetectedLanguage } from './detected_language';
import { QueryResult } from '../../../../../data/public';
import { selectQueryStatus } from '../../../application/utils/state_management/selectors';

import './query_panel_footer.scss';

export const QueryPanelFooter = () => {
  const { dataset } = useDatasetContext();
  const showDatePicker = Boolean(dataset?.timeFieldName);
  const queryStatus = useSelector(selectQueryStatus);

  return (
    <div className="queryPanel__footer">
      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="center"
        gutterSize="xs"
        responsive={true}
        wrap
      >
        {/* Left Section */}
        <EuiFlexItem grow={1} className="queryPanel__footer__minWidth0">
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            <EuiFlexItem grow={false}>
              <FilterPanelToggle />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RecentQueriesButton />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <SaveQueryButton />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <QueryResult queryStatus={queryStatus} />
            </EuiFlexItem>
            <EuiFlexItem grow={false} className="queryPanel__footer__showInputTypeWrapper">
              <DetectedLanguage />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Right Section */}
        <EuiFlexItem grow={false} className="queryPanel__footer__minWidth0">
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            {/* TODO: Actions should go here */}
            {showDatePicker && (
              <EuiFlexItem grow={false} className="queryPanel__footer__dateTimeRangePickerWrapper">
                <DateTimeRangePicker />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false} className="queryPanel__footer__minWidth0">
              <RunQueryButton />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
