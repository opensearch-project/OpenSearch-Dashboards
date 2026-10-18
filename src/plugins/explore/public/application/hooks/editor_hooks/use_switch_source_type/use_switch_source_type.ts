/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { i18n } from '@osd/i18n';
import { Dataset, EMPTY_QUERY, Query } from '../../../../../../data/common';
import { ExploreFlavor } from '../../../../../common';
import { getServices } from '../../../../services/services';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
  SourceTypeDefinition,
} from '../../../../services/source_type_registry';
import { setQueryWithHistory } from '../../../utils/state_management/slices';
import type { AppDispatch } from '../../../utils/state_management/store';
import { onEditorRunActionCreator } from '../../../utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
import { datasetRequiresExplicitRun } from '../../../utils/requires_explicit_run';
import { useClearEditors } from '../use_clear_editors';
import { useEditorFocus } from '../use_editor_focus';

/**
 * Switches the query panel to a source type: opens the source's default dataset with an empty
 * editor in the dataset's language, then runs it, unless the dataset's type requires an explicit
 * Run (meta.requiresExplicitRun). The language pill's "Source type" column and the Metrics page's
 * source switch both use this, so they behave the same.
 *
 * The previous source's query options (e.g. PromQL's per-query step and legend, and max data
 * points) are dropped: they belong to the previous language.
 */
// Query has no `queryOptions` in its type; languages such as PromQL keep their options there.
const withoutQueryOptions = (query: Partial<Query>) =>
  ({ ...query, queryOptions: undefined }) as Partial<Query>;

export const useSwitchSourceType = (flavor: ExploreFlavor | null) => {
  const dispatch: AppDispatch = useDispatch();
  const clearEditors = useClearEditors();
  const focusOnEditor = useEditorFocus();

  // Pending timeouts are cancelled on unmount so nothing dispatches against a stale store.
  const pendingTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const timeouts = pendingTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);
  const schedule = useCallback((cb: () => void) => {
    const id = setTimeout(() => {
      pendingTimeouts.current.delete(id);
      cb();
    });
    pendingTimeouts.current.add(id);
  }, []);

  return useCallback(
    async (sourceType: SourceTypeDefinition): Promise<void> => {
      const services = getServices();
      const queryString = services.data.query.queryString;
      const languageService = queryString.getLanguageService();
      const applyAndRun = (language: string, dataset?: Dataset) => {
        languageService.setUserQueryLanguage(language);
        dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
        clearEditors();
        schedule(focusOnEditor);
        if (datasetRequiresExplicitRun(queryString, dataset)) return;
        schedule(() =>
          dispatch(onEditorRunActionCreator(services, queryString.getQuery().query as string))
        );
      };

      try {
        const target = await sourceType.resolveDefaultDataset({ data: services.data, flavor });
        if (!target) {
          if (sourceType.id === OPENSEARCH_SOURCE_TYPE_ID && flavor === ExploreFlavor.Metrics) {
            // No Prometheus connection yet: show the (empty) Prometheus picker.
            queryString.setQuery(
              withoutQueryOptions({
                query: EMPTY_QUERY.QUERY,
                language: 'PROMQL',
                dataset: undefined,
              })
            );
            applyAndRun('PROMQL');
            return;
          }
          services.notifications?.toasts.addWarning({
            title: i18n.translate('explore.sourceType.noDataset', {
              defaultMessage: 'No {sourceType} dataset found to query',
              values: { sourceType: getSourceTypeRegistry().getLabel(sourceType, flavor) },
            }),
          });
          return;
        }

        // The dataset picker caches the dataView itself; switching bypasses it, so cache it here
        // or query execution can't resolve the dataView.
        try {
          const { storage, ...datasetServices } = services;
          await queryString.getDatasetService().cacheDataset(target, datasetServices);
        } catch (error) {
          // Not fatal: running the query reports a clearer error if the dataView can't load.
          // eslint-disable-next-line no-console
          console.warn(`Could not cache the ${sourceType.id} dataset "${target.id}"`, error);
        }

        // The language comes from dataset.language, which each source's resolveDefaultDataset
        // sets, so the previous source's language isn't coerced to the dataset type's default.
        const initialQuery = queryString.getInitialQueryByDataset(target);
        queryString.setQuery(
          withoutQueryOptions({ ...initialQuery, query: EMPTY_QUERY.QUERY, dataset: target })
        );
        applyAndRun(initialQuery.language, target);
      } catch (error) {
        services.notifications?.toasts.addError(error as Error, {
          title: i18n.translate('explore.sourceType.switchError', {
            defaultMessage: 'Could not switch source type',
          }),
        });
      }
    },
    [flavor, dispatch, clearEditors, focusOnEditor, schedule]
  );
};
