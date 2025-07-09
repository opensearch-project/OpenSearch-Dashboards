/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BottomEditor } from './bottom_editor';
import { EditorMode } from '../../../../application/utils/state_management/types';

jest.mock('../../utils', () => ({
  useBottomEditor: jest.fn(),
}));
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectIsDualEditorMode: jest.fn(),
}));
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ ...props }: any) => (
    <div data-test-subj="code-editor" {...props}>
      Code Editor Mock
    </div>
  ),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));
jest.mock('../../../../application/context', () => ({
  useEditorContextByEditorComponent: jest.fn(),
}));
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { useBottomEditor } from '../../utils';
import {
  selectEditorMode,
  selectIsDualEditorMode,
} from '../../../../application/utils/state_management/selectors';
import { useEditorContextByEditorComponent } from '../../../../application/context';

const mockUseBottomEditor = useBottomEditor as jest.MockedFunction<typeof useBottomEditor>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockSelectIsDualEditorMode = selectIsDualEditorMode as jest.MockedFunction<
  typeof selectIsDualEditorMode
>;
const mockUseEditorContextByEditorComponent = useEditorContextByEditorComponent as jest.MockedFunction<
  typeof useEditorContextByEditorComponent
>;

describe('BottomEditor', () => {
  const mockBottomEditorRef = {
    current: {
      focus: jest.fn(),
    },
  };

  const mockEditorProps = {
    value: 'SELECT * FROM logs',
    onChange: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    language: 'sql',
  };

  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEditorContextByEditorComponent.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      bottomEditorText: '',
    } as any);
    mockUseBottomEditor.mockReturnValue({
      isFocused: false,
      ...mockEditorProps,
    } as any);
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockSelectIsDualEditorMode.mockReturnValue(false);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the bottom editor component', () => {
    renderWithProvider(<BottomEditor />);

    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByText('Code Editor Mock')).toBeInTheDocument();
  });

  it('has correct test subject attribute', () => {
    renderWithProvider(<BottomEditor />);

    const editorContainer = screen.getByTestId('exploreReusableEditor');
    expect(editorContainer).toBeInTheDocument();
  });

  it('is hidden when not in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(false);

    const { container } = renderWithProvider(<BottomEditor />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('queryEditorWrapper--hidden');
  });

  it('is visible when in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(true);

    const { container } = renderWithProvider(<BottomEditor />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('queryEditorWrapper--hidden');
  });

  it('is readonly when not in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    const { container } = renderWithProvider(<BottomEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).toHaveClass('queryEditor--readonly');
  });

  it('is not readonly when in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    const { container } = renderWithProvider(<BottomEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).not.toHaveClass('queryEditor--readonly');
  });

  it('shows focused state when editor is focused', () => {
    mockUseBottomEditor.mockReturnValue({
      isFocused: true,
      ...mockEditorProps,
    } as any);

    const { container } = renderWithProvider(<BottomEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).toHaveClass('queryEditor--focused');
  });

  it('does not show focused state when editor is not focused', () => {
    mockUseBottomEditor.mockReturnValue({
      isFocused: false,
      ...mockEditorProps,
    } as any);

    const { container } = renderWithProvider(<BottomEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).not.toHaveClass('queryEditor--focused');
  });

  it('focuses editor when switching to dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    renderWithProvider(<BottomEditor />);

    expect(mockBottomEditorRef.current.focus).toHaveBeenCalled();
  });

  it('does not focus editor when not in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    renderWithProvider(<BottomEditor />);

    expect(mockBottomEditorRef.current.focus).not.toHaveBeenCalled();
  });

  it('passes correct props to CodeEditor', () => {
    const customProps = {
      isFocused: false,
      value: 'SELECT COUNT(*) FROM users',
      onChange: jest.fn(),
      language: 'ppl',
      onFocus: jest.fn(),
      onBlur: jest.fn(),
    };

    mockUseBottomEditor.mockReturnValue(customProps as any);

    renderWithProvider(<BottomEditor />);

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveAttribute('value', 'SELECT COUNT(*) FROM users');
    expect(codeEditor).toHaveAttribute('language', 'ppl');
  });

  it('shows placeholder when text is empty and not readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      bottomEditorText: '',
    } as any);

    renderWithProvider(<BottomEditor />);

    expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
  });

  it('does not show placeholder when text is present', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      bottomEditorText: 'SELECT * FROM logs',
    } as any);

    renderWithProvider(<BottomEditor />);

    expect(screen.queryByText('Search using </> PPL')).not.toBeInTheDocument();
  });

  it('does not show placeholder when readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      bottomEditorText: '',
    } as any);

    renderWithProvider(<BottomEditor />);

    expect(screen.queryByText('Search using </> PPL')).not.toBeInTheDocument();
  });

  describe('onWrapperClick', () => {
    it('calls onWrapperClick when editor wrapper is clicked', () => {
      const mockOnWrapperClick = jest.fn();
      mockUseBottomEditor.mockReturnValue({
        isFocused: false,
        onWrapperClick: mockOnWrapperClick,
        ...mockEditorProps,
      } as any);

      const { container } = renderWithProvider(<BottomEditor />);
      const editorWrapper = container.querySelector('[data-test-subj="exploreReusableEditor"]');

      fireEvent.click(editorWrapper!);

      expect(mockOnWrapperClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onWrapperClick when editor wrapper is not clicked', () => {
      const mockOnWrapperClick = jest.fn();
      mockUseBottomEditor.mockReturnValue({
        isFocused: false,
        onWrapperClick: mockOnWrapperClick,
        ...mockEditorProps,
      } as any);

      renderWithProvider(<BottomEditor />);

      expect(mockOnWrapperClick).not.toHaveBeenCalled();
    });
  });
});
