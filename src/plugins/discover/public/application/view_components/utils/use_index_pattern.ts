/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { SIMPLE_DATA_SET_TYPES, SimpleDataSet } from '../../../../../data/common';
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
  const { dataSet } = useDataSetManager({ dataSetManager: data.query.dataSetManager });
  const indexPatternIdFromState = useSelector((state) => state.metadata.indexPattern);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const isQueryEnhancementEnabled = useMemo(
    () => uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING),
    [uiSettings]
  );

  const fetchIndexPatternDetails = useCallback((id: string) => data.indexPatterns.get(id), [
    data.indexPatterns,
  ]);

  const createTempIndexPattern = useCallback(
    async (dataSetFromState: SimpleDataSet) => {
      try {
        const tempIndexPattern = await data.indexPatterns.create(
          {
            id: `${dataSetFromState.dataSourceRef?.id || ''}.${dataSetFromState.title}`,
            title: dataSetFromState.title,
            dataSourceRef: dataSetFromState.dataSourceRef,
            type: dataSetFromState.type,
            timeFieldName: dataSetFromState.timeFieldName,
            fields: dataSetFromState.fields as any,
          },
          true
        );
        data.indexPatterns.saveToCache(tempIndexPattern.id!, tempIndexPattern);
        return tempIndexPattern;
      } catch (error) {
        return null;
      }
    },
    [data.indexPatterns]
  );

  useEffect(() => {
    let isMounted = true;

    const handleIndexPattern = async () => {
      if (isQueryEnhancementEnabled && dataSet) {
        let pattern;

        if (dataSet.type === SIMPLE_DATA_SET_TYPES.INDEX_PATTERN) {
          pattern = await fetchIndexPatternDetails(dataSet.id);
        } else {
          pattern = await createTempIndexPattern(dataSet);
        }

        if (isMounted && pattern) {
          setIndexPattern(pattern);
        }
      } else if (!isQueryEnhancementEnabled) {
        if (!indexPatternIdFromState) {
          const indexPatternList = await data.indexPatterns.getCache();
          const newId = getIndexPatternId('', indexPatternList, uiSettings.get('defaultIndex'));
          if (isMounted) {
            store!.dispatch(updateIndexPattern(newId));
            handleIndexPattern();
          }
        } else {
          try {
            const ip = await fetchIndexPatternDetails(indexPatternIdFromState);
            if (isMounted) {
              setIndexPattern(ip);
            }
          } catch (error) {
            if (isMounted) {
              const warningMessage = i18n.translate('discover.indexPatternFetchErrorWarning', {
                defaultMessage: 'Error fetching index pattern: {error}',
                values: { error: (error as Error).message },
              });
              toastNotifications.addWarning(warningMessage);
            }
          }
        }
      }
    };

    handleIndexPattern();

    return () => {
      isMounted = false;
    };
  }, [
    isQueryEnhancementEnabled,
    dataSet,
    indexPatternIdFromState,
    fetchIndexPatternDetails,
    createTempIndexPattern,
    data.indexPatterns,
    store,
    toastNotifications,
    uiSettings,
  ]);

  return indexPattern;
};
