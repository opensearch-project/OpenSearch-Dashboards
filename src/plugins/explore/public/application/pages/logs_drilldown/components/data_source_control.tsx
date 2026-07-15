/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';

export interface SelectedDataSource {
  id?: string;
  title?: string;
}

interface Props {
  services: ExploreServices;
  onChange: (dataSource: SelectedDataSource) => void;
}

/**
 * Reuses the data_source_management `DataSourceSelector` so the user can switch which OpenSearch
 * data source (MDS) the index list is scoped to. Renders nothing when MDS is disabled / the
 * plugin isn't present (single local cluster), so the local-cluster case stays chrome-free.
 */
export const DataSourceControl: React.FC<Props> = ({ services, onChange }) => {
  const DataSourceSelector = services.dataSourceManagement?.ui?.DataSourceSelector;
  if (!DataSourceSelector) {
    return null;
  }

  return (
    <div className="logsExploreDataSourceControl" data-test-subj="logsExploreDataSourceControl">
      <DataSourceSelector
        savedObjectsClient={services.savedObjects.client}
        notifications={services.notifications.toasts}
        uiSettings={services.uiSettings}
        fullWidth
        compressed
        // Onboarding users (Splunk/Datadog) pick a real registered cluster — the implicit local
        // cluster isn't a meaningful drilldown target, so hide it here.
        hideLocalCluster
        // No `defaultOption` → the selector auto-selects a real registered data source on load
        // (the workspace default, or the first available when local cluster is hidden), so the
        // picker always reflects the cluster whose indexes are actually shown — never an empty
        // selection while the list below is populated.
        disabled={false}
        removePrepend={false}
        placeholderText={i18n.translate('explore.logsExplore.dataSource.placeholder', {
          defaultMessage: 'Select a data source',
        })}
        onSelectedDataSource={(options: Array<{ id?: string; label?: string }>) => {
          const opt = options?.[0];
          onChange({ id: opt?.id ?? '', title: opt?.label });
        }}
      />
    </div>
  );
};
