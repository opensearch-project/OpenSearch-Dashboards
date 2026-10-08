/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DEFAULT_DATA } from '../../../../data/common';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../components/constants';
import { DataExplorerServices } from '../../types';
import { getPreloadedState } from './preload';
import { RootState } from './store';

const initializeDefaultDatasetQuery = async (services: DataExplorerServices) => {
  if (!services.uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING)) {
    return;
  }

  const queryState = services.osdUrlStateStorage.get<{ query?: unknown }>('_q');
  if (queryState && Object.prototype.hasOwnProperty.call(queryState, 'query')) {
    return;
  }

  try {
    const defaultDataset = await services.data.query.getDefaultDataset();
    if (!defaultDataset) {
      return;
    }

    const defaultQuery = services.data.query.queryString.getDefaultQuery(defaultDataset);
    // Query-enhanced Discover owns dataset selection through query state. Initialize it here,
    // after checking URL state, so a fresh app gets the default dataset without overwriting an
    // explicitly restored query, including an intentionally empty one.
    services.data.query.queryString.setQuery(defaultQuery, false, false);
  } catch {
    // Discover can still render its empty state if the default dataset cannot be resolved.
  }
};

export const loadReduxState = async (services: DataExplorerServices) => {
  try {
    const serializedState = services.osdUrlStateStorage.get<RootState>('_a');
    if (serializedState !== null) {
      const isQueryEnhancementEnabled = services.uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

      // Migrate index pattern to query state
      if (isQueryEnhancementEnabled && serializedState.metadata.indexPattern) {
        const indexPattern = await services.data.indexPatterns.get(
          serializedState.metadata.indexPattern
        );

        const dataset: Dataset = {
          id: serializedState.metadata.indexPattern,
          title: indexPattern.title,
          displayName: indexPattern.displayName,
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        };

        if (indexPattern.dataSourceRef) {
          const dataSource = await services.data.indexPatterns.getDataSource(
            indexPattern.dataSourceRef.id
          );

          if (dataSource) {
            // @ts-expect-error TS2741 TODO(ts-error): fixme
            dataset.dataSource = {
              id: dataSource.id,
              title: dataSource.attributes.title,
              type: dataSource.attributes.dataSourceEngineType || '',
            };
          }
        }
        services.data.query.queryString.setQuery({
          dataset,
        });

        delete serializedState.metadata.indexPattern;
      } else {
        await initializeDefaultDatasetQuery(services);
      }

      return serializedState;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // If state is not found, load the default state
  await initializeDefaultDatasetQuery(services);
  return await getPreloadedState(services);
};

export const persistReduxState = (root: RootState, services: DataExplorerServices) => {
  try {
    services.osdUrlStateStorage.set<RootState>('_a', root, {
      replace: true,
    });
  } catch {
    return;
  }
};
