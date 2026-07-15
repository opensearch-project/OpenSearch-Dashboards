/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { BaseDataset, DEFAULT_DATA, Query } from '../../../../../../data/common';
import { AdvancedSelector } from '../../../../../../data/public';
import { toMountPoint } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { PLUGIN_ID, ExploreFlavor, EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';

interface CreateDatasetArgs {
  /** The seeded pattern: a wildcard (`logs-app-*`) or comma-separated set (`a,b,c`). */
  pattern: string;
  /** Active data source (MDS), or undefined for the local cluster. */
  dataSource?: BaseDataset['dataSource'];
}

const SIGNAL_TYPE_LOGS = 'logs';

/**
 * Opens the shared dataset-creation modal (`AdvancedSelector`) at step 1 (browse) — the same staging
 * UI + `saveDataset` APIs the dataset plugin's "Create dataset" flow uses (name + time field + schema
 * mappings). When seeded from a card/selection, the clicked index/pattern + active data source are
 * PRE-SELECTED at step 1 so the user sees what they're building before configuring it. On confirm it
 * persists the dataset with `signalType: 'logs'` and hands off to the logs Query experience.
 * Standalone: no Redux, navigate via `navigateToApp`.
 */
export const useCreateDataset = (services: ExploreServices) => {
  return useCallback(
    ({ pattern, dataSource }: CreateDatasetArgs) => {
      const datasetService = services.data.query.queryString.getDatasetService();

      // Persist the configured dataset (signalType: logs) then hand off to the logs Query app.
      const onSelect = async (query: Partial<Query>) => {
        if (!query?.dataset) return;
        try {
          await datasetService.saveDataset(
            query.dataset,
            { data: services.data } as any,
            SIGNAL_TYPE_LOGS
          );
          services.notifications.toasts.addSuccess({
            title: i18n.translate('explore.logsDrilldown.createDatasetSuccess', {
              defaultMessage: 'Dataset "{title}" created',
              values: { title: query.dataset.title },
            }),
          });
          services.data.dataViews.clearCache();
        } catch (error) {
          const isDuplicate =
            (error as { name?: string })?.name === 'DuplicateDataViewError' ||
            (error as { message?: string })?.message?.includes('Duplicate data view');
          if (!isDuplicate) {
            services.notifications.toasts.addDanger(
              i18n.translate('explore.logsDrilldown.createDatasetError', {
                defaultMessage: 'Unable to create dataset "{title}"',
                values: { title: query.dataset.title },
              })
            );
            return;
          }
          // Duplicate → reuse the existing dataset (fall through to activate it).
        }

        // Write to the shared query-string manager; the logs flavor hydrates from it on mount.
        // Pin PPL so the hand-off doesn't inherit a stale SQL/DQL language ("Language changed" toast).
        const initialQuery = services.data.query.queryString.getInitialQueryByDataset({
          ...query.dataset,
          language: query.dataset.language || EXPLORE_DEFAULT_LANGUAGE,
        });
        services.data.query.queryString.setQuery(initialQuery);
        services.core.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
          path: '#/',
        });
      };

      // Holder so the modal's own callbacks can close it (the ref is set right after openModal).
      const modalHolder: { close: () => void } = { close: () => {} };
      const closeModal = () => modalHolder.close();

      // Always open the full AdvancedSelector at step 1 (browse) so the user sees which
      // index/pattern the dataset is built from before configuring it. When seeded from a card or a
      // multi-select (`pattern`), the clicked index/pattern is PRE-SELECTED at step 1 (via the
      // additive `initialSelectedItems`), and the active data source is pre-selected too — so the
      // user lands on step 1 with everything staged and only has to click Next. Unseeded
      // (empty-state "Create dataset") opens step 1 blank.
      const element = React.createElement(AdvancedSelector, {
        services: services as any, // ExploreServices ⊇ IDataPluginServices for this UI
        supportedTypes: [DEFAULT_DATA.SET_TYPES.INDEX],
        useConfiguratorV2: true,
        alwaysShowDatasetFields: true,
        signalType: SIGNAL_TYPE_LOGS,
        // Comma-joined multi-index patterns split into individual pre-selected items in the creator.
        ...(pattern ? { initialSelectedItems: [pattern] } : {}),
        ...(dataSource?.id ? { initialDataSourceId: dataSource.id } : {}),
        onCancel: closeModal,
        onSelect: async (q: Partial<Query>) => {
          closeModal();
          await onSelect(q);
        },
      });

      const modal = services.overlays.openModal(toMountPoint(element), {
        maxWidth: false,
        className: 'datasetSelector__advancedModal',
      });
      modalHolder.close = () => modal.close();
    },
    [services]
  );
};
