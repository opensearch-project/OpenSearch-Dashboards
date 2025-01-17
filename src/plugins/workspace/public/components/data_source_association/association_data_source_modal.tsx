/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useState, useCallback, useRef } from 'react';
import React from 'react';
import {
  EuiText,
  EuiModal,
  EuiSmallButton,
  EuiModalBody,
  EuiSelectable,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectableOption,
  EuiSpacer,
  EuiBadge,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextColor,
} from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import { i18n } from '@osd/i18n';

import {
  getDataSourcesList,
  fetchDirectQueryConnectionsByIDs,
  convertDataSourcesToOpenSearchAndDataConnections,
} from '../../utils';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { HttpStart, NotificationsStart, SavedObjectsStart } from '../../../../../core/public';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { Logos } from '../../../../../core/common';
import { ConnectionTypeIcon } from '../workspace_form/connection_type_icon';
import './association_data_source_modal.scss';

const ConnectionIcon = ({
  connection: { connectionType, type },
  logos,
}: {
  connection: DataSourceConnection;
  logos: Logos;
}) => {
  if (connectionType === DataSourceConnectionType.OpenSearchConnection) {
    return <EuiIcon type={logos.Mark.url} />;
  }
  if (
    connectionType === DataSourceConnectionType.DirectQueryConnection ||
    connectionType === DataSourceConnectionType.DataConnection
  ) {
    return <ConnectionTypeIcon type={type} />;
  }

  return null;
};

export type DataSourceModalOption = EuiSelectableOption<{
  description?: string;
  parentId?: string;
}>;

