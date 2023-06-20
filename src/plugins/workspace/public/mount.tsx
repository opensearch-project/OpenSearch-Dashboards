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
      ReactDOM.render(<WorkspaceDropdownList coreStart={core} />, element);
      return () => {
        ReactDOM.unmountComponentAtNode(element);
      };
    },
  });
};
