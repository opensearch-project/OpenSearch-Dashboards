/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { EuiButton, EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { ApplicationStart, WorkspaceAttribute, WorkspacesStart } from '../../../../../core/public';
import { WORKSPACE_APP_ID, PATHS } from '../../../common/constants';
import { switchWorkspace } from '../../components/utils/workspace';

type WorkspaceOption = EuiComboBoxOptionOption<WorkspaceAttribute>;

interface WorkspaceDropdownListProps {
  workspaces: WorkspacesStart;
  application: ApplicationStart;
}

function workspaceToOption(workspace: WorkspaceAttribute): WorkspaceOption {
  return { label: workspace.name, key: workspace.id, value: workspace };
}

export function getErrorMessage(err: any) {
  if (err && err.message) return err.message;
  return '';
}

export function WorkspaceDropdownList(props: WorkspaceDropdownListProps) {
  const workspaceList = useObservable(props.workspaces.client.workspaceList$, []);
  const currentWorkspace = useObservable(props.workspaces.client.currentWorkspace$, null);

  const [loading, setLoading] = useState(false);
  const [workspaceOptions, setWorkspaceOptions] = useState([] as WorkspaceOption[]);

  const currentWorkspaceOption = useMemo(() => {
    if (!currentWorkspace) {
      return [];
    } else {
      return [workspaceToOption(currentWorkspace)];
    }
  }, [currentWorkspace]);
  const allWorkspaceOptions = useMemo(() => {
    return workspaceList.map(workspaceToOption);
  }, [workspaceList]);

  const onSearchChange = useCallback(
    (searchValue: string) => {
      setWorkspaceOptions(allWorkspaceOptions.filter((item) => item.label.includes(searchValue)));
    },
    [allWorkspaceOptions]
  );

  const onChange = useCallback(
    (workspaceOption: WorkspaceOption[]) => {
      /** switch the workspace */
      setLoading(true);
      const id = workspaceOption[0].key!;
      switchWorkspace({ workspaces: props.workspaces, application: props.application }, id);
      setLoading(false);
    },
    [props.application, props.workspaces]
  );

  const onCreateWorkspaceClick = () => {
    props.application.navigateToApp(WORKSPACE_APP_ID, { path: PATHS.create });
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
        isClearable={false}
        append={
          <EuiButton onClick={onCreateWorkspaceClick} style={{ width: '500px' }}>
            Create workspace
          </EuiButton>
        }
      />
    </>
  );
}
