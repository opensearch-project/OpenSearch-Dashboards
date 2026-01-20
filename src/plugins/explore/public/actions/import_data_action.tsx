/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiModal, EuiModalHeader, EuiModalHeaderTitle, EuiModalBody } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FlyoutActionConfig, FlyoutComponentProps } from '../services/query_panel_actions_registry';

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

/**
 * Component that renders the import data modal
 */
const ImportDataModal: React.FC<FlyoutComponentProps> = ({ closeFlyout, services }) => {
  const [DataImporterApp, setDataImporterApp] = useState<React.ComponentType<any> | null>(null);

  // Lazy load the data importer component when modal is opened
  useEffect(() => {
    if (!DataImporterApp) {
      import('../../../data_importer/public')
        .then((module) => {
          setDataImporterApp(() => module.DataImporterPluginApp);
        })
        .catch((error) => {
          services.notifications.toasts.addDanger({
            title: i18n.translate('explore.queryPanel.importDataLoadError', {
              defaultMessage: 'Failed to load data importer',
            }),
            text: error.message,
          });
          closeFlyout();
        });
    }
  }, [DataImporterApp, services.notifications.toasts, closeFlyout]);

  return (
    <EuiModal
      onClose={closeFlyout}
      maxWidth="1200px"
      style={{ width: 'min(1200px, 90vw)', maxHeight: '80vh' }}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>{label}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody
        style={{ maxHeight: 'calc(80vh - 100px)', minHeight: '400px', padding: '16px' }}
      >
        {DataImporterApp && (
          <DataImporterApp
            basename=""
            notifications={services.notifications}
            http={services.http}
            navigation={services.navigation}
            config={services.dataImporterConfig}
            savedObjects={services.savedObjects}
            dataSourceEnabled={false}
            hideLocalCluster={false}
            embedded={true}
          />
        )}
      </EuiModalBody>
    </EuiModal>
  );
};

/**
 * Import data action configuration for the query panel actions registry
 */
export const importDataActionConfig: FlyoutActionConfig = {
  id: 'import-data',
  actionType: 'flyout',
  order: 100,
  getLabel: () => label,
  getIcon: () => 'importAction',
  getIsEnabled: () => true,
  component: ImportDataModal,
};
