/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { LanguageToggle } from './lauguage_toggle';
import { QueryPanelActions } from '../../../components/query_panel/query_panel_widgets/query_panel_actions';

import { DatasetSelectWidget } from './dataset_select';
import '../in_context_editor.scss';
import { SaveQueryButton } from '../component/saveQueryButton';

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
        <SaveQueryButton />
        {!queryPanelActionsRegistry.isEmpty() ? (
          <>
            <div className="exploreQueryPanelWidgets__verticalSeparator" />
            <QueryPanelActions registry={queryPanelActionsRegistry} />
          </>
        ) : null}
      </div>
    </div>
  );
};
