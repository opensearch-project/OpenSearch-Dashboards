/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import React from 'react';
import { i18n } from '@osd/i18n';
import { OverlayStart, NotificationsStart } from 'opensearch-dashboards/public';
import { toMountPoint } from '../../../../../../opensearch_dashboards_react/public';
import { DataPublicPluginStart, DuplicateDataViewError } from '../../../../../../data/public';
import { AdvancedSelector } from '../../../../../../data/public';
import { DEFAULT_DATA, Query } from '../../../../../../data/common';
import { IDataPluginServices } from '../../../../../../data/public';

interface UseDatasetSelectorParams {
  data: DataPublicPluginStart;
  overlays?: OverlayStart;
  services: IDataPluginServices;
  notifications?: NotificationsStart;
  historyPush: (path: string) => void;
}

export const useDatasetSelector = ({
  data,
  overlays,
  services,
  notifications,
  historyPush,
}: UseDatasetSelectorParams) => {
  const openDatasetSelector = useCallback(
    (signalType: string) => {
      const datasetService = data.query.queryString.getDatasetService();

      const overlay = overlays?.openModal(
        toMountPoint(
          <AdvancedSelector
            useConfiguratorV2
            alwaysShowDatasetFields
            signalType={signalType}
            services={services}
            supportedTypes={[DEFAULT_DATA.SET_TYPES.INDEX]}
            onSelect={async (query: Partial<Query>) => {
              overlay?.close();
              if (query?.dataset) {
                try {
                  await datasetService.saveDataset(query.dataset, { data }, signalType);
                  notifications?.toasts.addSuccess({
                    title: i18n.translate(
                      'datasetManagement.datasetTable.createDatasetSuccessTitle',
                      {
                        defaultMessage: 'Dataset "{title}" created successfully',
                        values: { title: query.dataset.title },
                      }
                    ),
                  });
                  data.dataViews.clearCache();
                  historyPush(`/patterns/${encodeURIComponent(query.dataset.id)}`);
                } catch (error) {
                  if (error instanceof DuplicateDataViewError) {
                    const confirmMessage = i18n.translate(
                      'datasetManagement.dataset.titleExistsLabel',
                      {
                        values: { title: query.dataset.title },
                        defaultMessage: "An index pattern with the title '{title}' already exists.",
                      }
                    );

                    const isConfirmed = await overlays?.openConfirm(confirmMessage, {
                      confirmButtonText: i18n.translate(
                        'datasetManagement.dataset.goToPatternButtonLabel',
                        {
                          defaultMessage: 'Go to existing pattern',
                        }
                      ),
                    });

                    if (isConfirmed) {
                      historyPush(`/patterns/${encodeURIComponent(query.dataset.id)}`);
                    }
                    return;
                  }
                  notifications?.toasts.addDanger({
                    title: i18n.translate(
                      'datasetManagement.datasetTable.createDatasetErrorTitle',
                      {
                        defaultMessage: 'Failed to create dataset',
                      }
                    ),
                    text: (error as Error).message,
                  });
                }
              }
            }}
            onCancel={() => overlay?.close()}
          />
        ),
        {
          maxWidth: false,
          className: 'datasetSelector__advancedModal',
        }
      );
    },
    [data, overlays, services, notifications?.toasts, historyPush]
  );

  return { openDatasetSelector };
};
