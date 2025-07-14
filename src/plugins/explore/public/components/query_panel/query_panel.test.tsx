/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryPanel } from './query_panel';

jest.mock('./editor_stack', () => ({
  EditorStack: () => <div data-test-subj="editor-stack">Editor Stack</div>,
}));

jest.mock('./footer', () => ({
  QueryPanelFooter: () => <div data-test-subj="query-panel-footer">Query Panel Footer</div>,
}));

describe('QueryPanel', () => {
  it('renders EditorStack component', () => {
    render(<QueryPanel />);
    expect(screen.getByTestId('editor-stack')).toBeInTheDocument();
  });

  it('renders QueryPanelFooter component', () => {
    render(<QueryPanel />);
    expect(screen.getByTestId('query-panel-footer')).toBeInTheDocument();
  });
});
