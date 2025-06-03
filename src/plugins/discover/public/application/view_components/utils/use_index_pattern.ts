/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IndexPattern, useQueryStringManager } from '../../../../../data/public';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';
import { DiscoverViewServices } from '../../../build_services';
import { getIndexPatternId } from '../../helpers/get_index_pattern_id';
import { updateIndexPattern, useSelector } from '../../utils/state_management';

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
  const { query } = useQueryStringManager({
    queryString: data.query.queryString,
  });
  const indexPatternIdFromState = useSelector((state) => state.metadata.indexPattern);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const isQueryEnhancementEnabled = useMemo(
    () => uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING),
    [uiSettings]
  );

  const fetchIndexPatternDetails = useCallback((id: string) => data.indexPatterns.get(id), [
    data.indexPatterns,
  ]);

  useEffect(() => {
    let isMounted = true;

    const handleIndexPattern = async () => {
      if (isQueryEnhancementEnabled && query.dataset) {
        let pattern = await data.indexPatterns.get(
          query.dataset.id,
          query.dataset.type !== 'INDEX_PATTERN'
        );
        if (!pattern) {
          await data.query.queryString.getDatasetService().cacheDataset(query.dataset, {
            uiSettings: services.uiSettings,
            savedObjects: services.savedObjects,
            notifications: services.notifications,
            http: services.http,
            data: services.data,
          });
          pattern = await data.indexPatterns.get(
            query.dataset.id,
            query.dataset.type !== 'INDEX_PATTERN'
          );
        }

        if (isMounted && pattern) {
          setIndexPattern(pattern);
        }
      } else if (!isQueryEnhancementEnabled) {
        if (!indexPatternIdFromState) {
          const indexPatternList = await data.indexPatterns.getCache();
          const newId = getIndexPatternId(
            '',
            indexPatternList || [],
            uiSettings.get('defaultIndex')
          );
          if (isMounted && newId) {
            store!.dispatch(updateIndexPattern(newId));
            handleIndexPattern();
          }
        } else {
          const ip = await fetchIndexPatternDetails(indexPatternIdFromState);
          if (isMounted) {
            setIndexPattern(ip);
          }
        }
      }
    };

    try {
      handleIndexPattern();
    } catch (error) {
      if (isMounted) {
        const warningMessage = i18n.translate('discover.indexPatternFetchErrorWarning', {
          defaultMessage: 'Error fetching index pattern: {error}',
          values: { error: (error as Error).message },
        });
        toastNotifications.addWarning(warningMessage);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [
    services,
    isQueryEnhancementEnabled,
    indexPatternIdFromState,
    fetchIndexPatternDetails,
    data.indexPatterns,
    store,
    toastNotifications,
    uiSettings,
    query.dataset,
    data.query.queryString,
  ]);

  return indexPattern;
};
