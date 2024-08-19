/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiSpacer,
  EuiFormLabel,
  EuiSelectable,
  EuiText,
  EuiSelectableOption,
  EuiPopover,
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SavedObjectsStart } from '../../../../../core/public';
import { getDataSourcesList } from '../../utils';
import { DataSource } from '../../../common/types';
import { WorkspaceFormError } from './types';
import { AssociationDataSourceModal } from '../workspace_detail/association_data_source_modal';
import { useWorkspaceFormContext } from './workspace_form_context';
import { OpenSearchConnectionTable } from '../workspace_detail/opensearch_connections_table';
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
  const [dataSourcesOptions, setDataSourcesOptions] = useState<EuiSelectableOption[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [dataSourcesOptionsInTable, setDataSourcesOptionsInTable] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!savedObjects) return;
    getDataSourcesList(savedObjects.client, ['*']).then((result) => {
      const options = result.map((option) => ({
        label: option.title,
        value: option.id,
        description: option.description,
        type: option.dataSourceEngineType,
      }));

      setDataSourcesOptions(options);
    });
  }, [savedObjects, setDataSourcesOptions]);

  const handleSelect = useCallback(
    (options) => {
      setDataSourcesOptions(options);
      const selectedOptions = [];
      for (const option of options) {
        if (option.checked === 'on')
          selectedOptions.push({ title: option.label, id: option.value });
      }
      onChange(selectedOptions);
    },
    [onChange]
  );

  const handleAssignDataSources = async (dataSources: DataSource[]) => {
    setIsVisible(false);
    const savedDataSources: DataSource[] = [...assignedDataSources, ...dataSources];
    onChange(savedDataSources);
  };

  const associationButton = (
    <EuiSmallButton
      onClick={() => setIsVisible(true)}
      isLoading={isLoading}
      // data-test-subj="workspace-detail-dataSources-assign-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
        defaultMessage: 'Add New',
      })}
    </EuiSmallButton>
  );

  const loadingMessage = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <EuiLoadingSpinner size="xl" />
      <EuiSpacer size="m" />
      <EuiText>
        {i18n.translate('workspace.detail.dataSources.noAssociation.message', {
          defaultMessage: 'Loading OpenSearch connections...',
        })}
      </EuiText>
    </div>
  );

  const renderTableContent = () => {
    if (isLoading) {
      return loadingMessage;
    }
    return (
      <CreatePageOpenSearchConnectionTable
        isDashboardAdmin={isDashboardAdmin}
        // currentWorkspace={currentWorkspace}
        assignedDataSources={assignedDataSources}
        setIsLoading={setIsLoading}
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
      {/* <EuiPopover
        button={
          <EuiSmallButton
            fullWidth={false}
            onClick={() => {
              setIsDataSourceAssociateListOpen((current) => !current);
            }}
            data-test-subj={`workspaceForm-permissionSettingPanel-addNew`}
            color="primary"
            iconType="plusInCircle"
          >
            {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
              defaultMessage: 'Add New',
            })}
          </EuiSmallButton>
        }
        closePopover={() => {
          setIsDataSourceAssociateListOpen(false);
        }}
        isOpen={isDataSourceAssociateListOpen}
      >
        <EuiSelectable
          style={{ maxWidth: 400 }}
          searchable
          searchProps={{
            placeholder: i18n.translate('workspace.form.selectDataSource.searchBar', {
              defaultMessage: 'Search',
            }),
          }}
          listProps={{ bordered: true, rowHeight: 32, showIcons: true }}
          options={dataSourcesOptions}
          onChange={(options) => {
            setDataSourcesOptions(options);
          }}
        >
          {(list, search) => (
            <>
              {search}
              {list}
            </>
          )}
        </EuiSelectable>
      </EuiPopover> */}
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        {isDashboardAdmin && <EuiFlexItem grow={false}>{associationButton}</EuiFlexItem>}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      {assignedDataSources.length > 0 && renderTableContent()}
      {isVisible && (
        <AssociationDataSourceModal
          savedObjects={savedObjects}
          assignedDataSources={assignedDataSources}
          closeModal={() => setIsVisible(false)}
          handleAssignDataSources={handleAssignDataSources}
        />
      )}
    </div>
  );
};
