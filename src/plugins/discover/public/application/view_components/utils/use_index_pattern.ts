/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { SIMPLE_DATA_SET_TYPES } from '../../../../../data/common';
import { IndexPattern } from '../../../../../data/public';
import { useSelector, updateIndexPattern } from '../../utils/state_management';
import { DiscoverViewServices } from '../../../build_services';
import { getIndexPatternId } from '../../helpers/get_index_pattern_id';
import { useDataSetManager } from './use_dataset_manager';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';

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
  const { data, toastNotifications, uiSettings, store } = services;
  const { dataSet } = useDataSetManager({
    dataSetManager: data.query.dataSet,
  });
  const indexPatternIdFromState = useSelector((state) => state.metadata.indexPattern);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const isQueryEnhancementEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

  const fetchIndexPatternDetails = useCallback(
    async (id: string) => {
      return await data.indexPatterns.get(id);
    },
    [data.indexPatterns]
  );

  useEffect(() => {
    if (isQueryEnhancementEnabled) {
      if (dataSet) {
        if (dataSet.type === SIMPLE_DATA_SET_TYPES.INDEX_PATTERN) {
          fetchIndexPatternDetails(dataSet.id).then((ip) => {
            setIndexPattern(ip);
          });
        }
      }
    }
  }, [dataSet, fetchIndexPatternDetails, isQueryEnhancementEnabled]);

  useEffect(() => {
    let isMounted = true;

    const fetchIndexPattern = (id: string) => {
      fetchIndexPatternDetails(id)
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
      if (!indexPatternIdFromState) {
        data.indexPatterns.getCache().then((indexPatternList) => {
          const newId = getIndexPatternId('', indexPatternList, uiSettings.get('defaultIndex'));
          store!.dispatch(updateIndexPattern(newId));
          fetchIndexPattern(newId);
        });
      } else {
        fetchIndexPattern(indexPatternIdFromState);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [
    indexPatternIdFromState,
    data.indexPatterns,
    toastNotifications,
    store,
    isQueryEnhancementEnabled,
    dataSet,
    uiSettings,
    fetchIndexPatternDetails,
  ]);

  return indexPattern;
};
