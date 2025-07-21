/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { ExploreServices } from '../../../../types';
import { SavedExplore } from '../../../../types/saved_explore_types';
import { unhashUrl } from '../../../../../../opensearch_dashboards_utils/public';
import { getSharingData } from './helpers';

export const shareTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('explore.topNav.shareTitle', {
    defaultMessage: 'Share',
  }),
  ariaLabel: i18n.translate('explore.topNav.shareAriaLabel', {
    defaultMessage: `Share search`,
  }),
  testId: 'shareTopNavButton',
  iconType: 'share',
  controlType: 'icon',
};

export const getShareButtonRun = (
  services: ExploreServices,
  savedExplore?: SavedExplore
): TopNavMenuIconRun => async (anchorElement) => {
  const { share, store } = services;
  if (!savedExplore || !share) return;

  const legacyState = store.getState().legacy;
  const sharingData = await getSharingData({
    searchSource: savedExplore.searchSource,
    state: legacyState,
    services,
  });
  share.toggleShareContextMenu({
    anchorElement,
    allowEmbed: false,
    allowShortUrl: services.capabilities.discover?.createShortUrl as boolean,
    shareableUrl: unhashUrl(window.location.href),
    objectId: savedExplore.id,
    objectType: 'search',
    sharingData: {
      ...sharingData,
      title: savedExplore.title,
    },
    isDirty: !savedExplore.id || legacyState.isDirty || false,
  });
};
