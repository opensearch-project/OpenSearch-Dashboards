/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSpacer, EuiFormLabel, EuiText, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsStart } from '../../../../../core/public';
import { DataSource } from '../../../common/types';
import { WorkspaceFormError } from './types';
import { AssociationDataSourceModal } from '../workspace_detail/association_data_source_modal';
import { CreatePageOpenSearchConnectionTable } from './createpage_opensearch_connections_table';

export interface SelectDataSourcePanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  savedObjects: SavedObjectsStart;
  assignedDataSources: DataSource[];
  onChange: (value: DataSource[]) => void;
  isDashboardAdmin: boolean;
}

export const SelectDataSourcePanel = ({
  errors,
  onChange,
  assignedDataSources,
  savedObjects,
  isDashboardAdmin,
}: SelectDataSourcePanelProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAssignDataSources = async (dataSources: DataSource[]) => {
    setModalVisible(false);
    const savedDataSources: DataSource[] = [...assignedDataSources, ...dataSources];
    onChange(savedDataSources);
  };

  const renderTableContent = () => {
    return (
      <CreatePageOpenSearchConnectionTable
        isDashboardAdmin={isDashboardAdmin}
        assignedDataSources={assignedDataSources}
        setAssignedDataSources={onChange}
        setModalVisible={setModalVisible}
      />
    );
  };

  return (
    <div>
      <EuiFormLabel>
        <EuiText size="xs">
          {i18n.translate('workspace.form.selectDataSource.subTitle', {
            defaultMessage: 'Add data sources that will be available in the workspace',
          })}
        </EuiText>
      </EuiFormLabel>
      <EuiSpacer size="m" />
      <EuiFlexItem style={{ maxWidth: 800 }}>{renderTableContent()}</EuiFlexItem>
      {modalVisible && (
        <AssociationDataSourceModal
          savedObjects={savedObjects}
          assignedDataSources={assignedDataSources}
          closeModal={() => setModalVisible(false)}
          handleAssignDataSources={handleAssignDataSources}
        />
      )}
    </div>
  );
};
