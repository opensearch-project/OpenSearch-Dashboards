/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from '../../../core/public';
import { WorkspaceDropdownList } from './containers/workspace_dropdown_list';

export const mountDropdownList = (core: CoreStart) => {
  core.chrome.navControls.registerLeft({
    order: 0,
    mount: (element) => {
      ReactDOM.render(
        <WorkspaceDropdownList
          coreStart={core}
          onCreateWorkspace={() => alert('create')}
          onSwitchWorkspace={async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            alert(`switch to workspace ${id}`);
          }}
          // onSwitchWorkspace={(id: string) => alert(`switch to workspace ${id}`)}
        />,
        element
      );
      return () => {
        ReactDOM.unmountComponentAtNode(element);
      };
    },
  });
};
