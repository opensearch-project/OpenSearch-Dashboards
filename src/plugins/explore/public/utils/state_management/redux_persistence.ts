/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DEFAULT_DATA } from '../../../../data/common';
import { DefaultViewState } from '../../../../data_explorer/public';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../components/constants';
import { getPreloadedState } from './preload';
import { RootState } from './store';
import { DataExplorerServices } from '../../types';

export const loadReduxState = async (
  services: DataExplorerServices,
  defaults: DefaultViewState | (() => DefaultViewState) | (() => Promise<DefaultViewState>)
) => {
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
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        };

        if (indexPattern.dataSourceRef) {
          const dataSource = await services.data.indexPatterns.getDataSource(
            indexPattern.dataSourceRef.id
          );

          if (dataSource) {
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
      }

      return serializedState;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // If state is not found, load the default state
  return await getPreloadedState(services, defaults);
};

export const persistReduxState = (root: RootState, services: DataExplorerServices) => {
  try {
    services.osdUrlStateStorage.set<RootState>('_a', root, {
      replace: true,
    });
  } catch (err) {
    return;
  }
};
