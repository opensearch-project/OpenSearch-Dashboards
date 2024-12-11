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
  loadingStatus,
}: {
  connection: DataSourceConnection;
  selectedConnectionIds: string[];
  logos: Logos;
  loadingStatus: Record<string, boolean>;
}) => {
  return {
    label: connection.name,
    key: connection.id,
    description: connection.description,
    append: !loadingStatus[connection.id] ? (
      connection.relatedConnections && connection.relatedConnections.length > 0 ? (
        <EuiBadge>
          {i18n.translate('workspace.form.selectDataSource.optionBadge', {
            defaultMessage: '+ {relatedConnections} related',
            values: {
              relatedConnections: connection.relatedConnections.length,
            },
          })}
        </EuiBadge>
      ) : undefined
    ) : (
      <EuiBadge>
        {i18n.translate('workspace.form.selectDataSource.loading', {
          defaultMessage: 'Loading...',
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
  loadingStatus,
}: {
  connections: DataSourceConnection[];
  excludedConnectionIds: string[];
  showDirectQueryConnections: boolean;
  selectedConnectionIds: string[];
  logos: Logos;
  loadingStatus: Record<string, boolean>;
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
        if (showDirectQueryConnections) {
          return [connection];
        }
        return [];
      }

      if (connection.connectionType === DataSourceConnectionType.OpenSearchConnection) {
        if (showDirectQueryConnections) {
          if (!connection.relatedConnections || connection.relatedConnections.length === 0) {
            // return [connection] for the case where the connnection has no direct connections for now, but it may have in the future
            return [connection];
          }
          return [
            connection,
            ...(selectedConnectionIds.includes(connection.id) ? connection.relatedConnections : []),
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
        loadingStatus,
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
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    setIsLoading(true);
    getDataSourcesList(savedObjects.client, ['*'])
      .then((dataSourcesList) => {
        const {
          openSearchConnections,
          dataConnections,
        } = convertDataSourcesToOpenSearchAndDataConnections(dataSourcesList);

        const initialLoadingStatus = dataSourcesList.reduce((acc, ds) => {
          acc[ds.id] = true;
          return acc;
        }, {} as Record<string, boolean>);

        setLoadingStatus(initialLoadingStatus);

        // display data sources connections first while loading direct query connection
        setAllConnections([...openSearchConnections, ...dataConnections]);
        return { openSearchConnections };
      })
      .then(({ openSearchConnections }) => {
        //  Only data source saved object type needs to fetch data source connections, data connection type object not.
        openSearchConnections.forEach((ds) => {
          // fetch direct query connections for each data source, and set loading status accordingly
          fetchDirectQueryConnectionsByIDs([ds.id], http, notifications)
            .then((directQueryConnections) => {
              setAllConnections((prev) => {
                return prev.map((connection) => {
                  if (connection.id === ds.id) {
                    return {
                      ...connection,
                      relatedConnections: directQueryConnections,
                    };
                  }
                  return connection;
                });
              });
            })
            .finally(() => {
              setLoadingStatus((prev) => ({ ...prev, [ds.id]: false }));
            });
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [savedObjects.client, notifications, http]);

  useEffect(() => {
    if (allConnections.length > 0) {
      setOptions(
        convertConnectionsToOptions({
          connections: allConnections,
          excludedConnectionIds,
          selectedConnectionIds,
          showDirectQueryConnections:
            mode === AssociationDataSourceModalMode.DirectQueryConnections,
          logos,
          loadingStatus,
        })
      );
    }
  }, [excludedConnectionIds, selectedConnectionIds, mode, allConnections, logos, loadingStatus]);

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
            id="workspace.detail.dataSources.associateModal.close.button"
            defaultMessage="Close"
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
