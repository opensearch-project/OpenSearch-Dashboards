/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { i18n } from '@osd/i18n';
import { WorkspaceAttribute, CoreSetup } from '../../../../../core/public';
import {
  SavedObjectsManagementColumn,
  SavedObjectsManagementRecord,
} from '../../../../saved_objects_management/public';

interface WorkspaceColumnProps {
  coreSetup: CoreSetup;
  workspaces?: string[];
  record: SavedObjectsManagementRecord;
}

function WorkspaceColumn({ coreSetup, workspaces, record }: WorkspaceColumnProps) {
  const workspaceList = useObservable(coreSetup.workspaces.workspaceList$);

  const wsLookUp = workspaceList?.reduce((map, ws) => {
    return map.set(ws.id, ws.name);
  }, new Map<string, string>());

  const workspaceNames = workspaces?.map((wsId) => wsLookUp?.get(wsId)).join(' | ');

  return <EuiText>{workspaceNames}</EuiText>;
}

export function getWorkspaceColumn(
  coreSetup: CoreSetup
): SavedObjectsManagementColumn<WorkspaceAttribute | undefined> {
  return {
    id: 'workspace_column',
    euiColumn: {
      align: 'left',
      field: 'workspaces',
      name: i18n.translate('savedObjectsManagement.objectsTable.table.columnWorkspacesName', {
        defaultMessage: 'Workspaces',
      }),
      render: (workspaces: string[], record: SavedObjectsManagementRecord) => {
        return <WorkspaceColumn coreSetup={coreSetup} workspaces={workspaces} record={record} />;
      },
    },
    loadData: () => {
      return Promise.resolve(undefined);
    },
  };
}
