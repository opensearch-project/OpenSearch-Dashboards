/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DatasetSelectWidget } from './dataset_select';
import { SaveQueryButton } from './save_query';
import { RecentQueriesButton } from './recent_queries_button';
import { SelectedLanguage } from './selected_language';
import { QueryPanelError } from './query_panel_error';
import { LanguageToggle } from './language_toggle';
import './query_panel_widgets.scss';

export const QueryPanelWidgets = () => {
  return (
    <div className="exploreQueryPanelWidgets">
      {/* Left Section */}
      <div className="exploreQueryPanelWidgets__left">
        <DatasetSelectWidget />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        <RecentQueriesButton />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        <SaveQueryButton />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        {/* TODO: Actions should go here */}
        <QueryPanelError />
      </div>

      {/* Right Section */}
      <div className="exploreQueryPanelWidgets__right">
        <SelectedLanguage />
        <LanguageToggle />
      </div>
    </div>
  );
};
