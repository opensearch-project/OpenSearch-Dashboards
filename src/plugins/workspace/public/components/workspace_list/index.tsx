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
  EuiButtonEmpty,
  EuiButton,
  EuiEmptyPrompt,
  EuiBadge,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject, of } from 'rxjs';
import { i18n } from '@osd/i18n';
import {
  DEFAULT_NAV_GROUPS,
  WorkspaceAttribute,
  WorkspaceAttributeWithPermission,
} from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { DetailTab } from '../workspace_form/constants';

import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { getFirstUseCaseOfFeatureConfigs, getDataSourcesList } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';
import { WorkspacePermissionMode } from '../../../common/constants';
import { DataSourceAttributesWithWorkspaces } from '../../types';

export interface WorkspaceListProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

interface WorkspaceAttributeWithUseCaseIDAndDataSources extends WorkspaceAttribute {
  useCase?: string;
  dataSources?: string[];
}

export const WorkspaceList = ({ registeredUseCases$ }: WorkspaceListProps) => {
  const {
    services: {
      workspaces,
      application,
      http,
      navigationUI: { HeaderControl },
      uiSettings,
      savedObjects,
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
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });
  const [deletedWorkspaces, setDeletedWorkspaces] = useState<WorkspaceAttribute[]>([]);
  const [selection, setSelection] = useState<WorkspaceAttribute[]>([]);
  const [allDataSources, setAllDataSources] = useState<DataSourceAttributesWithWorkspaces[]>([]);

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
    if (savedObjects) {
      getDataSourcesList(savedObjects.client, ['*']).then((data) => {
        setAllDataSources(data);
      });
    }
  }, [savedObjects]);

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
    const button = (
      <EuiSmallButton
        href={workspaceCreateUrl}
        key="create_workspace"
        data-test-subj="workspaceList-create-workspace"
        iconType="plus"
      >
        {i18n.translate('workspace.list.buttons.createWorkspace', {
          defaultMessage: 'Create workspace',
        })}
      </EuiSmallButton>
    );
    return (
      <HeaderControl
        controls={[{ renderComponent: button }]}
        setMountPoint={application?.setAppRightControls}
      />
    );
  };

  const handleCopyId = (id: string) => {
    copyToClipboard(id);
  };

  const handleSwitchWorkspace = useCallback(
    (id: string, tab?: DetailTab) => {
      if (application && http) {
        navigateToWorkspaceDetail({ application, http }, id, tab);
      }
    },
    [application, http]
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

  const columns = [
    {
      field: 'name',
      name: 'Name',
      width: '15%',
      sortable: true,
      render: (name: string, item: WorkspaceAttributeWithPermission) => (
        <span>
          <EuiLink onClick={() => handleSwitchWorkspace(item.id)}>
            <EuiLink>{name}</EuiLink>
          </EuiLink>
        </span>
      ),
    },

    {
      field: 'useCase',
      name: 'Use case',
      width: '15%',
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
          {/* Here I need to set width mannuly as the tooltip will ineffect the property : truncateText ',  */}
          <EuiText size="s" className="eui-textTruncate" style={{ maxWidth: 150 }}>
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
    {
      name: 'Actions',
      field: '',
      actions: [
        {
          name: 'Copy ID',
          type: 'button',
          description: 'Copy id',
          'data-test-subj': 'workspace-list-copy-id-icon',
          render: ({ id }: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => handleCopyId(id)}
                size="xs"
                iconType="copy"
                color="text"
              >
                <EuiText size="m">Copy ID</EuiText>
              </EuiButtonEmpty>
            );
          },
        },
        {
          name: 'Edit',
          type: 'icon',
          icon: 'edit',
          color: 'danger',
          description: 'Edit workspace',
          'data-test-subj': 'workspace-list-edit-icon',
          onClick: ({ id }: WorkspaceAttribute) => handleSwitchWorkspace(id),
          render: ({ id }: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => handleSwitchWorkspace(id)}
                iconType="pencil"
                size="xs"
                color="text"
              >
                <EuiText size="m">Edit</EuiText>
              </EuiButtonEmpty>
            );
          },
        },
        {
          name: 'Delete',
          type: 'button',
          description: 'Delete workspace',
          'data-test-subj': 'workspace-list-delete-icon',
          render: (item: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => {
                  setDeletedWorkspaces([item]);
                }}
                size="xs"
                iconType="trash"
                color="danger"
              >
                <EuiText size="m">Delete</EuiText>
              </EuiButtonEmpty>
            );
          },
        },
      ],
    },
  ];

  return (
    <EuiPage paddingSize="m">
      <HeaderControl
        controls={[
          {
            description: i18n.translate('workspace.list.description', {
              defaultMessage: 'Organize collaborative projects with use-case-specific workspaces.',
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
        <EuiInMemoryTable
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
          isSelectable={true}
          search={search}
          selection={selectionValue}
        />
      </EuiPageContent>

      {deletedWorkspaces.length > 0 && (
        <DeleteWorkspaceModal
          selectedWorkspaces={deletedWorkspaces}
          onClose={() => setDeletedWorkspaces([])}
        />
      )}
    </EuiPage>
  );
};
