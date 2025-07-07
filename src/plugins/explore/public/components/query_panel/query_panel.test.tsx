/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryPanel } from './query_panel';
import { RECENT_QUERIES_TABLE_WRAPPER_EL } from './utils/constants';

jest.mock('./editor_stack', () => ({
  EditorStack: () => <div data-test-subj="editor-stack">Editor Stack</div>,
}));

jest.mock('./footer', () => ({
  QueryPanelFooter: () => <div data-test-subj="query-panel-footer">Query Panel Footer</div>,
}));

describe('QueryPanel', () => {
  it('renders without crashing', () => {
    render(<QueryPanel />);
    expect(screen.getByTestId('exploreQueryPanelLayout')).toBeInTheDocument();
  });

  it('renders EditorStack component', () => {
    render(<QueryPanel />);
    expect(screen.getByTestId('editor-stack')).toBeInTheDocument();
  });

  it('renders QueryPanelFooter component', () => {
    render(<QueryPanel />);
    expect(screen.getByTestId('query-panel-footer')).toBeInTheDocument();
  });

  it('portal container is accessible from document', () => {
    render(<QueryPanel />);
    const portalContainer = document.getElementById(RECENT_QUERIES_TABLE_WRAPPER_EL);
    expect(portalContainer).toBeInTheDocument();
  });
});
