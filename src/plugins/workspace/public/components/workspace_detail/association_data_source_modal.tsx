/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
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
  EuiButtonGroup,
  EuiButtonGroupOptionProps,
  EuiBadge,
} from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import { i18n } from '@osd/i18n';

import { getDataSourcesList, fetchDataSourceConnections } from '../../utils';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { HttpStart, NotificationsStart, SavedObjectsStart } from '../../../../../core/public';
import { AssociationDataSourceModalTab } from '../../../common/constants';

export type DataSourceModalOption = EuiSelectableOption<{ connection: DataSourceConnection }>;

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

export const getUpdatedOptions = ({
  prevAllOptions,
  newOptions,
}: {
  prevAllOptions: DataSourceModalOption[];
  newOptions: DataSourceModalOption[];
}) => {
  let updatedOptions = prevAllOptions;
  const newCheckedOptions: DataSourceModalOption[] = [];
  const newUncheckedOptions: DataSourceModalOption[] = [];

  for (const option of newOptions) {
    const previousOption = prevAllOptions.find(
      ({ connection }) => connection.id === option.connection.id
    );

    if (previousOption?.checked === option.checked) {
      continue;
    }
    if (option.checked === 'on') {
      newCheckedOptions.push(option);
    } else {
      newUncheckedOptions.push(option);
    }
  }

  // Update checked status if option checked this time
  for (const newCheckedOption of newCheckedOptions) {
    switch (newCheckedOption.connection.connectionType) {
      case DataSourceConnectionType.OpenSearchConnection:
        // Set data source and its DQC checked status to 'on'
        updatedOptions = updatedOptions.map((option) =>
          option.connection.parentId === newCheckedOption.connection.id ||
          option.connection.id === newCheckedOption.connection.id
            ? { ...option, checked: 'on' }
            : option
        );
        break;
      case DataSourceConnectionType.DirectQueryConnection:
        // Set DQC and its parent data source checked status to 'on'
        updatedOptions = updatedOptions.map((option) =>
          option.connection.id === newCheckedOption.connection.id ||
          option.connection.id === newCheckedOption.connection.parentId
            ? { ...option, checked: 'on' }
            : option
        );
        break;
    }
  }

  // Update checked status if option unchecked this time
  for (const newUncheckedOption of newUncheckedOptions) {
    switch (newUncheckedOption.connection.connectionType) {
      case DataSourceConnectionType.OpenSearchConnection:
        // Set data source and its DQC checked status to undefined
        updatedOptions = updatedOptions.map((option) =>
          option.connection.parentId === newUncheckedOption.connection.id ||
          option.connection.id === newUncheckedOption.connection.id
            ? { ...option, checked: undefined }
            : option
        );
        break;
      case DataSourceConnectionType.DirectQueryConnection:
        // Set DQC checked status to 'undefined'
        updatedOptions = updatedOptions.map((option) =>
          option.connection.id === newUncheckedOption.connection.id
            ? { ...option, checked: undefined }
            : option
        );
        break;
    }
  }

  return updatedOptions;
};

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

  const handleSelectionChange = useCallback((newOptions: DataSourceModalOption[]) => {
    setAllOptions((prevAllOptions) => getUpdatedOptions({ prevAllOptions, newOptions }));
  }, []);

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
        <EuiSmallButton onClick={closeModal}>
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.close.button"
            defaultMessage="Close"
          />
        </EuiSmallButton>
        <EuiSmallButton
          onClick={() => handleAssignDataSourceConnections(selectedConnections)}
          isDisabled={!selectedConnections || selectedConnections.length === 0}
          fill
        >
          <FormattedMessage
            id="workspace.detail.dataSources.associateModal.save.button"
            defaultMessage="Associate data sources"
          />
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
