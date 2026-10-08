/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';
import { resetExploreStateActionCreator } from '../../../../application/utils/state_management/actions/reset_explore_state';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { useClearEditors } from '../../../../application/hooks';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder';

// One label for both the tooltip and the aria-label, so the icon strip reads as a set of
// search actions rather than four bare verbs.
const newSearchLabel = i18n.translate('explore.topNav.newAriaLabel', {
  defaultMessage: 'New search',
});

export const newTopNavData: TopNavMenuIconUIData = {
  tooltip: newSearchLabel,
  ariaLabel: newSearchLabel,
  testId: 'discoverNewButton',
  iconType: 'plusInCircle',
  controlType: 'icon',
};

export const getNewButtonRun =
  (
    services: ExploreServices,
    clearEditors: ReturnType<typeof useClearEditors>
  ): TopNavMenuIconRun =>
  () => {
    const visBuilder = getVisualizationBuilder();
    visBuilder.clearUrl();
    services.store.dispatch(resetExploreStateActionCreator(services, clearEditors));

    if (services.scopedHistory) {
      services.scopedHistory.push('/');
    }
  };
