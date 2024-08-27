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
import { getDataSourcesList } from '../../utils';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { SavedObjectsStart } from '../../../../../core/public';

const tabOptions: EuiButtonGroupOptionProps[] = [
  {
    id: 'all',
    label: i18n.translate('workspace.form.selectDataSource.subTitle', {
      defaultMessage: 'All',
    }),
  },
  {
    id: 'opensearch-connections',
    label: i18n.translate('workspace.form.selectDataSource.subTitle', {
      defaultMessage: 'OpenSearch connections',
    }),
  },
  {
    id: 'direct-query-connections',
    label: i18n.translate('workspace.form.selectDataSource.subTitle', {
      defaultMessage: 'Direct query connections',
    }),
  },
];

export interface AssociationDataSourceModalProps {
  savedObjects: SavedObjectsStart;
  assignedDataSources: DataSourceConnection[];
  closeModal: () => void;
  handleAssignDataSources: (dataSources: DataSourceConnection[]) => Promise<void>;
}

export const AssociationDataSourceModal = ({
  closeModal,
  savedObjects,
  assignedDataSources,
  handleAssignDataSources,
}: AssociationDataSourceModalProps) => {
  // const [options, setOptions] = useState<Array<EuiSelectableOption<any>>>([]);
  // const [allOptions, setAlloptions] = useState<EuiSelectableOption[]>([]);
  const [allDataSources, setAllDataSources] = useState<DataSourceConnection[]>([]);
  const [currentTab, setCurrentTab] = useState('all');
  const [allOptions, setAllOptions] = useState<Array<EuiSelectableOption<any>>>([]);

  useEffect(() => {
    getDataSourcesList(savedObjects.client, ['*']).then((result) => {
      const filteredDataSources: DataSourceConnection[] = result
        .filter(({ id }) => !assignedDataSources.some((ds) => ds.id === id))
        .map((datasource) => {
          return {
            ...datasource,
            name: datasource.title,
            type: datasource.dataSourceEngineType,
            connectionType: DataSourceConnectionType.OpenSearchConnection,
          };
        });

      // dqc
      filteredDataSources.push({
        name: 's3 connection1',
        description: 'this is a s3',
        id: filteredDataSources[0].id + '-' + 's3 connection1',
        parentId: filteredDataSources[0].id,
        type: 's3',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
      });
      filteredDataSources.push({
        name: 's3 connection2',
        description: 'this is a s3',
        id: filteredDataSources[0].id + '-' + 's3 connection2',
        parentId: filteredDataSources[0].id,
        type: 's3',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
      });
      filteredDataSources[0].relatedConnections = [
        filteredDataSources[filteredDataSources.length - 1],
        filteredDataSources[filteredDataSources.length - 2],
      ];

      setAllDataSources(filteredDataSources);
      setAllOptions(
        filteredDataSources.map((dataSource) => ({
          ...dataSource,
          label: dataSource.name,
          key: dataSource.id,
          append: dataSource.relatedConnections ? (
            <EuiBadge>
              {i18n.translate('workspace.form.selectDataSource.optionBadge', {
                defaultMessage: '+' + dataSource.relatedConnections.length + ' related',
              })}
            </EuiBadge>
          ) : undefined,
        }))
      );
    });
  }, [assignedDataSources, savedObjects]);

  const selectedDataSources = useMemo(() => {
    const selectedIds = allOptions
      .filter((option: EuiSelectableOption) => option.checked)
      .map((option: EuiSelectableOption) => option.key);

    return allDataSources.filter((ds) => selectedIds.includes(ds.id));
  }, [allOptions, allDataSources]);

  const options = useMemo(() => {
    if (currentTab === 'all') {
      return allOptions;
    }
    if (currentTab === 'opensearch-connections') {
      return allOptions.filter(
        (dataSource) => dataSource.connectionType === DataSourceConnectionType.OpenSearchConnection
      );
    }
    if (currentTab === 'direct-query-connections') {
      return allOptions.filter(
        (dataSource) => dataSource.connectionType === DataSourceConnectionType.DirectQueryConnection
      );
    }
  }, [allOptions, currentTab]);

  const handleSelectionChange = useCallback(
    (newOptions: Array<EuiSelectableOption<any>>) => {
      const newCheckedOptionIds = newOptions
        .filter(({ checked }) => checked === 'on')
        .map(({ value }) => value);

      setAllOptions((prevOptions) => {
        return prevOptions.map((option) => {
          const checkedInNewOptions = newCheckedOptionIds.includes(option.value);
          const connection = allDataSources.find(({ id }) => id === option.value);
          option.checked = checkedInNewOptions ? 'on' : undefined;

          if (!connection) {
            return option;
          }

          if (connection.type === 'DS') {
            const childDQCIds = allDataSources
              .find(({ parentId }) => parentId === connection.id)
              ?.relatedConnections?.map(({ id }) => id);
            // Check if there any DQC change to checked status this time, set to "on" if exists.
            if (
              newCheckedOptionIds.some(
                (id) =>
                  childDQCIds.includes(id) &&
                  // This child DQC not checked before
                  !prevOptions.find(({ value, checked }) => value === id && checked === 'on')
              )
            ) {
              option.checked = 'on';
            }
          }

          if (connection.type === 'DQC') {
            const parentConnection = allDataSources.find(({ id }) => id === connection.id);
            if (parentConnection) {
              const isParentCheckedLastTime = prevOptions.find(
                ({ value, checked }) => value === parentConnection.id && checked === 'on'
              );
              const isParentCheckedThisTime = newCheckedOptionIds.includes(parentConnection.id);

              // Parent change to checked this time
              if (!isParentCheckedLastTime && isParentCheckedThisTime) {
                option.checked = 'on';
              }

              if (isParentCheckedLastTime && isParentCheckedThisTime) {
                option.checked = undefined;
              }
            }
          }

          return option;
        });
      });
    },
    [allDataSources]
  );

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
          // isFullWidth={true}
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
          onClick={() => handleAssignDataSources(selectedDataSources)}
          isDisabled={!selectedDataSources || selectedDataSources.length === 0}
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
