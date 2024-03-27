/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiLink,
  EuiButton,
  EuiInMemoryTable,
  EuiSearchBarProps,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { debounce } from '../../../../../core/public';
import { WorkspaceAttribute } from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { switchWorkspace, navigateToWorkspaceUpdatePage } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { cleanWorkspaceId } from '../../../../../core/public';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';

const WORKSPACE_LIST_PAGE_DESCRIPTIOIN = i18n.translate('workspace.list.description', {
  defaultMessage:
    'Workspace allow you to save and organize library items, such as index patterns, visualizations, dashboards, saved searches, and share them with other OpenSearch Dashboards users. You can control which features are visible in each workspace, and which users and groups have read and write access to the library items in the workspace.',
});

export const WorkspaceList = () => {
  const {
    services: { workspaces, application, http },
  } = useOpenSearchDashboards();

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
        switchWorkspace({ application, http }, id);
      }
    },
    [application, http]
  );

  const handleUpdateWorkspace = useCallback(
    (id: string) => {
      if (application && http) {
        navigateToWorkspaceUpdatePage({ application, http }, id);
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
      name: 'Features',
      isExpander: true,
      hasActions: true,
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
          onClick: ({ id }: WorkspaceAttribute) => handleUpdateWorkspace(id),
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
    toolsRight: [
      <EuiButton
        href={workspaceCreateUrl}
        key="create_workspace"
        data-test-subj="workspaceList-create-workspace"
      >
        Create workspace
      </EuiButton>,
    ],
  };

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader
          restrictWidth
          pageTitle="Workspaces"
          description={WORKSPACE_LIST_PAGE_DESCRIPTIOIN}
          style={{ paddingBottom: 0, borderBottom: 0 }}
        />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          panelPaddingSize="l"
          hasShadow={false}
          style={{ width: '100%', maxWidth: 1000 }}
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
      </EuiPageBody>
      {deletedWorkspace && (
        <DeleteWorkspaceModal
          selectedWorkspace={deletedWorkspace}
          onClose={() => setDeletedWorkspace(null)}
        />
      )}
    </EuiPage>
  );
};
