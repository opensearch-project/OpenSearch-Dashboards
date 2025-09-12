/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiButton } from '@elastic/eui';
import { EXPLORE_LOGS_TAB_ID } from '../../../../common';
import { usePatternsFlyoutContext } from './patterns_flyout_context';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  setActiveTab,
  setQueryStringWithHistory,
} from '../../../application/utils/state_management/slices';
import { useSetEditorText } from '../../../application/hooks';
import { executeQueries } from '../../../application/utils/state_management/actions/query_actions';
import {
  selectPatternsField,
  selectQuery,
  selectUsingRegexPatterns,
} from '../../../application/utils/state_management/selectors';
import { createSearchPatternQuery } from '../utils/utils';

export interface PatternsFlyoutUpdateSearchProps {
  patternString: string;
}

export const PatternsFlyoutUpdateSearch = ({ patternString }: PatternsFlyoutUpdateSearchProps) => {
  const { closePatternsTableFlyout } = usePatternsFlyoutContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const setEditorText = useSetEditorText();
  const dispatch = useDispatch();

  const originalQuery = useSelector(selectQuery);
  const selectedPatternsField = useSelector(selectPatternsField);
  const usingRegexPatterns = useSelector(selectUsingRegexPatterns);

  // move to 'logs' flow with 'update search' query
  const redirectToLogsWithQuery = (query: string) => {
    dispatch(setQueryStringWithHistory(query)); // sets query to be ran
    setEditorText(query); // sets the text in the editor
    dispatch(setActiveTab(EXPLORE_LOGS_TAB_ID)); // moves tab over to logs
    dispatch(executeQueries({ services }));
    closePatternsTableFlyout();
  };

  const updateSearchClick = () => {
    if (!selectedPatternsField) throw new Error('no patterns field');

    // craft query that will select for all documents with specific pattern
    const newQuery = createSearchPatternQuery(
      originalQuery,
      selectedPatternsField,
      usingRegexPatterns,
      patternString
    );
    redirectToLogsWithQuery(newQuery);
  };

  return (
    <EuiButton
      aria-label={i18n.translate('explore.patterns.flyout.updateSearchWithPattern', {
        defaultMessage: 'Update search with pattern',
      })}
      iconType={'continuityBelow'}
      onClick={updateSearchClick}
    >
      {i18n.translate('explore.patterns.flyout.updateSearch', {
        defaultMessage: 'Update search',
      })}
    </EuiButton>
  );
};
