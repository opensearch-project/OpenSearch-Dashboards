/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import moment from 'moment';
import {
  EuiPage,
  EuiPageContent,
  EuiLink,
  EuiSmallButton,
  EuiInMemoryTable,
  EuiToolTip,
  EuiText,
  EuiSearchBarProps,
  copyToClipboard,
  EuiTableSelectionType,
  EuiButton,
  EuiEmptyPrompt,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiInMemoryTableProps,
  EuiTableProps,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject, of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { isString } from 'lodash';
import { startCase } from 'lodash';
import {
  DEFAULT_NAV_GROUPS,
  WorkspaceAttribute,
  WorkspaceAttributeWithPermission,
} from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { DetailTab } from '../workspace_form/constants';

import { DEFAULT_WORKSPACE, WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { getFirstUseCaseOfFeatureConfigs, getDataSourcesList } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';
import { WorkspacePermissionMode } from '../../../common/constants';
import { DataSourceAttributesWithWorkspaces } from '../../types';
import { PermissionModeId } from '../../../common/types';

export interface WorkspaceListProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export interface WorkspaceListInnerProps extends WorkspaceListProps {
  fullPage?: boolean;
  selectable?: boolean;
  searchable?: boolean;
  excludedActionNames?: string[];
  includedColumns?: Array<{ field: string; width?: string }>;
  excludedColumns?: string[];
}

interface WorkspaceAttributeWithUseCaseIDAndDataSources extends WorkspaceAttribute {
  useCase?: string;
  dataSources?: string[];
}

export const WorkspaceList = (props: WorkspaceListProps) => {
  return (
    <WorkspaceListInner
      {...props}
      excludedActionNames={['leave']}
      excludedColumns={['permissionMode']}
    />
  );
};

export const WorkspaceListInner = ({
  registeredUseCases$,
  fullPage = true,
  selectable = true,
  searchable = true,
  excludedActionNames = [],
  includedColumns = [],
  excludedColumns = [],
}: WorkspaceListInnerProps) => {
  const {
    services: {
      workspaces,
      application,
      http,
      navigationUI: { HeaderControl },
      uiSettings,
      savedObjects,
      notifications,
    },
  } = useOpenSearchDashboards<{
    navigationUI: NavigationPublicPluginStart['ui'];
  }>();
  const registeredUseCases = useObservable(registeredUseCases$);
  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin;
  const initialSortField = 'name';
  const initialSortDirection = 'asc';
  const workspaceList = useObservable(workspaces?.workspaceList$ ?? of([]), []);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });
  const [deletedWorkspaces, setDeletedWorkspaces] = useState<WorkspaceAttribute[]>([]);
  const [selection, setSelection] = useState<WorkspaceAttribute[]>([]);
  const [allDataSources, setAllDataSources] = useState<DataSourceAttributesWithWorkspaces[]>([]);
  //  default workspace state
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | undefined>(undefined);

  const dateFormat = uiSettings?.get('dateFormat');

  const extractUseCaseFromFeatures = useCallback(
    (features: string[]) => {
      if (!features || features.length === 0) {
        return '';
      }
      const useCaseId = getFirstUseCaseOfFeatureConfigs(features);
      const usecase =
        useCaseId === DEFAULT_NAV_GROUPS.all.id
          ? DEFAULT_NAV_GROUPS.all
          : registeredUseCases?.find(({ id }) => id === useCaseId);
      if (usecase) {
        return usecase.title;
      }
    },
    [registeredUseCases]
  );

  useEffect(() => {
    setDefaultWorkspace(uiSettings?.get(DEFAULT_WORKSPACE));
    if (savedObjects) {
      getDataSourcesList(savedObjects.client, ['*']).then((data) => {
        setAllDataSources(data);
      });
    }
  }, [savedObjects, uiSettings]);

  const newWorkspaceList: WorkspaceAttributeWithUseCaseIDAndDataSources[] = useMemo(() => {
    return workspaceList.map(
      (workspace): WorkspaceAttributeWithUseCaseIDAndDataSources => {
        const associatedDataSourcesTitles = allDataSources
          .filter((ds) => ds.workspaces && ds.workspaces.includes(workspace.id))
          .map((ds) => ds.title as string);
        return {
          ...workspace,
          useCase: extractUseCaseFromFeatures(workspace.features ?? []),
          dataSources: associatedDataSourcesTitles,
        };
      }
    );
  }, [workspaceList, extractUseCaseFromFeatures, allDataSources]);
  const workspaceCreateUrl = useMemo(() => {
    if (!application) {
      return '';
    }

    const appUrl = application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
      absolute: false,
    });
    if (!appUrl) return '';

    return appUrl;
  }, [application]);

  const emptyStateMessage = useMemo(() => {
    return (
      <EuiEmptyPrompt
        iconType="spacesApp"
        title={
          <h3>
            {i18n.translate('workspace.workspaceList.emptyState.title', {
              defaultMessage: 'No workspace available',
            })}
          </h3>
        }
        titleSize="s"
        body={i18n.translate('workspace.workspaceList.emptyState.body', {
          defaultMessage: 'There are no workspace to display. Create workspace to get started.',
        })}
        actions={
          isDashboardAdmin && (
            <EuiSmallButton
              href={workspaceCreateUrl}
              key="create_workspace"
              data-test-subj="workspaceList-create-workspace"
            >
              {i18n.translate('workspace.workspaceList.buttons.createWorkspace', {
                defaultMessage: 'Create workspace',
              })}
            </EuiSmallButton>
          )
        }
      />
    );
  }, [isDashboardAdmin, workspaceCreateUrl]);

  const renderCreateWorkspaceButton = () => {
    return (
      <HeaderControl
        controls={[
          {
            controlType: 'button',
            label: i18n.translate('workspace.list.buttons.createWorkspace', {
              defaultMessage: 'Create workspace',
            }),
            testId: 'workspaceList-create-workspace',
            iconType: 'plus',
            href: workspaceCreateUrl,
            fill: true,
          },
        ]}
        setMountPoint={application?.setAppRightControls}
      />
    );
  };

  const handleCopyId = (id: string) => {
    copyToClipboard(id);
    notifications?.toasts.addSuccess('Workspace ID copied');
  };

  const handleSwitchWorkspace = useCallback(
    (id: string, tab?: DetailTab) => {
      if (application && http) {
        navigateToWorkspaceDetail({ application, http }, id, tab);
      }
    },
    [application, http]
  );

  const handleSetDefaultWorkspace = useCallback(
    async (item: WorkspaceAttribute) => {
      const set = await uiSettings?.set(DEFAULT_WORKSPACE, item.id);
      if (set) {
        setDefaultWorkspace(item.id);
        notifications?.toasts.addSuccess(`Default workspace been set to ${item.name}`);
      } else {
        // toast
        notifications?.toasts.addError(
          new Error(`Failed to set workspace ${item.name} as default workspace.`),
          {
            title: 'Set default workspace error',
          }
        );
      }
    },
    [notifications?.toasts, uiSettings]
  );

  const renderDataWithMoreBadge = (
    data: string[],
    maxDisplayedAmount: number,
    workspaceId: string,
    tab: DetailTab
  ) => {
    const amount = data.length;
    const mostDisplayedTitles = data.slice(0, maxDisplayedAmount).join(',');
    return amount <= maxDisplayedAmount ? (
      mostDisplayedTitles
    ) : (
      <>
        {mostDisplayedTitles}&nbsp;
        <EuiBadge
          color="hollow"
          iconType="popout"
          iconSide="right"
          onClick={() => handleSwitchWorkspace(workspaceId, tab)}
          iconOnClick={() => handleSwitchWorkspace(workspaceId, tab)}
          iconOnClickAriaLabel="Open workspace detail"
          onClickAriaLabel="Open workspace detail"
          data-test-subj={`workspaceList-more-${tab}-badge`}
        >
          + {amount - maxDisplayedAmount} more
        </EuiBadge>
      </>
    );
  };

  const renderToolsLeft = () => {
    if (selection.length === 0) {
      return;
    }

    const onClick = () => {
      const deleteWorkspacesByIds = (workSpaces: WorkspaceAttribute[], ids: string[]) => {
        const needToBeDeletedWorkspaceList: WorkspaceAttribute[] = [];
        ids.forEach((id) => {
          const index = workSpaces.findIndex((workSpace) => workSpace.id === id);
          if (index >= 0) {
            needToBeDeletedWorkspaceList.push(workSpaces[index]);
          }
        });
        return needToBeDeletedWorkspaceList;
      };

      setDeletedWorkspaces(
        deleteWorkspacesByIds(
          newWorkspaceList,
          selection.map((item) => item.id)
        )
      );

      setSelection([]);
    };

    return (
      <>
        <EuiButton color="danger" iconType="trash" onClick={onClick}>
          Delete {selection.length} Workspace
        </EuiButton>
        {deletedWorkspaces && deletedWorkspaces.length > 0 && (
          <DeleteWorkspaceModal
            selectedWorkspaces={deletedWorkspaces}
            onClose={() => setDeletedWorkspaces([])}
          />
        )}
      </>
    );
  };

  const selectionValue: EuiTableSelectionType<WorkspaceAttribute> = {
    onSelectionChange: (deletedSelection) => setSelection(deletedSelection),
  };

  const search: EuiSearchBarProps = {
    box: {
      incremental: true,
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'useCase',
        name: 'Use Case',
        multiSelect: false,
        options: Array.from(
          new Set(newWorkspaceList.map(({ useCase }) => useCase).filter(Boolean))
        ).map((useCase) => ({
          value: useCase!,
          name: useCase!,
        })),
      },
    ],
    toolsLeft: renderToolsLeft(),
  };

  const columnsWithoutActions = [
    {
      field: 'name',
      name: 'Name',
      width: '18%',
      sortable: true,
      render: (name: string, item: WorkspaceAttributeWithPermission) => (
        <span>
          <EuiLink onClick={() => handleSwitchWorkspace(item.id)}>
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              <EuiFlexItem>
                <EuiText size="s">{name}</EuiText>
              </EuiFlexItem>
              {item.id === defaultWorkspace && (
                <EuiFlexItem grow={false}>
                  <EuiBadge>Default workspace</EuiBadge>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiLink>
        </span>
      ),
    },

    {
      field: 'useCase',
      name: 'Use case',
      width: '12%',
    },

    {
      field: 'description',
      name: 'Description',
      width: '15%',
      render: (description: string) => (
        <EuiToolTip
          position="bottom"
          content={description}
          data-test-subj="workspaceList-hover-description"
        >
          {/* Here I need to set width manually as the tooltip will ineffect the property : truncateText ',  */}
          <EuiText className="eui-textTruncate" size="xs" style={{ maxWidth: 150 }}>
            {description}
          </EuiText>
        </EuiToolTip>
      ),
    },
    {
      field: 'permissions',
      name: 'Owners',
      width: '15%',
      render: (
        permissions: WorkspaceAttributeWithPermission['permissions'],
        item: WorkspaceAttributeWithPermission
      ) => {
        const owners = permissions?.[WorkspacePermissionMode.Write]?.users ?? [];
        return renderDataWithMoreBadge(owners, 1, item.id, DetailTab.Collaborators);
      },
    },
    {
      field: 'permissionMode',
      name: 'Permissions',
      width: '6%',
      render: (permissionMode: WorkspaceAttributeWithPermission['permissionMode']) => {
        return isDashboardAdmin ? (
          <EuiToolTip position="right" content="You are dashboard admin">
            <EuiText size="xs">Admin</EuiText>
          </EuiToolTip>
        ) : (
          startCase(permissionMode)
        );
      },
    },
    {
      field: 'lastUpdatedTime',
      name: 'Last updated',
      width: '15%',
      truncateText: false,
      render: (lastUpdatedTime: string) => {
        return moment(lastUpdatedTime).format(dateFormat);
      },
    },
    {
      field: 'dataSources',
      width: '15%',
      name: 'Data sources',
      render: (dataSources: string[], item: WorkspaceAttributeWithPermission) => {
        return renderDataWithMoreBadge(dataSources, 2, item.id, DetailTab.DataSources);
      },
    },
  ];
  const allActions = [
    {
      name: <EuiText key="copyId">Copy ID</EuiText>,
      icon: 'copy',
      type: 'icon',
      description: 'Copy workspace id',
      'data-test-subj': 'workspace-list-copy-id-icon',
      onClick: ({ id }: WorkspaceAttribute) => handleCopyId(id),
    },
    {
      name: <EuiText key="edit">Edit</EuiText>,
      icon: 'pencil',
      type: 'icon',
      description: 'Edit workspace',
      'data-test-subj': 'workspace-list-edit-icon',
      onClick: ({ id }: WorkspaceAttribute) => handleSwitchWorkspace(id),
    },
    {
      name: <EuiText key="setDefault">Set as my default</EuiText>,
      icon: 'flag',
      type: 'icon',
      description: 'Set as default workspace',
      'data-test-subj': 'workspace-list-set-default-icon',
      onClick: (item: WorkspaceAttribute) => handleSetDefaultWorkspace(item),
    },
    {
      name: <EuiText key="leave">Leave</EuiText>,
      icon: 'exit',
      type: 'icon',
      description: 'Leave workspace',
      'data-test-subj': 'workspace-list-leave-icon',
      available: () => false,
    },
    {
      name: (
        <EuiText color="danger" key="delete">
          Delete
        </EuiText>
      ),
      icon: () => <EuiIcon type="trash" size="m" color="danger" />,
      type: 'icon',
      isPrimary: false,
      description: 'Delete workspace',
      'data-test-subj': 'workspace-list-delete-icon',
      onClick: (item: WorkspaceAttribute) => {
        setDeletedWorkspaces([item]);
      },
    },
  ];

  const availableActions = allActions.filter(
    (action) =>
      !excludedActionNames?.includes(isString(action.name) ? action.name : action.name.key || '')
  );

  const includedColumnsFields = includedColumns.map((column) => {
    return column.field;
  });
  const availableColumns = columnsWithoutActions
    .filter((column) => !excludedColumns.includes(column.field))
    .filter((column) => {
      return (
        !includedColumnsFields ||
        includedColumnsFields.length === 0 ||
        includedColumnsFields.includes(column.field)
      );
    })
    .map((column) => {
      const customizedCol = includedColumns.find((col) => col.field === column.field);
      return {
        ...column,
        ...(customizedCol ? { ...customizedCol } : {}),
      };
    });

  const actionColumns = [
    {
      name: 'Actions',
      field: '',
      actions: availableActions,
    },
  ];

  const columns = [...availableColumns, ...actionColumns];

  const workspaceListTable = (
    <EuiInMemoryTable
      compressed={true}
      items={newWorkspaceList}
      columns={columns}
      itemId="id"
      message={emptyStateMessage}
      onTableChange={({ page: { index, size } }) =>
        setPagination((prev) => {
          return { ...prev, pageIndex: index, pageSize: size };
        })
      }
      pagination={pagination}
      sorting={{
        sort: {
          field: initialSortField,
          direction: initialSortDirection,
        },
      }}
      isSelectable={selectable}
      search={searchable ? search : undefined}
      selection={selectable ? selectionValue : undefined}
    />
  );

  return fullPage ? (
    <>
      <EuiPage paddingSize="m">
        <HeaderControl
          controls={[
            {
              description: i18n.translate('workspace.list.description', {
                defaultMessage:
                  'Organize collaborative projects with use-case-specific workspaces.',
              }),
            },
          ]}
          setMountPoint={application?.setAppDescriptionControls}
        />
        {isDashboardAdmin && renderCreateWorkspaceButton()}
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="m"
          panelPaddingSize="l"
          hasShadow={false}
        >
          {workspaceListTable}
        </EuiPageContent>

        {deletedWorkspaces.length > 0 && (
          <DeleteWorkspaceModal
            selectedWorkspaces={deletedWorkspaces}
            onClose={() => setDeletedWorkspaces([])}
          />
        )}
      </EuiPage>
    </>
  ) : (
    workspaceListTable
  );
};
