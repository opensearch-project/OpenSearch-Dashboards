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
    <div className="queryPanelLayout" data-test-subj="query-panel-layout">
      <div className="editorArea">{children}</div>
      <div className="footerPanel">{footer}</div>
    </div>
  );
};

export { QueryPanelLayout };
