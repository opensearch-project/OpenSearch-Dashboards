/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { EuiButtonEmpty, EuiIcon, EuiListGroup, EuiPopover, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { getOpenButtonRun } from '../../../top_nav/top_nav_links/top_nav_open';
import { getSaveSearchAction$ } from '../../../top_nav/saved_search_actions';
import './saved_searches_button.scss';

const label = i18n.translate('explore.queryPanel.savedSearchesLabel', {
  defaultMessage: 'Saved searches',
});

/**
 * Sits beside "Saved queries" so the two are visibly different things: a saved *search* restores the
 * dataset, query and tab; a saved *query* restores only the query. Users reaching for the wrong one
 * was the whole reason this button exists — so it mirrors the Saved queries popover's shape (an
 * option list of Save / Browse) rather than being a single action that looks unrelated to it.
 */
export const SavedSearchesButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Published by TopNav — see `saved_search_actions.ts` for why it arrives this way.
  const saveSearchAction = useObservable(getSaveSearchAction$(), getSaveSearchAction$().getValue());

  const onButtonClick = useCallback(() => setIsPopoverOpen((open) => !open), []);
  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const handleSave = useCallback(() => {
    closePopover();
    saveSearchAction?.run();
  }, [closePopover, saveSearchAction]);

  // Reuses the header's Browse searches flyout rather than a second browser over the same objects.
  // `getOpenButtonRun` ignores its anchor argument (the flyout is not popover-anchored), so there
  // is nothing meaningful to pass now that the click originates inside a popover.
  const handleBrowse = useCallback(() => {
    closePopover();
    getOpenButtonRun(services)({} as HTMLElement);
  }, [closePopover, services]);

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          onClick={onButtonClick}
          data-test-subj="queryPanelFooterSavedSearchesButton"
          size="xs"
        >
          <div className="exploreSavedSearchesButton__buttonTextWrapper">
            <EuiIcon type="folderOpen" size="s" />
            <EuiText size="xs">{label}</EuiText>
            <EuiIcon type="arrowDown" size="s" />
          </div>
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
      panelPaddingSize="none"
      panelClassName="exploreSavedSearchesButton__popoverContent"
    >
      <EuiListGroup className="exploreSavedSearchesButton__optionList">
        <div className="exploreSavedSearchesButton__option">
          <EuiButtonEmpty
            className="exploreSavedSearchesButton__optionButton"
            data-test-subj="savedSearchesSaveButton"
            iconType="save"
            // No SavedExplore to save into yet (TopNav not mounted, or still loading). Disabled
            // rather than hidden so the popover doesn't change shape under the cursor.
            disabled={!saveSearchAction}
            onClick={handleSave}
          >
            <EuiText size="xs">
              {i18n.translate('explore.queryPanel.savedSearches.saveSearch', {
                defaultMessage: 'Save search',
              })}
            </EuiText>
          </EuiButtonEmpty>
        </div>
        <div className="exploreSavedSearchesButton__option">
          <EuiButtonEmpty
            className="exploreSavedSearchesButton__optionButton"
            data-test-subj="savedSearchesBrowseButton"
            iconType="folderOpen"
            onClick={handleBrowse}
          >
            <EuiText size="xs">
              {i18n.translate('explore.queryPanel.savedSearches.browseSearches', {
                defaultMessage: 'Browse searches',
              })}
            </EuiText>
          </EuiButtonEmpty>
        </div>
      </EuiListGroup>
    </EuiPopover>
  );
};
