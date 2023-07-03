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
}

function workspaceToOption(workspace: WorkspaceAttribute): WorkspaceOption {
  return { label: workspace.name, key: workspace.id, value: workspace };
}

export function getErrorMessage(err: any) {
  if (err && err.message) return err.message;
  return '';
}

export function WorkspaceDropdownList(props: WorkspaceDropdownListProps) {
  const { coreStart } = props;

  const workspaceList = useObservable(coreStart.workspaces.client.workspaceList$, []);
  const currentWorkspace = useObservable(coreStart.workspaces.client.currentWorkspace$, null);

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
      const newUrl = coreStart.workspaces?.formatUrlWithWorkspaceId(
        coreStart.application.getUrlForApp(WORKSPACE_APP_ID, {
          path: PATHS.update,
          absolute: true,
        }),
        id,
        {
          jumpable: true,
        }
      );
      if (newUrl) {
        window.location.href = newUrl;
      }
      setLoading(false);
    },
    [coreStart.workspaces, coreStart.application]
  );

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
