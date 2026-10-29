/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EuiButton,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AgentTracesServices } from '../../types';
import type {
  DataImporterHandle,
  DataImporterPluginAppProps,
} from '../../../../data_importer/public';

interface ImportDataModalProps {
  services: AgentTracesServices;
  isVisible: boolean;
  onClose: () => void;
}

const label = i18n.translate('agentTraces.queryPanel.importDataLabel', {
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
    DataImporterPluginAppProps & React.RefAttributes<DataImporterHandle>
  > | null>(null);
  const importerRef = useRef<DataImporterHandle>(null);

  // Every close affordance (X, Escape, Done) goes through the importer so it can guard
  // un-imported input with a discard confirmation. Before the importer has lazy-loaded
  // there is nothing to lose, so close directly.
  const requestClose = useCallback(() => {
    if (importerRef.current) {
      importerRef.current.requestClose();
    } else {
      onClose();
    }
  }, [onClose]);

  // Lazy load the data importer component when modal is opened
  useEffect(() => {
    if (isVisible && !DataImporterApp) {
      import('../../../../data_importer/public')
        .then((module) => {
          setDataImporterApp(() => module.DataImporterPluginApp);
        })
        .catch((error) => {
          services.notifications.toasts.addDanger({
            title: i18n.translate('agentTraces.queryPanel.importDataLoadError', {
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
    <EuiModal onClose={requestClose} maxWidth="1200px" className="importDataModal">
      <EuiModalHeader>
        <EuiModalHeaderTitle>{label}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody className="importDataModal__body">
        {DataImporterApp && (
          <DataImporterApp
            ref={importerRef}
            onClose={onClose}
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
        {/* Secondary on purpose: Import (inside the importer) is the primary action, and Done
            is a separate terminal action so several files can be imported before closing. */}
        <EuiButton onClick={requestClose} data-test-subj="importDataModalDoneButton">
          {i18n.translate('agentTraces.queryPanel.importDataDone', {
            defaultMessage: 'Done',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
