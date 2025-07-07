/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { EditorStack } from './editor_stack';
import { QueryPanelFooter } from './footer';
import { RECENT_QUERIES_TABLE_WRAPPER_EL } from './utils/constants';
import './query_panel.scss';

const QueryPanel = () => {
  return (
    <EuiPanel paddingSize="s" className="queryPanel__container">
      <div className="queryPanel__layout" data-test-subj="exploreQueryPanelLayout">
        <div className="queryPanel__editorArea" data-test-subj="exploreQueryPanelEditorArea">
          <EditorStack />
        </div>
        <div className="queryPanel__footerArea" data-test-subj="exploreQueryPanelFooterArea">
          <QueryPanelFooter />
        </div>
      </div>
      {/* Used as a portal for RecentQueries */}
      <div className="queryPanel__recentQueries" id={RECENT_QUERIES_TABLE_WRAPPER_EL} />
    </EuiPanel>
  );
};

export { QueryPanel };
