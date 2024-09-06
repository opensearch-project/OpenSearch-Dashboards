/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiConfirmModal, EuiSearchBarProps, EuiSmallButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { DataSourceConnectionTable } from '../workspace_form';

interface WorkspaceDetailConnectionTableProps {
  isDashboardAdmin: boolean;
  connectionType: string;
  dataSourceConnections: DataSourceConnection[];
  handleUnassignDataSources: (dataSources: DataSourceConnection[]) => void;
}

export const WorkspaceDetailConnectionTable = ({
  isDashboardAdmin,
  connectionType,
  dataSourceConnections,
  handleUnassignDataSources,
}: WorkspaceDetailConnectionTableProps) => {
  const [selectedItems, setSelectedItems] = useState<DataSourceConnection[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Reset selected items when connectionType changes
    setSelectedItems([]);
  }, [connectionType]);

  const openSearchConnections = useMemo(() => {
    return dataSourceConnections.filter((dsc) =>
      connectionType === AssociationDataSourceModalMode.OpenSearchConnections
        ? dsc.connectionType === DataSourceConnectionType.OpenSearchConnection
        : dsc?.relatedConnections && dsc.relatedConnections?.length > 0
    );
  }, [connectionType, dataSourceConnections]);

  const renderToolsLeft = useCallback(() => {
    return selectedItems.length > 0 && !modalVisible
      ? [
          <EuiSmallButton
            color="danger"
            onClick={() => setModalVisible(true)}
            data-test-subj="workspace-detail-dataSources-table-bulkRemove"
          >
            {i18n.translate('workspace.detail.dataSources.table.remove.button', {
              defaultMessage: 'Remove {numberOfSelect} association(s)',
              values: { numberOfSelect: selectedItems.length },
            })}
          </EuiSmallButton>,
        ]
      : [];
  }, [selectedItems, modalVisible]);

  const search: EuiSearchBarProps = {
    toolsLeft: renderToolsLeft(),
    box: {
      incremental: true,
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'type',
        name: 'Type',
        multiSelect: 'or',
        options: Array.from(
          new Set(openSearchConnections.map(({ type }) => type).filter(Boolean))
        ).map((type) => ({
          value: type!,
          name: type!,
        })),
      },
    ],
  };

  return (
    <>
      {
        <DataSourceConnectionTable
          isDashboardAdmin={isDashboardAdmin}
          dataSourceConnections={openSearchConnections}
          connectionType={connectionType}
          onUnlinkDataSource={(item) => {
            setSelectedItems([item]);
            setModalVisible(true);
          }}
          onSelectionChange={setSelectedItems}
          tableProps={{
            search,
            pagination: {
              initialPageSize: 10,
              pageSizeOptions: [10, 20, 30],
            },
          }}
          /* Unmount table after connection type */
          key={connectionType}
        />
      }
      {modalVisible && (
        <EuiConfirmModal
          data-test-subj="workspaceForm-cancelModal"
          title={i18n.translate('workspace.detail.dataSources.modal.title', {
            defaultMessage: 'Remove data source(s)',
          })}
          onCancel={() => {
            setModalVisible(false);
            setSelectedItems([]);
          }}
          onConfirm={() => {
            setModalVisible(false);
            handleUnassignDataSources(selectedItems);
          }}
          cancelButtonText={i18n.translate('workspace.detail.dataSources.modal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('workspace.detail.dataSources.Modal.confirmButton', {
            defaultMessage: 'Remove data source(s)',
          })}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        />
      )}
    </>
  );
};
