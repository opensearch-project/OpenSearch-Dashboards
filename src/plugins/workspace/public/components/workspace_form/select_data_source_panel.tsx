/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EuiSpacer,
  EuiFlexItem,
  EuiSmallButton,
  EuiFlexGroup,
  EuiPanel,
  EuiEmptyPrompt,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsStart, CoreStart } from '../../../../../core/public';
import { DataSourceConnection } from '../../../common/types';
import { WorkspaceFormError } from './types';
import { AssociationDataSourceModal } from '../data_source_association/association_data_source_modal';
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

  const excludedConnectionIds = useMemo(() => assignedDataSourceConnections.map((c) => c.id), [
    assignedDataSourceConnections,
  ]);

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

  const renderAddOpenSearchConnectionsButton = (
    testingId = 'workspace-creator-dataSources-assign-button'
  ) => (
    <EuiSmallButton
      iconType="plusInCircle"
      onClick={() => {
        setToggleIdSelected(AssociationDataSourceModalMode.OpenSearchConnections);
        setModalVisible(true);
      }}
      data-test-subj={testingId}
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
        defaultMessage: 'Associate OpenSearch data sources',
      })}
    </EuiSmallButton>
  );

  const renderAddDirectQueryConnectionsButton = (
    testingId = 'workspace-creator-dqc-assign-button'
  ) => (
    <EuiSmallButton
      iconType="plusInCircle"
      onClick={() => {
        setToggleIdSelected(AssociationDataSourceModalMode.DirectQueryConnections);
        setModalVisible(true);
      }}
      data-test-subj={testingId}
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNewDQCs', {
        defaultMessage: 'Associate direct query data sources',
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

  const renderTableContent = () => {
    const message =
      assignedDataSourceConnections.length === 0 ? (
        <EuiEmptyPrompt
          iconType="database"
          iconColor="default"
          title={
            <EuiText size="s">
              <h3>
                {i18n.translate('workspace.forms.selectDataSourcePanel.emptyTableTitle', {
                  defaultMessage: 'Associated data sources will appear here',
                })}
              </h3>
            </EuiText>
          }
          body={
            <EuiText size="s">
              {i18n.translate('workspace.forms.selectDataSourcePanel.emptyTableDescription', {
                defaultMessage: 'At least one data source is required to create a workspace.',
              })}
            </EuiText>
          }
          actions={
            showDataSourceManagement && (
              <EuiFlexGroup gutterSize="s">
                <EuiFlexItem>
                  {renderAddOpenSearchConnectionsButton(
                    'workspace-creator-emptyPrompt-dataSources-assign-button'
                  )}
                </EuiFlexItem>
                <EuiFlexItem>
                  {renderAddDirectQueryConnectionsButton(
                    'workspace-creator-emptyPrompt-dqc-assign-button'
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            )
          }
        />
      ) : undefined;
    return (
      <EuiPanel paddingSize="none" hasBorder={false}>
        <DataSourceConnectionTable
          isDashboardAdmin={showDataSourceManagement}
          dataSourceConnections={assignedDataSourceConnections}
          onUnlinkDataSource={handleSingleDataSourceUnAssign}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          onSelectionChange={setSelectedItems}
          tableProps={{ message }}
        />
      </EuiPanel>
    );
  };

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
          <EuiFlexItem grow={false}>{renderAddOpenSearchConnectionsButton()}</EuiFlexItem>
        )}
        {showDataSourceManagement && (
          <EuiFlexItem grow={false}>{renderAddDirectQueryConnectionsButton()}</EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      {renderTableContent()}
      {modalVisible && chrome && (
        <AssociationDataSourceModal
          savedObjects={savedObjects}
          excludedConnectionIds={excludedConnectionIds}
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
