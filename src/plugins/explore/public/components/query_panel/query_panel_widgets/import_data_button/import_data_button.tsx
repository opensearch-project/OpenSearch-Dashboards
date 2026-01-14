/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiIcon,
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
import './import_data_button.scss';

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

export const ImportDataButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  // Lazy load the data importer component
  const [DataImporterApp, setDataImporterApp] = useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    if (isModalVisible && !DataImporterApp) {
      // Dynamically import the data importer component
      import('../../../../../../data_importer/public').then((module) => {
        setDataImporterApp(() => module.DataImporterPluginApp);
      });
    }
  }, [isModalVisible, DataImporterApp]);

  return (
    <>
      <EuiButtonEmpty onClick={showModal} data-test-subj="exploreImportDataButton" size="xs">
        <div className="exploreImportDataButton__buttonTextWrapper">
          <EuiIcon type="importAction" size="s" />
          <EuiText size="xs">{label}</EuiText>
        </div>
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
                config={{
                  enabledFileTypes: ['csv', 'json', 'ndjson'],
                  maxFileSizeBytes: 100000000,
                  maxTextCount: 10000,
                  filePreviewDocumentsCount: 10,
                }}
                savedObjects={services.savedObjects}
                dataSourceEnabled={false}
                hideLocalCluster={false}
                embedded={true}
              />
            )}
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton onClick={closeModal} fill>
              Done
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </>
  );
};
