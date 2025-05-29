import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ReusableEditor } from './resuable_editor';

describe('ReusableEditor', () => {
  it('renders editor with placeholder', () => {
    render(
      <ReusableEditor
        value=""
        onChange={jest.fn()}
        onRun={jest.fn()}
        isReadOnly={false}
        onEdit={jest.fn()}
        onClear={jest.fn()}
        editorConfig={{ languageId: 'nl', options: {} }}
        placeholder={<span>Placeholder</span>}
        editorType="prompt"
      />
    );
    expect(screen.getByText('Placeholder')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = jest.fn();
    render(
      <ReusableEditor
        value=""
        onChange={onChange}
        onRun={jest.fn()}
        isReadOnly={false}
        onEdit={jest.fn()}
        onClear={jest.fn()}
        editorConfig={{ languageId: 'ppl', options: {} }}
        editorType="query"
      />
    );
  });

  it('shows edit/clear overlay when read only', () => {
    render(
      <ReusableEditor
        value="test"
        onChange={jest.fn()}
        onRun={jest.fn()}
        isReadOnly={true}
        onEdit={jest.fn()}
        onClear={jest.fn()}
        editorConfig={{ languageId: 'ppl', options: {} }}
        editorType="query"
        editText="Edit"
        clearText="Clear"
      />
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});
