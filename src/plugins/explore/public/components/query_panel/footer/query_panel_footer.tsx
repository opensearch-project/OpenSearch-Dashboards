/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SaveQueryButton } from './save_query';
import { DateTimeRangePicker } from './date_time_range_picker';
import { RunQueryButton } from './run_query_button';
import { QueryError } from './query_error';
import { FilterPanelToggle } from './filter_panel_toggle';
import { RecentQueriesButton } from './recent_queries_button';
import { useIndexPatternContext } from '../../../application/components/index_pattern_context';
import { DetectedLanguage } from './detected_language';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';

import './query_panel_footer.scss';

export const QueryPanelFooter = () => {
  const { indexPattern } = useIndexPatternContext();
  const showDatePicker = Boolean(indexPattern?.timeFieldName);

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
              <QueryError
                // TODO: Update query error with query slice object and remove below mocked string
                queryStatus={{
                  status: QueryExecutionStatus.ERROR,
                  body: {
                    error: {
                      error: 'An error occurred while processing the query.', // This is mocked error string
                    },
                  },
                }}
              />
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
