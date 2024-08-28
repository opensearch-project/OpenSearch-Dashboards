/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import React from 'react';
import {
  EuiText,
  EuiModal,
  EuiButton,
  EuiModalBody,
  EuiSelectable,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelectableOption,
  EuiSpacer,
  EuiButtonGroup,
  EuiButtonGroupOptionProps,
  EuiBadge,
} from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import { i18n } from '@osd/i18n';

import { getDataSourcesList, fetchDataSourceConnections } from '../../utils';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { HttpStart, NotificationsStart, SavedObjectsStart } from '../../../../../core/public';

type DataSourceModalOption = EuiSelectableOption<{ connection: DataSourceConnection }>;

const convertConnectionsToOptions = (
  connections: DataSourceConnection[],
  assignedConnections: DataSourceConnection[]
) => {
  const assignedConnectionIds = assignedConnections.map(({ id }) => id);
  return connections
    .filter((connection) => !assignedConnectionIds.includes(connection.id))
    .map((connection) => ({
      label: connection.name,
      key: connection.id,
      append:
        connection.relatedConnections && connection.relatedConnections.length > 0 ? (
          <EuiBadge>
            {i18n.translate('workspace.form.selectDataSource.optionBadge', {
              defaultMessage: '+ {relatedConnections} related',
              values: {
                relatedConnections: connection.relatedConnections.length,
              },
            })}
          </EuiBadge>
        ) : undefined,
      connection,
      checked: undefined,
    }));
};

enum AssociationDataSourceModalTab {
  OpenSearchConnections = 'opensearch-connections',
  DirectQueryConnections = 'direction-query-connections',
}

const tabOptions: EuiButtonGroupOptionProps[] = [
  {
    id: AssociationDataSourceModalTab.OpenSearchConnections,
    label: i18n.translate('workspace.form.selectDataSource.subTitle', {
      defaultMessage: 'OpenSearch connections',
    }),
  },
  {
    id: AssociationDataSourceModalTab.DirectQueryConnections,
    label: i18n.translate('workspace.form.selectDataSource.subTitle', {
      defaultMessage: 'Direct query connections',
    }),
  },
];

export interface AssociationDataSourceModalProps {
  http: HttpStart | undefined;
  notifications: NotificationsStart | undefined;
  savedObjects: SavedObjectsStart;
  assignedConnections: DataSourceConnection[];
  closeModal: () => void;
  handleAssignDataSourceConnections: (connections: DataSourceConnection[]) => Promise<void>;
}

export const AssociationDataSourceModal = ({
  http,
  notifications,
  closeModal,
  savedObjects,
  assignedConnections,
  handleAssignDataSourceConnections,
}: AssociationDataSourceModalProps) => {
  const [allConnections, setAllConnections] = useState<DataSourceConnection[]>([]);
  const [currentTab, setCurrentTab] = useState(tabOptions[0].id);
  const [allOptions, setAllOptions] = useState<DataSourceModalOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const options = useMemo(() => {
    if (currentTab === AssociationDataSourceModalTab.OpenSearchConnections) {
      return allOptions.filter(
        ({ connection }) =>
          connection.connectionType === DataSourceConnectionType.OpenSearchConnection
      );
    }
    if (currentTab === AssociationDataSourceModalTab.DirectQueryConnections) {
      return allOptions.filter(
        ({ connection }) =>
          connection.connectionType === DataSourceConnectionType.DirectQueryConnection
      );
    }
    return allOptions;
  }, [allOptions, currentTab]);

  const selectedConnections = useMemo(
    () => allOptions.filter(({ checked }) => checked === 'on').map(({ connection }) => connection),
    [allOptions]
  );

  const handleSelectionChange = useCallback(
    (newOptions: DataSourceModalOption[]) => {
      const newCheckedConnectionIds = newOptions
        .filter(({ checked }) => checked === 'on')
        .map(({ connection }) => connection.id);

      setAllOptions((prevOptions) => {
        return prevOptions.map((option) => {
          option = { ...option };
          const checkedInNewOptions = newCheckedConnectionIds.includes(option.connection.id);
          const connection = option.connection;
          option.checked = checkedInNewOptions ? 'on' : undefined;

          if (connection.connectionType === DataSourceConnectionType.OpenSearchConnection) {
            const childDQCIds = allConnections
              .filter(({ parentId }) => parentId === connection.id)
              .map(({ id }) => id);
            // Check if there any DQC change to checked status this time, set to "on" if exists.
            if (
              newCheckedConnectionIds.some(
                (id) =>
                  childDQCIds.includes(id) &&
                  // This child DQC not checked before
                  !prevOptions.find((item) => item.connection.id === id && item.checked === 'on')
              )
            ) {
              option.checked = 'on';
            }
          }

          if (connection.connectionType === DataSourceConnectionType.DirectQueryConnection) {
            const parentConnection = allConnections.find(({ id }) => id === connection.parentId);
            if (parentConnection) {
              const isParentCheckedLastTime = !!prevOptions.find(
                (item) => item.connection.id === parentConnection.id && item.checked === 'on'
              );
              const isParentCheckedThisTime = newCheckedConnectionIds.includes(parentConnection.id);

              // Update checked status if parent checked status changed this time
              if (isParentCheckedLastTime !== isParentCheckedThisTime) {
                option.checked = isParentCheckedThisTime ? 'on' : undefined;
              }
            }
          }

          return option;
        });
      });
    },
    [allConnections]
  );

  useEffect(() => {
    setIsLoading(true);
    getDataSourcesList(savedObjects.client, ['*'])
      .then((dataSourcesList) => fetchDataSourceConnections(dataSourcesList, http, notifications))
      .then((connections) => {
        setAllConnections(connections);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [savedObjects.client, http, notifications]);

  useEffect(() => {
    setAllOptions(convertConnectionsToOptions(allConnections, assignedConnections));
  }, [allConnections, assignedConnections]);

  return (
    <EuiModal onClose={closeModal} style={{ width: 900 }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.title"
            defaultMessage="Associate OpenSearch connections"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="xs" color="subdued">
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.message"
            defaultMessage="Add OpenSearch connections that will be available in the workspace."
          />
        </EuiText>
        <EuiSpacer />
        <EuiButtonGroup
          legend="Data source tab"
          options={tabOptions}
          idSelected={currentTab}
          onChange={(id) => setCurrentTab(id)}
          buttonSize="compressed"
        />
        <EuiSpacer size="s" />
        <EuiSelectable
          aria-label="Searchable"
          searchable
          listProps={{ bordered: true, onFocusBadge: false }}
          searchProps={{
            'data-test-subj': 'workspace-detail-dataSources-associateModal-search',
          }}
          options={options}
          onChange={handleSelectionChange}
          isLoading={isLoading}
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
        <EuiButton onClick={closeModal}>
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.close.button"
            defaultMessage="Close"
          />
        </EuiButton>
        <EuiButton
          onClick={() => handleAssignDataSourceConnections(selectedConnections)}
          isDisabled={!selectedConnections || selectedConnections.length === 0}
          fill
        >
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.save.button"
            defaultMessage="Associate data sources"
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
