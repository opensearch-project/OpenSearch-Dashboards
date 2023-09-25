/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiText, EuiCollapsibleNavGroup } from '@elastic/eui';
import { WorkspacesStart } from '../../../../public';

interface Props {
  workspaces: WorkspacesStart;
}

export function CollapsibleNavHeader({ workspaces }: Props) {
  const workspaceEnabled = useObservable(workspaces.workspaceEnabled$, false);
  const defaultHeaderName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
    {
      defaultMessage: 'OpenSearch Dashboards',
    }
  );

  if (!workspaceEnabled) {
    return (
      <EuiCollapsibleNavGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiIcon type="logoOpenSearch" size="l" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText>
              <strong> {defaultHeaderName} </strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiCollapsibleNavGroup>
    );
  } else {
    return workspaces.renderWorkspaceMenu();
  }
}
