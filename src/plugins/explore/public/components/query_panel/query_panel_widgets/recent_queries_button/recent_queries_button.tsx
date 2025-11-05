/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { EuiButtonEmpty, EuiIcon, EuiPopover, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useDispatch } from 'react-redux';
import { Query, RecentQueriesTable, TimeRange } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { loadQueryActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../../utils';
import { useSetEditorTextWithQuery } from '../../../../application/hooks';
import './recent_queries_button.scss';

const label = i18n.translate('explore.queryPanel.recentQueryLabel', {
  defaultMessage: 'Recent Queries',
});

export const RecentQueriesButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();
  const { handleTimeChange } = useTimeFilter();
  const dispatch = useDispatch();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const handleTogglePopover = useCallback(() => {
    setPopoverIsOpen((state) => !state);
  }, []);
  const { keyboardShortcut } = services;

  keyboardShortcut?.useKeyboardShortcut({
    id: 'recent_queries',
    pluginId: 'explore',
    name: i18n.translate('explore.keyboardShortcut.recentQueries.name', {
      defaultMessage: 'Recent queries',
    }),
    category: i18n.translate('explore.keyboardShortcut.category.search', {
      defaultMessage: 'Search',
    }),
    keys: 'shift+q',
    execute: handleTogglePopover,
  });

  const onClick = (selectedQuery: Query, timeRange?: TimeRange) => {
    const updatedQuery = typeof selectedQuery.query === 'string' ? selectedQuery.query : '';
    setPopoverIsOpen(false);
    if (timeRange) {
      handleTimeChange({
        start: timeRange.from,
        end: timeRange.to,
        isInvalid: false,
        isQuickSelection: true,
      });
    }
    dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, updatedQuery));
  };

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={
        <EuiButtonEmpty
          onClick={() => setPopoverIsOpen((state) => !state)}
          data-test-subj="exploreRecentQueriesButton"
          size="xs"
        >
          <div className="exploreRecentQueriesButton__buttonTextWrapper">
            <EuiIcon type="clock" size="s" />
            <EuiText size="xs">{label}</EuiText>
            <EuiIcon type="arrowDown" size="s" />
          </div>
        </EuiButtonEmpty>
      }
      isOpen={popoverIsOpen}
      closePopover={() => setPopoverIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downCenter"
      panelClassName="exploreRecentQueriesButton__popover"
    >
      <RecentQueriesTable
        isVisible={popoverIsOpen}
        queryString={services.data.query.queryString}
        onClickRecentQuery={onClick}
      />
    </EuiPopover>
  );
};
