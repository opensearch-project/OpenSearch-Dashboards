/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { IBasePath, WorkspaceAttribute } from 'src/core/public';
import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import {
  EuiSearchBar,
  EuiBasicTable,
  EuiSmallButton,
  EuiIcon,
  EuiLink,
  EuiSpacer,
  EuiToolTip,
  EuiFormErrorText,
  EuiPopover,
  EuiCompressedSwitch,
  EuiCompressedFormRow,
  EuiText,
  EuiTableFieldDataColumnType,
  EuiTableActionsColumnType,
  EuiSearchBarProps,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { getDefaultTitle, getSavedObjectLabel } from '../../../lib';
import { SavedObjectWithMetadata } from '../../../types';
import {
  SavedObjectsManagementActionServiceStart,
  SavedObjectsManagementAction,
  SavedObjectsManagementColumnServiceStart,
} from '../../../services';
import { formatUrlWithWorkspaceId } from '../../../../../../core/public/utils';

export interface TableProps {
  basePath: IBasePath;
  actionRegistry: SavedObjectsManagementActionServiceStart;
  columnRegistry: SavedObjectsManagementColumnServiceStart;
  namespaceRegistry: SavedObjectsManagementNamespaceServiceStart;
  selectedSavedObjects: SavedObjectWithMetadata[];
  selectionConfig: {
    onSelectionChange: (selection: SavedObjectWithMetadata[]) => void;
  };
  filters: EuiSearchBarProps['filters'];
  canDelete: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onDuplicateSingle: (object: SavedObjectWithMetadata) => void;
  onActionRefresh: (object: SavedObjectWithMetadata) => void;
  onExport: (includeReferencesDeep: boolean) => void;
  goInspectObject: (obj: SavedObjectWithMetadata) => void;
  pageIndex: number;
  pageSize: number;
  items: SavedObjectWithMetadata[];
  itemId: string | (() => string);
  totalItemCount: number;
  onQueryChange: (query: any, filterFields: string[]) => void;
  onTableChange: (table: any) => void;
  isSearching: boolean;
  onShowRelationships: (object: SavedObjectWithMetadata) => void;
  canGoInApp: (obj: SavedObjectWithMetadata) => boolean;
  dateFormat: string;
  availableWorkspaces?: WorkspaceAttribute[];
  currentWorkspaceId?: string;
  showDuplicate: boolean;
  useUpdatedUX: boolean;
  onRefresh: () => void;
}

interface TableState {
  isSearchTextValid: boolean;
  parseErrorMessage: any;
  isExportPopoverOpen: boolean;
  isIncludeReferencesDeepChecked: boolean;
  activeAction?: SavedObjectsManagementAction;
  isColumnDataLoaded: boolean;
}

export class Table extends PureComponent<TableProps, TableState> {
  state: TableState = {
    isSearchTextValid: true,
    parseErrorMessage: null,
    isExportPopoverOpen: false,
    isIncludeReferencesDeepChecked: true,
    activeAction: undefined,
    isColumnDataLoaded: false,
  };

  constructor(props: TableProps) {
    super(props);
  }

  componentDidMount() {
    this.loadColumnData();
  }

  loadColumnData = async () => {
    await Promise.all(this.props.columnRegistry.getAll().map((column) => column.loadData()));
    this.setState({ isColumnDataLoaded: true });
  };

  onChange = ({ query, error }: any) => {
    if (error) {
      this.setState({
        isSearchTextValid: false,
        parseErrorMessage: error.message,
      });
      return;
    }

    this.setState({
      isSearchTextValid: true,
      parseErrorMessage: null,
    });
    this.props.onQueryChange({ query });
  };

  closeExportPopover = () => {
    this.setState({ isExportPopoverOpen: false });
  };

  toggleExportPopoverVisibility = () => {
    this.setState((state) => ({
      isExportPopoverOpen: !state.isExportPopoverOpen,
    }));
  };

  toggleIsIncludeReferencesDeepChecked = () => {
    this.setState((state) => ({
      isIncludeReferencesDeepChecked: !state.isIncludeReferencesDeepChecked,
    }));
  };

  onExportClick = () => {
    const { onExport } = this.props;
    const { isIncludeReferencesDeepChecked } = this.state;
    onExport(isIncludeReferencesDeepChecked);
    this.setState({ isExportPopoverOpen: false });
  };

  render() {
    const {
      pageIndex,
      pageSize,
      itemId,
      items,
      totalItemCount,
      isSearching,
      columnRegistry,
      filters,
      selectionConfig: selection,
      onDelete,
      onDuplicate,
      onDuplicateSingle,
      onActionRefresh,
      selectedSavedObjects,
      onTableChange,
      goInspectObject,
      onShowRelationships,
      basePath,
      actionRegistry,
      dateFormat,
      availableWorkspaces,
      currentWorkspaceId,
      showDuplicate,
      useUpdatedUX,
      onRefresh,
    } = this.props;

    const visibleWsIds = availableWorkspaces?.map((ws) => ws.id) || [];

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount,
      pageSizeOptions: [5, 10, 20, 50],
    };

    const columns = [
      {
        field: 'type',
        name: i18n.translate('savedObjectsManagement.objectsTable.table.columnTypeName', {
          defaultMessage: 'Type',
        }),
        width: '50px',
        align: 'center',
        description: i18n.translate(
          'savedObjectsManagement.objectsTable.table.columnTypeDescription',
          { defaultMessage: 'Type of the saved object' }
        ),
        sortable: false,
        'data-test-subj': 'savedObjectsTableRowType',
        render: (type: string, object: SavedObjectWithMetadata) => {
          return (
            <EuiToolTip position="top" content={getSavedObjectLabel(type)}>
              <EuiIcon
                aria-label={getSavedObjectLabel(type)}
                type={object.meta.icon || 'apps'}
                size="s"
                data-test-subj="objectType"
              />
            </EuiToolTip>
          );
        },
      } as EuiTableFieldDataColumnType<SavedObjectWithMetadata<any>>,
      {
        field: 'meta.title',
        name: i18n.translate('savedObjectsManagement.objectsTable.table.columnTitleName', {
          defaultMessage: 'Title',
        }),
        description: i18n.translate(
          'savedObjectsManagement.objectsTable.table.columnTitleDescription',
          { defaultMessage: 'Title of the saved object' }
        ),
        dataType: 'string',
        sortable: false,
        'data-test-subj': 'savedObjectsTableRowTitle',
        render: (title: string, object: SavedObjectWithMetadata) => {
          const { path = '' } = object.meta.inAppUrl || {};
          const canGoInApp = this.props.canGoInApp(object);
          if (!canGoInApp) {
            return <EuiText size="s">{title || getDefaultTitle(object)}</EuiText>;
          }
          let finalPath = path;
          if (this.props.useUpdatedUX && finalPath) {
            finalPath = finalPath.replace(/^\/app\/management\/opensearch-dashboards/, '/app');
          }
          let inAppUrl = basePath.prepend(finalPath);
          if (object.workspaces?.length) {
            if (currentWorkspaceId) {
              inAppUrl = formatUrlWithWorkspaceId(finalPath, currentWorkspaceId, basePath);
            } else {
              // find first workspace user have permission
              const workspaceId = object.workspaces.find((wsId) => visibleWsIds.includes(wsId));
              if (workspaceId) {
                inAppUrl = formatUrlWithWorkspaceId(finalPath, workspaceId, basePath);
              }
            }
          }
          return <EuiLink href={inAppUrl}>{title || getDefaultTitle(object)}</EuiLink>;
        },
      } as EuiTableFieldDataColumnType<SavedObjectWithMetadata<any>>,
      {
        field: `updated_at`,
        name: i18n.translate('savedObjectsManagement.objectsTable.table.columnUpdatedAtName', {
          defaultMessage: 'Last updated',
        }),
        dataType: 'date',
        sortable: true,
        description: i18n.translate(
          'savedObjectsManagement.objectsTable.table.columnUpdatedAtDescription',
          { defaultMessage: 'Last update of the saved object' }
        ),
        'data-test-subj': 'updated-at',
        render: (updatedAt: string) => updatedAt && moment(updatedAt).format(dateFormat),
      } as EuiTableFieldDataColumnType<SavedObjectWithMetadata<any>>,
      ...columnRegistry.getAll().map((column) => {
        return {
          ...column.euiColumn,
          sortable: false,
          'data-test-subj': `savedObjectsTableColumn-${column.id}`,
        };
      }),
      {
        name: i18n.translate('savedObjectsManagement.objectsTable.table.columnActionsName', {
          defaultMessage: 'Actions',
        }),
        width: '80px',
        actions: [
          {
            name: i18n.translate(
              'savedObjectsManagement.objectsTable.table.columnActions.inspectActionName',
              { defaultMessage: 'Inspect' }
            ),
            description: i18n.translate(
              'savedObjectsManagement.objectsTable.table.columnActions.inspectActionDescription',
              { defaultMessage: 'Inspect this saved object' }
            ),
            type: 'icon',
            icon: 'inspect',
            onClick: (object) => goInspectObject(object),
            available: (object) => !!object.meta.editUrl,
            'data-test-subj': 'savedObjectsTableAction-inspect',
          },
          {
            name: i18n.translate(
              'savedObjectsManagement.objectsTable.table.columnActions.viewRelationshipsActionName',
              { defaultMessage: 'Relationships' }
            ),
            description: i18n.translate(
              'savedObjectsManagement.objectsTable.table.columnActions.viewRelationshipsActionDescription',
              {
                defaultMessage:
                  'View the relationships this saved object has to other saved objects',
              }
            ),
            type: 'icon',
            icon: 'kqlSelector',
            onClick: (object) => onShowRelationships(object),
            'data-test-subj': 'savedObjectsTableAction-relationships',
          },
          ...(showDuplicate
            ? [
                {
                  name: i18n.translate(
                    'savedObjectsManagement.objectsTable.table.columnActions.duplicateActionName',
                    { defaultMessage: 'Copy to...' }
                  ),
                  description: i18n.translate(
                    'savedObjectsManagement.objectsTable.table.columnActions.duplicateActionDescription',
                    { defaultMessage: 'Copy this saved object' }
                  ),
                  type: 'icon',
                  icon: 'copy',
                  onClick: (object: SavedObjectWithMetadata) => onDuplicateSingle(object),
                  available: (object: SavedObjectWithMetadata) => object.type !== 'config',
                  'data-test-subj': 'savedObjectsTableAction-duplicate',
                },
              ]
            : []),
          ...actionRegistry.getAll().map((action) => {
            return {
              ...action.euiAction,
              'data-test-subj': `savedObjectsTableAction-${action.id}`,
              onClick: (object: SavedObjectWithMetadata) => {
                this.setState({
                  activeAction: action,
                });

                action.registerOnFinishCallback(() => {
                  this.setState({
                    activeAction: undefined,
                  });
                  const { refreshOnFinish = () => false } = action;
                  if (refreshOnFinish()) {
                    onActionRefresh(object);
                  }
                });

                if (action.euiAction.onClick) {
                  action.euiAction.onClick(object as any);
                }
              },
            };
          }),
        ],
      } as EuiTableActionsColumnType<SavedObjectWithMetadata>,
    ];

    let queryParseError;
    if (!this.state.isSearchTextValid) {
      const parseErrorMsg = i18n.translate(
        'savedObjectsManagement.objectsTable.searchBar.unableToParseQueryErrorMessage',
        { defaultMessage: 'Unable to parse query' }
      );
      queryParseError = (
        <EuiFormErrorText>{`${parseErrorMsg}. ${this.state.parseErrorMessage}`}</EuiFormErrorText>
      );
    }

    const button = (
      <EuiSmallButton
        iconType="arrowDown"
        iconSide="right"
        onClick={this.toggleExportPopoverVisibility}
        isDisabled={selectedSavedObjects.length === 0}
      >
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.table.exportPopoverButtonLabel"
          defaultMessage="Export"
        />
      </EuiSmallButton>
    );

    const activeActionContents = this.state.activeAction?.render() ?? null;

    const duplicateButton = (
      <EuiSmallButton
        key="duplicateSO"
        iconType="copy"
        onClick={onDuplicate}
        isDisabled={selectedSavedObjects.length === 0}
        data-test-subj="savedObjectsManagementDuplicate"
      >
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.table.duplicateSOButtonLabel"
          defaultMessage="Copy to..."
        />
      </EuiSmallButton>
    );

    return (
      <Fragment>
        {activeActionContents}
        <EuiSearchBar
          box={{ 'data-test-subj': 'savedObjectSearchBar' }}
          compressed
          filters={filters}
          onChange={this.onChange}
          toolsRight={[
            <>
              {useUpdatedUX && (
                <EuiToolTip
                  content={i18n.translate(
                    'savedObjectsManagement.objectsTable.table.refreshButtonTooltip',
                    {
                      defaultMessage: 'Refresh',
                    }
                  )}
                >
                  <EuiButtonIcon
                    iconType="refresh"
                    size="s"
                    display="base"
                    type="base"
                    onClick={onRefresh}
                  />
                </EuiToolTip>
              )}
            </>,
            <>{showDuplicate && duplicateButton}</>,
            <EuiSmallButton
              key="deleteSO"
              iconType="trash"
              color="danger"
              onClick={onDelete}
              isDisabled={selectedSavedObjects.length === 0 || !this.props.canDelete}
              title={
                this.props.canDelete
                  ? undefined
                  : i18n.translate('savedObjectsManagement.objectsTable.table.deleteButtonTitle', {
                      defaultMessage: 'Unable to delete saved objects',
                    })
              }
              data-test-subj="savedObjectsManagementDelete"
            >
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.table.deleteButtonLabel"
                defaultMessage="Delete"
              />
            </EuiSmallButton>,
            <EuiPopover
              key="exportSOOptions"
              button={button}
              isOpen={this.state.isExportPopoverOpen}
              closePopover={this.closeExportPopover}
              panelPaddingSize="s"
            >
              <EuiCompressedFormRow
                label={
                  <FormattedMessage
                    id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.exportOptionsLabel"
                    defaultMessage="Options"
                  />
                }
              >
                <EuiCompressedSwitch
                  name="includeReferencesDeep"
                  label={
                    <FormattedMessage
                      id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.includeReferencesDeepLabel"
                      defaultMessage="Include related {useUpdatedUX, select, true {assets} other {objects}}"
                      values={{
                        useUpdatedUX: this.props.useUpdatedUX,
                      }}
                    />
                  }
                  checked={this.state.isIncludeReferencesDeepChecked}
                  onChange={this.toggleIsIncludeReferencesDeepChecked}
                />
              </EuiCompressedFormRow>
              <EuiCompressedFormRow>
                <EuiSmallButton
                  key="exportSO"
                  iconType="exportAction"
                  onClick={this.onExportClick}
                  fill
                >
                  <FormattedMessage
                    id="savedObjectsManagement.objectsTable.table.exportButtonLabel"
                    defaultMessage="Export"
                  />
                </EuiSmallButton>
              </EuiCompressedFormRow>
            </EuiPopover>,
          ]}
        />
        {queryParseError}
        <EuiSpacer size={useUpdatedUX ? 'm' : 's'} />
        <div data-test-subj="savedObjectsTable">
          <EuiBasicTable
            loading={isSearching}
            itemId={itemId}
            items={items}
            columns={columns as any}
            pagination={pagination}
            selection={selection}
            onChange={onTableChange}
            rowProps={(item) => ({
              'data-test-subj': `savedObjectsTableRow row-${item.id}`,
            })}
          />
        </div>
      </Fragment>
    );
  }
}
