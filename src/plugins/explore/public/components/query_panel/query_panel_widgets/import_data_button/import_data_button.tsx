/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

export const ImportDataButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [DataImporterApp, setDataImporterApp] = useState<React.ComponentType<any> | null>(null);

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  // Lazy load the data importer component when modal is opened
  React.useEffect(() => {
    if (isModalVisible && !DataImporterApp) {
      import('../../../../../../data_importer/public')
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
          closeModal();
        });
    }
  }, [isModalVisible, DataImporterApp, services.notifications.toasts]);

  if (services.dataImporterConfig === undefined) {
    return null;
  }

  return (
    <>
      <EuiButtonEmpty
        iconSide="left"
        iconType="importAction"
        size="xs"
        onClick={showModal}
        data-test-subj="exploreImportDataButton"
      >
        <EuiText size="xs">{label}</EuiText>
      </EuiButtonEmpty>

      {isModalVisible && (
        <EuiModal
          onClose={closeModal}
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

          <EuiModalFooter>
            <EuiButton onClick={closeModal} fill>
              {i18n.translate('explore.queryPanel.importDataDone', {
                defaultMessage: 'Done',
              })}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </>
  );
};
