/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../types';
import type { DataImporterPluginAppProps } from '../../../../data_importer/public';

interface ImportDataModalProps {
  services: ExploreServices;
  isVisible: boolean;
  onClose: () => void;
}

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

/**
 * Shared modal component for importing data using the data importer plugin.
 * Handles lazy loading of the DataImporterPluginApp component and renders it in a modal.
 */
export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  services,
  isVisible,
  onClose,
}) => {
  const [DataImporterApp, setDataImporterApp] = useState<React.ComponentType<
    DataImporterPluginAppProps
  > | null>(null);

  // Lazy load the data importer component when modal is opened
  useEffect(() => {
    if (isVisible && !DataImporterApp) {
      import('../../../../data_importer/public')
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
          onClose();
        });
    }
  }, [isVisible, DataImporterApp, services.notifications.toasts, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <EuiModal onClose={onClose} maxWidth="1200px" className="importDataModal">
      <EuiModalHeader>
        <EuiModalHeaderTitle>{label}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody className="importDataModal__body">
        {DataImporterApp && (
          <DataImporterApp
            basename=""
            notifications={services.notifications}
            http={services.http}
            navigation={services.navigation}
            // @ts-expect-error TS2322 TODO(ts-error): fixme
            config={services.dataImporterConfig}
            savedObjects={services.savedObjects}
            dataSourceEnabled={services.dataSourceEnabled}
            hideLocalCluster={services.hideLocalCluster}
            dataSourceManagement={services.dataSourceManagement}
            embedded={true}
          />
        )}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={onClose} fill>
          {i18n.translate('explore.queryPanel.importDataDone', {
            defaultMessage: 'Done',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
