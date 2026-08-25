/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { getOpenButtonRun } from '../../../top_nav/top_nav_links/top_nav_open';
import './saved_searches_button.scss';

const label = i18n.translate('explore.queryPanel.savedSearchesLabel', {
  defaultMessage: 'Saved searches',
});

/**
 * Sits beside "Saved queries" so the two are visibly different things: a saved *search* restores the
 * dataset, query and tab; a saved *query* restores only the query. Users reaching for the wrong one
 * was the whole reason this button exists.
 */
export const SavedSearchesButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Reuses the header's Browse searches flyout rather than a second browser over the same objects.
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => getOpenButtonRun(services)(event.currentTarget),
    [services]
  );

  return (
    <EuiButtonEmpty
      onClick={onClick}
      data-test-subj="queryPanelFooterSavedSearchesButton"
      size="xs"
    >
      <div className="exploreSavedSearchesButton__buttonTextWrapper">
        <EuiIcon type="folderOpen" size="s" />
        <EuiText size="xs">{label}</EuiText>
      </div>
    </EuiButtonEmpty>
  );
};
