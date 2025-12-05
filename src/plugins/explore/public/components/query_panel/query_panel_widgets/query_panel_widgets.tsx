/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DatasetSelectWidget } from './dataset_select';
import { SaveQueryButton } from './save_query';
import { RecentQueriesButton } from './recent_queries_button';
import { LanguageToggle } from './language_toggle';
import { QueryPanelActions } from './query_panel_actions';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import './query_panel_widgets.scss';
import { AskAIButton } from './ask_ai_button';

export const QueryPanelWidgets = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryPanelActionsRegistry } = services;

  return (
    <div className="exploreQueryPanelWidgets">
      {/* Left Section */}
      <div className="exploreQueryPanelWidgets__left">
        <LanguageToggle />
        <DatasetSelectWidget />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        <RecentQueriesButton />
        <div className="exploreQueryPanelWidgets__verticalSeparator" />
        <SaveQueryButton />
        {!queryPanelActionsRegistry.isEmpty() ? (
          <>
            <div className="exploreQueryPanelWidgets__verticalSeparator" />
            <QueryPanelActions registry={queryPanelActionsRegistry} />
          </>
        ) : null}
      </div>

      {/* Right Section */}
      <div className="exploreQueryPanelWidgets__right">
        <AskAIButton />
      </div>
    </div>
  );
};
