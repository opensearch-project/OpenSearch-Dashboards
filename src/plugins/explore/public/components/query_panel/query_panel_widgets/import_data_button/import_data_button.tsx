/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonEmpty, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { ImportDataModal } from '../../../import_data_modal';

const label = i18n.translate('explore.queryPanel.importDataLabel', {
  defaultMessage: 'Import data',
});

export const ImportDataButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

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

      <ImportDataModal services={services} isVisible={isModalVisible} onClose={closeModal} />
    </>
  );
};
