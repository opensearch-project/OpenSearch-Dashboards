/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { ApplicationStart, ChromeStart, WorkspacesStart } from '../../../core/public';
import { WorkspaceDropdownList } from './containers/workspace_dropdown_list';

export const mountDropdownList = ({
  application,
  workspaces,
  chrome,
}: {
  application: ApplicationStart;
  workspaces: WorkspacesStart;
  chrome: ChromeStart;
}) => {
  chrome.navControls.registerLeft({
    order: 0,
    mount: (element) => {
      ReactDOM.render(
        <WorkspaceDropdownList workspaces={workspaces} application={application} />,
        element
      );
      return () => {
        ReactDOM.unmountComponentAtNode(element);
      };
    },
  });
};
