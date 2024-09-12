/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSpacer, EuiFlexItem, EuiSmallButton, EuiFlexGroup, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsStart, CoreStart } from '../../../../../core/public';
import { DataSourceConnection } from '../../../common/types';
import { WorkspaceFormError } from './types';
import { AssociationDataSourceModal } from '../workspace_detail/association_data_source_modal';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceClient } from '../../workspace_client';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { DataSourceConnectionTable } from './data_source_connection_table';

export interface SelectDataSourcePanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  savedObjects: SavedObjectsStart;
  assignedDataSourceConnections: DataSourceConnection[];
  onChange: (value: DataSourceConnection[]) => void;
  showDataSourceManagement: boolean;
}

export const SelectDataSourcePanel = ({
  onChange,
  assignedDataSourceConnections,
  savedObjects,
  showDataSourceManagement,
}: SelectDataSourcePanelProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<DataSourceConnection[]>([]);
  const [toggleIdSelected, setToggleIdSelected] = useState(
    AssociationDataSourceModalMode.OpenSearchConnections
  );
  const {
    services: { notifications, http, chrome },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();

  const handleAssignDataSourceConnections = (newDataSourceConnections: DataSourceConnection[]) => {
    setModalVisible(false);
    onChange([...assignedDataSourceConnections, ...newDataSourceConnections]);
  };

  const handleUnassignDataSources = (dataSourceConnections: DataSourceConnection[]) => {
    onChange(
      assignedDataSourceConnections.filter(
        ({ id }: DataSourceConnection) => !dataSourceConnections.some((item) => item.id === id)
      )
    );
  };

  const handleSingleDataSourceUnAssign = (connection: DataSourceConnection) => {
    handleUnassignDataSources([connection]);
  };

  const renderTableContent = () => {
    return (
      <EuiPanel paddingSize="none" hasBorder={false}>
        <DataSourceConnectionTable
          isDashboardAdmin={showDataSourceManagement}
          dataSourceConnections={assignedDataSourceConnections}
          onUnlinkDataSource={handleSingleDataSourceUnAssign}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          onSelectionChange={setSelectedItems}
        />
      </EuiPanel>
    );
  };

  const addOpenSearchConnectionsButton = (
    <EuiSmallButton
      iconType="plusInCircle"
      onClick={() => {
        setToggleIdSelected(AssociationDataSourceModalMode.OpenSearchConnections);
        setModalVisible(true);
      }}
      data-test-subj="workspace-creator-dataSources-assign-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
        defaultMessage: 'Add OpenSearch connections',
      })}
    </EuiSmallButton>
  );

  const addDirectQueryConnectionsButton = (
    <EuiSmallButton
      iconType="plusInCircle"
      onClick={() => {
        setToggleIdSelected(AssociationDataSourceModalMode.DirectQueryConnections);
        setModalVisible(true);
      }}
      data-test-subj="workspace-creator-dqc-assign-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNewDQCs', {
        defaultMessage: 'Add direct query connections',
      })}
    </EuiSmallButton>
  );

  const removeButton = (
    <EuiSmallButton
      iconType="unlink"
      color="danger"
      onClick={() => {
        handleUnassignDataSources(selectedItems);
      }}
      data-test-subj="workspace-creator-dataSources-remove-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.remove', {
        defaultMessage: 'Remove selected',
      })}
    </EuiSmallButton>
  );

  return (
    <div>
      <EuiSpacer size="m" />
      <EuiFlexGroup alignItems="center" gutterSize="s">
        {showDataSourceManagement &&
          selectedItems.length > 0 &&
          assignedDataSourceConnections.length > 0 && (
            <EuiFlexItem grow={false}>{removeButton}</EuiFlexItem>
          )}
        {showDataSourceManagement && (
          <EuiFlexItem grow={false}>{addOpenSearchConnectionsButton}</EuiFlexItem>
        )}
        {showDataSourceManagement && (
          <EuiFlexItem grow={false}>{addDirectQueryConnectionsButton}</EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiFlexItem style={{ maxWidth: 768 }}>
        {assignedDataSourceConnections.length > 0 && renderTableContent()}
      </EuiFlexItem>
      {modalVisible && chrome && (
        <AssociationDataSourceModal
          savedObjects={savedObjects}
          assignedConnections={assignedDataSourceConnections}
          closeModal={() => setModalVisible(false)}
          handleAssignDataSourceConnections={handleAssignDataSourceConnections}
          http={http}
          mode={toggleIdSelected}
          notifications={notifications}
          logos={chrome.logos}
        />
      )}
    </div>
  );
};
