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
  EuiConfirmModal,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EUI_MODAL_CONFIRM_BUTTON,
  EuiCheckboxGroup,
  EuiToolTip,
  EuiPageContent,
  EuiSwitch,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiModalHeaderTitle,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  SavedObjectsClientContract,
  SavedObjectsFindOptions,
  WorkspaceStart,
  HttpStart,
  OverlayStart,
  NotificationsStart,
  ApplicationStart,
  WorkspaceAttribute,
} from 'src/core/public';
import { Subscription } from 'rxjs';
import { RedirectAppLinks } from '../../../../opensearch_dashboards_react/public';
import { IndexPatternsContract } from '../../../../data/public';
import {
  parseQuery,
  getSavedObjectCounts,
  SavedObjectCountOptions,
  getRelationships,
  getSavedObjectLabel,
  getWorkspacesWithWritePermission,
  fetchExportObjects,
  fetchExportByTypeAndSearch,
  filterQuery,
  findObjects,
  findObject,
  extractExportDetails,
  SavedObjectsExportResultDetails,
  copySavedObjects,
} from '../../lib';
import { SavedObjectWithMetadata } from '../../types';
import {
  ISavedObjectsManagementServiceRegistry,
  SavedObjectsManagementActionServiceStart,
  SavedObjectsManagementColumnServiceStart,
  SavedObjectsManagementNamespaceServiceStart,
} from '../../services';
import { Header, Table, Flyout, Relationships } from './components';
import { DataPublicPluginStart } from '../../../../data/public';
import { SavedObjectsCopyModal } from './components/copy_modal';
import { PUBLIC_WORKSPACE_ID, MANAGEMENT_WORKSPACE_ID } from '../../../../../core/public';

export enum CopyState {
  Single = 'single',
  Selected = 'selected',
  All = 'all',
}

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
  workspaces: WorkspaceStart;
  search: DataPublicPluginStart['search'];
  overlays: OverlayStart;
  notifications: NotificationsStart;
  applications: ApplicationStart;
  perPageConfig: number;
  goInspectObject: (obj: SavedObjectWithMetadata) => void;
  canGoInApp: (obj: SavedObjectWithMetadata) => boolean;
  dateFormat: string;
  title: string;
  fullWidth: boolean;
}

export interface SavedObjectsTableState {
  totalCount: number;
  page: number;
  perPage: number;
  savedObjects: SavedObjectWithMetadata[];
  savedObjectCounts: Record<string, Record<string, number>>;
  activeQuery: Query;
  selectedSavedObjects: SavedObjectWithMetadata[];
  copySelectedSavedObjects: SavedObjectWithMetadata[];
  isShowingImportFlyout: boolean;
  isShowingCopyModal: boolean;
  copyState: CopyState;
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
  currentWorkspaceId: string | null;
  availableWorkspaces?: WorkspaceAttribute[];
  workspaceEnabled: boolean;
}

