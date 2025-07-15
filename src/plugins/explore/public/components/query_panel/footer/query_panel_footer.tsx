/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { SaveQueryButton } from './save_query';
import { DateTimeRangePicker } from './date_time_range_picker';
import { RunQueryButton } from './run_query_button';
import { FilterPanelToggle } from './filter_panel_toggle';
import { RecentQueriesButton } from './recent_queries_button';
import { useDatasetContext } from '../../../application/context';
import { DetectedLanguage } from './detected_language';
import { QueryResult, ResultStatus } from '../../../../../data/public';
import {
  selectQueryStatus,
  selectEditorMode,
} from '../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../application/utils/state_management/types';
import './query_panel_footer.scss';

export const QueryPanelFooter = () => {
  const { dataset } = useDatasetContext();
  const showDatePicker = Boolean(dataset?.timeFieldName);
  const queryStatus = useSelector(selectQueryStatus);
  const editorMode = useSelector(selectEditorMode);
  const shouldShowSaveButton = [EditorMode.SingleQuery, EditorMode.DualQuery].includes(editorMode);

  return (
    <div className="exploreQueryPanelFooter">
      {/* Left Section */}
      <div className="exploreQueryPanelFooter__left">
        <FilterPanelToggle />
        <div className="exploreQueryPanelFooter__verticalSeparator" />
        <RecentQueriesButton />
        {shouldShowSaveButton && (
          <>
            <div className="exploreQueryPanelFooter__verticalSeparator" />
            <SaveQueryButton />
          </>
        )}
        <div className="exploreQueryPanelFooter__verticalSeparator" />
        <DetectedLanguage />
        {queryStatus.status === ResultStatus.ERROR && <QueryResult queryStatus={queryStatus} />}
      </div>

      {/* Right Section */}
      <div className="exploreQueryPanelFooter__right">
        {/* TODO: Actions should go here */}
        {showDatePicker && <DateTimeRangePicker />}
        <RunQueryButton />
      </div>
    </div>
  );
};
