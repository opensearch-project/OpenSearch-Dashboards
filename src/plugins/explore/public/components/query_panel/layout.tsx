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
    <div className="queryPanel__layout" data-test-subj="queryPanelLayout">
      <div className="queryPanel__editorArea" data-test-subj="queryPanelEditorArea">
        {children}
      </div>
      <div className="queryPanel__footerArea" data-test-subj="queryPanelFooterArea">
        {footer}
      </div>
    </div>
  );
};

export { QueryPanelLayout };
