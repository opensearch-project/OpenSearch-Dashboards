/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageToggle } from './lauguage_toggle';
import { EditorMode } from '../../../utils/state_management/types';
import { QueryPanelFullProps } from './query_panel_context';

const mockHandleEditorChange = jest.fn();
const mockHandleLanguageTypeChange = jest.fn();
const mockSwitchEditorMode = jest.fn();
const mockClearEditor = jest.fn();
const mockFocusEditor = jest.fn();

let mockQueryEditorState: any;

jest.mock('../../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

jest.mock('./query_panel_context', () => ({
  useQueryPanelContext: (): Partial<QueryPanelFullProps> => ({
    queryEditorState: mockQueryEditorState,
    handleEditorChange: mockHandleEditorChange,
    handleLanguageTypeChange: mockHandleLanguageTypeChange,
    editorOperations: {
      focusEditor: mockFocusEditor,
      clearEditor: mockClearEditor,
      switchEditorMode: mockSwitchEditorMode,
    } as any,
  }),
}));

const buildQueryEditorState = (options: Record<string, any> = {}) => ({
  languageType: 'PPL',
  editorMode: EditorMode.Query,
  promptModeIsAvailable: false,
  ...options,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockQueryEditorState = buildQueryEditorState();
});

afterEach(() => {
  jest.useRealTimers();
});

const openPopover = () => {
  fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
};

describe('LanguageToggle', () => {
  it('renders the toggle button', () => {
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();
  });

  it('shows PPL label when language is PPL', () => {
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PPL');
  });

  it('shows PromQL label when language is PROMQL', () => {
    mockQueryEditorState = buildQueryEditorState({ languageType: 'PROMQL' });
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PromQL');
  });

  it('shows AI label when in prompt mode', () => {
    mockQueryEditorState = buildQueryEditorState({ editorMode: EditorMode.Prompt });
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('AI');
  });

  it('opens popover on button click', () => {
    render(<LanguageToggle />);
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeInTheDocument();
  });

  it('does not show AI option when promptModeIsAvailable is false', () => {
    render(<LanguageToggle />);
    openPopover();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
  });

  it('shows AI option when promptModeIsAvailable is true', () => {
    mockQueryEditorState = buildQueryEditorState({ promptModeIsAvailable: true });
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeInTheDocument();
  });

  it('disables PPL option when already on PPL', () => {
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeDisabled();
  });

  it('disables PromQL option when already on PROMQL', () => {
    mockQueryEditorState = buildQueryEditorState({ languageType: 'PROMQL' });
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeDisabled();
  });

  it('disables AI option when already in prompt mode', () => {
    mockQueryEditorState = buildQueryEditorState({
      editorMode: EditorMode.Prompt,
      promptModeIsAvailable: true,
    });
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeDisabled();
  });

  it('switches to PromQL and updates languageType when PromQL is clicked', () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    expect(mockHandleEditorChange).toHaveBeenCalledWith({ editorMode: EditorMode.Query });
    expect(mockHandleLanguageTypeChange).toHaveBeenCalledWith('PROMQL');
    expect(mockClearEditor).toHaveBeenCalled();
  });

  it('switches to prompt mode when AI is clicked', () => {
    mockQueryEditorState = buildQueryEditorState({ promptModeIsAvailable: true });
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-AI'));
    expect(mockHandleEditorChange).toHaveBeenCalledWith({ editorMode: EditorMode.Prompt });
    expect(mockHandleLanguageTypeChange).not.toHaveBeenCalled();
  });

  it('focuses editor after language switch', async () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    await waitFor(() => jest.advanceTimersByTime(100));
    expect(mockFocusEditor).toHaveBeenCalledWith(true);
  });
});