export class SavedObjectsTable extends Component<SavedObjectsTableProps, SavedObjectsTableState> {
  private _isMounted = false;
  private currentWorkspaceIdSubscription?: Subscription;
  private workspacesSubscription?: Subscription;
  private workspacesEnabledSubscription?: Subscription;

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
      copySelectedSavedObjects: [],
      isShowingImportFlyout: false,
      isShowingCopyModal: false,
      copyState: CopyState.Selected,
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
      currentWorkspaceId: this.props.workspaces.currentWorkspaceId$.getValue(),
      availableWorkspaces: this.props.workspaces.workspaceList$.getValue(),
      workspaceEnabled: this.props.workspaces.workspaceEnabled$.getValue(),
    };
  }

  private get workspaceIdQuery() {
    const { availableWorkspaces, currentWorkspaceId, workspaceEnabled } = this.state;
    // workspace is turned off
    if (!workspaceEnabled) {
      return undefined;
    } else {
      // application home
      if (!currentWorkspaceId) {
        return availableWorkspaces?.map((ws) => ws.id);
      } else {
        return [currentWorkspaceId];
      }
    }
  }

  private get wsNameIdLookup() {
    const { availableWorkspaces } = this.state;
    //  Assumption: workspace name is unique across the system
    return availableWorkspaces?.reduce((map, ws) => {
      return map.set(ws.name, ws.id);
    }, new Map<string, string>());
  }

  private formatWorkspaceIdParams<T extends { workspaces?: string[] }>(
    obj: T
  ): T | Omit<T, 'workspaces'> {
    const { workspaces, ...others } = obj;
    if (workspaces) {
      return obj;
    }
    return others;
  }

  componentDidMount() {
    this._isMounted = true;

    this.fetchWorkspace();
    this.fetchSavedObjects();
    this.fetchCounts();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.debouncedFetchObjects.cancel();
    this.currentWorkspaceIdSubscription?.unsubscribe();
    this.workspacesSubscription?.unsubscribe();
    this.workspacesEnabledSubscription?.unsubscribe();
  }

  fetchCounts = async () => {
    const { allowedTypes, namespaceRegistry } = this.props;
    const { queryText, visibleTypes, visibleNamespaces, visibleWorkspaces } = parseQuery(
      this.state.activeQuery
    );

    const filteredTypes = filterQuery(allowedTypes, visibleTypes);

    const availableNamespaces = namespaceRegistry.getAll()?.map((ns) => ns.id) || [];

    const filteredCountOptions: SavedObjectCountOptions = this.formatWorkspaceIdParams({
      typesToInclude: filteredTypes,
      searchString: queryText,
      workspaces: this.workspaceIdQuery,
    });

    if (availableNamespaces.length) {
      const filteredNamespaces = filterQuery(availableNamespaces, visibleNamespaces);
      filteredCountOptions.namespacesToInclude = filteredNamespaces;
    }
    if (visibleWorkspaces?.length) {
      filteredCountOptions.workspaces = visibleWorkspaces.map(
        (wsName) => this.wsNameIdLookup?.get(wsName) || PUBLIC_WORKSPACE_ID
      );
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

    const countOptions: SavedObjectCountOptions = this.formatWorkspaceIdParams({
      typesToInclude: allowedTypes,
      searchString: queryText,
      workspaces: this.workspaceIdQuery,
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

  fetchWorkspace = () => {
    const workspace = this.props.workspaces;
    this.currentWorkspaceIdSubscription = workspace.currentWorkspaceId$.subscribe((workspaceId) =>
      this.setState({
        currentWorkspaceId: workspaceId,
      })
    );

    this.workspacesSubscription = workspace.workspaceList$.subscribe((workspaceList) => {
      this.setState({ availableWorkspaces: workspaceList });
    });

    this.workspacesEnabledSubscription = workspace.workspaceEnabled$.subscribe((enabled) => {
      this.setState({ workspaceEnabled: enabled });
    });
  };

  fetchSavedObject = (type: string, id: string) => {
    this.setState({ isSearching: true }, () => this.debouncedFetchObject(type, id));
  };

  debouncedFetchObjects = debounce(async () => {
    const { activeQuery: query, page, perPage } = this.state;
    const { notifications, http, allowedTypes, namespaceRegistry } = this.props;
    const { queryText, visibleTypes, visibleNamespaces, visibleWorkspaces } = parseQuery(query);
    const filteredTypes = filterQuery(allowedTypes, visibleTypes);
    // "searchFields" is missing from the "findOptions" but gets injected via the API.
    // The API extracts the fields from each uiExports.savedObjectsManagement "defaultSearchField" attribute
    const findOptions: SavedObjectsFindOptions = this.formatWorkspaceIdParams({
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
      const workspaceIds: string[] = visibleWorkspaces.map(
        (wsName) => this.wsNameIdLookup?.get(wsName) || PUBLIC_WORKSPACE_ID
      );
      findOptions.workspaces = workspaceIds;
    }

    if (findOptions.type.length > 1) {
      findOptions.sortField = 'type';
    }

    try {
      const resp = await findObjects(http, findOptions);
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
          { defaultMessage: 'Unable find saved objects' }
        ),
        text: `${error}`,
      });
    }
  }, 300);

  debouncedFetchObject = debounce(async (type: string, id: string) => {
    const { notifications, http } = this.props;
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
          { defaultMessage: 'Unable to find saved object' }
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

  getCopyWorkspaces = async (): Promise<WorkspaceAttribute[]> => {
    const { notifications, http } = this.props;
    let result;
    try {
      result = await getWorkspacesWithWritePermission(http);
    } catch (error) {
      notifications?.toasts.addDanger({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.copyWorkspaces.dangerNotification',
          {
            defaultMessage: 'Unable to get workspaces with write permission',
          }
        ),
        text: error instanceof Error ? error.message : JSON.stringify(error),
      });
    }
    if (result?.success) {
      return result.result?.workspaces ?? [];
    } else {
      return [];
    }
  };

  onCopy = async (
    savedObjects: SavedObjectWithMetadata[],
    includeReferencesDeep: boolean,
    targetWorkspace: string
  ) => {
    const { notifications, http } = this.props;
    const objectsToCopy = savedObjects.map((obj) => ({ id: obj.id, type: obj.type }));
    let result;
    try {
      result = await copySavedObjects(http, objectsToCopy, includeReferencesDeep, targetWorkspace);
      if (result.success) {
        notifications.toasts.addSuccess({
          title: i18n.translate('savedObjectsManagement.objectsTable.copy.successNotification', {
            defaultMessage:
              'Copy ' + savedObjects.length.toString() + ' saved objects successfully',
          }),
        });
      } else {
        const failedCount = savedObjects.length - result.successCount;
        notifications.toasts.addSuccess({
          title: i18n.translate('savedObjectsManagement.objectsTable.copy.dangerNotification', {
            defaultMessage: 'Unable to copy ' + failedCount.toString() + ' saved objects',
          }),
        });
      }
    } catch (e) {
      notifications.toasts.addDanger({
        title: i18n.translate('savedObjectsManagement.objectsTable.copy.dangerNotification', {
          defaultMessage: 'Unable to copy all saved objects',
        }),
      });
      throw e;
    }

    this.hideCopyModal();
    this.refreshObjects();
  };

  onExport = async (includeReferencesDeep: boolean) => {
    const { selectedSavedObjects } = this.state;
    const { notifications, http } = this.props;
    const objectsToExport = selectedSavedObjects.map((obj) => ({ id: obj.id, type: obj.type }));

    let blob;
    try {
      blob = await fetchExportObjects(
        http,
        objectsToExport,
        includeReferencesDeep,
        this.formatWorkspaceIdParams({
          workspaces: this.workspaceIdQuery,
        })
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
  };

  onExportAll = async () => {
    const { exportAllSelectedOptions, isIncludeReferencesDeepChecked, activeQuery } = this.state;
    const { notifications, http } = this.props;

    const { queryText } = parseQuery(activeQuery);
    const exportTypes = Object.entries(exportAllSelectedOptions).reduce((accum, [id, selected]) => {
      if (selected) {
        accum.push(id);
      }
      return accum;
    }, [] as string[]);

    let blob;
    try {
      blob = await fetchExportByTypeAndSearch(
        http,
        exportTypes,
        queryText ? `${queryText}*` : undefined,
        isIncludeReferencesDeepChecked,
        this.formatWorkspaceIdParams({
          workspaces: this.workspaceIdQuery,
        })
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
    const { notifications } = this.props;
    if (exportDetails && exportDetails.missingReferences.length > 0) {
      notifications.toasts.addWarning({
        title: i18n.translate(
          'savedObjectsManagement.objectsTable.export.successWithMissingRefsNotification',
          {
            defaultMessage:
              'Your file is downloading in the background. ' +
              'Some related objects could not be found. ' +
              'Please see the last line in the exported file for a list of missing objects.',
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

  showCopyModal = () => {
    this.setState({ isShowingCopyModal: true });
  };

  hideCopyModal = () => {
    this.setState({ isShowingCopyModal: false });
  };

  onDelete = () => {
    this.setState({ isShowingDeleteConfirmModal: true });
  };

  delete = async () => {
    const { savedObjectsClient } = this.props;
    const { selectedSavedObjects, isDeleting } = this.state;

    if (isDeleting) {
      return;
    }

    this.setState({ isDeleting: true });

    const indexPatterns = selectedSavedObjects.filter((object) => object.type === 'index-pattern');
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
    this.setState({
      isShowingDeleteConfirmModal: false,
      isDeleting: false,
    });
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
    const newIndexPatternUrl = applications.getUrlForApp('indexPatterns');

    return (
      <Flyout
        close={this.hideImportFlyout}
        done={this.finishImport}
        http={this.props.http}
        workspaces={this.state.currentWorkspaceId ? [this.state.currentWorkspaceId] : undefined}
        serviceRegistry={this.props.serviceRegistry}
        indexPatterns={this.props.indexPatterns}
        newIndexPatternUrl={newIndexPatternUrl}
        allowedTypes={this.props.allowedTypes}
        overlays={this.props.overlays}
        search={this.props.search}
      />
    );
  }

  renderCopyModal() {
    const { workspaces } = this.props;
    const { isShowingCopyModal, copySelectedSavedObjects, copyState } = this.state;

    if (!isShowingCopyModal) {
      return null;
    }

    return (
      <SavedObjectsCopyModal
        selectedSavedObjects={copySelectedSavedObjects}
        workspaces={workspaces}
        getCopyWorkspaces={this.getCopyWorkspaces}
        copyState={copyState}
        onCopy={this.onCopy}
        onClose={this.hideCopyModal}
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
        <EuiConfirmModal
          title={
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModalTitle"
              defaultMessage="Delete saved objects"
            />
          }
          onCancel={onCancel}
          onConfirm={onConfirm}
          buttonColor="danger"
          cancelButtonText={
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          }
          confirmButtonText={
            isDeleting ? (
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.deleteProcessButtonLabel"
                defaultMessage="Deleting…"
              />
            ) : (
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.deleteButtonLabel"
                defaultMessage="Delete"
              />
            )
          }
          defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
        >
          <p>
            <FormattedMessage
              id="savedObjectsManagement.deleteSavedObjectsConfirmModalDescription"
              defaultMessage="This action will delete the following saved objects:"
            />
          </p>
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
                field: 'id',
                name: i18n.translate(
                  'savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.idColumnName',
                  { defaultMessage: 'Id' }
                ),
              },
              {
                field: 'meta.title',
                name: i18n.translate(
                  'savedObjectsManagement.objectsTable.deleteSavedObjectsConfirmModal.titleColumnName',
                  { defaultMessage: 'Title' }
                ),
              },
            ]}
            pagination={true}
            sorting={false}
          />
        </EuiConfirmModal>
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
            <FormattedMessage
              id="savedObjectsManagement.objectsTable.exportObjectsConfirmModalTitle"
              defaultMessage="Export {filteredItemCount, plural, one{# object} other {# objects}}"
              values={{
                filteredItemCount,
              }}
            />
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiFormRow
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.exportObjectsConfirmModalDescription"
                defaultMessage="Select which types to export"
              />
            }
            labelType="legend"
          >
            <EuiCheckboxGroup
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
          </EuiFormRow>
          <EuiSpacer size="m" />
          <EuiSwitch
            name="includeReferencesDeep"
            label={
              <FormattedMessage
                id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.includeReferencesDeepLabel"
                defaultMessage="Include related objects"
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
                  <EuiButtonEmpty onClick={this.closeExportAllModal}>
                    <FormattedMessage
                      id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.cancelButtonLabel"
                      defaultMessage="Cancel"
                    />
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton fill onClick={this.onExportAll}>
                    <FormattedMessage
                      id="savedObjectsManagement.objectsTable.exportObjectsConfirmModal.exportAllButtonLabel"
                      defaultMessage="Export all"
                    />
                  </EuiButton>
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
      availableWorkspaces: availableWorkspace,
      workspaceEnabled,
      currentWorkspaceId: workspaceId,
    } = this.state;
    const { http, allowedTypes, applications, namespaceRegistry } = this.props;

    const selectionConfig = {
      onSelectionChange: this.onSelectionChanged,
    };
    const typeCounts = savedObjectCounts.type || {};

    const filterOptions = allowedTypes.map((type) => ({
      value: type,
      name: type,
      view: `${type} (${typeCounts[type] || 0})`,
    }));

    const filters = [
      {
        type: 'field_value_selection',
        field: 'type',
        name: i18n.translate('savedObjectsManagement.objectsTable.table.typeFilterName', {
          defaultMessage: 'Type',
        }),
        multiSelect: 'or',
        options: filterOptions,
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

    // Add workspace filter
    if (workspaceEnabled && availableWorkspace?.length) {
      const wsCounts = savedObjectCounts.workspaces || {};
      const wsFilterOptions = availableWorkspace
        .filter((ws) => {
          return this.workspaceIdQuery?.includes(ws.id);
        })
        .map((ws) => {
          return {
            name: ws.name,
            value: ws.name,
            view: `${ws.name} (${wsCounts[ws.id] || 0})`,
          };
        });

      filters.push({
        type: 'field_value_selection',
        field: 'workspaces',
        name:
          namespaceRegistry.getAlias() ||
          i18n.translate('savedObjectsManagement.objectsTable.table.workspaceFilterName', {
            defaultMessage: 'Workspaces',
          }),
        multiSelect: 'or',
        options: wsFilterOptions,
      });
    }

    // workspace enable and no workspace is selected
    const hideImport = workspaceEnabled && !workspaceId;

    return (
      <EuiPageContent
        horizontalPosition="center"
        style={this.props.fullWidth ? {} : { maxWidth: '75%', marginTop: '40px' }}
      >
        {this.renderFlyout()}
        {this.renderRelationships()}
        {this.renderDeleteConfirmModal()}
        {this.renderExportAllOptionsModal()}
        {this.renderCopyModal()}
        <Header
          onExportAll={() => this.setState({ isShowingExportAllOptionsModal: true })}
          onImport={this.showImportFlyout}
          hideImport={hideImport}
          showDuplicateAll={workspaceEnabled}
          onCopy={() =>
            this.setState({
              copySelectedSavedObjects: savedObjects,
              isShowingCopyModal: true,
              copyState: CopyState.All,
            })
          }
          onRefresh={this.refreshObjects}
          filteredCount={filteredItemCount}
          title={this.props.title}
          objectCount={savedObjects.length}
        />
        <EuiSpacer size="xs" />
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
            onCopySelected={() =>
              this.setState({
                isShowingCopyModal: true,
                copyState: CopyState.Selected,
                copySelectedSavedObjects: selectedSavedObjects,
              })
            }
            onCopySingle={(object) =>
              this.setState({
                copySelectedSavedObjects: [object],
                isShowingCopyModal: true,
                copyState: CopyState.Single,
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
            availableWorkspaces={this.state.availableWorkspaces}
            showDuplicate={workspaceEnabled}
          />
        </RedirectAppLinks>
      </EuiPageContent>
    );
  }
}
