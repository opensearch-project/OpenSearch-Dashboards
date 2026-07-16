/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { DatasetSelectWidget } from './dataset_select';
import { SaveQueryButton } from './save_query';
import { RecentQueriesButton } from './recent_queries_button';
import { LanguageToggle } from './language_toggle';
import { QueryPanelActions } from './query_panel_actions';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
// @ts-ignore - allow side-effect scss import without type declarations
import './query_panel_widgets.scss';
import { AskAIButton } from './ask_ai_button';
import { useFlavorId } from '../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../common';
import { getPPLAnalyzeResult$, getPPLAnalyzeLoading$ } from '../../../../../data/public';

export const useAnalyzePanelState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const resultSub = getPPLAnalyzeResult$().subscribe((result) => {
      if (result) {
        setHasResult(true);
        // Keep isOpen as-is — panel stays open showing the result
      } else {
        setHasResult(false);
        setIsOpen(false);
      }
    });
    const loadingSub = getPPLAnalyzeLoading$().subscribe(setIsLoading);
    return () => {
      resultSub.unsubscribe();
      loadingSub.unsubscribe();
    };
  }, []);

  return { isOpen, setIsOpen, hasResult, isLoading };
};

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
  const isPPL = flavorId !== ExploreFlavor.Metrics;

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
        {isPPL && onToggleAnalyze && (
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
