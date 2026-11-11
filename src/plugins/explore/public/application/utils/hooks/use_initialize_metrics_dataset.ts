/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  /**
   * The id of the saved explore in the URL, if any. The saved object loads asynchronously, so on a
   * cold load `savedExplore` is still undefined on mount; the saved object then supplies the
   * dataset and language, and the default must not run first.
   */
  savedExploreId?: string;
  /** Set when the saved explore failed to load; the PromQL default then applies once. */
  savedExploreError?: string | null;
}

export const useInitializeMetricsDataset = ({
  services,
  savedExplore,
  savedExploreId,
  savedExploreError,
}: UseInitializeMetricsDatasetOptions) => {
  const dispatch = useDispatch();
  const currentQuery = useSelector(selectQuery);
  // The saved explore id (undefined for a new search) the hook last initialized for. The page is
  // not remounted when the URL moves from one saved explore to another (#/view/<id>), so each new
  // id initializes again.
  const initializedForRef = useRef<{ savedExploreId: string | undefined }>();

  // Only a saved explore loaded for the id in the URL counts as loaded. Not the previous one while
  // the next one loads or after a move from #/view/<id> to a new search, and not the new, empty
  // saved explore (no id) a new search resolves to.
  const loadedSavedExplore =
    savedExplore && savedExploreId && savedExplore.id === savedExploreId ? savedExplore : undefined;
  // The load error of the previous id is still set on the first render for a new id (it is cleared
  // in an effect): an error that was already there before the id changed is not this id's error.
  const lastSeenRef = useRef<{ savedExploreId?: string; savedExploreError?: string | null }>({});
  const savedExploreLoadError =
    savedExploreError &&
    !(
      lastSeenRef.current.savedExploreId !== savedExploreId &&
      lastSeenRef.current.savedExploreError === savedExploreError
    )
      ? savedExploreError
      : undefined;
  useEffect(() => {
    lastSeenRef.current = { savedExploreId, savedExploreError };
  });
  // Read by an in-flight default before it dispatches (see below).
  const loadedSavedExploreRef = useRef(loadedSavedExplore);
  loadedSavedExploreRef.current = loadedSavedExplore;
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Runs once per saved explore id: right away, or, while a saved explore in the URL is loading,
  // once it has loaded (it supplies its own dataset and language, so nothing is changed then) or
  // failed to load (the PromQL default applies). If a failed saved explore loads later after all,
  // its own dataset and language replace the default.
  const waitingForSavedExplore = !!savedExploreId && !loadedSavedExplore && !savedExploreLoadError;

  useEffect(() => {
    if (waitingForSavedExplore) return;
    if (initializedForRef.current && initializedForRef.current.savedExploreId === savedExploreId) {
      return;
    }
    const previous = initializedForRef.current;
    const run = { savedExploreId };
    initializedForRef.current = run;
    // From a saved explore to a new search ("New"): the reset to a new search sets the query
    // itself, so the default is not applied over it (an in-flight default for the saved explore
    // is dropped too, see isCurrent).
    if (previous && previous.savedExploreId !== undefined && savedExploreId === undefined) {
      return;
    }
    // The default is applied asynchronously. It is dropped when, by then, the page moved to another
    // saved explore, a saved explore for this id loaded, or the page unmounted.
    const isCurrent = () =>
      mountedRef.current && initializedForRef.current === run && !loadedSavedExploreRef.current;

    const initializeDataset = async () => {
      if (
        loadedSavedExplore ||
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
        if (!isCurrent()) return;
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
        if (!isCurrent()) return;

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

          if (!isCurrent()) return;
          const initialQuery = services.data.query.queryString.getInitialQueryByDataset(dataset);
          dispatch(setQueryWithHistory(initialQuery));
        }
      } catch (error) {
        // Silently fail - user can manually select a dataset
      }
    };

    initializeDataset();
    // Only the readiness flag and the saved explore id decide when this runs; the values are read
    // when it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForSavedExplore, savedExploreId]);
};
