/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../../../data/public';
import { SIMPLE_DATA_SET_TYPES, SimpleDataSet } from '../../../../../data/common';
import { useSelector } from '../../utils/state_management';
import { DiscoverViewServices } from '../../../build_services';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';
import { useDataSetManager } from './use_dataset_manager';

/**
 * Custom hook to fetch and manage the index pattern based on the provided services.
 *
 * This hook does the following:
 * 1. Check if there's an `indexPatternId` from the state.
 * 2. If not, fetch a list of index patterns, determine the default, and update the store with it.
 * 3. Once an `indexPatternId` is determined (either from the state or by fetching the default),
 *    it fetches the details of the index pattern.
 * 4. If there's any error fetching the index pattern details, a warning notification is shown.
 *
 * @param services - The services needed to fetch the index patterns and show notifications.
 * @param store - The redux store in data_explorer to dispatch actions.
 * @returns - The fetched index pattern.
 */
export const useIndexPattern = (services: DiscoverViewServices) => {
  const { data, toastNotifications, uiSettings } = services;
  const { dataSet } = useDataSetManager({
    dataSetManager: data.query.dataSet,
  });
  const indexPatternIdFromState = useSelector((state) => state.metadata.indexPattern);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const isQueryEnhancementEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

  const cacheTemporaryIndexPattern = useCallback(
    async (dataset: SimpleDataSet) => {
      const temporaryIndexPatternID = dataset.id ?? `${dataset.dataSourceRef?.id}.${dataset.title}`;
      const temporaryIndexPattern = await data.indexPatterns.create(
        {
          id: temporaryIndexPatternID,
          title: dataset.title,
          timeFieldName: dataset.timeFieldName,
          type: dataset.type,
          ...(dataset.dataSourceRef
            ? {
                dataSourceRef: {
                  id: dataset.dataSourceRef.id ?? dataset.dataSourceRef.name,
                  name: dataset.dataSourceRef.name,
                  type: dataset.type!,
                },
              }
            : {}),
        },
        true
      );
      data.indexPatterns.saveToCache(temporaryIndexPatternID, temporaryIndexPattern);

      return temporaryIndexPattern;
    },
    [data.indexPatterns]
  );

  useEffect(() => {
    // Only perform updates when the component is mounted. Use to prevent asyn updates to unmounted components
    let isMounted = true;

    const fetchAndSetIndexPatternDetails = (id: string) => {
      data.indexPatterns
        .get(id)
        .then((result) => {
          if (isMounted) {
            setIndexPattern(result);
          }
        })
        .catch(() => {
          if (isMounted) {
            const indexPatternMissingWarning = i18n.translate(
              'discover.valueIsNotConfiguredIndexPatternIDWarningTitle',
              {
                defaultMessage: '{id} is not a configured index pattern ID',
                values: {
                  id: `"${id}"`,
                },
              }
            );
            toastNotifications.addDanger({
              title: indexPatternMissingWarning,
            });
          }
        });
    };

    if (!isQueryEnhancementEnabled) {
      // The index pattern in the legacy mode uses the metadata slice's index field
      if (!indexPatternIdFromState) {
        // If no indexpattern set in the app state, use the default index pattern
        data.indexPatterns.getDefault().then((ip) => {
          if (ip && isMounted) {
            setIndexPattern(ip);
          }
        });
      } else {
        fetchAndSetIndexPatternDetails(indexPatternIdFromState);
      }
    } else {
      // With query enhancements enabled, we use datasets
      if (dataSet) {
        if (dataSet.type === SIMPLE_DATA_SET_TYPES.INDEX_PATTERN) {
          fetchAndSetIndexPatternDetails(dataSet.id!);
        } else {
          cacheTemporaryIndexPattern(dataSet).then((ip) => {
            if (isMounted) {
              setIndexPattern(ip);
            }
          });
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [
    cacheTemporaryIndexPattern,
    data.indexPatterns,
    dataSet,
    indexPatternIdFromState,
    isQueryEnhancementEnabled,
    toastNotifications,
  ]);

  return indexPattern;
};
