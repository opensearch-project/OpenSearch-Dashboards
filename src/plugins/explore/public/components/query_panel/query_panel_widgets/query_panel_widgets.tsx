/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { DatasetSelectWidget } from './dataset_select';
import { SaveQueryButton } from './save_query';
import { RecentQueriesButton } from './recent_queries_button';
import { LanguageToggle } from './language_toggle';
import { QueryPanelActions } from './query_panel_actions';
import { ExploreServices } from '../../../types';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
// @ts-ignore - allow side-effect scss import without type declarations
import './query_panel_widgets.scss';
import { AskAIButton } from './ask_ai_button';
import { useFlavorId } from '../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../common';
import {
  selectQueryLanguage,
  selectIsPromptEditorMode,
} from '../../../application/utils/state_management/selectors';
export { useAnalyzePanelState } from './use_analyze_panel_state';

interface QueryPanelWidgetsProps {
  analyzeIsOpen?: boolean;
  onToggleAnalyze?: () => void;
  hasAnalyzeResult?: boolean;
}

export const QueryPanelWidgets = ({
  analyzeIsOpen,
  onToggleAnalyze,
  hasAnalyzeResult,
}: QueryPanelWidgetsProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryPanelActionsRegistry } = services;
  const flavorId = useFlavorId();
  const isMetrics = flavorId === ExploreFlavor.Metrics;
  const queryLanguage = useSelector(selectQueryLanguage);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  // Only show Analyze for PPL queries in query mode — not SQL, not prompt mode
  const isPPLQueryMode = queryLanguage === 'PPL' && !isPromptMode;

  return (
    <div className="exploreQueryPanelWidgets">
      {/* Left Section */}
      <div className="exploreQueryPanelWidgets__left">
        <LanguageToggle />
        {!isMetrics && <DatasetSelectWidget />}
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
        {isPPLQueryMode && onToggleAnalyze && (
          <>
            <EuiButtonEmpty
              size="xs"
              onClick={onToggleAnalyze}
              isSelected={analyzeIsOpen}
              data-test-subj="exploreAnalyzeButton"
              iconType="inspect"
            >
              Analyze Query
            </EuiButtonEmpty>
            <div className="exploreQueryPanelWidgets__verticalSeparator" />
          </>
        )}
        <AskAIButton />
      </div>
    </div>
  );
};
