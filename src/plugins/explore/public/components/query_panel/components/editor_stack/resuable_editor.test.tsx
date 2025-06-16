/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ReusableEditor, ReusableEditorProps } from './resuable_editor';
import { EditorType } from './types';

// TODO: Look for more test cases related to monaco editor, once api integrated.
// Mock CodeEditor from opensearch_dashboards_react
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ value, onChange, height }: any) => (
    <textarea
      data-test-subj="mockCodeEditor"
      value={value}
      style={{ height }}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const defaultProps: ReusableEditorProps = {
  value: '',
  onChange: jest.fn(),
  onRun: jest.fn(),
  onEdit: jest.fn(),
  onClear: jest.fn(),
  isReadOnly: false,
  editorConfig: {
    languageId: 'ppl',
    options: {},
    languageConfiguration: {},
    triggerSuggestOnFocus: false,
  },
  editorType: EditorType.Query,
};

describe('ReusableEditor', () => {
  it('renders editor and placeholder', () => {
    render(<ReusableEditor {...defaultProps} placeholder="Type here..." />);
    expect(screen.getByTestId('mockCodeEditor')).toBeInTheDocument();
    expect(screen.getByText('Type here...')).toBeInTheDocument();
  });

  it('calls onChange when editor value changes', () => {
    const onChange = jest.fn();
    render(<ReusableEditor {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('mockCodeEditor'), { target: { value: 'foo' } });
    expect(onChange).toHaveBeenCalledWith('foo');
  });

  it('shows edit toolbar when readOnly', () => {
    render(<ReusableEditor {...defaultProps} isReadOnly value="test" />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls onEdit when Edit is clicked', () => {
    const onEdit = jest.fn();
    render(<ReusableEditor {...defaultProps} isReadOnly value="test" onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onClear when Clear is clicked', () => {
    const onClear = jest.fn();
    render(<ReusableEditor {...defaultProps} isReadOnly value="test" onClear={onClear} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalled();
  });
});
