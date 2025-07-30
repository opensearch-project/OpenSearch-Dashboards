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

export const newTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('explore.topNav.newTitle', {
    defaultMessage: 'New',
  }),
  ariaLabel: i18n.translate('explore.topNav.newAriaLabel', {
    defaultMessage: `New Search`,
  }),
  testId: 'discoverNewButton',
  iconType: 'plusInCircle',
  controlType: 'icon',
};

export const getNewButtonRun = (
  services: ExploreServices,
  clearEditors: ReturnType<typeof useClearEditors>
): TopNavMenuIconRun => () => {
  const visBuilder = getVisualizationBuilder();
  visBuilder.clearUrl();
  services.store.dispatch(resetExploreStateActionCreator(services, clearEditors));
};
