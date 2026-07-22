/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { Dataset, DEFAULT_DATA } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { PLUGIN_ID, ExploreFlavor, EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';

interface ActivateDatasetArgs {
  /** Dataset title / index pattern (e.g. `logs-app-*`). */
  title: string;
  /** Existing dataset saved-object id, if this is an already-created dataset. */
  datasetId?: string;
  timeFieldName?: string;
  dataSource?: Dataset['dataSource'];
}

/**
 * Activates an EXISTING dataset (or a covered index) and hands off to the logs Query experience —
 * the "Query" primary action in the Rows view. Standalone (no Redux): it caches the dataset
 * in-session, writes it to the shared query-string manager (which the logs flavor hydrates from on
 * mount via `resolveDataset`), then navigates to `explore/logs`.
 */
export const useActivateDataset = (services: ExploreServices) => {
  return useCallback(
    async ({ title, datasetId, timeFieldName, dataSource }: ActivateDatasetArgs) => {
      const datasetService = services.data.query.queryString.getDatasetService();

      const dataset: Dataset = {
        id: datasetId ?? (dataSource?.id ? `${dataSource.id}::${title}` : title),
        title,
        type: DEFAULT_DATA.SET_TYPES.INDEX,
        timeFieldName,
        // Logs drilldown is a PPL experience; pin the language so activating a dataset doesn't
        // inherit a stale SQL/DQL language from the shared query state (avoids the "Language
        // changed to OpenSearch SQL" surprise on hand-off).
        language: EXPLORE_DEFAULT_LANGUAGE,
        dataSource: (dataSource ??
          DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE) as Dataset['dataSource'],
      };

      try {
        // Cache the dataset in-session so the query pipeline can resolve it without a save.
        await datasetService.cacheDataset(
          dataset,
          {
            uiSettings: services.uiSettings,
            savedObjects: services.savedObjects,
            notifications: services.notifications,
            http: services.http,
            data: services.data,
          },
          false
        );
      } catch {
        // Non-fatal — proceed even if caching fields fails.
      }

      // Write to the SHARED query-string manager; the logs flavor reads dataset from here on mount.
      const initialQuery = services.data.query.queryString.getInitialQueryByDataset(dataset);
      services.data.query.queryString.setQuery(initialQuery);

      // Hand off to the logs Query experience.
      services.core.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
        path: '#/',
      });
    },
    [services]
  );
};
