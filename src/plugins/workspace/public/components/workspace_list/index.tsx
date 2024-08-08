/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import moment from 'moment';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
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
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject, of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { DEFAULT_NAV_GROUPS, WorkspaceAttribute } from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { cleanWorkspaceId } from '../../../../../core/public';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';

const WORKSPACE_LIST_PAGE_DESCRIPTION = i18n.translate('workspace.list.description', {
  defaultMessage:
    'Workspace allow you to save and organize library items, such as index patterns, visualizations, dashboards, saved searches, and share them with other OpenSearch Dashboards users. You can control which features are visible in each workspace, and which users and groups have read and write access to the library items in the workspace.',
});

export interface WorkspaceListProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

interface WorkspaceAttributeWithUseCaseID extends WorkspaceAttribute {
  useCase?: string;
}

export const WorkspaceList = ({ registeredUseCases$ }: WorkspaceListProps) => {
  const {
    services: { workspaces, application, http },
  } = useOpenSearchDashboards();
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

  const extractUseCaseFromFeatures = (features: string[]) => {
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
  };

  const newWorkspaceList: WorkspaceAttributeWithUseCaseID[] = useMemo(() => {
    return workspaceList.map(
      (workspace): WorkspaceAttributeWithUseCaseID => ({
        ...workspace,
        useCase: extractUseCaseFromFeatures(workspace.features ?? []),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceList]);

  const workspaceCreateUrl = useMemo(() => {
    if (!application || !http) {
      return '';
    }

    const appUrl = application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
      absolute: false,
    });
    if (!appUrl) return '';

    return cleanWorkspaceId(appUrl);
  }, [application, http]);

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

  const handleCopyId = (id: string) => {
    copyToClipboard(id);
  };

  const handleSwitchWorkspace = useCallback(
    (id: string) => {
      if (application && http) {
        navigateToWorkspaceDetail({ application, http }, id);
      }
    },
    [application, http]
  );

  const renderToolsLeft = () => {
    if (selection.length === 0) {
      return;
    }

    const onClick = () => {
      const deleteWorkspacesByIds = (workSpaces: WorkspaceAttribute[], ids: string[]) => {
        const needToBeDeleteWorkspaceList: WorkspaceAttribute[] = [];
        ids.forEach((id) => {
          const index = workSpaces.findIndex((workSpace) => workSpace.id === id);
          if (index >= 0) {
            needToBeDeleteWorkspaceList.push(workSpaces[index]);
          }
        });
        return needToBeDeleteWorkspaceList;
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
    toolsRight: [
      ...(isDashboardAdmin
        ? [
            <EuiSmallButton
              href={workspaceCreateUrl}
              key="create_workspace"
              data-test-subj="workspaceList-create-workspace"
            >
              {i18n.translate('workspace.workspaceList.buttons.createWorkspace', {
                defaultMessage: 'Create workspace',
              })}
            </EuiSmallButton>,
          ]
        : []),
    ],
  };

  const columns = [
    {
      field: 'name',
      name: 'Name',
      width: '25%',
      sortable: true,
      render: (name: string, item: WorkspaceAttribute) => (
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
      width: '20%',
    },

    {
      field: 'description',
      name: 'Description',
      width: '20%',
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
      field: 'lastUpdatedTime',
      name: 'Last updated',
      width: '25%',
      truncateText: false,
      render: (lastUpdatedTime: string) => {
        return moment(lastUpdatedTime).format('MMM DD[,]YYYY [@] HH:mm:ss.SSS');
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
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader
          restrictWidth
          pageTitle="Workspaces"
          description={WORKSPACE_LIST_PAGE_DESCRIPTION}
          style={{ paddingBottom: 0, borderBottom: 0 }}
        />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          panelPaddingSize="l"
          hasShadow={false}
          style={{ width: '100%' }}
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
      </EuiPageBody>
      {deletedWorkspaces.length > 0 && (
        <DeleteWorkspaceModal
          selectedWorkspaces={deletedWorkspaces}
          onClose={() => setDeletedWorkspaces([])}
        />
      )}
    </EuiPage>
  );
};
