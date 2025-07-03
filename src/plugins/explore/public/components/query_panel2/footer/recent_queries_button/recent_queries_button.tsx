/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { RecentQueriesTable, TimeRange } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { Query } from '../../../types';
import { loadQueryActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../../utils';

export const RECENT_QUERIES_TABLE_WRAPPER_EL = 'exploreRecentQueriesPanel';

const label = i18n.translate('explore.queryPanel.recentQueryLabel', {
  defaultMessage: 'Recent Queries',
});

export const RecentQueriesButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { handleTimeChange } = useTimeFilter();
  const dispatch = useDispatch();
  const [queriesAreVisible, setQueriesAreVisible] = useState(false);
  const recentQueriesTableWrapperEl = document.getElementById(RECENT_QUERIES_TABLE_WRAPPER_EL);

  const toggleVisibility = () => {
    setQueriesAreVisible(!queriesAreVisible);
  };

  const onClick = (selectedQuery: Query, timeRange?: TimeRange) => {
    const updatedQuery = typeof selectedQuery.query === 'string' ? selectedQuery.query : '';
    setQueriesAreVisible(false);
    if (timeRange) {
      handleTimeChange({
        start: timeRange.from,
        end: timeRange.to,
        isInvalid: false,
        isQuickSelection: true,
      });
    }
    dispatch(loadQueryActionCreator(services, updatedQuery));
  };

  return (
    <>
      <EuiButtonEmpty
        onClick={toggleVisibility}
        iconType="clock"
        data-test-subj="exploreRecentQueriesButton"
      >
        {label}
      </EuiButtonEmpty>
      {recentQueriesTableWrapperEl
        ? createPortal(
            <RecentQueriesTable
              isVisible={queriesAreVisible}
              queryString={services.data.query.queryString}
              onClickRecentQuery={onClick}
            />,
            recentQueriesTableWrapperEl
          )
        : null}
    </>
  );
};
