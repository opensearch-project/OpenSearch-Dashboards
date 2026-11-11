/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SourceQueryEditor, SourceQueryEditorProps } from './source_query_editor';
import type { SourceTypeQueryEditorProps } from '../../../../services/source_type_registry';
import { DataPublicPluginStart } from '../../../../../../data/public';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({
    languageId,
    value,
    onChange,
  }: {
    languageId: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-test-subj="codeEditor"
      data-language={languageId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockEditorProps = jest.fn();
const FakeEditor = (props: SourceTypeQueryEditorProps) => {
  mockEditorProps(props);
  return (
    <>
      <span data-test-subj="fakeQuery">{props.query}</span>
      <button data-test-subj="fakeEdit" onClick={() => props.onChange('edited')} />
      <button data-test-subj="fakeRun" onClick={() => props.onRun()} />
      <button data-test-subj="fakeRunText" onClick={() => props.onRun('SELECT 9')} />
      <button
        data-test-subj="fakeOptions"
        onClick={() => props.onQueryOptionsChange({ period: 300 })}
      />
    </>
  );
};

const data = {} as DataPublicPluginStart;
const dataset = { id: 'external-1', title: 'External', type: 'EXTERNAL_METRICS' };

const renderEditor = (overrides: Partial<SourceQueryEditorProps> = {}) => {
  const props: SourceQueryEditorProps = {
    editor: FakeEditor,
    reduxQuery: 'SELECT 1',
    isDirty: false,
    onQueryChange: jest.fn(),
    onRun: jest.fn(),
    languageId: 'External QL',
    languageTitle: 'External',
    queryOptions: { period: 60 },
    onQueryOptionsChange: jest.fn(),
    status: { isRunning: false, error: 'Bad query' },
    dataset,
    data,
    ...overrides,
  };
  const view = render(<SourceQueryEditor {...props} />);
  return {
    props,
    rerender: (next: Partial<SourceQueryEditorProps>) =>
      view.rerender(<SourceQueryEditor {...props} {...next} />),
  };
};

describe('SourceQueryEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the query, language and dataset to the source's editor", () => {
    renderEditor();

    expect(screen.getByTestId('fakeQuery')).toHaveTextContent('SELECT 1');
    expect(mockEditorProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ languageId: 'External QL', dataset, data })
    );
  });

  it('reports edits and runs', () => {
    const { props } = renderEditor();

    fireEvent.click(screen.getByTestId('fakeEdit'));
    fireEvent.click(screen.getByTestId('fakeRun'));

    expect(props.onQueryChange).toHaveBeenCalledWith('edited');
    expect(screen.getByTestId('fakeQuery')).toHaveTextContent('edited');
    expect(props.onRun).toHaveBeenCalled();
  });

  it('runs the query it is given, and shows it', () => {
    const { props } = renderEditor();
    fireEvent.click(screen.getByTestId('fakeRunText'));
    expect(props.onRun).toHaveBeenCalledWith('SELECT 9');
    expect(screen.getByTestId('fakeQuery')).toHaveTextContent('SELECT 9');
  });

  it('passes the query options and the last run status, and reports option changes', () => {
    const { props } = renderEditor();
    expect(mockEditorProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryOptions: { period: 60 },
        status: { isRunning: false, error: 'Bad query' },
      })
    );
    fireEvent.click(screen.getByTestId('fakeOptions'));
    expect(props.onQueryOptionsChange).toHaveBeenCalledWith({ period: 300 });
  });

  it('keeps a dirty draft until another query is loaded', () => {
    const { rerender } = renderEditor();
    fireEvent.click(screen.getByTestId('fakeEdit'));

    rerender({ isDirty: true });
    expect(screen.getByTestId('fakeQuery')).toHaveTextContent('edited');

    rerender({ isDirty: true, reduxQuery: 'SELECT 2' });
    expect(screen.getByTestId('fakeQuery')).toHaveTextContent('SELECT 2');
  });

  it('falls back to a code editor in the language', () => {
    const { props } = renderEditor({ editor: undefined, reduxQuery: '' });

    const editor = screen.getByTestId('codeEditor');
    expect(editor).toHaveAttribute('data-language', 'External QL');
    expect(screen.getByText('Search using </> External')).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: 'SELECT 3' } });
    expect(props.onQueryChange).toHaveBeenCalledWith('SELECT 3');
  });
});
