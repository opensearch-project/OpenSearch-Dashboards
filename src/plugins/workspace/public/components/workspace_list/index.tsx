/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiBasicTable,
  EuiLink,
  Direction,
  CriteriaWithPagination,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { WorkspaceAttribute } from '../../../../../core/public';

import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { switchWorkspace } from '../utils/workspace';

export const WorkspaceList = () => {
  const {
    services: { workspaces, application },
  } = useOpenSearchDashboards();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<'name' | 'id'>('name');
  const [sortDirection, setSortDirection] = useState<Direction>('asc');

  const workspaceList = useObservable(workspaces!.client.workspaceList$, []);

  const pageOfItems = useMemo(() => {
    return workspaceList
      .sort((a, b) => {
        const compare = a[sortField].localeCompare(b[sortField]);
        return sortDirection === 'asc' ? compare : -compare;
      })
      .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }, [workspaceList, pageIndex, pageSize, sortField, sortDirection]);

  const handleSwitchWorkspace = useCallback(
    (id: string) => {
      if (workspaces && application) {
        switchWorkspace({ workspaces, application }, id);
      }
    },
    [workspaces, application]
  );

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
  ];

  const onTableChange = ({ page, sort }: CriteriaWithPagination<WorkspaceAttribute>) => {
    const { field, direction } = sort!;
    const { index, size } = page;

    setPageIndex(index);
    setPageSize(size);
    setSortField(field as 'name' | 'id');
    setSortDirection(direction);
  };

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader restrictWidth pageTitle="Workspace list" />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: 1000 }}
        >
          <EuiBasicTable
            items={pageOfItems}
            columns={columns}
            pagination={{
              pageIndex,
              pageSize,
              totalItemCount: workspaceList.length,
              pageSizeOptions: [5, 10, 20],
            }}
            sorting={{
              sort: {
                field: sortField,
                direction: sortDirection,
              },
            }}
            onChange={onTableChange}
          />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
