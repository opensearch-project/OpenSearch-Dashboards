/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeRange, RefreshInterval, QueryState as DataQueryState } from '../../data/public';
import { QueryState as ExploreQueryState } from './application/utils/state_management/slices';
import { setStateToOsdUrl } from '../../opensearch_dashboards_utils/public';
import { UrlGeneratorsDefinition } from '../../share/public';

export const EXPLORE_APP_URL_GENERATOR = 'EXPLORE_APP_URL_GENERATOR';

export interface ExploreUrlGeneratorState {
  /**
   * Optionally set saved search ID.
   */
  savedObjectId?: string;

  /**
   * Optionally set index pattern ID.
   */
  indexPatternId?: string;

  /**
   * Optionally set the time range in the time picker.
   */
  timeRange?: TimeRange;

  /**
   * Optionally set the refresh interval.
   */
  refreshInterval?: RefreshInterval;

  /**
   * Optionally set a query. NOTE: if given and used in conjunction with `dashboardId`, and the
   * saved dashboard has a query saved with it, this will _replace_ that query.
   */
  query?: ExploreQueryState;

  /**
   * If not given, will use the uiSettings configuration for `storeInSessionStorage`. useHash determines
   * whether to hash the data in the url to avoid url length issues.
   */
  useHash?: boolean;

  /**
   * Saved query Id
   */
  savedQuery?: string;
}

interface Params {
  appBasePath: string;
  useHash: boolean;
}

export class ExploreUrlGenerator
  implements UrlGeneratorsDefinition<typeof EXPLORE_APP_URL_GENERATOR> {
  constructor(private readonly params: Params) {}

  public readonly id = EXPLORE_APP_URL_GENERATOR;

  public readonly createUrl = async ({
    indexPatternId,
    query,
    refreshInterval,
    savedObjectId,
    timeRange,
    useHash = this.params.useHash,
    savedQuery,
  }: ExploreUrlGeneratorState): Promise<string> => {
    const savedSearchPath = savedObjectId ? encodeURIComponent(savedObjectId) : '';
    const appState: {
      query?: ExploreQueryState;
      index?: string;
      savedQuery?: string;
    } = {};
    const queryState: DataQueryState = {};

    if (query) appState.query = query;
    if (indexPatternId) appState.index = indexPatternId;

    if (timeRange) queryState.time = timeRange;
    if (refreshInterval) queryState.refreshInterval = refreshInterval;
    if (savedQuery) appState.savedQuery = savedQuery;

    let url = `${this.params.appBasePath}#/${savedSearchPath}`;
    url = setStateToOsdUrl<DataQueryState>('_g', queryState, { useHash }, url);
    url = setStateToOsdUrl('_a', appState, { useHash }, url);

    return url;
  };
}
