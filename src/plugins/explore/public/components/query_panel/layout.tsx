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
    <div className="query-panel-layout">
      <div className="editor-area">{children}</div>
      <div className="footer-panel">{footer}</div>
    </div>
  );
};

export { QueryPanelLayout };
