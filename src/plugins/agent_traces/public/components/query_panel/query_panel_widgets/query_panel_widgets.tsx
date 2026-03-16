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
import { AgentTracesServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
// @ts-ignore - allow side-effect scss import without type declarations
import './query_panel_widgets.scss';
import { AskAIButton } from './ask_ai_button';

export const QueryPanelWidgets = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { queryPanelActionsRegistry } = services;

  return (
    <div className="agentTracesQueryPanelWidgets">
      {/* Left Section */}
      <div className="agentTracesQueryPanelWidgets__left">
        <LanguageToggle />
        <DatasetSelectWidget />
        <div className="agentTracesQueryPanelWidgets__verticalSeparator" />
        <RecentQueriesButton />
        <div className="agentTracesQueryPanelWidgets__verticalSeparator" />
        <SaveQueryButton />
        {!queryPanelActionsRegistry.isEmpty() ? (
          <>
            <div className="agentTracesQueryPanelWidgets__verticalSeparator" />
            <QueryPanelActions registry={queryPanelActionsRegistry} />
          </>
        ) : null}
      </div>

      {/* Right Section */}
      <div className="agentTracesQueryPanelWidgets__right">
        <AskAIButton />
      </div>
    </div>
  );
};
