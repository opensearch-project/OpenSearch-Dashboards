/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { EditorStack } from './editor_stack';
import { QueryPanelFooter } from './footer';
import './query_panel.scss';

const QueryPanel = () => {
  return (
    <EuiPanel paddingSize="s">
      <div className="exploreQueryPanel__editorStackWrapper">
        <EditorStack />
      </div>
      <QueryPanelFooter />
    </EuiPanel>
  );
};

export { QueryPanel };
