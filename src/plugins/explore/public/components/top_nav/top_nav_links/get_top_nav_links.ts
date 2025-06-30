/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../saved_explore';
import { TopNavMenuIconData } from '../../../../../navigation/public';
import { ExecutionContextSearch } from '../../../../../expressions';
import { IndexPattern } from '../../../../../data/public';
import { getNewButtonRun, newTopNavData } from './top_nav_new';
import { getOpenButtonRun, openTopNavData } from './top_nav_open';
import { getSaveButtonRun, saveTopNavData } from './top_nav_save';
import { getShareButtonRun, shareTopNavData } from './top_nav_share';

export const getTopNavLinks = (
  services: ExploreServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  indexPattern: IndexPattern | undefined,
  savedExplore?: SavedExplore
) => {
  const { capabilities, share } = services;

  const topNavLinks: TopNavMenuIconData[] = [];

  if (capabilities.discover?.save) {
    topNavLinks.push({
      ...saveTopNavData,
      run: getSaveButtonRun(
        services,
        startSyncingQueryStateWithUrl,
        searchContext,
        indexPattern,
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
    run: getNewButtonRun(services),
  });

  if (share) {
    topNavLinks.push({
      ...shareTopNavData,
      run: getShareButtonRun(services, savedExplore),
    });
  }

  return topNavLinks;
};
