/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import './index.scss';

interface QueryPanelLayoutProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

const QueryPanelLayout: React.FC<QueryPanelLayoutProps> = ({ children, footer }) => {
  return (
    <div className="queryPanelLayout" data-test-subj="queryPanelLayout">
      <div className="queryPanelLayout__editorArea" data-test-subj="queryPanelLayoutEditorArea">
        {children}
      </div>
      <div className="queryPanelLayout__footerPanel" data-test-subj="queryPanelLayoutFooterPanel">
        {footer}
      </div>
    </div>
  );
};

export { QueryPanelLayout };
