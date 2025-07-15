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
jest.mock('../../../../application/hooks', () => ({
  useBottomEditorText: jest.fn(),
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
import { useBottomEditorText } from '../../../../application/hooks';

const mockUseBottomEditor = useBottomEditor as jest.MockedFunction<typeof useBottomEditor>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockSelectIsDualEditorMode = selectIsDualEditorMode as jest.MockedFunction<
  typeof selectIsDualEditorMode
>;
const mockUseBottomEditorText = useBottomEditorText as jest.MockedFunction<
  typeof useBottomEditorText
>;

describe('BottomEditor', () => {
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
    mockUseBottomEditorText.mockReturnValue('');
    mockUseBottomEditor.mockReturnValue({
      isFocused: false,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockSelectIsDualEditorMode.mockReturnValue(false);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the bottom editor component with correct test subject', () => {
    renderWithProvider(<BottomEditor />);

    expect(screen.getByTestId('exploreBottomEditor')).toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByText('Code Editor Mock')).toBeInTheDocument();
  });

  it('applies hidden class when not in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(false);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).toHaveClass('exploreBottomEditor--hidden');
  });

  it('does not apply hidden class when in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(true);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).not.toHaveClass('exploreBottomEditor--hidden');
  });

  it('applies readonly class when not in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).toHaveClass('exploreBottomEditor--readonly');
  });

  it('does not apply readonly class when in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).not.toHaveClass('exploreBottomEditor--readonly');
  });

  it('applies focused class when editor is focused', () => {
    mockUseBottomEditor.mockReturnValue({
      isFocused: true,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).toHaveClass('exploreBottomEditor--focused');
  });

  it('does not apply focused class when editor is not focused', () => {
    mockUseBottomEditor.mockReturnValue({
      isFocused: false,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);

    renderWithProvider(<BottomEditor />);

    const bottomEditor = screen.getByTestId('exploreBottomEditor');
    expect(bottomEditor).not.toHaveClass('exploreBottomEditor--focused');
  });

  it('renders overlay div', () => {
    const { container } = renderWithProvider(<BottomEditor />);

    const overlay = container.querySelector('.exploreBottomEditor__overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('passes correct props to CodeEditor', () => {
    const customProps = {
      isFocused: false,
      onWrapperClick: jest.fn(),
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
    mockUseBottomEditorText.mockReturnValue('');

    renderWithProvider(<BottomEditor />);

    expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
  });

  it('does not show placeholder when text is present', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    mockUseBottomEditorText.mockReturnValue('SELECT * FROM logs');

    renderWithProvider(<BottomEditor />);

    expect(screen.queryByText('Search using </> PPL')).not.toBeInTheDocument();
  });

  it('does not show placeholder when readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseBottomEditorText.mockReturnValue('');

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
      const editorWrapper = container.querySelector('[data-test-subj="exploreBottomEditor"]');

      expect(mockOnWrapperClick).not.toHaveBeenCalled();

      fireEvent.click(editorWrapper!);

      expect(mockOnWrapperClick).toHaveBeenCalledTimes(1);
    });
  });
});
