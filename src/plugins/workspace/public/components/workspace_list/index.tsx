/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  EuiPage,
  EuiPageContent,
  EuiLink,
  EuiSmallButton,
  EuiInMemoryTable,
  EuiSearchBarProps,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject, of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { debounce, DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { WorkspaceAttribute } from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';
import { NavigationPublicPluginStart } from '../../../../../plugins/navigation/public';

export interface WorkspaceListProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceList = ({ registeredUseCases$ }: WorkspaceListProps) => {
  const {
    services: {
      workspaces,
      application,
      http,
      navigationUI: { HeaderControl },
    },
  } = useOpenSearchDashboards<{
    navigationUI: NavigationPublicPluginStart['ui'];
  }>();
  const registeredUseCases = useObservable(registeredUseCases$);
  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin;

  const initialSortField = 'name';
  const initialSortDirection = 'asc';
  const workspaceList = useObservable(workspaces?.workspaceList$ ?? of([]), []);
  const [queryInput, setQueryInput] = useState<string>('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });
  const [deletedWorkspace, setDeletedWorkspace] = useState<WorkspaceAttribute | null>(null);

  const handleSwitchWorkspace = useCallback(
    (id: string) => {
      if (application && http) {
        navigateToWorkspaceDetail({ application, http }, id);
      }
    },
    [application, http]
  );

  const searchResult = useMemo(() => {
    if (queryInput) {
      const normalizedQuery = queryInput.toLowerCase();
      const result = workspaceList.filter((item) => {
        return (
          item.id.toLowerCase().indexOf(normalizedQuery) > -1 ||
          item.name.toLowerCase().indexOf(normalizedQuery) > -1
        );
      });
      return result;
    }
    return workspaceList;
  }, [workspaceList, queryInput]);

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

  const columns = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      render: (name: string, item: WorkspaceAttribute) => (
        <span>
          <EuiLink onClick={() => handleSwitchWorkspace(item.id)}>{name}</EuiLink>
        </span>
      ),
    },
    {
      field: 'id',
      name: 'ID',
      sortable: true,
    },
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
    },
    {
      field: 'features',
      name: 'Use case',
      isExpander: true,
      hasActions: true,
      render: (features: string[]) => {
        if (!features || features.length === 0) {
          return '';
        }
        const useCaseId = getFirstUseCaseOfFeatureConfigs(features);
        const useCase =
          useCaseId === DEFAULT_NAV_GROUPS.all.id
            ? DEFAULT_NAV_GROUPS.all
            : registeredUseCases?.find(({ id }) => id === useCaseId);
        if (useCase) {
          return useCase.title;
        }
      },
    },
    {
      name: 'Actions',
      field: '',
      actions: [
        {
          name: 'Edit',
          icon: 'pencil',
          type: 'icon',
          description: 'Edit workspace',
          onClick: ({ id }: WorkspaceAttribute) => handleSwitchWorkspace(id),
          'data-test-subj': 'workspace-list-edit-icon',
        },
        {
          name: 'Delete',
          icon: 'trash',
          type: 'icon',
          description: 'Delete workspace',
          onClick: (item: WorkspaceAttribute) => setDeletedWorkspace(item),
          'data-test-subj': 'workspace-list-delete-icon',
        },
      ],
    },
  ];

  const debouncedSetQueryInput = useMemo(() => {
    return debounce(setQueryInput, 300);
  }, [setQueryInput]);

  const handleSearchInput: EuiSearchBarProps['onChange'] = useCallback(
    ({ query }) => {
      debouncedSetQueryInput(query?.text ?? '');
    },
    [debouncedSetQueryInput]
  );

  const search: EuiSearchBarProps = {
    onChange: handleSearchInput,
    box: {
      incremental: true,
    },
  };

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
          items={searchResult}
          columns={columns}
          itemId="id"
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
        />
      </EuiPageContent>
      {deletedWorkspace && (
        <DeleteWorkspaceModal
          selectedWorkspace={deletedWorkspace}
          onClose={() => setDeletedWorkspace(null)}
        />
      )}
    </EuiPage>
  );
};