const renderOption = (option: DataSourceModalOption) => {
  const label = (
    <EuiTextColor color={!!option.parentId ? 'subdued' : undefined}>
      <EuiText className="eui-textTruncate" size={!!option.parentId ? 'xs' : 's'}>
        {option.label}
      </EuiText>
    </EuiTextColor>
  );
  if (option.description) {
    return (
      <EuiFlexGroup alignItems="center" style={{ overflow: 'hidden' }}>
        <EuiFlexItem style={{ overflow: 'hidden' }}>{label}</EuiFlexItem>
        <EuiFlexItem style={{ overflow: 'hidden' }}>
          {option.description && (
            <EuiTextColor color="subdued">
              <EuiText className="eui-textTruncate" size="xs">
                {option.description}
              </EuiText>
            </EuiTextColor>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return label;
};

const convertConnectionToOption = ({
  connection,
  selectedConnectionIds,
  logos,
  showDirectQueryConnections,
}: {
  connection: DataSourceConnection;
  selectedConnectionIds: string[];
  logos: Logos;
  showDirectQueryConnections: boolean;
}) => {
  return {
    label: connection.name,
    key: connection.id,
    description: connection.description,
    append: showDirectQueryConnections &&
      connection.relatedConnections &&
      connection.relatedConnections.length > 0 && (
        <EuiBadge>
          {i18n.translate('workspace.form.selectDataSource.optionBadge', {
            defaultMessage: '+ {relatedConnections} related',
            values: {
              relatedConnections: connection.relatedConnections.length,
            },
          })}
        </EuiBadge>
      ),
    disabled: connection.connectionType === DataSourceConnectionType.DirectQueryConnection,
    checked:
      connection.connectionType !== DataSourceConnectionType.DirectQueryConnection &&
      selectedConnectionIds.includes(connection.id)
        ? ('on' as const)
        : undefined,
    prepend: <ConnectionIcon connection={connection} logos={logos} />,
    parentId: connection.parentId,
  };
};

const convertConnectionsToOptions = ({
  connections,
  showDirectQueryConnections,
  selectedConnectionIds,
  excludedConnectionIds,
  logos,
}: {
  connections: DataSourceConnection[];
  excludedConnectionIds: string[];
  showDirectQueryConnections: boolean;
  selectedConnectionIds: string[];
  logos: Logos;
}) => {
  return connections
    .flatMap((connection) => {
      if (
        excludedConnectionIds.includes(connection.id) ||
        connection.connectionType === DataSourceConnectionType.DirectQueryConnection
      ) {
        return [];
      }

      if (connection.connectionType === DataSourceConnectionType.DataConnection) {
        if (!showDirectQueryConnections) {
          return [connection];
        }
        return [];
      }

      if (connection.connectionType === DataSourceConnectionType.OpenSearchConnection) {
        if (showDirectQueryConnections) {
          return [
            connection,
            ...(selectedConnectionIds.includes(connection.id)
              ? connection.relatedConnections ?? []
              : []),
          ];
        }
      }

      return [connection];
    })
    .map((connection) =>
      convertConnectionToOption({
        connection,
        selectedConnectionIds,
        logos,
        showDirectQueryConnections,
      })
    );
};

export interface AssociationDataSourceModalProps {
  http: HttpStart | undefined;
  notifications: NotificationsStart | undefined;
  savedObjects: SavedObjectsStart;
  excludedConnectionIds: string[];
  mode: AssociationDataSourceModalMode;
  closeModal: () => void;
  handleAssignDataSourceConnections: (connections: DataSourceConnection[]) => Promise<void> | void;
  logos: Logos;
}

export const AssociationDataSourceModal = (props: AssociationDataSourceModalProps) => {
  return (
    <EuiModal onClose={props.closeModal} style={{ width: 630 }}>
      <AssociationDataSourceModalContent {...props} />
    </EuiModal>
  );
};

export const AssociationDataSourceModalContent = ({
  mode,
  http,
  notifications,
  closeModal,
  savedObjects,
  excludedConnectionIds,
  handleAssignDataSourceConnections,
  logos,
}: AssociationDataSourceModalProps) => {
  const [allConnections, setAllConnections] = useState<DataSourceConnection[]>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);
  const [options, setOptions] = useState<DataSourceModalOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSelectionChange = useCallback((newOptions: DataSourceModalOption[]) => {
    setSelectedConnectionIds(
      newOptions.flatMap(({ checked, key }) => (checked === 'on' && key ? [key] : []))
    );
  }, []);

  const handleSaveButtonClick = useCallback(async () => {
    setIsSaving(true);
    const res = handleAssignDataSourceConnections(
      allConnections.filter((connection) => selectedConnectionIds.includes(connection.id))
    );
    await Promise.resolve(res);
    if (mountedRef.current) {
      setIsSaving(false);
    }
  }, [selectedConnectionIds, allConnections, handleAssignDataSourceConnections]);

  const handleDirectQueryConnections = useCallback(
    async (
      openSearchConnections: DataSourceConnection[],
      dataConnections: DataSourceConnection[]
    ) => {
      if (mode === AssociationDataSourceModalMode.OpenSearchConnections) {
        return [...openSearchConnections, ...dataConnections];
      }

      const fetchDqcConnectionsPromises = openSearchConnections.map((ds) =>
        fetchDirectQueryConnectionsByIDs([ds.id], http, notifications)
          .then((directQueryConnections) => ({
            id: ds.id,
            relatedConnections: directQueryConnections,
          }))
          .catch(() => ({
            id: ds.id,
            relatedConnections: [],
          }))
      );
      const dqcConnections = await Promise.all(fetchDqcConnectionsPromises);

      const allConnectionsWithDQC = openSearchConnections
        .filter((connection) => {
          const filteredData = dqcConnections.find((c) => c.id === connection.id);
          return filteredData && filteredData.relatedConnections.length > 0;
        })
        .map((connection) => {
          const relatedDQC = dqcConnections.find((c) => c.id === connection.id);
          return {
            ...connection,
            relatedConnections: relatedDQC?.relatedConnections,
          } as DataSourceConnection;
        });

      return allConnectionsWithDQC;
    },
    [http, mode, notifications]
  );

  useEffect(() => {
    const fetchDataSources = async () => {
      const dataSourcesList = await getDataSourcesList(savedObjects.client, ['*']);
      const {
        openSearchConnections,
        dataConnections,
      } = convertDataSourcesToOpenSearchAndDataConnections(dataSourcesList);
      return { openSearchConnections, dataConnections };
    };

    const fetchDataSourcesAndHandleRelatedConnections = async () => {
      setIsLoading(true);
      try {
        const { openSearchConnections, dataConnections } = await fetchDataSources();
        const connections = await handleDirectQueryConnections(
          openSearchConnections,
          dataConnections
        );
        setAllConnections(connections);
      } catch {
        notifications?.toasts.addDanger(
          i18n.translate('workspace.detail.dataSources.associateModal.fetchDataSourcesError', {
            defaultMessage: 'Failed to get data sources',
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataSourcesAndHandleRelatedConnections();
  }, [savedObjects.client, notifications, http, mode, handleDirectQueryConnections]);

  useEffect(() => {
    setOptions(
      convertConnectionsToOptions({
        connections: allConnections,
        excludedConnectionIds,
        selectedConnectionIds,
        showDirectQueryConnections: mode === AssociationDataSourceModalMode.DirectQueryConnections,
        logos,
      })
    );
  }, [excludedConnectionIds, selectedConnectionIds, mode, allConnections, logos]);

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {mode === AssociationDataSourceModalMode.OpenSearchConnections ? (
            <FormattedMessage
              id="workspace.detail.dataSources.associateModal.title.openSearchDataSources"
              defaultMessage="Associate OpenSearch data sources"
            />
          ) : (
            <FormattedMessage
              id="workspace.detail.dataSources.associateModal.title.directQueryDataSources"
              defaultMessage="Associate direct query data sources"
            />
          )}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="xs" color="subdued">
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.message"
            defaultMessage="Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace."
          />
        </EuiText>
        <EuiSpacer size="s" />
        <EuiSelectable
          aria-label="Searchable"
          searchable
          listProps={{ bordered: true, onFocusBadge: false }}
          searchProps={{
            'data-test-subj': 'workspace-detail-dataSources-associateModal-search',
            placeholder: i18n.translate(
              'workspace.detail.dataSources.associateModal.searchPlaceholder',
              { defaultMessage: 'Search' }
            ),
            compressed: true,
          }}
          options={options}
          onChange={handleSelectionChange}
          isLoading={isLoading}
          renderOption={renderOption}
        >
          {(list, search) => (
            <Fragment>
              {search}
              {list}
            </Fragment>
          )}
        </EuiSelectable>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButton onClick={closeModal}>
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.cancel.button"
            defaultMessage="Cancel"
          />
        </EuiSmallButton>
        <EuiSmallButton
          data-test-subj="workspace-detail-dataSources-associateModal-save-button"
          onClick={handleSaveButtonClick}
          isDisabled={selectedConnectionIds.length === 0}
          isLoading={isSaving}
          fill
        >
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.save.button"
            defaultMessage="Associate data sources"
          />
        </EuiSmallButton>
      </EuiModalFooter>
    </>
  );
};
