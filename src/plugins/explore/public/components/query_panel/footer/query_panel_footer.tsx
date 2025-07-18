/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SaveQueryButton } from './save_query';
import { DateTimeRangePicker } from './date_time_range_picker';
import { RunQueryButton } from './run_query_button';
import { FilterPanelToggle } from './filter_panel_toggle';
import { RecentQueriesButton } from './recent_queries_button';
import { useDatasetContext } from '../../../application/context';
import { SelectedLanguage } from './selected_language';
import { QueryPanelError } from './query_panel_error';
import { LanguageToggle } from './language_toggle';
import './query_panel_footer.scss';

export const QueryPanelFooter = () => {
  const { dataset } = useDatasetContext();
  const showDatePicker = Boolean(dataset?.timeFieldName);

  return (
    <div className="exploreQueryPanelFooter">
      {/* Left Section */}
      <div className="exploreQueryPanelFooter__left">
        <FilterPanelToggle />
        <div className="exploreQueryPanelFooter__verticalSeparator" />
        <RecentQueriesButton />
        <div className="exploreQueryPanelFooter__verticalSeparator" />
        <SaveQueryButton />
        <div className="exploreQueryPanelFooter__verticalSeparator" />
        <SelectedLanguage />
        <LanguageToggle />
        <QueryPanelError />
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
