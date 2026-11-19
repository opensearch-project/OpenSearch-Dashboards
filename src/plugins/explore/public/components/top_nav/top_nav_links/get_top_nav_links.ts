/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../saved_explore';
import { TopNavMenuData } from '../../../../../navigation/public';
import { ExecutionContextSearch } from '../../../../../expressions';
import { getNewButtonRun, newTopNavData } from './top_nav_new';
import { getOpenButtonRun, openTopNavData } from './top_nav_open';
import { getSaveButtonRun, SaveStateProps, saveTopNavData } from './top_nav_save';
import { getShareButtonRun, shareTopNavData } from './top_nav_share';
import { useClearEditors } from '../../../application/hooks';

export const getTopNavLinks = (
  services: ExploreServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  stateProps: SaveStateProps,
  clearEditors: ReturnType<typeof useClearEditors>,
  savedExplore?: SavedExplore
) => {
  const { capabilities, share } = services;

  // Union type: Save is a labeled button (controlType: 'button'); the rest are icons.
  const topNavLinks: TopNavMenuData[] = [];

  if (capabilities.discover?.save) {
    topNavLinks.push({
      ...saveTopNavData,
      run: getSaveButtonRun(
        services,
        startSyncingQueryStateWithUrl,
        searchContext,
        stateProps,
        savedExplore
      ),
    });
  }

  topNavLinks.push({
    ...openTopNavData,
    run: getOpenButtonRun(services),
  });
  topNavLinks.push({
    ...newTopNavData,
    run: getNewButtonRun(services, clearEditors),
  });

  if (share) {
    topNavLinks.push({
      ...shareTopNavData,
      run: getShareButtonRun(services, savedExplore),
    });
  }

  return topNavLinks;
};
