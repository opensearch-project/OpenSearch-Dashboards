/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { EuiButton, EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { CoreStart, WorkspaceAttribute } from '../../../../../core/public';
import { WORKSPACE_APP_ID, PATHS } from '../../../common/constants';

type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceAttribute>;

interface WorkspaceDropdownListProps {
  coreStart: CoreStart;
  onSwitchWorkspace: (workspaceId: string) => Promise<void>;
}

function workspaceToOption(workspace: WorkspaceAttribute): WorkspaceOption {
  return { label: workspace.name, key: workspace.id, value: workspace };
}

export function WorkspaceDropdownList(props: WorkspaceDropdownListProps) {
  const { coreStart, onSwitchWorkspace } = props;
  const workspaceList = useObservable(coreStart.workspaces.client.workspaceList$, []);
  const currentWorkspaceId = useObservable(coreStart.workspaces.client.currentWorkspaceId$, '');

  const [loading, setLoading] = useState(false);
  const [workspaceOptions, setWorkspaceOptions] = useState([] as WorkspaceOption[]);

  const currentWorkspaceOption = useMemo(() => {
    const workspace = workspaceList.find((item) => item.id === currentWorkspaceId);
    if (!workspace) {
      coreStart.notifications.toasts.addDanger(
        `can not get current workspace of id [${currentWorkspaceId}]`
      );
      return [workspaceToOption({ id: currentWorkspaceId, name: '' })];
    }
    return [workspaceToOption(workspace)];
  }, [workspaceList, currentWorkspaceId, coreStart]);
  const allWorkspaceOptions = useMemo(() => {
    return workspaceList.map(workspaceToOption);
  }, [workspaceList]);

  const onSearchChange = useCallback(
    (searchValue: string) => {
      setWorkspaceOptions(allWorkspaceOptions.filter((item) => item.label.includes(searchValue)));
    },
    [allWorkspaceOptions]
  );

  const onChange = (workspaceOption: WorkspaceOption[]) => {
    /** switch the workspace */
    setLoading(true);
    onSwitchWorkspace(workspaceOption[0].key!)
      .catch((err) =>
        coreStart.notifications.toasts.addDanger('some error happens in workspace service')
      )
      .finally(() => {
        setLoading(false);
      });
  };

  const onCreateWorkspaceClick = () => {
    coreStart.application.navigateToApp(WORKSPACE_APP_ID, { path: PATHS.create });
  };

  useEffect(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <>
      <EuiComboBox
        async
        options={workspaceOptions}
        isLoading={loading}
        onChange={onChange}
        selectedOptions={currentWorkspaceOption}
        singleSelection={{ asPlainText: true }}
        onSearchChange={onSearchChange}
        append={<EuiButton onClick={onCreateWorkspaceClick}>Create workspace</EuiButton>}
      />
    </>
  );
}
