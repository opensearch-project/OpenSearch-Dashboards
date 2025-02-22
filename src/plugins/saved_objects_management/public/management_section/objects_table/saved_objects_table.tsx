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

import React, { Component } from 'react';
import { debounce } from 'lodash';
// @ts-expect-error
import { saveAs } from '@elastic/filesaver';
import {
  EuiSpacer,
  Query,
  EuiInMemoryTable,
  EuiIcon,
  EuiButtonEmpty,
  EuiModal,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiCompressedCheckboxGroup,
  EuiToolTip,
  EuiPageContent,
  EuiCompressedSwitch,
  EuiModalHeader,
  EuiButton,
  EuiModalBody,
  EuiModalFooter,
  EuiSmallButtonEmpty,
  EuiSmallButton,
  EuiModalHeaderTitle,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBarProps,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import {
  SavedObjectsClientContract,
  SavedObjectsFindOptions,
  HttpStart,
  OverlayStart,
  NotificationsStart,
  ApplicationStart,
  WorkspacesStart,
  WorkspaceAttribute,
  SavedObjectsImportSuccess,
  SavedObjectsImportError,
} from 'src/core/public';
import { Subscription } from 'rxjs';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { RedirectAppLinks } from '../../../../opensearch_dashboards_react/public';
import { IndexPatternsContract } from '../../../../data/public';
import {
  parseQuery,
  getSavedObjectCounts,
  SavedObjectCountOptions,
  getRelationships,
  getSavedObjectLabel,
  fetchExportObjects,
  fetchExportByTypeAndSearch,
  filterQuery,
  findObjects,
  findObject,
  extractExportDetails,
  SavedObjectsExportResultDetails,
} from '../../lib';
import { SavedObjectWithMetadata } from '../../types';
import {
  ISavedObjectsManagementServiceRegistry,
  SavedObjectsManagementActionServiceStart,
  SavedObjectsManagementColumnServiceStart,
  SavedObjectsManagementNamespaceServiceStart,
} from '../../services';
import {
  Header,
  Table,
  Flyout,
  Relationships,
  SavedObjectsDuplicateModal,
  DuplicateResultFlyout,
} from './components';
import { DataPublicPluginStart } from '../../../../../plugins/data/public';
import { DuplicateObject } from '../types';
import { formatWorkspaceIdParams } from '../../utils';
import { NavigationPublicPluginStart } from '../../../../navigation/public';
import { WorkspaceObject } from '../../../../../core/public';
interface ExportAllOption {
  id: string;
  label: string;
}
export interface SavedObjectsTableProps {
  allowedTypes: string[];
  serviceRegistry: ISavedObjectsManagementServiceRegistry;
  actionRegistry: SavedObjectsManagementActionServiceStart;
  columnRegistry: SavedObjectsManagementColumnServiceStart;
  namespaceRegistry: SavedObjectsManagementNamespaceServiceStart;
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: IndexPatternsContract;
  http: HttpStart;
  search: DataPublicPluginStart['search'];
  overlays: OverlayStart;
  notifications: NotificationsStart;
  applications: ApplicationStart;
  workspaces: WorkspacesStart;
  perPageConfig: number;
  goInspectObject: (obj: SavedObjectWithMetadata) => void;
  canGoInApp: (obj: SavedObjectWithMetadata) => boolean;
  dateFormat: string;
  dataSourceEnabled: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  navigationUI: NavigationPublicPluginStart['ui'];
  useUpdatedUX: boolean;
}

export interface SavedObjectsTableState {
  totalCount: number;
  page: number;
  perPage: number;
  savedObjects: SavedObjectWithMetadata[];
  savedObjectCounts: Record<string, Record<string, number>>;
  activeQuery: Query;
  selectedSavedObjects: SavedObjectWithMetadata[];
  duplicateSelectedSavedObjects: DuplicateObject[];
  isShowingImportFlyout: boolean;
  isShowingDuplicateModal: boolean;
  isSearching: boolean;
  filteredItemCount: number;
  isShowingRelationships: boolean;
  relationshipObject?: SavedObjectWithMetadata;
  isShowingDeleteConfirmModal: boolean;
  isShowingExportAllOptionsModal: boolean;
  isDeleting: boolean;
  exportAllOptions: ExportAllOption[];
  exportAllSelectedOptions: Record<string, boolean>;
  isIncludeReferencesDeepChecked: boolean;
  currentWorkspace?: WorkspaceObject;
  workspaceEnabled: boolean;
  availableWorkspaces?: WorkspaceAttribute[];
  isShowingDuplicateResultFlyout: boolean;
  failedCopies: SavedObjectsImportError[];
  successfulCopies: SavedObjectsImportSuccess[];
  targetWorkspaceName: string;
  targetWorkspace: string;
}
export class SavedObjectsTable extends Component<SavedObjectsTableProps, SavedObjectsTableState> {
  private _isMounted = false;
  private currentWorkspaceSubscription?: Subscription;
  private workspacesSubscription?: Subscription;

  constructor(props: SavedObjectsTableProps) {
    super(props);

    const typeCounts = props.allowedTypes.reduce((typeToCountMap, type) => {
      typeToCountMap[type] = 0;
      return typeToCountMap;
    }, {} as Record<string, number>);

    this.state = {
      totalCount: 0,
      page: 0,
      perPage: props.perPageConfig || 50,
      savedObjects: [],
      savedObjectCounts: { type: typeCounts } as Record<string, Record<string, number>>,
      activeQuery: Query.parse(''),
      selectedSavedObjects: [],
      duplicateSelectedSavedObjects: [],
      isShowingImportFlyout: false,
      isShowingDuplicateModal: false,
      isSearching: false,
      filteredItemCount: 0,
      isShowingRelationships: false,
      relationshipObject: undefined,
      isShowingDeleteConfirmModal: false,
      isShowingExportAllOptionsModal: false,
      isDeleting: false,
      exportAllOptions: [],
      exportAllSelectedOptions: {},
      isIncludeReferencesDeepChecked: true,
      currentWorkspace: this.props.workspaces.currentWorkspace$.getValue(),
      availableWorkspaces: this.props.workspaces.workspaceList$.getValue(),
      workspaceEnabled: this.props.applications.capabilities.workspaces.enabled,
      isShowingDuplicateResultFlyout: false,
      failedCopies: [],
      successfulCopies: [],
      targetWorkspaceName: '',
      targetWorkspace: '',
    };
  }

  private get findOptions() {
    const { activeQuery: query, page, perPage } = this.state;
    const { allowedTypes, namespaceRegistry } = this.props;
    const { queryText, visibleTypes, visibleNamespaces, visibleWorkspaces } = parseQuery(query);
    const filteredTypes = filterQuery(allowedTypes, visibleTypes);
    // "searchFields" is missing from the "findOptions" but gets injected via the API.
    // The API extracts the fields from each uiExports.savedObjectsManagement "defaultSearchField" attribute
    const findOptions: SavedObjectsFindOptions = formatWorkspaceIdParams({
      search: queryText ? `${queryText}*` : undefined,
      perPage,
      page: page + 1,
      fields: ['id'],
      type: filteredTypes,
      workspaces: this.workspaceIdQuery,
    });

    const availableNamespaces = namespaceRegistry.getAll()?.map((ns) => ns.id) || [];
    if (availableNamespaces.length) {
      const filteredNamespaces = filterQuery(availableNamespaces, visibleNamespaces);
      findOptions.namespaces = filteredNamespaces;
    }

    if (visibleWorkspaces?.length) {
      findOptions.workspaces = this.workspaceNamesToIds(visibleWorkspaces);
    }

    if (findOptions.type.length > 1) {
      findOptions.sortField = 'type';
    }

    return findOptions;
  }

  private get workspaceIdQuery() {
    const { currentWorkspace, workspaceEnabled } = this.state;
    // workspace is turned off
    if (!workspaceEnabled) {
      return undefined;
    } else {
      // not in any workspace
      if (!currentWorkspace) {
        return undefined;
      } else {
        return [currentWorkspace.id];
      }
    }
  }

  private get workspaceNameIdLookup() {
    const { availableWorkspaces } = this.state;
    const workspaceNameIdMap = new Map<string, string>();
    // workspace name is unique across the system
    availableWorkspaces?.forEach((workspace) => {
      workspaceNameIdMap.set(workspace.name, workspace.id);
    });
    return workspaceNameIdMap;
  }

  /**
   * convert workspace names to ids
   * @param workspaceNames workspace name list
   * @returns workspace id list
   */
  private workspaceNamesToIds(workspaceNames?: string[]): string[] | undefined {
    return workspaceNames
      ?.map((wsName) => this.workspaceNameIdLookup.get(wsName) || '')
      .filter((wsId) => !!wsId);
  }

  componentDidMount() {
    this._isMounted = true;
    this.subscribeWorkspace();
    this.fetchSavedObjects();
    this.fetchCounts();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.debouncedFetchObjects.cancel();
    this.unSubscribeWorkspace();
  }

  fetchCounts = async () => {
    const { allowedTypes, namespaceRegistry } = this.props;
    const { queryText, visibleTypes, visibleNamespaces, visibleWorkspaces } = parseQuery(
      this.state.activeQuery
    );

    const filteredTypes = filterQuery(allowedTypes, visibleTypes);

    const availableNamespaces = namespaceRegistry.getAll()?.map((ns) => ns.id) || [];

    const filteredCountOptions: SavedObjectCountOptions = formatWorkspaceIdParams({
      typesToInclude: filteredTypes,
      searchString: queryText,
      workspaces: this.workspaceIdQuery,
      availableWorkspaces: this.state.availableWorkspaces?.map((ws) => ws.id),
    });

    if (availableNamespaces.length) {
      const filteredNamespaces = filterQuery(availableNamespaces, visibleNamespaces);
      filteredCountOptions.namespacesToInclude = filteredNamespaces;
    }
    if (visibleWorkspaces?.length) {
      filteredCountOptions.workspaces = this.workspaceNamesToIds(visibleWorkspaces);
    }

    // These are the saved objects visible in the table.
    const filteredSavedObjectCounts = await getSavedObjectCounts(
      this.props.http,
      filteredCountOptions
    );

    const exportAllOptions: ExportAllOption[] = [];
    const exportAllSelectedOptions: Record<string, boolean> = {};

    const filteredTypeCounts = filteredSavedObjectCounts.type || {};

    Object.keys(filteredTypeCounts).forEach((id) => {
      // Add this type as a bulk-export option.
      exportAllOptions.push({
        id,
        label: `${id} (${filteredTypeCounts[id] || 0})`,
      });

      // Select it by default.
      exportAllSelectedOptions[id] = true;
    });

    const countOptions: SavedObjectCountOptions = formatWorkspaceIdParams({
      typesToInclude: allowedTypes,
      searchString: queryText,
      workspaces: this.workspaceIdQuery,
      availableWorkspaces: this.state.availableWorkspaces?.map((ws) => ws.id),
    });

    if (availableNamespaces.length) {
      countOptions.namespacesToInclude = availableNamespaces;
    }

    // Fetch all the saved objects that exist so we can accurately populate the counts within
    // the table filter dropdown.
    const savedObjectCounts = await getSavedObjectCounts(this.props.http, countOptions);

    this.setState((state) => ({
      ...state,
      savedObjectCounts,
      exportAllOptions,
      exportAllSelectedOptions,
    }));
  };

  fetchSavedObjects = () => {
    this.setState({ isSearching: true }, this.debouncedFetchObjects);
  };

  subscribeWorkspace = () => {
    const workspace = this.props.workspaces;
    this.currentWorkspaceSubscription = workspace.currentWorkspace$.subscribe((newValue) =>
      this.setState({
        currentWorkspace: newValue,
      })
    );

    this.workspacesSubscription = workspace.workspaceList$.subscribe((workspaceList) => {
      this.setState({ availableWorkspaces: workspaceList });
    });
  };

  unSubscribeWorkspace = () => {
    this.currentWorkspaceSubscription?.unsubscribe();
    this.workspacesSubscription?.unsubscribe();
  };

  fetchSavedObject = (type: string, id: string) => {
    this.setState({ isSearching: true }, () => this.debouncedFetchObject(type, id));
  };

  debouncedFetchObjects = debounce(async () => {
    const { activeQuery: query } = this.state;
    const { notifications, http, useUpdatedUX } = this.props;

    try {
      const resp = await findObjects(http, this.findOptions);
      if (!this._isMounted) {
        return;
      }

      this.setState(({ activeQuery }) => {
        // ignore results for old requests
        if (activeQuery.text !== query.text) {
          return null;
        }

        return {
          savedObjects: resp.savedObjects,
          filteredItemCount: resp.total,
          isSearching: false,
        };
      });
    } catch (error) {
      if (this._isMounted) {
        this.setState({
          isSearching: false,
        });
      }
      notifications.toasts.addDanger({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.unableFindSavedObjectsNotificationMessage',
          {
            defaultMessage:
              'Unable find {useUpdatedUX, select, true {assets} other {saved objects}}',
            values: { useUpdatedUX },
          }
        ),
        text: `${error}`,
      });
    }
  }, 300);

  debouncedFetchObject = debounce(async (type: string, id: string) => {
    const { notifications, http, useUpdatedUX } = this.props;
    try {
      const resp = await findObject(http, type, id);
      if (!this._isMounted) {
        return;
      }

      this.setState(({ savedObjects, filteredItemCount }) => {
        const refreshedSavedObjects = savedObjects.map((object) =>
          object.type === type && object.id === id ? resp : object
        );
        return {
          savedObjects: refreshedSavedObjects,
          filteredItemCount,
          isSearching: false,
        };
      });
    } catch (error) {
      if (this._isMounted) {
        this.setState({
          isSearching: false,
        });
      }
      notifications.toasts.addDanger({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.unableFindSavedObjectNotificationMessage',
          {
            defaultMessage:
              'Unable to find {useUpdatedUX, select, true {asset} other {saved object}}',
            values: { useUpdatedUX },
          }
        ),
        text: `${error}`,
      });
    }
  }, 300);

  refreshObjects = async () => {
    await Promise.all([this.fetchSavedObjects(), this.fetchCounts()]);
  };

  refreshObject = async ({ type, id }: SavedObjectWithMetadata) => {
    await this.fetchSavedObject(type, id);
  };

  onSelectionChanged = (selection: SavedObjectWithMetadata[]) => {
    this.setState({ selectedSavedObjects: selection });
  };

  onQueryChange = ({ query }: { query: Query }) => {
    // TODO: Use isSameQuery to compare new query with state.activeQuery to avoid re-fetching the
    // same data we already have.
    this.setState(
      {
        activeQuery: query,
        page: 0, // Reset this on each query change
        selectedSavedObjects: [],
      },
      () => {
        this.fetchSavedObjects();
        this.fetchCounts();
      }
    );
  };

  onTableChange = async (table: any) => {
    const { index: page, size: perPage } = table.page || {};

    this.setState(
      {
        page,
        perPage,
        selectedSavedObjects: [],
      },
      this.fetchSavedObjects
    );
  };

  onShowRelationships = (object: SavedObjectWithMetadata) => {
    this.setState({
      isShowingRelationships: true,
      relationshipObject: object,
    });
  };

  onHideRelationships = () => {
    this.setState({
      isShowingRelationships: false,
      relationshipObject: undefined,
    });
  };

  onExport = async (includeReferencesDeep: boolean) => {
    const { selectedSavedObjects } = this.state;
    const { notifications, http } = this.props;
    const objectsToExport = selectedSavedObjects.map((obj) => ({ id: obj.id, type: obj.type }));

    let blob;
    try {
      blob = await fetchExportObjects(http, objectsToExport, includeReferencesDeep);
    } catch (e) {
      notifications.toasts.addDanger({
        title: i18n.translate('savedObjectsManagement.objectsTable.export.dangerNotification', {
          defaultMessage: 'Unable to generate export',
        }),
      });
      throw e;
    }

    saveAs(blob, 'export.ndjson');

    const exportDetails = await extractExportDetails(blob);
    this.showExportSuccessMessage(exportDetails);
  };

  onExportAll = async () => {
    const { exportAllSelectedOptions, isIncludeReferencesDeepChecked, activeQuery } = this.state;
    const { notifications, http } = this.props;

    const { queryText, visibleWorkspaces } = parseQuery(activeQuery);
    const exportTypes = Object.entries(exportAllSelectedOptions).reduce((accum, [id, selected]) => {
      if (selected) {
        accum.push(id);
      }
      return accum;
    }, [] as string[]);

    const filteredWorkspaceIds = this.workspaceNamesToIds(visibleWorkspaces);
    const workspaces = filteredWorkspaceIds || this.workspaceIdQuery;

    let blob;
    try {
      blob = await fetchExportByTypeAndSearch(
        http,
        exportTypes,
        queryText ? `${queryText}*` : undefined,
        isIncludeReferencesDeepChecked,
        workspaces
      );
    } catch (e) {
      notifications.toasts.addDanger({
        title: i18n.translate('savedObjectsManagement.objectsTable.export.dangerNotification', {
          defaultMessage: 'Unable to generate export',
        }),
      });
      throw e;
    }

    saveAs(blob, 'export.ndjson');

    const exportDetails = await extractExportDetails(blob);
    this.showExportSuccessMessage(exportDetails);
    this.setState({ isShowingExportAllOptionsModal: false });
  };

  showExportSuccessMessage = (exportDetails: SavedObjectsExportResultDetails | undefined) => {
    const { notifications, useUpdatedUX } = this.props;
    if (exportDetails && exportDetails.missingReferences.length > 0) {
      notifications.toasts.addWarning({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.export.successWithMissingRefsNotification',
          {
            defaultMessage:
              'Your file is downloading in the background. ' +
              'Some related {useUpdatedUX, select, true {assets} other {objects}} could not be found. ' +
              'Please see the last line in the exported file for a list of missing objects.',
            values: {
              useUpdatedUX,
            },
          }
        ),
      });
    } else {
      notifications.toasts.addSuccess({
        title: i18n.translate('savedObjectsManagement.objectsTable.export.successNotification', {
          defaultMessage: 'Your file is downloading in the background',
        }),
      });
    }
  };

  finishImport = () => {
    this.hideImportFlyout();
    this.fetchSavedObjects();
    this.fetchCounts();
  };

  showImportFlyout = () => {
    this.setState({ isShowingImportFlyout: true });
  };

  hideImportFlyout = () => {
    this.setState({ isShowingImportFlyout: false });
  };

  onDelete = () => {
    this.setState({ isShowingDeleteConfirmModal: true });
  };

  delete = async () => {
    const { savedObjectsClient, notifications, useUpdatedUX } = this.props;
    const { selectedSavedObjects, isDeleting } = this.state;

    if (isDeleting) {
      return;
    }

    this.setState({ isDeleting: true });

    const indexPatterns = selectedSavedObjects.filter((object) => object.type === 'index-pattern');

    try {
      if (indexPatterns.length) {
        await this.props.indexPatterns.clearCache();
      }
      const objects = await savedObjectsClient.bulkGet(selectedSavedObjects);
      const deletes = objects.savedObjects.map((object) =>
        savedObjectsClient.delete(object.type, object.id, { force: true })
      );
      await Promise.all(deletes);
      // Unset this
      this.setState({
        selectedSavedObjects: [],
      });
      // Fetching all data
      await this.fetchSavedObjects();
      await this.fetchCounts();

      // Allow the user to interact with the table once the saved objects have been re-fetched.
      // If the user fails to delete the saved objects, the delete modal will continue to display.
      this.setState({ isShowingDeleteConfirmModal: false });
    } catch (error) {
      notifications.toasts.addDanger({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.unableDeleteSavedObjectsNotificationMessage',
          {
            defaultMessage:
              'Unable to delete {useUpdatedUX, select, true {assets} other {saved objects}}',
            values: { useUpdatedUX },
          }
        ),
        text: `${error}`,
      });
    }

    this.setState({ isDeleting: false });
  };

  getRelationships = async (type: string, id: string) => {
    const { allowedTypes, http } = this.props;
    return await getRelationships(http, type, id, allowedTypes);
  };

  renderFlyout() {
    if (!this.state.isShowingImportFlyout) {
      return null;
    }
    const { applications } = this.props;
    const newIndexPatternUrl = applications.getUrlForApp('management', {
      path: 'opensearch-dashboards/indexPatterns',
    });

    return (
      <Flyout
        close={this.hideImportFlyout}
        done={this.finishImport}
        http={this.props.http}
        serviceRegistry={this.props.serviceRegistry}
        indexPatterns={this.props.indexPatterns}
        newIndexPatternUrl={newIndexPatternUrl}
        allowedTypes={this.props.allowedTypes}
        overlays={this.props.overlays}
        search={this.props.search}
        dataSourceEnabled={this.props.dataSourceEnabled}
        savedObjects={this.props.savedObjectsClient}
        notifications={this.props.notifications}
        dataSourceManagement={this.props.dataSourceManagement}
        useUpdatedUX={this.props.useUpdatedUX}
      />
    );
  }

  hideDuplicateModal = () => {
    this.setState({ isShowingDuplicateModal: false });
  };

  onDuplicateAll = async () => {
    const { notifications, http, useUpdatedUX } = this.props;
    const findOptions = this.findOptions;
    findOptions.perPage = 9999;
    findOptions.page = 1;

    try {
      const resp = await findObjects(http, findOptions);
      const duplicateObjects = resp.savedObjects.map((obj) => ({
        id: obj.id,
        type: obj.type,
        meta: obj.meta,
        workspaces: obj.workspaces,
      }));
      this.setState({
        duplicateSelectedSavedObjects: duplicateObjects,
        isShowingDuplicateModal: true,
      });
    } catch (error) {
      notifications.toasts.addDanger({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.unableFindSavedObjectsNotificationMessage',
          {
            defaultMessage:
              'Unable find {useUpdatedUX, select, true {assets} other {saved objects}}',
            values: { useUpdatedUX },
          }
        ),
        text: `${error}`,
      });
    }
  };

  onDuplicate = async (
    savedObjects: DuplicateObject[],
    includeReferencesDeep: boolean,
    targetWorkspace: string,
    targetWorkspaceName: string
  ) => {
    const { notifications, workspaces, useUpdatedUX } = this.props;
    const workspaceClient = workspaces.client$.getValue();

    const showErrorNotification = () => {
      notifications.toasts.addDanger({
        title: i18n.translate('savedObjectsManagement.objectsTable.duplicate.dangerNotification', {
          defaultMessage:
            'Unable to copy {useUpdatedUX, select, true {{errorCount, plural, one {# asset} other {# assets}}} other {{errorCount, plural, one {# saved object} other {# saved objects}}}}.',
          values: { errorCount: savedObjects.length, useUpdatedUX },
        }),
      });
    };
    if (!workspaceClient) {
      showErrorNotification();
      return;
    }
    const objectsToDuplicate = savedObjects.map((obj) => ({ id: obj.id, type: obj.type }));
    try {
      const result = await workspaceClient.copy(
        objectsToDuplicate,
        targetWorkspace,
        includeReferencesDeep
      );
      this.setState({
        isShowingDuplicateResultFlyout: true,
        failedCopies: result?.errors || [],
        successfulCopies: result?.successResults || [],
        targetWorkspace,
        targetWorkspaceName,
      });
    } catch (e) {
      showErrorNotification();
    } finally {
      this.hideDuplicateModal();
      await this.refreshObjects();
    }
  };

  renderDuplicateModal() {
    const { isShowingDuplicateModal, duplicateSelectedSavedObjects } = this.state;

    if (!isShowingDuplicateModal) {
      return null;
    }

    return (
      <SavedObjectsDuplicateModal
        http={this.props.http}
        workspaces={this.props.workspaces}
        onDuplicate={this.onDuplicate}
        notifications={this.props.notifications}
        onClose={this.hideDuplicateModal}
        selectedSavedObjects={duplicateSelectedSavedObjects}
        useUpdatedUX={this.props.useUpdatedUX}
      />
    );
  }

  hideDuplicateResultFlyout = () => {
    this.setState({ isShowingDuplicateResultFlyout: false });
  };

  renderDuplicateResultFlyout() {
    const {
      isShowingDuplicateResultFlyout,
      targetWorkspaceName,
      failedCopies,
      successfulCopies,
      targetWorkspace,
    } = this.state;
    const { applications, http } = this.props;

    if (!isShowingDuplicateResultFlyout) {
      return null;
    }

    const dataSourceUrlForTargetWorkspace = formatUrlWithWorkspaceId(
      applications.getUrlForApp('dataSources', {
        absolute: false,
      }),
      targetWorkspace,
      http.basePath
    );

    return (
      <DuplicateResultFlyout
        workspaceName={targetWorkspaceName}
        failedCopies={failedCopies}
        successfulCopies={successfulCopies}
        onClose={this.hideDuplicateResultFlyout}
        onCopy={this.onDuplicate}
        targetWorkspace={targetWorkspace}
        useUpdatedUX={this.props.useUpdatedUX}
        dataSourceUrlForTargetWorkspace={dataSourceUrlForTargetWorkspace}
      />
    );
  }

  renderRelationships() {
    if (!this.state.isShowingRelationships) {
      return null;
    }

    return (
      <Relationships
        basePath={this.props.http.basePath}
        savedObject={this.state.relationshipObject!}
        getRelationships={this.getRelationships}
        close={this.onHideRelationships}
        goInspectObject={this.props.goInspectObject}
        canGoInApp={this.props.canGoInApp}
        useUpdatedUX={this.props.useUpdatedUX}
      />
    );
  }

  renderDeleteConfirmModal() {
    const { isShowingDeleteConfirmModal, isDeleting, selectedSavedObjects } = this.state;

    if (!isShowingDeleteConfirmModal) {
      return null;
    }

    let modal;

    if (isDeleting) {
      // Block the user from interacting with the table while its contents are being deleted.
      modal = (
        <EuiOverlayMask>
          <EuiLoadingSpinner size="xl" />
        </EuiOverlayMask>
      );
    } else {
      const onCancel = () => {
        this.setState({ isShowingDeleteConfirmModal: false });
      };

      const onConfirm = () => {
        this.delete();
      };

      modal = (
        <EuiModal onClose={onCancel} maxWidth="50vw">
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModalTitle"
                defaultMessage="Delete assets"
              />
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiText size="s">
              <p>
                <FormattedMessage
                  id="savedObjectsManagement.deleteSavedObjectsConfirmModalDescription"
                  defaultMessage="This action will delete the following assets:"
                />
              </p>
            </EuiText>
            <EuiInMemoryTable
              items={selectedSavedObjects}
              columns={[
                {
                  field: 'type',
                  name: i18n.translate(
                    'savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.typeColumnName',
                    { defaultMessage: 'Type' }
                  ),
                  width: '50px',
                  render: (type, object) => (
                    <EuiToolTip position="top" content={getSavedObjectLabel(type)}>
                      <EuiIcon type={object.meta.icon || 'apps'} />
                    </EuiToolTip>
                  ),
                },
                {
                  field: 'meta.title',
                  name: i18n.translate(
                    'savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.titleColumnName',
                    { defaultMessage: 'Title' }
                  ),
                },
                {
                  field: 'id',
                  name: i18n.translate(
                    'savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.idColumnName',
                    { defaultMessage: 'ID' }
                  ),
                },
              ]}
              pagination={true}
              sorting={false}
            />
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButtonEmpty onClick={onCancel}>
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.cancelButtonLabel"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>

            <EuiButton
              type="submit"
              onClick={onConfirm}
              fill
              color="danger"
              data-test-subj="confirmModalConfirmButton"
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <FormattedMessage
                  id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.deleteProcessButtonLabel"
                  defaultMessage="Deleting…"
                />
              ) : (
                <FormattedMessage
                  id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.deleteButtonLabel"
                  defaultMessage="Delete"
                />
              )}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
    }

    return modal;
  }

  changeIncludeReferencesDeep = () => {
    this.setState((state) => ({
      isIncludeReferencesDeepChecked: !state.isIncludeReferencesDeepChecked,
    }));
  };

  closeExportAllModal = () => {
    this.setState({ isShowingExportAllOptionsModal: false });
  };

  renderExportAllOptionsModal() {
    const {
      isShowingExportAllOptionsModal,
      filteredItemCount,
      exportAllOptions,
      exportAllSelectedOptions,
      isIncludeReferencesDeepChecked,
    } = this.state;

    if (!isShowingExportAllOptionsModal) {
      return null;
    }

    return (
      <EuiModal onClose={this.closeExportAllModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiText size="s">
              <h2>
                <FormattedMessage
                  id="savedObjectsManagement.objectsTable.exportObjectsConfirmModalTitle"
                  defaultMessage="Export {useUpdatedUX, select, true {{filteredItemCount, plural, one{# asset} other {# assets}}} other {{filteredItemCount, plural, one{# object} other {# objects}}}}"
                  values={{
                    useUpdatedUX: this.props.useUpdatedUX,
                    filteredItemCount,
                  }}
                />
              </h2>
            </EuiText>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiCompressedFormRow
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.exportObjectsConfirmModalDescription"
                defaultMessage="Select which types to export"
              />
            }
            labelType="legend"
          >
            <EuiCompressedCheckboxGroup
              options={exportAllOptions}
              idToSelectedMap={exportAllSelectedOptions}
              onChange={(optionId) => {
                const newExportAllSelectedOptions = {
                  ...exportAllSelectedOptions,
                  ...{
                    [optionId]: !exportAllSelectedOptions[optionId],
                  },
                };

                this.setState({
                  exportAllSelectedOptions: newExportAllSelectedOptions,
                });
              }}
            />
          </EuiCompressedFormRow>
          <EuiSpacer size="m" />
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
            checked={isIncludeReferencesDeepChecked}
            onChange={this.changeIncludeReferencesDeep}
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiSmallButtonEmpty onClick={this.closeExportAllModal}>
                    <FormattedMessage
                      id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.cancelButtonLabel"
                      defaultMessage="Cancel"
                    />
                  </EuiSmallButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSmallButton fill onClick={this.onExportAll}>
                    <FormattedMessage
                      id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.exportAllButtonLabel"
                      defaultMessage="Export all"
                    />
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalFooter>
      </EuiModal>
    );
  }

  render() {
    const {
      selectedSavedObjects,
      page,
      perPage,
      savedObjects,
      filteredItemCount,
      isSearching,
      savedObjectCounts,
      availableWorkspaces,
      workspaceEnabled,
      currentWorkspace,
    } = this.state;
    const {
      http,
      allowedTypes,
      applications,
      namespaceRegistry,
      useUpdatedUX,
      navigationUI,
    } = this.props;

    const selectionConfig = {
      onSelectionChange: this.onSelectionChanged,
    };
    const typeCounts = savedObjectCounts.type || {};

    const filterOptions = allowedTypes.map((type) => ({
      value: type,
      name: type,
      view: `${type} (${typeCounts[type] || 0})`,
    }));

    const filters: EuiSearchBarProps['filters'] = [
      {
        type: 'field_value_selection',
        field: 'type',
        name: i18n.translate('savedObjectsManagement.objectsTable.table.typeFilterName', {
          defaultMessage: 'Type',
        }),
        multiSelect: 'or',
        options: filterOptions,
        searchThreshold: 1,
      },
    ];

    const availableNamespaces = namespaceRegistry.getAll() || [];
    if (availableNamespaces.length) {
      const nsCounts = savedObjectCounts.namespaces || {};
      const nsFilterOptions = availableNamespaces.map((ns) => {
        return {
          name: ns.name,
          value: ns.id,
          view: `${ns.name} (${nsCounts[ns.id] || 0})`,
        };
      });

      filters.push({
        type: 'field_value_selection',
        field: 'namespaces',
        name:
          namespaceRegistry.getAlias() ||
          i18n.translate('savedObjectsManagement.objectsTable.table.namespaceFilterName', {
            defaultMessage: 'Namespaces',
          }),
        multiSelect: 'or',
        options: nsFilterOptions,
      });
    }

    // Add workspace filter when out of workspace
    if (workspaceEnabled && availableWorkspaces?.length && !currentWorkspace) {
      const wsCounts = savedObjectCounts.workspaces || {};
      const wsFilterOptions = availableWorkspaces.map((ws) => {
        return {
          name: ws.name,
          value: ws.name,
          view: `${ws.name} (${wsCounts[ws.id] || 0})`,
        };
      });

      filters.push({
        type: 'field_value_selection',
        field: 'workspaces',
        name: i18n.translate('savedObjectsManagement.objectsTable.table.workspaceFilterName', {
          defaultMessage: 'Workspace',
        }),
        multiSelect: 'or',
        options: wsFilterOptions,
        searchThreshold: 1,
      });
    }
    return (
      <EuiPageContent horizontalPosition="center" paddingSize={useUpdatedUX ? 'm' : undefined}>
        {this.renderFlyout()}
        {this.renderRelationships()}
        {this.renderDeleteConfirmModal()}
        {this.renderExportAllOptionsModal()}
        {this.renderDuplicateModal()}
        {this.renderDuplicateResultFlyout()}
        <Header
          onExportAll={() => this.setState({ isShowingExportAllOptionsModal: true })}
          onImport={this.showImportFlyout}
          showDuplicateAll={this.state.workspaceEnabled}
          onDuplicate={this.onDuplicateAll}
          onRefresh={this.refreshObjects}
          objectCount={savedObjects.length}
          useUpdatedUX={useUpdatedUX}
          navigationUI={navigationUI}
          applications={applications}
          currentWorkspaceName={currentWorkspace?.name}
          showImportButton={!workspaceEnabled || !!currentWorkspace}
        />
        {!useUpdatedUX && <EuiSpacer size="xs" />}
        <RedirectAppLinks application={applications}>
          <Table
            basePath={http.basePath}
            itemId={'id'}
            actionRegistry={this.props.actionRegistry}
            columnRegistry={this.props.columnRegistry}
            selectionConfig={selectionConfig}
            selectedSavedObjects={selectedSavedObjects}
            onQueryChange={this.onQueryChange}
            onTableChange={this.onTableChange}
            filters={filters}
            onExport={this.onExport}
            canDelete={applications.capabilities.savedObjectsManagement.delete as boolean}
            onDelete={this.onDelete}
            onDuplicate={() =>
              this.setState({
                isShowingDuplicateModal: true,
                duplicateSelectedSavedObjects: selectedSavedObjects,
              })
            }
            onDuplicateSingle={(object) =>
              this.setState({
                duplicateSelectedSavedObjects: [object],
                isShowingDuplicateModal: true,
              })
            }
            onActionRefresh={this.refreshObject}
            goInspectObject={this.props.goInspectObject}
            pageIndex={page}
            pageSize={perPage}
            items={savedObjects}
            totalItemCount={filteredItemCount}
            isSearching={isSearching}
            onShowRelationships={this.onShowRelationships}
            canGoInApp={this.props.canGoInApp}
            dateFormat={this.props.dateFormat}
            availableWorkspaces={availableWorkspaces}
            currentWorkspaceId={currentWorkspace?.id}
            showDuplicate={this.state.workspaceEnabled}
            onRefresh={this.refreshObjects}
            useUpdatedUX={useUpdatedUX}
          />
        </RedirectAppLinks>
      </EuiPageContent>
    );
  }
}
