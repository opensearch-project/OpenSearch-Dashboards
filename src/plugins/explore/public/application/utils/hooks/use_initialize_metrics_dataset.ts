/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDispatch, useSelector } from 'react-redux';
import { useEffectOnce } from 'react-use';
import { DataStructure } from '../../../../../data/common';
import { ExploreServices } from '../../../types';
import { setQueryWithHistory } from '../state_management/slices';
import { selectQuery } from '../state_management/selectors';
import { SavedExplore } from '../../../saved_explore';
import { getSourceTypeRegistry } from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';

interface UseInitializeMetricsDatasetOptions {
  services: ExploreServices;
  savedExplore?: SavedExplore;
}

export const useInitializeMetricsDataset = ({
  services,
  savedExplore,
}: UseInitializeMetricsDatasetOptions) => {
  const dispatch = useDispatch();
  const currentQuery = useSelector(selectQuery);

  useEffectOnce(() => {
    const initializeDataset = async () => {
      if (
        savedExplore ||
        (currentQuery.dataset && currentQuery.dataset.type === 'PROMETHEUS') ||
        // A Metrics-flavor source's dataset (with its own language) is kept as is.
        getSourceTypeRegistry().isRegisteredSourceDataset(
          currentQuery.dataset,
          ExploreFlavor.Metrics
        )
      ) {
        return;
      }

      if (
        (currentQuery.dataset && currentQuery.dataset.type !== 'PROMETHEUS') ||
        (!currentQuery.dataset && currentQuery.language !== 'PROMQL')
      ) {
        dispatch(setQueryWithHistory({ ...currentQuery, dataset: undefined, language: 'PROMQL' }));
      }

      try {
        const datasetService = services.data.query.queryString.getDatasetService();
        const typeConfig = datasetService.getType('PROMETHEUS');
        if (!typeConfig) return;

        const datasetRoot: DataStructure = {
          id: typeConfig.id,
          title: typeConfig.title,
          type: typeConfig.id,
        };
        const result = await typeConfig.fetch(services as any, [datasetRoot]);

        if (result.children && result.children.length > 0) {
          const firstConnection = result.children[0];
          const dataset = typeConfig.toDataset([datasetRoot, firstConnection]);

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

          const initialQuery = services.data.query.queryString.getInitialQueryByDataset(dataset);
          dispatch(setQueryWithHistory(initialQuery));
        }
      } catch (error) {
        // Silently fail - user can manually select a dataset
      }
    };

    initializeDataset();
  });
};
