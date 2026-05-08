/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditorPanel } from './editor_panel';

jest.mock('./vis_action_bar', () => ({
  VisActionBar: () => <div data-test-subj="vis-action-bar" />,
}));

describe('EditorPanel', () => {
  it('renders VisActionBar', () => {
    render(<EditorPanel>content</EditorPanel>);
    expect(screen.getByTestId('vis-action-bar')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<EditorPanel>child content</EditorPanel>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('sets data-test-subj from testId prop', () => {
    render(<EditorPanel testId="my-editor">content</EditorPanel>);
    expect(screen.getByTestId('my-editor')).toBeInTheDocument();
  });
});
